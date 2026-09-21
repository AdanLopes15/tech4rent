/**
 * EXCLUSÃO DEFINITIVA de um contrato que está na Lixeira — procedimento
 * administrativo controlado. A interface NUNCA apaga contratos fisicamente
 * (firestore.rules: `allow delete: if false`); este script usa o Admin SDK,
 * que não passa pelas regras, e por isso só deve ser executado por quem
 * administra o projeto, com backup recente.
 *
 * Garantias:
 *   - Por padrão é SIMULAÇÃO: nada é apagado.
 *   - Só aceita contratos que já estão na Lixeira (deletedAt preenchido).
 *   - SEMPRE exporta contrato, parcelas e auditoria relacionada para
 *     scripts/exports/ (pasta ignorada pelo git — contém dados pessoais)
 *     antes de qualquer exclusão.
 *   - Para apagar exige --confirm com o mesmo ID do contrato.
 *   - Apaga contrato + parcelas numa única transação, que confere de novo se
 *     o contrato continua na Lixeira, e grava auditoria "contract.purge".
 *   - Não mexe em estoque (já devolvido quando o contrato foi para a Lixeira)
 *     nem apaga arquivos do Storage (apenas os lista no relatório).
 *
 * Uso:
 *   npm install --no-save firebase-admin
 *   # credencial: scripts/serviceAccount.json ou GOOGLE_APPLICATION_CREDENTIALS
 *   node scripts/purge-contract.cjs --contract CTR-123                      # simulação
 *   node scripts/purge-contract.cjs --contract CTR-123 --confirm CTR-123    # executa
 *
 * Opções:
 *   --project <id>   padrão: project_id da credencial (ou st4r-f404e)
 *   Com FIRESTORE_EMULATOR_HOST definido, roda contra o emulador sem credencial.
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const admin = require("firebase-admin");

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      const next = argv[i + 1];
      args[key] = next && !next.startsWith("--") ? argv[++i] : true;
    }
  }
  return args;
}

function initApp(projectArg) {
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    return admin.initializeApp({ projectId: projectArg || "demo-tech4rent" });
  }
  const localKey = path.join(__dirname, "serviceAccount.json");
  if (fs.existsSync(localKey)) {
    const sa = require(localKey);
    return admin.initializeApp({
      credential: admin.credential.cert(sa),
      projectId: projectArg || sa.project_id,
      storageBucket: `${projectArg || sa.project_id}.firebasestorage.app`,
    });
  }
  const projectId = projectArg || "st4r-f404e";
  return admin.initializeApp({ projectId, storageBucket: `${projectId}.firebasestorage.app` });
}

// Converte Timestamps em ISO para o JSON de exportação.
function serialize(value) {
  if (value && typeof value.toDate === "function") return { __timestamp: value.toDate().toISOString() };
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, serialize(v)]));
  }
  return value;
}

async function listStorage(prefix) {
  if (process.env.FIRESTORE_EMULATOR_HOST) return [];
  try {
    const [files] = await admin.storage().bucket().getFiles({ prefix });
    return files.map((f) => f.name);
  } catch (err) {
    return [`(não foi possível listar ${prefix}: ${err.message})`];
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const contractId = typeof args.contract === "string" ? args.contract.trim() : "";
  if (!/^[A-Za-z0-9_-]+$/.test(contractId)) {
    console.error("Informe --contract <ID>, ex.: --contract CTR-123");
    process.exit(2);
  }
  const execute = args.confirm !== undefined;
  if (execute && args.confirm !== contractId) {
    console.error(`--confirm deve ser exatamente "${contractId}". Nada foi alterado.`);
    process.exit(2);
  }

  initApp(typeof args.project === "string" ? args.project : undefined);
  const db = admin.firestore();
  const projectId = admin.app().options.projectId;

  const contractRef = db.collection("contracts").doc(contractId);
  const contractSnap = await contractRef.get();
  if (!contractSnap.exists) {
    console.error(`Contrato ${contractId} não existe no projeto ${projectId}.`);
    process.exit(1);
  }
  const contract = contractSnap.data();
  if (!contract.deletedAt) {
    console.error(
      `Contrato ${contractId} NÃO está na Lixeira. Mova-o para a Lixeira pela interface antes. Nada foi alterado.`,
    );
    process.exit(1);
  }

  const revenuesSnap = await db.collection("revenues").where("contractId", "==", contractId).get();
  const auditSnap = await db.collection("auditLogs").where("details.contractId", "==", contractId).get();
  const storageFiles = [
    ...(await listStorage(`contracts/${contractId}/`)),
    ...(await listStorage(`boletos/${contractId}/`)),
  ];

  const exportData = {
    exportedAt: new Date().toISOString(),
    projectId,
    mode: execute ? "execute" : "dry-run",
    operator: `${os.userInfo().username}@${os.hostname()}`,
    contract: { id: contractId, ...serialize(contract) },
    revenues: revenuesSnap.docs.map((d) => ({ id: d.id, ...serialize(d.data()) })),
    auditLogs: auditSnap.docs.map((d) => ({ id: d.id, ...serialize(d.data()) })),
    storageFiles,
  };
  const exportDir = process.env.PURGE_EXPORT_DIR || path.join(__dirname, "exports");
  fs.mkdirSync(exportDir, { recursive: true });
  const stamp = exportData.exportedAt.replace(/[:.]/g, "-");
  const exportFile = path.join(exportDir, `purge-${contractId}-${stamp}.json`);
  const exportJson = JSON.stringify(exportData, null, 2);
  fs.writeFileSync(exportFile, exportJson);
  const exportSha256 = crypto.createHash("sha256").update(exportJson).digest("hex");

  const byStatus = {};
  let paidTotal = 0;
  for (const d of revenuesSnap.docs) {
    const r = d.data();
    byStatus[r.status || "?"] = (byStatus[r.status || "?"] || 0) + 1;
    if (r.status === "recebido") paidTotal += Number(r.valorTotal) || 0;
  }

  console.log(`\n=== ${execute ? "EXECUÇÃO" : "SIMULAÇÃO"} — exclusão definitiva de ${contractId} (${projectId}) ===`);
  console.log(`Cliente:          ${contract.client?.razaoSocial || contract.clientId || "?"}`);
  console.log(`Status:           ${contract.status || "?"}`);
  console.log(`Na Lixeira desde: ${contract.deletedAt.toDate ? contract.deletedAt.toDate().toISOString() : contract.deletedAt}`);
  console.log(`Excluído por:     ${contract.deletedBy?.email || contract.deletedBy?.uid || "?"}`);
  console.log(`Motivo:           ${contract.deletionReason || "?"}`);
  console.log(`Parcelas:         ${revenuesSnap.size} ${JSON.stringify(byStatus)} — recebido: R$ ${paidTotal.toFixed(2)}`);
  console.log(`Auditoria:        ${auditSnap.size} registro(s) preservado(s) (não são apagados)`);
  console.log(`Storage:          ${storageFiles.length ? storageFiles.join(", ") : "nenhum arquivo"} (não são apagados)`);
  console.log(`Exportação:       ${exportFile}`);
  console.log(`SHA-256:          ${exportSha256}`);

  if (!execute) {
    console.log(`\nSimulação concluída. Nada foi apagado.`);
    console.log(`Para executar: node scripts/purge-contract.cjs --contract ${contractId} --confirm ${contractId}\n`);
    return;
  }

  const deleted = await db.runTransaction(async (tx) => {
    const fresh = await tx.get(contractRef);
    if (!fresh.exists || !fresh.data().deletedAt) {
      throw new Error("O contrato saiu da Lixeira ou já foi apagado. Nada foi alterado.");
    }
    const revs = await tx.get(db.collection("revenues").where("contractId", "==", contractId));
    if (revs.size + 2 > 500) throw new Error("Parcelas demais para uma única transação. Nada foi alterado.");
    revs.docs.forEach((d) => tx.delete(d.ref));
    tx.delete(contractRef);
    tx.set(db.collection("auditLogs").doc(), {
      action: "contract.purge",
      actorUid: null,
      actorEmail: null,
      details: {
        contractId,
        clientId: contract.clientId || null,
        revenueIds: revs.docs.map((d) => d.id),
        exportFile: path.basename(exportFile),
        exportSha256,
        operator: exportData.operator,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return revs.size;
  });

  console.log(`\nContrato ${contractId} e ${deleted} parcela(s) apagados definitivamente. Auditoria "contract.purge" registrada.`);
  console.log(`Guarde a exportação em local seguro: ${exportFile}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(`ERRO: ${err.message}`);
    process.exit(1);
  });
