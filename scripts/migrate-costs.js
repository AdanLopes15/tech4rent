/**
 * Migração segura de custos para a coleção privada (Tech4Rent RBAC).
 * Projeto: st4r-f404e
 *
 * O que faz:
 *   1. Para cada documento em `equipments` que possua `costPrice`,
 *      copia o valor para `equipamentosPrivate/{id}` (idempotente).
 *   2. Só depois de copiar (etapa 1 confirmada), com a flag --strip,
 *      remove o campo `costPrice` do documento público `equipments/{id}`.
 *
 * Compatibilidade:
 *   - Não apaga nada até rodar com --strip.
 *   - O app tem fallback: enquanto o custo ainda existir no doc público,
 *     ele continua funcionando; após --strip, o custo só é lido da coleção
 *     privada (protegida por regras).
 *
 * Como executar:
 *   1. Baixe uma chave de serviço (Firebase Console > Configurações do projeto
 *      > Contas de serviço > Gerar nova chave privada) e salve como
 *      serviceAccount.json nesta pasta.
 *   2. npm install firebase-admin
 *   3. Etapa de cópia (segura, sem apagar):
 *        node scripts/migrate-costs.js
 *   4. Verifique os dados em `equipamentosPrivate`.
 *   5. Só então remova os custos públicos:
 *        node scripts/migrate-costs.js --strip
 */

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccount.json");

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const STRIP = process.argv.includes("--strip");

async function main() {
  const snap = await db.collection("equipments").get();
  let copied = 0;
  let stripped = 0;

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const id = docSnap.id;

    if (data.costPrice !== undefined && data.costPrice !== null && data.costPrice !== "") {
      // 1) Copia para a coleção privada (merge, idempotente)
      await db.collection("equipamentosPrivate").doc(id).set({ costPrice: data.costPrice }, { merge: true });
      copied++;

      // 2) Remove do documento público apenas com --strip
      if (STRIP) {
        await db.collection("equipments").doc(id).update({
          costPrice: admin.firestore.FieldValue.delete(),
        });
        stripped++;
      }
    }
  }

  console.log(`Custos copiados para equipamentosPrivate: ${copied}`);
  console.log(STRIP ? `Custos removidos dos docs públicos: ${stripped}` : "Modo cópia (nada removido). Rode com --strip depois de validar.");
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
