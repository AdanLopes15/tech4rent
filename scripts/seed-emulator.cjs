/**
 * Popula o Firebase Emulator com dados FICTÍCIOS (projeto demo-tech4rent).
 *
 * Travas contra produção:
 *   - o projeto é fixo em "demo-tech4rent" (projetos demo-* não existem no Google Cloud);
 *   - os endereços dos emuladores são fixados em 127.0.0.1 antes de carregar o
 *     Admin SDK, e qualquer valor externo pré-existente é recusado;
 *   - nenhuma credencial é carregada; GOOGLE_APPLICATION_CREDENTIALS é ignorada;
 *   - aborta se os emuladores não estiverem respondendo.
 *
 * Uso: npm run emulators   (em outro terminal)
 *      npm run emulators:seed
 *
 * Usuários criados (senha: senha123):
 *   admin@demo.test      admin legado (permission: "admin", sem profile)
 *   restrito@demo.test   vê contratos e financeiro, sem excluir/restaurar
 */

const PROJECT_ID = "demo-tech4rent";
const HOSTS = {
  FIRESTORE_EMULATOR_HOST: "127.0.0.1:8085",
  FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
  FIREBASE_STORAGE_EMULATOR_HOST: "127.0.0.1:9199",
};

for (const [key, value] of Object.entries(HOSTS)) {
  const current = process.env[key];
  if (current && !/^(127\.0\.0\.1|localhost):\d+$/.test(current)) {
    console.error(`Recusado: ${key}=${current} não é local.`);
    process.exit(2);
  }
  process.env[key] = current || value;
}
delete process.env.GOOGLE_APPLICATION_CREDENTIALS;

const admin = require("firebase-admin");

const PASSWORD = "senha123";
const day = (offset) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return admin.firestore.Timestamp.fromDate(d);
};

async function assertEmulatorsUp() {
  for (const [key, host] of Object.entries(HOSTS)) {
    const target = process.env[key] || host;
    try {
      await fetch(`http://${target}/`);
    } catch {
      console.error(`Emulador ${key} não responde em ${target}. Rode "npm run emulators" antes.`);
      process.exit(1);
    }
  }
}

async function clearEmulators() {
  const fs = process.env.FIRESTORE_EMULATOR_HOST;
  const au = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  await fetch(`http://${fs}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`, { method: "DELETE" });
  await fetch(`http://${au}/emulator/v1/projects/${PROJECT_ID}/accounts`, { method: "DELETE" });
}

async function main() {
  await assertEmulatorsUp();
  admin.initializeApp({ projectId: PROJECT_ID });
  if (admin.app().options.projectId !== PROJECT_ID) throw new Error("Projeto inesperado.");

  await clearEmulators();
  const db = admin.firestore();
  const batch = db.batch();
  const set = (path, data) => batch.set(db.doc(path), data);

  // ---------- Usuários ----------
  const users = [
    { uid: "demo-admin", email: "admin@demo.test", name: "Admin Legado", doc: { permission: "admin", status: "ativo" } },
    {
      uid: "demo-restrito",
      email: "restrito@demo.test",
      name: "Usuário Restrito",
      doc: {
        profile: "custom",
        permission: "custom",
        status: "ativo",
        permissions: ["dashboard.view", "contratos.view", "contratos.edit", "financeiro.view", "clientes.view", "equipamentos.view"],
      },
    },
  ];
  for (const u of users) {
    await admin.auth().createUser({ uid: u.uid, email: u.email, password: PASSWORD, displayName: u.name });
    set(`users/${u.uid}`, { name: u.name, email: u.email, ...u.doc });
  }

  // ---------- Cadastros ----------
  set("settings/company", { name: "Tech4Rent DEMO", fantasyName: "Tech4Rent DEMO", address: { localidade: "São Paulo", uf: "SP" } });
  set("clients/CLI-001", { razaoSocial: "Cliente Demonstração Ltda", name: "Cliente Demonstração Ltda", type: "PJ", status: "ativo" });
  set("clients/CLI-002", { razaoSocial: "Vandesmar Demo ME", name: "Vandesmar Demo ME", type: "PJ", status: "ativo" });
  set("equipments/EQP-001", { name: "PDA TC60 (demo)", category: "Coletor", stock: 10, status: "disponível", purpose: "locação" });
  set("equipments/EQP-009", { name: "Gatilho Scan (demo)", category: "Acessório", stock: 5, status: "disponível", purpose: "locação" });
  set("bankAccounts/BANCO-1", { name: "Banco Demo", initialBalance: 0 });
  set("counters/contracts", { currentNumber: 3 });
  set("counters/clients", { currentNumber: 2 });
  set("counters/equipments", { currentNumber: 9 });
  set("counters/quotes", { currentNumber: 1 });

  // ---------- Orçamentos ----------
  set("quotes/ORC-001", {
    id: "ORC-001",
    clientId: "CLI-001",
    clientName: "Cliente Demonstração Ltda",
    budgetType: "locacao",
    status: "Pendente",
    items: [{ equipmentId: "EQP-001", quantity: 1, unitPrice: 150, billingType: "Mensal" }],
    paymentMethods: [{ paymentMethod: "boleto", installments: 1 }],
    startDate: day(1),
    endDate: day(91),
    totalValue: 150,
    createdAt: day(-1),
  });

  // ---------- Contratos ----------
  const contract = (id, clientId, clientName, status, items) => ({
    id,
    clientId,
    client: { id: clientId, razaoSocial: clientName },
    status,
    items,
    startDate: day(-60),
    endDate: day(120),
    totalValue: items.reduce((a, i) => a + i.quantity * i.unitPrice, 0) * 6,
    createdAt: day(-60),
  });
  set("contracts/CTR-001", contract("CTR-001", "CLI-001", "Cliente Demonstração Ltda", "Em Andamento", [
    { equipmentId: "EQP-001", quantity: 2, unitPrice: 150 },
    { equipmentId: "EQP-009", quantity: 1, unitPrice: 30 },
  ]));
  set("contracts/CTR-002", contract("CTR-002", "CLI-002", "Vandesmar Demo ME", "Em Andamento", [
    { equipmentId: "EQP-001", quantity: 3, unitPrice: 150 },
    { equipmentId: "EQP-009", quantity: 2, unitPrice: 30 },
  ]));
  set("contracts/CTR-003", { ...contract("CTR-003", "CLI-001", "Cliente Demonstração Ltda", "Finalizado", [
    { equipmentId: "EQP-001", quantity: 1, unitPrice: 150 },
  ]), finalizedAt: day(-5) });

  // ---------- Parcelas ----------
  const revenue = (id, contractId, clientId, n, total, value, dueOffset, status) =>
    set(`revenues/${id}`, {
      clientId,
      contractId,
      description: `Parcela ${n}/${total} do contrato ${contractId}`,
      valorTotal: value,
      valorBruto: value,
      dueDate: day(dueOffset),
      status,
      ...(status === "recebido" ? { paymentDate: day(dueOffset) } : {}),
      createdAt: day(-60),
      bankAccountId: "BANCO-1",
    });
  revenue("rev-001-1", "CTR-001", "CLI-001", 1, 3, 330, -30, "recebido");
  revenue("rev-001-2", "CTR-001", "CLI-001", 2, 3, 330, 1, "Pendente");
  revenue("rev-001-3", "CTR-001", "CLI-001", 3, 3, 330, 31, "Pendente");
  revenue("rev-002-1", "CTR-002", "CLI-002", 1, 2, 510, -30, "recebido");
  revenue("rev-002-2", "CTR-002", "CLI-002", 2, 2, 510, 2, "Pendente");

  await batch.commit();
  console.log(`Emulator populado (${PROJECT_ID}). Login: admin@demo.test ou restrito@demo.test / ${PASSWORD}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(`ERRO: ${err.message}`);
    process.exit(1);
  });
