// Testes de integração com o Firestore Emulator (projeto fictício demo-tech4rent).
// Executa as transações reais de Lixeira contra as regras reais de firestore.rules.
// Rodar com: npm run test:emulator  (nunca acessa a produção)

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type Firestore,
} from "firebase/firestore";

import { partitionContracts, partitionRevenues, type TrashActor } from "@/lib/contract-trash";
import { createContract } from "@/store/methods/contractCreate";
import {
  ContractRestoreConflictError,
  moveContractToTrash,
  restoreContractFromTrash,
} from "@/store/methods/contractTrash";

let env: RulesTestEnvironment;

const USERS: Record<string, any> = {
  legacyAdmin: { name: "Admin Legado", email: "legado@t4r.test", permission: "admin", status: "ativo" }, // sem profile
  newAdmin: { name: "Admin Novo", email: "novo@t4r.test", profile: "admin", permission: "admin", status: "ativo" },
  deleter: { name: "Exclui", email: "exclui@t4r.test", profile: "custom", permissions: ["contratos.view", "contratos.delete"], status: "ativo" },
  restorer: { name: "Restaura", email: "restaura@t4r.test", profile: "custom", permissions: ["contratos.view", "contratos.restore"], status: "ativo" },
  viewer: { name: "Leitor", email: "leitor@t4r.test", profile: "custom", permissions: ["contratos.view"], status: "ativo" },
  creator: { name: "Cria", email: "cria@t4r.test", profile: "custom", permissions: ["contratos.view", "contratos.create"], status: "ativo" },
  editor: { name: "Edita", email: "edita@t4r.test", profile: "custom", permissions: ["contratos.view", "contratos.edit"], status: "ativo" },
  comercial: { name: "Comercial", email: "comercial@t4r.test", profile: "comercial_orcamentos", permission: "comercial_orcamentos", permissions: [], status: "ativo" },
  legacyGestor: { name: "Gestor Legado", email: "gestor@t4r.test", permission: "gestor", status: "ativo" }, // sem profile => acesso total (AuthContext)
  moduleWildcard: { name: "Coringa", email: "coringa@t4r.test", profile: "custom", permissions: ["contratos.*"], status: "ativo" },
  inactive: { name: "Inativo", email: "inativo@t4r.test", permission: "admin", status: "inativo" },
};

const REASON = "Contrato lançado em duplicidade";

const actor = (uid: string): TrashActor => ({ uid, email: USERS[uid].email, name: USERS[uid].name });
const dbAs = (uid: string) => env.authenticatedContext(uid).firestore() as unknown as Firestore;

async function adminRead<T = any>(path: string): Promise<T | undefined> {
  let data: any;
  await env.withSecurityRulesDisabled(async (ctx) => {
    const snap = await getDoc(doc(ctx.firestore() as unknown as Firestore, path));
    data = snap.exists() ? snap.data() : undefined;
  });
  return data;
}

async function adminWrite(path: string, data: any) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore() as unknown as Firestore, path), data);
  });
}

async function adminList(col: string): Promise<any[]> {
  let rows: any[] = [];
  await env.withSecurityRulesDisabled(async (ctx) => {
    const snap = await getDocs(collection(ctx.firestore() as unknown as Firestore, col));
    rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  });
  return rows;
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-tech4rent",
    firestore: { rules: readFileSync(resolve(__dirname, "../../../firestore.rules"), "utf8") },
  });
});

afterAll(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore() as unknown as Firestore;
    for (const [uid, data] of Object.entries(USERS)) await setDoc(doc(db, "users", uid), data);
    await setDoc(doc(db, "equipments", "EQP-001"), { name: "PDA TC60", stock: 10 });
    await setDoc(doc(db, "equipments", "EQP-009"), { name: "Gatilho Scan", stock: 4 });
    await setDoc(doc(db, "contracts", "CTR-117"), {
      id: "CTR-117",
      clientId: "CLI-057",
      status: "Em Andamento",
      items: [
        { equipmentId: "EQP-001", quantity: 2, unitPrice: 100 },
        { equipmentId: "EQP-001", quantity: 1, unitPrice: 100 },
        { equipmentId: "EQP-009", quantity: 2, unitPrice: 20 },
      ],
      totalValue: 340,
    });
    await setDoc(doc(db, "contracts", "CTR-118"), {
      id: "CTR-118",
      clientId: "CLI-001",
      status: "Finalizado",
      items: [{ equipmentId: "EQP-001", quantity: 5, unitPrice: 100 }],
    });
    await setDoc(doc(db, "revenues", "rev-paid"), { contractId: "CTR-117", status: "recebido", valorTotal: 340 });
    await setDoc(doc(db, "revenues", "rev-pending"), { contractId: "CTR-117", status: "Pendente", valorTotal: 340 });
    await setDoc(doc(db, "revenues", "rev-other"), { contractId: "CTR-118", status: "Pendente", valorTotal: 500 });
    await setDoc(doc(db, "clients", "CLI-057"), { razaoSocial: "Cliente Teste" });
  });
});

describe("mover para a Lixeira (transação)", () => {
  it("admin legado (sem profile) exclui: marca o contrato, devolve estoque, preserva parcelas e audita", async () => {
    const result = await moveContractToTrash(dbAs("legacyAdmin"), {
      contractId: "CTR-117",
      reason: `  ${REASON}  `,
      actor: actor("legacyAdmin"),
    });

    expect(result.stockReturned).toEqual([
      { equipmentId: "EQP-001", quantity: 3 },
      { equipmentId: "EQP-009", quantity: 2 },
    ]);

    const contract = await adminRead("contracts/CTR-117");
    expect(contract?.deletedAt).toBeTruthy();
    expect(contract?.deletedBy).toEqual(actor("legacyAdmin"));
    expect(contract?.deletionReason).toBe(REASON);
    expect(contract?.items).toHaveLength(3);

    expect((await adminRead("equipments/EQP-001"))?.stock).toBe(13);
    expect((await adminRead("equipments/EQP-009"))?.stock).toBe(6);

    expect(await adminRead("revenues/rev-paid")).toEqual({ contractId: "CTR-117", status: "recebido", valorTotal: 340 });
    expect(await adminRead("revenues/rev-pending")).toBeTruthy();

    const audit = await adminList("auditLogs");
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({
      action: "contract.delete",
      actorUid: "legacyAdmin",
      details: { contractId: "CTR-117", clientId: "CLI-057", reason: REASON },
    });
  });

  it("contrato excluído some da listagem normal e aparece na Lixeira com suas parcelas", async () => {
    await moveContractToTrash(dbAs("newAdmin"), { contractId: "CTR-117", reason: REASON, actor: actor("newAdmin") });

    const { active, deleted } = partitionContracts(await adminList("contracts"));
    expect(active.map((c) => c.id)).toEqual(["CTR-118"]);
    expect(deleted.map((c) => c.id)).toEqual(["CTR-117"]);

    const revs = partitionRevenues(await adminList("revenues"), new Set(deleted.map((c) => c.id)));
    expect(revs.active.map((r) => r.id)).toEqual(["rev-other"]);
    expect(revs.trashed.map((r) => r.id).sort()).toEqual(["rev-paid", "rev-pending"]);
  });

  it("contrato finalizado vai para a Lixeira sem mexer no estoque", async () => {
    await moveContractToTrash(dbAs("newAdmin"), { contractId: "CTR-118", reason: REASON, actor: actor("newAdmin") });
    expect((await adminRead("contracts/CTR-118"))?.stockReturned).toEqual([]);
    expect((await adminRead("equipments/EQP-001"))?.stock).toBe(10);
  });

  it("motivo curto é recusado sem gravar nada", async () => {
    await expect(
      moveContractToTrash(dbAs("newAdmin"), { contractId: "CTR-117", reason: "erro", actor: actor("newAdmin") }),
    ).rejects.toThrow(/motivo/);
    expect((await adminRead("contracts/CTR-117"))?.deletedAt).toBeUndefined();
    expect((await adminRead("equipments/EQP-001"))?.stock).toBe(10);
    expect(await adminList("auditLogs")).toHaveLength(0);
  });

  it("não exclui duas vezes", async () => {
    await moveContractToTrash(dbAs("newAdmin"), { contractId: "CTR-117", reason: REASON, actor: actor("newAdmin") });
    await expect(
      moveContractToTrash(dbAs("newAdmin"), { contractId: "CTR-117", reason: REASON, actor: actor("newAdmin") }),
    ).rejects.toThrow(/Lixeira/);
    expect((await adminRead("equipments/EQP-001"))?.stock).toBe(13);
  });

  it("usuário sem contratos.delete é bloqueado e nada muda (nem o estoque)", async () => {
    await assertFails(
      moveContractToTrash(dbAs("viewer"), { contractId: "CTR-117", reason: REASON, actor: actor("viewer") }),
    );
    expect((await adminRead("contracts/CTR-117"))?.deletedAt).toBeUndefined();
    expect((await adminRead("equipments/EQP-001"))?.stock).toBe(10);
    expect(await adminList("auditLogs")).toHaveLength(0);
  });

  it("permissão personalizada contratos.delete e coringa contratos.* são aceitas", async () => {
    await assertSucceeds(
      moveContractToTrash(dbAs("deleter"), { contractId: "CTR-117", reason: REASON, actor: actor("deleter") }),
    );
    await assertSucceeds(
      moveContractToTrash(dbAs("moduleWildcard"), { contractId: "CTR-118", reason: REASON, actor: actor("moduleWildcard") }),
    );
  });

  it("não aceita exclusão em nome de outro usuário", async () => {
    await assertFails(
      moveContractToTrash(dbAs("deleter"), { contractId: "CTR-117", reason: REASON, actor: actor("newAdmin") }),
    );
  });
});

describe("restaurar da Lixeira (transação)", () => {
  beforeEach(async () => {
    await moveContractToTrash(dbAs("newAdmin"), { contractId: "CTR-117", reason: REASON, actor: actor("newAdmin") });
  });

  it("restaura, debita o estoque devolvido e o contrato volta à listagem normal", async () => {
    await restoreContractFromTrash(dbAs("restorer"), { contractId: "CTR-117", actor: actor("restorer") });

    const contract = await adminRead("contracts/CTR-117");
    expect(contract).not.toHaveProperty("deletedAt");
    expect(contract).not.toHaveProperty("deletedBy");
    expect(contract).not.toHaveProperty("deletionReason");
    expect(contract).not.toHaveProperty("stockReturned");
    expect(contract?.restoredBy).toEqual(actor("restorer"));
    expect(contract?.lastDeletion).toMatchObject({ reason: REASON, deletedBy: actor("newAdmin") });

    expect((await adminRead("equipments/EQP-001"))?.stock).toBe(10);
    expect((await adminRead("equipments/EQP-009"))?.stock).toBe(4);

    const { active, deleted } = partitionContracts(await adminList("contracts"));
    expect(active.map((c) => c.id).sort()).toEqual(["CTR-117", "CTR-118"]);
    expect(deleted).toHaveLength(0);
    const revs = partitionRevenues(await adminList("revenues"), new Set());
    expect(revs.active).toHaveLength(3);

    const audit = (await adminList("auditLogs")).map((a) => a.action).sort();
    expect(audit).toEqual(["contract.delete", "contract.restore"]);

    // Contrato restaurado volta a aceitar edição comum.
    await assertSucceeds(updateDoc(doc(dbAs("newAdmin"), "contracts/CTR-117"), { status: "Finalizado" }));
  });

  it("sem estoque suficiente: não restaura, não debita nada e informa os equipamentos", async () => {
    // EQP-001 tem estoque suficiente; EQP-009 não. Nenhum dos dois pode mudar.
    await adminWrite("equipments/EQP-009", { name: "Gatilho Scan", stock: 1 });

    const err = await restoreContractFromTrash(dbAs("newAdmin"), {
      contractId: "CTR-117",
      actor: actor("newAdmin"),
    }).catch((e) => e);

    expect(err).toBeInstanceOf(ContractRestoreConflictError);
    expect(err.conflicts).toEqual([
      { equipmentId: "EQP-009", name: "Gatilho Scan", required: 2, available: 1, reason: "insufficient" },
    ]);
    expect(err.message).toMatch(/Gatilho Scan/);

    expect((await adminRead("contracts/CTR-117"))?.deletedAt).toBeTruthy();
    expect((await adminRead("equipments/EQP-001"))?.stock).toBe(13);
    expect((await adminRead("equipments/EQP-009"))?.stock).toBe(1);
    expect((await adminList("auditLogs")).map((a) => a.action)).toEqual(["contract.delete"]);

    // Após o administrador resolver o conflito, a restauração funciona.
    await adminWrite("equipments/EQP-009", { name: "Gatilho Scan", stock: 2 });
    await restoreContractFromTrash(dbAs("newAdmin"), { contractId: "CTR-117", actor: actor("newAdmin") });
    expect((await adminRead("equipments/EQP-009"))?.stock).toBe(0);
    expect((await adminRead("equipments/EQP-001"))?.stock).toBe(10);
  });

  it("equipamento removido do cadastro bloqueia a restauração", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await deleteDoc(doc(ctx.firestore() as unknown as Firestore, "equipments/EQP-009"));
    });
    const err = await restoreContractFromTrash(dbAs("newAdmin"), {
      contractId: "CTR-117",
      actor: actor("newAdmin"),
    }).catch((e) => e);
    expect(err).toBeInstanceOf(ContractRestoreConflictError);
    expect(err.conflicts[0]).toMatchObject({ equipmentId: "EQP-009", reason: "missing" });
    expect((await adminRead("equipments/EQP-001"))?.stock).toBe(13);
  });

  it("usuário sem contratos.restore não restaura", async () => {
    await assertFails(restoreContractFromTrash(dbAs("deleter"), { contractId: "CTR-117", actor: actor("deleter") }));
    expect((await adminRead("contracts/CTR-117"))?.deletedAt).toBeTruthy();
    expect((await adminRead("equipments/EQP-001"))?.stock).toBe(13);
  });

  it("contrato na Lixeira não pode ser editado, finalizado nem ter parcelas alteradas", async () => {
    const db = dbAs("newAdmin");
    await assertFails(updateDoc(doc(db, "contracts/CTR-117"), { status: "Finalizado" }));
    await assertFails(updateDoc(doc(db, "contracts/CTR-117"), { signedContractUrl: "x" }));
    await assertFails(updateDoc(doc(db, "revenues/rev-pending"), { status: "recebido" }));
    await assertFails(deleteDoc(doc(db, "revenues/rev-pending")));
    await assertFails(
      addDoc(collection(db, "revenues"), { contractId: "CTR-117", status: "Pendente", valorTotal: 10 }),
    );
    // Restaurar "na mão" sem passar pelo fluxo (sem restoredAt/restoredBy) também é negado.
    await assertFails(updateDoc(doc(db, "contracts/CTR-117"), { deletedAt: null }));
  });
});

describe("permissões por ação em contratos", () => {
  // Criação pelo fluxo real (número manual, contador avança na mesma transação).
  const create = (uid: string, id: string) =>
    createContract(dbAs(uid), {
      contractNumber: id,
      suggestedId: null,
      actor: actor(uid),
      draft: {
        clientId: "CLI-057",
        client: null,
        startDate: new Date(2026, 9, 1),
        endDate: new Date(2026, 10, 1),
        firstInstallmentDate: new Date(2026, 10, 1),
        items: [{ equipmentId: "EQP-001", quantity: 1, unitPrice: 10 }],
        totalValue: 10,
        status: "Em Andamento",
      },
    });
  const edit = (uid: string, id = "CTR-117") => updateDoc(doc(dbAs(uid), "contracts", id), { unitOperation: `por ${uid}` });
  const trash = (uid: string, id = "CTR-117") =>
    moveContractToTrash(dbAs(uid), { contractId: id, reason: REASON, actor: actor(uid) });
  const restore = (uid: string, id = "CTR-118") =>
    restoreContractFromTrash(dbAs(uid), { contractId: id, actor: actor(uid) });

  // CTR-118 começa na Lixeira para os testes de restauração.
  beforeEach(async () => {
    await moveContractToTrash(dbAs("newAdmin"), { contractId: "CTR-118", reason: REASON, actor: actor("newAdmin") });
  });

  it("administrador antigo (permission: admin, sem profile) cria, edita, exclui e restaura", async () => {
    await assertSucceeds(create("legacyAdmin", "CTR-300"));
    await assertSucceeds(edit("legacyAdmin"));
    await assertSucceeds(trash("legacyAdmin"));
    await assertSucceeds(restore("legacyAdmin"));
  });

  it("gestor legado sem profile mantém acesso total, como no AuthContext", async () => {
    await assertSucceeds(create("legacyGestor", "CTR-301"));
    await assertSucceeds(edit("legacyGestor"));
  });

  it("contratos.create: só cria", async () => {
    await assertSucceeds(create("creator", "CTR-302"));
    await assertFails(edit("creator"));
    await assertFails(trash("creator"));
    await assertFails(restore("creator"));
  });

  it("contratos.edit: só edita (inclui finalizar e anexar)", async () => {
    await assertSucceeds(edit("editor"));
    await assertSucceeds(updateDoc(doc(dbAs("editor"), "contracts/CTR-117"), { status: "Finalizado" }));
    await assertSucceeds(updateDoc(doc(dbAs("editor"), "contracts/CTR-117"), { signedContractUrl: "gs://x" }));
    await assertFails(create("editor", "CTR-303"));
    await assertFails(trash("editor"));
    await assertFails(restore("editor"));
  });

  it("contratos.delete: só move para a Lixeira", async () => {
    await assertFails(create("deleter", "CTR-304"));
    await assertFails(edit("deleter"));
    await assertFails(restore("deleter"));
    await assertSucceeds(trash("deleter"));
  });

  it("contratos.restore: só restaura", async () => {
    await assertFails(create("restorer", "CTR-305"));
    await assertFails(edit("restorer"));
    await assertFails(trash("restorer"));
    await assertSucceeds(restore("restorer"));
  });

  it("contratos.view e perfil comercial: apenas leem", async () => {
    for (const uid of ["viewer", "comercial"]) {
      await assertSucceeds(getDocs(collection(dbAs(uid), "contracts")));
      await assertFails(create(uid, `CTR-9${uid.length}`));
      await assertFails(edit(uid));
      await assertFails(trash(uid));
      await assertFails(restore(uid));
    }
  });

  it("coringa contratos.* concede todas as ações do módulo", async () => {
    await assertSucceeds(create("moduleWildcard", "CTR-306"));
    await assertSucceeds(edit("moduleWildcard"));
    await assertSucceeds(trash("moduleWildcard"));
    await assertSucceeds(restore("moduleWildcard"));
  });

  it("nenhuma falha deixou efeito colateral no estoque", async () => {
    await assertFails(trash("editor"));
    await assertFails(restore("editor"));
    // CTR-118 está finalizado: não devolveu estoque ao ir para a Lixeira.
    expect((await adminRead("equipments/EQP-001"))?.stock).toBe(10);
    expect((await adminRead("equipments/EQP-009"))?.stock).toBe(4);
  });
});

describe("proteção contra exclusão física e regras gerais", () => {
  it("ninguém apaga fisicamente um contrato, nem admin", async () => {
    await assertFails(deleteDoc(doc(dbAs("legacyAdmin"), "contracts/CTR-117")));
    await assertFails(deleteDoc(doc(dbAs("newAdmin"), "contracts/CTR-117")));
    expect(await adminRead("contracts/CTR-117")).toBeTruthy();
  });

  it("o lote de exclusão do sistema legado falha por inteiro (estoque e parcelas intactos)", async () => {
    const db = dbAs("legacyAdmin");
    const batch = writeBatch(db);
    batch.update(doc(db, "equipments/EQP-001"), { stock: 13 });
    batch.delete(doc(db, "revenues/rev-paid"));
    batch.delete(doc(db, "revenues/rev-pending"));
    batch.delete(doc(db, "contracts/CTR-117"));
    await assertFails(batch.commit());

    expect((await adminRead("equipments/EQP-001"))?.stock).toBe(10);
    expect(await adminRead("revenues/rev-paid")).toBeTruthy();
    expect(await adminRead("contracts/CTR-117")).toBeTruthy();
  });

  it("edição comum não pode gravar campos da Lixeira (atalho para excluir sem auditoria)", async () => {
    await assertFails(
      updateDoc(doc(dbAs("newAdmin"), "contracts/CTR-117"), {
        deletedAt: serverTimestamp(),
        deletedBy: actor("newAdmin"),
        deletionReason: REASON,
      }),
    );
    await assertFails(
      setDoc(doc(dbAs("newAdmin"), "contracts/CTR-999"), { clientId: "CLI-1", deletedAt: serverTimestamp() }),
    );
  });

  it("fluxos existentes continuam funcionando em contrato ativo", async () => {
    const db = dbAs("legacyAdmin");
    // Criação como a versão anterior do app fazia: getNextId (+1) e depois o contrato.
    await adminWrite("counters/contracts", { currentNumber: 119 });
    await assertSucceeds(setDoc(doc(db, "counters/contracts"), { currentNumber: 120 }));
    await assertSucceeds(setDoc(doc(db, "contracts/CTR-120"), { id: "CTR-120", clientId: "CLI-057", status: "Em Andamento", items: [] }));
    await assertSucceeds(updateDoc(doc(db, "contracts/CTR-117"), { status: "Finalizado", finalizedAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(doc(db, "revenues/rev-pending"), { status: "Cancelado" }));
    await assertSucceeds(addDoc(collection(db, "revenues"), { contractId: "CTR-117", status: "Pendente" }));
    await assertSucceeds(addDoc(collection(db, "revenues"), { description: "Receita avulsa", status: "Pendente" }));
    await assertSucceeds(deleteDoc(doc(db, "revenues/rev-other")));
    await assertSucceeds(getDocs(collection(db, "contracts")));
  });

  it("finalização (lote contrato + estoque + parcelas + venda) funciona para admin legado", async () => {
    const db = dbAs("legacyAdmin");
    const batch = writeBatch(db);
    batch.update(doc(db, "contracts/CTR-117"), { status: "Finalizado", finalizedAt: serverTimestamp() });
    batch.update(doc(db, "equipments/EQP-001"), { stock: 13 });
    batch.update(doc(db, "equipments/EQP-009"), { stock: 6 });
    batch.set(doc(db, "sales/VND-050"), { clientId: "CLI-057", totalValue: 10 });
    batch.set(doc(collection(db, "revenues")), { clientId: "CLI-057", contractId: "CTR-117", status: "Pendente" });
    batch.update(doc(db, "revenues/rev-pending"), { status: "Cancelado" });
    await assertSucceeds(batch.commit());
    expect((await adminRead("equipments/EQP-001"))?.stock).toBe(13);
  });

  it("recálculo de parcelas (lote grande de exclusões/criações) cabe nos limites das regras", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore() as unknown as Firestore;
      for (let i = 0; i < 40; i++) {
        await setDoc(doc(db, "revenues", `bulk-${i}`), { contractId: "CTR-117", status: "Pendente" });
      }
    });
    const db = dbAs("newAdmin");
    const batch = writeBatch(db);
    for (let i = 0; i < 40; i++) batch.delete(doc(db, "revenues", `bulk-${i}`));
    for (let i = 0; i < 40; i++) batch.set(doc(collection(db, "revenues")), { contractId: "CTR-117", status: "Pendente" });
    await assertSucceeds(batch.commit());
  });

  it("auditoria é imutável e só admin lê", async () => {
    await assertSucceeds(addDoc(collection(dbAs("viewer"), "auditLogs"), { action: "login", actorUid: "viewer" }));
    const [log] = await adminList("auditLogs");
    await assertFails(updateDoc(doc(dbAs("legacyAdmin"), "auditLogs", log.id), { action: "x" }));
    await assertFails(deleteDoc(doc(dbAs("legacyAdmin"), "auditLogs", log.id)));
    await assertFails(getDocs(collection(dbAs("viewer"), "auditLogs")));
    await assertSucceeds(getDocs(collection(dbAs("legacyAdmin"), "auditLogs")));
  });

  it("usuário inativo ou anônimo não acessa contratos", async () => {
    await assertFails(getDocs(collection(dbAs("inactive"), "contracts")));
    await assertFails(getDocs(collection(env.unauthenticatedContext().firestore() as unknown as Firestore, "contracts")));
  });

  it("demais coleções mantêm o comportamento anterior (qualquer usuário ativo)", async () => {
    await assertSucceeds(updateDoc(doc(dbAs("viewer"), "clients/CLI-057"), { razaoSocial: "Alterado" }));
    await assertSucceeds(updateDoc(doc(dbAs("viewer"), "equipments/EQP-001"), { stock: 9 }));
  });
});
