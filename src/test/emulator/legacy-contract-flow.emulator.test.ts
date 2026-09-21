// Compatibilidade das regras novas com a versão do app publicada ANTES do
// número editável (commit 9cefabe). As funções abaixo reproduzem o código
// daquela versão (store/utils.ts getNextId, store/index.ts addContract e
// convertQuoteToContract), apenas recebendo o `db` e o estado local como
// parâmetro. Garante que publicar as regras antes do app novo é seguro.
// Rodar com: npm run test:emulator  (Firestore Emulator, projeto demo-tech4rent)

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
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import { addMonths, differenceInMonths, getDate } from "date-fns";

import type { TrashActor } from "@/lib/contract-trash";
import { parseContractNumber } from "@/lib/contract-number";
import { createContract, getSuggestedContractNumber } from "@/store/methods/contractCreate";

// ---------- Cópia fiel do fluxo antigo (9cefabe) ----------

async function legacyGetNextId(db: Firestore, collectionName: string): Promise<string> {
  const prefixes: { [key: string]: string } = { contracts: "CTR", quotes: "ORC" };
  const counterRef = doc(db, "counters", collectionName);
  let newId: string;
  await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    let nextNumber = 1;
    if (counterDoc.exists()) {
      nextNumber = (counterDoc.data().currentNumber || 0) + 1;
    }
    transaction.set(counterRef, { currentNumber: nextNumber }, { merge: true });
    const prefix = prefixes[collectionName] || "ID";
    newId = `${prefix}-${String(nextNumber).padStart(3, "0")}`;
  });
  return newId!;
}

// `equipments` = estado local do app antigo (o estoque vinha da tela).
async function legacyAddContract(db: Firestore, equipments: any[], contractData: any) {
  const { client, items, startDate, endDate, firstInstallmentDate, ...rest } = contractData;

  const contractId = await legacyGetNextId(db, "contracts");
  const batch = writeBatch(db);

  for (const item of items) {
    const equipment = equipments.find((e) => e.id === item.equipmentId);
    if (!equipment || equipment.stock < item.quantity) {
      throw new Error(`Estoque insuficiente para ${equipment?.name || "equipamento"}.`);
    }
    const newStock = equipment.stock - item.quantity;
    const equipmentRef = doc(db, "equipments", item.equipmentId);
    batch.update(equipmentRef, { stock: newStock });
  }

  const finalDate = new Date(endDate);
  const monthlyValue = items.reduce((acc: number, item: any) => acc + item.quantity * item.unitPrice, 0);

  const dataToSave = {
    ...rest,
    id: contractId,
    client,
    items,
    startDate,
    endDate,
    totalValue: contractData.totalValue,
    createdAt: serverTimestamp(),
  };

  const contractRef = doc(db, "contracts", contractId);
  batch.set(contractRef, dataToSave);

  const startDateObj = new Date(startDate);
  const firstInstallmentDateObj = new Date(firstInstallmentDate);

  let totalMonths = differenceInMonths(finalDate, startDateObj);
  if (getDate(finalDate) > getDate(startDateObj)) totalMonths++;
  if (totalMonths === 0) totalMonths = 1;

  let currentDueDate = new Date(firstInstallmentDateObj);
  for (let i = 0; i < totalMonths; i++) {
    const revenueData = {
      clientId: client.id,
      contractId: contractId,
      description: `Parcela ${i + 1}/${totalMonths} do contrato ${contractId}`,
      valorTotal: monthlyValue,
      valorBruto: monthlyValue,
      dueDate: Timestamp.fromDate(currentDueDate),
      status: "Pendente",
      createdAt: serverTimestamp(),
      costCenterId: rest.costCenterId || "",
      chartOfAccountId: rest.chartOfAccountId || "",
      bankAccountId: rest.bankAccountId || "",
    };
    const revenueRef = doc(collection(db, "revenues"));
    batch.set(revenueRef, revenueData);
    currentDueDate = addMonths(currentDueDate, 1);
  }

  await batch.commit();
  return { ...dataToSave, createdAt: new Date().toISOString() };
}

async function legacyConvertQuoteToContract(db: Firestore, equipments: any[], clients: any[], quoteId: string) {
  const quoteDoc = await getDoc(doc(db, "quotes", quoteId));
  if (!quoteDoc.exists()) throw new Error("Orçamento não encontrado.");
  const quote = { id: quoteDoc.id, ...quoteDoc.data() } as any;
  if (quote.status !== "Pendente") throw new Error("Apenas orçamentos pendentes podem ser convertidos.");
  if (quote.budgetType !== "locacao") throw new Error("Este orçamento não é de locação.");

  const client = clients.find((c) => c.id === quote.clientId);
  const startDate = quote.startDate?.toDate ? quote.startDate.toDate() : new Date(quote.startDate);
  const endDate = quote.endDate?.toDate ? quote.endDate.toDate() : new Date(quote.endDate);

  const contractData = {
    clientId: quote.clientId,
    client: client || null,
    startDate,
    endDate,
    items: quote.items,
    totalValue: quote.totalValue,
    status: "Em Andamento",
    quoteId: quote.id,
    costCenterId: quote.costCenterId || "",
    chartOfAccountId: quote.chartOfAccountId || "",
    bankAccountId: quote.bankAccountId || "",
    firstInstallmentDate: addMonths(startDate, 1),
  };

  const newContract = await legacyAddContract(db, equipments, contractData);
  await updateDoc(doc(db, "quotes", quoteId), { status: "Aprovado" });
  return newContract;
}

// ---------- Ambiente ----------

let env: RulesTestEnvironment;

const USERS: Record<string, any> = {
  legacyAdmin: { name: "Admin Legado", email: "legado@t4r.test", permission: "admin", status: "ativo" }, // sem profile
  legacyAdminStatusActive: { name: "Admin Legado 2", email: "legado2@t4r.test", permission: "Administrador", status: "active" },
  newAdmin: { name: "Admin Novo", email: "novo@t4r.test", profile: "admin", permission: "admin", status: "ativo" },
  legacyGestor: { name: "Gestor Legado", email: "gestor@t4r.test", permission: "gestor", status: "ativo" },
  creator: { name: "Cria", email: "cria@t4r.test", profile: "custom", permissions: ["contratos.view", "contratos.create"], status: "ativo" },
  moduleWildcard: { name: "Coringa", email: "coringa@t4r.test", profile: "custom", permissions: ["contratos.*"], status: "ativo" },
  viewer: { name: "Leitor", email: "leitor@t4r.test", profile: "custom", permissions: ["contratos.view"], status: "ativo" },
  comercial: { name: "Comercial", email: "comercial@t4r.test", profile: "comercial_orcamentos", permission: "comercial_orcamentos", permissions: [], status: "ativo" },
};

const dbAs = (uid: string) => env.authenticatedContext(uid).firestore() as unknown as Firestore;
const actor = (uid: string): TrashActor => ({ uid, email: USERS[uid].email, name: USERS[uid].name });

async function adminRead<T = any>(path: string): Promise<T | undefined> {
  let data: any;
  await env.withSecurityRulesDisabled(async (ctx) => {
    const snap = await getDoc(doc(ctx.firestore() as unknown as Firestore, path));
    data = snap.exists() ? snap.data() : undefined;
  });
  return data;
}

async function adminList(col: string): Promise<any[]> {
  let rows: any[] = [];
  await env.withSecurityRulesDisabled(async (ctx) => {
    const snap = await getDocs(collection(ctx.firestore() as unknown as Firestore, col));
    rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  });
  return rows;
}

const counter = async () => (await adminRead("counters/contracts"))?.currentNumber;
const stock = async (id: string) => (await adminRead(`equipments/${id}`))?.stock;
const localEquipments = async () => adminList("equipments");
const CLIENT = { id: "CLI-001", name: "Cliente Teste" };

const contractData = () => ({
  clientId: "CLI-001",
  unitOperation: "CD Campinas",
  client: CLIENT,
  startDate: new Date(2026, 9, 1),
  endDate: new Date(2027, 0, 1),
  firstInstallmentDate: new Date(2026, 10, 1),
  items: [
    { equipmentId: "EQP-001", quantity: 2, billingType: "Mensal", unitPrice: 100 },
    { equipmentId: "EQP-009", quantity: 1, billingType: "Mensal", unitPrice: 50 },
  ],
  totalValue: 250,
  status: "Em Andamento",
  costCenterId: "",
  chartOfAccountId: "",
  bankAccountId: "",
});

const legacyCreate = async (uid: string) => legacyAddContract(dbAs(uid), await localEquipments(), contractData());

beforeAll(async () => {
  // Também valida a sintaxe de firestore.rules: o emulador recusa regras que não compilam.
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
    // Estado equivalente ao da produção: contador 119, CTR-116 e CTR-118 existem, CTR-117 não.
    await setDoc(doc(db, "counters", "contracts"), { currentNumber: 119 });
    for (const id of ["CTR-116", "CTR-118"]) {
      await setDoc(doc(db, "contracts", id), { id, clientId: "CLI-001", status: "Em Andamento", items: [] });
    }
    await setDoc(doc(db, "quotes", "ORC-010"), {
      id: "ORC-010",
      clientId: "CLI-001",
      status: "Pendente",
      budgetType: "locacao",
      startDate: Timestamp.fromDate(new Date(2026, 9, 1)),
      endDate: Timestamp.fromDate(new Date(2027, 0, 1)),
      items: [{ equipmentId: "EQP-001", quantity: 3, billingType: "Mensal", unitPrice: 80 }],
      totalValue: 240,
    });
  });
});

describe("app publicado (9cefabe) sob as regras novas", () => {
  it.each(["legacyAdmin", "legacyAdminStatusActive", "newAdmin", "legacyGestor", "creator", "moduleWildcard"])(
    "criação antiga por %s: contador +1, contrato, estoque e parcelas",
    async (uid) => {
      const created = await legacyCreate(uid);

      expect(created.id).toBe("CTR-120");
      expect(await counter()).toBe(120);
      expect(await adminRead("contracts/CTR-120")).toMatchObject({ id: "CTR-120", clientId: "CLI-001", totalValue: 250 });
      expect(await stock("EQP-001")).toBe(8);
      expect(await stock("EQP-009")).toBe(3);
      const revenues = (await adminList("revenues")).filter((r) => r.contractId === "CTR-120");
      expect(revenues).toHaveLength(3);
    },
  );

  it("etapas antigas isoladas: contador separado e depois o lote (contrato + estoque + parcelas)", async () => {
    const db = dbAs("legacyAdmin");
    await assertSucceeds(legacyGetNextId(db, "contracts"));
    expect(await counter()).toBe(120);

    const batch = writeBatch(db);
    batch.update(doc(db, "equipments/EQP-001"), { stock: 9 });
    batch.set(doc(db, "contracts/CTR-120"), { id: "CTR-120", clientId: "CLI-001", items: [], createdAt: serverTimestamp() });
    batch.set(doc(collection(db, "revenues")), { clientId: "CLI-001", contractId: "CTR-120", status: "Pendente" });
    await assertSucceeds(batch.commit());
  });

  it("criações antigas sequenciais seguem a numeração", async () => {
    expect((await legacyCreate("legacyAdmin")).id).toBe("CTR-120");
    expect((await legacyCreate("newAdmin")).id).toBe("CTR-121");
    expect(await counter()).toBe(121);
  });

  it("criações antigas simultâneas recebem números diferentes", async () => {
    const eq = await localEquipments();
    const [a, b] = await Promise.all([
      legacyAddContract(dbAs("legacyAdmin"), eq, contractData()),
      legacyAddContract(dbAs("newAdmin"), eq, contractData()),
    ]);
    expect([a.id, b.id].sort()).toEqual(["CTR-120", "CTR-121"]);
    expect(await counter()).toBe(121);
  });

  it("contador ainda inexistente: a versão antiga cria CTR-001", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore() as unknown as Firestore, "counters/contracts"), {});
    });
    expect((await legacyCreate("legacyAdmin")).id).toBe("CTR-001");
  });

  it("conversão antiga de orçamento (admin legado): contrato, estoque, parcelas e orçamento aprovado", async () => {
    const created = await legacyConvertQuoteToContract(dbAs("legacyAdmin"), await localEquipments(), [CLIENT], "ORC-010");

    expect(created.id).toBe("CTR-120");
    expect(await adminRead("contracts/CTR-120")).toMatchObject({ quoteId: "ORC-010", totalValue: 240 });
    expect((await adminRead("quotes/ORC-010"))?.status).toBe("Aprovado");
    expect(await stock("EQP-001")).toBe(7);
    expect((await adminList("revenues")).filter((r) => r.contractId === "CTR-120")).toHaveLength(3);
    expect(await counter()).toBe(120);
  });

  it("conversão antiga por usuário com contratos.create (sem orcamentos.edit) continua funcionando", async () => {
    await assertSucceeds(legacyConvertQuoteToContract(dbAs("creator"), await localEquipments(), [CLIENT], "ORC-010"));
  });

  it("usuário sem contratos.create continua sem criar, e agora nem consome número", async () => {
    for (const uid of ["viewer", "comercial"]) {
      await assertFails(legacyCreate(uid));
    }
    expect(await counter()).toBe(119);
    expect((await adminList("contracts")).map((c) => c.id).sort()).toEqual(["CTR-116", "CTR-118"]);
    expect(await stock("EQP-001")).toBe(10);
  });
});

describe("app antigo e app novo convivendo", () => {
  it("número manual maior no app novo: o app antigo continua depois dele", async () => {
    await createContract(dbAs("newAdmin"), {
      draft: contractData(),
      contractNumber: "CTR-150",
      suggestedId: "CTR-120",
      actor: actor("newAdmin"),
    });
    expect((await legacyCreate("legacyAdmin")).id).toBe("CTR-151");
  });

  it("número manual menor no app novo: o app antigo não colide e segue o contador", async () => {
    await createContract(dbAs("newAdmin"), {
      draft: contractData(),
      contractNumber: "CTR-050",
      suggestedId: "CTR-120",
      actor: actor("newAdmin"),
    });
    expect(await counter()).toBe(119);
    expect((await legacyCreate("legacyAdmin")).id).toBe("CTR-120");
  });

  it("depois de uma criação antiga, o app novo sugere o próximo número", async () => {
    await legacyCreate("legacyAdmin");
    expect(await getSuggestedContractNumber(dbAs("newAdmin"))).toBe("CTR-121");
  });
});

describe("CTR-117 (lacuna do incidente)", () => {
  it("permanece disponível e não é criado por nenhum fluxo automático", async () => {
    // Não existe no banco e não é bloqueado pela validação de formato.
    expect(await adminRead("contracts/CTR-117")).toBeUndefined();
    expect(parseContractNumber("CTR-117")).toEqual({ ok: true, id: "CTR-117", number: 117 });

    // A numeração automática (nova e antiga) nunca volta para ele.
    expect(await getSuggestedContractNumber(dbAs("newAdmin"))).toBe("CTR-120");
    await legacyCreate("legacyAdmin");
    await createContract(dbAs("newAdmin"), {
      draft: contractData(),
      contractNumber: await getSuggestedContractNumber(dbAs("newAdmin")),
      suggestedId: null,
      actor: actor("newAdmin"),
    });

    expect(await adminRead("contracts/CTR-117")).toBeUndefined();
    expect((await adminList("contracts")).map((c) => c.id).sort()).toEqual(["CTR-116", "CTR-118", "CTR-120", "CTR-121"]);
  });
});
