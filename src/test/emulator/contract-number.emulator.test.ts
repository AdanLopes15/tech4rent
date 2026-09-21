// Testes de integração com o Firestore Emulator (projeto fictício demo-tech4rent).
// Executa as transações reais de criação de contrato (número editável) contra
// as regras reais de firestore.rules.
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
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, Timestamp, type Firestore } from "firebase/firestore";

import type { TrashActor } from "@/lib/contract-trash";
import {
  ContractNumberTakenError,
  convertQuoteToContract,
  createContract,
  getSuggestedContractNumber,
  type ContractDraft,
} from "@/store/methods/contractCreate";

let env: RulesTestEnvironment;

const USERS: Record<string, any> = {
  legacyAdmin: { name: "Admin Legado", email: "legado@t4r.test", permission: "admin", status: "ativo" }, // sem profile
  newAdmin: { name: "Admin Novo", email: "novo@t4r.test", profile: "admin", permission: "admin", status: "ativo" },
  creator: { name: "Cria", email: "cria@t4r.test", profile: "custom", permissions: ["contratos.view", "contratos.create"], status: "ativo" },
  editor: { name: "Edita", email: "edita@t4r.test", profile: "custom", permissions: ["contratos.view", "contratos.edit"], status: "ativo" },
  viewer: { name: "Leitor", email: "leitor@t4r.test", profile: "custom", permissions: ["contratos.view"], status: "ativo" },
  // Converte orçamentos, mas não cria contratos: a conversão também é negada.
  converter: {
    name: "Converte",
    email: "converte@t4r.test",
    profile: "custom",
    permissions: ["orcamentos.view", "orcamentos.edit", "orcamentos.convert"],
    status: "ativo",
  },
  comercial: { name: "Comercial", email: "comercial@t4r.test", profile: "comercial_orcamentos", permission: "comercial_orcamentos", permissions: [], status: "ativo" },
};

const actor = (uid: string): TrashActor => ({ uid, email: USERS[uid].email, name: USERS[uid].name });
const dbAs = (uid: string) => env.authenticatedContext(uid).firestore() as unknown as Firestore;

const draft = (overrides: Partial<ContractDraft> = {}): ContractDraft => ({
  clientId: "CLI-001",
  client: { id: "CLI-001", name: "Cliente Teste" },
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
  ...overrides,
});

const create = (uid: string, contractNumber: string, suggestedId: string | null = "CTR-120", d = draft()) =>
  createContract(dbAs(uid), { draft: d, contractNumber, suggestedId, actor: actor(uid) });

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

const counter = async () => (await adminRead("counters/contracts"))?.currentNumber;
const stock = async (id: string) => (await adminRead(`equipments/${id}`))?.stock;

// Estado completo do que uma criação pode alterar, para provar que falhas não gravam nada.
async function snapshot() {
  return {
    contracts: (await adminList("contracts")).map((c) => c.id).sort(),
    revenues: (await adminList("revenues")).length,
    audit: (await adminList("auditLogs")).length,
    counter: await counter(),
    stock: [await stock("EQP-001"), await stock("EQP-009")],
    quote: (await adminRead("quotes/ORC-010"))?.status,
  };
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
    await setDoc(doc(db, "counters", "contracts"), { currentNumber: 119 });
    await setDoc(doc(db, "contracts", "CTR-118"), { id: "CTR-118", clientId: "CLI-001", status: "Em Andamento", items: [] });
    // CTR-100 está na Lixeira: continua ocupando o número.
    await setDoc(doc(db, "contracts", "CTR-100"), {
      id: "CTR-100",
      clientId: "CLI-002",
      status: "Em Andamento",
      items: [],
      deletedAt: Timestamp.now(),
      deletedBy: { uid: "newAdmin", email: "novo@t4r.test", name: "Admin Novo" },
      deletionReason: "Contrato lançado em duplicidade",
      stockReturned: [],
    });
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

describe("1–4. sugestão e regra do contador", () => {
  it("1. sugere contador + 1 sem gravar nada", async () => {
    expect(await getSuggestedContractNumber(dbAs("newAdmin"))).toBe("CTR-120");
    expect(await counter()).toBe(119);
  });

  it("1. a sugestão pula números já ocupados (inclusive na Lixeira) e nunca volta atrás", async () => {
    await adminWrite("counters/contracts", { currentNumber: 99 });
    // CTR-100 está na Lixeira → sugere CTR-101.
    expect(await getSuggestedContractNumber(dbAs("newAdmin"))).toBe("CTR-101");
  });

  it("1. sem contador ainda, sugere CTR-001", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await deleteDoc(doc(ctx.firestore() as unknown as Firestore, "counters/contracts"));
    });
    expect(await getSuggestedContractNumber(dbAs("newAdmin"))).toBe("CTR-001");
  });

  it("2. aceitar o sugerido cria CTR-120 e o próximo automático passa a ser CTR-121", async () => {
    const result = await create("newAdmin", "CTR-120");

    expect(result).toMatchObject({ contractId: "CTR-120", numberSource: "automatico", counterBefore: 119, counterAfter: 120 });
    expect(await counter()).toBe(120);
    expect(await getSuggestedContractNumber(dbAs("newAdmin"))).toBe("CTR-121");
  });

  it("3. número manual menor (CTR-050) é aceito e o contador NÃO diminui", async () => {
    const result = await create("newAdmin", "ctr-50");

    expect(result).toMatchObject({ contractId: "CTR-050", numberSource: "manual", counterAfter: 119 });
    expect(await adminRead("contracts/CTR-050")).toMatchObject({ id: "CTR-050" });
    expect(await counter()).toBe(119);
    expect(await getSuggestedContractNumber(dbAs("newAdmin"))).toBe("CTR-120");
  });

  it("4. número manual maior (CTR-150) avança o contador e o próximo automático é CTR-151", async () => {
    const result = await create("newAdmin", " 150 ");

    expect(result).toMatchObject({ contractId: "CTR-150", numberSource: "manual", counterBefore: 119, counterAfter: 150 });
    expect(await counter()).toBe(150);
    expect(await getSuggestedContractNumber(dbAs("newAdmin"))).toBe("CTR-151");
  });
});

describe("9. criação direta: contrato, parcelas, estoque e auditoria", () => {
  it("grava tudo e registra número, origem, usuário e data na auditoria", async () => {
    await create("newAdmin", "CTR-120");

    const contract = await adminRead("contracts/CTR-120");
    expect(contract).toMatchObject({
      id: "CTR-120",
      clientId: "CLI-001",
      status: "Em Andamento",
      totalValue: 250,
      createdBy: actor("newAdmin"),
      numbering: { source: "automatico", suggestedId: "CTR-120", origin: "contrato_direto" },
    });
    expect(contract?.createdAt).toBeTruthy();

    const revenues = (await adminList("revenues")).filter((r) => r.contractId === "CTR-120");
    expect(revenues).toHaveLength(3);
    expect(revenues.every((r) => r.valorTotal === 250 && r.status === "Pendente")).toBe(true);
    expect(revenues.map((r) => r.description).sort()[0]).toBe("Parcela 1/3 do contrato CTR-120");

    expect(await stock("EQP-001")).toBe(8);
    expect(await stock("EQP-009")).toBe(3);

    const audit = await adminList("auditLogs");
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({
      action: "contract.create",
      actorUid: "newAdmin",
      actorEmail: "novo@t4r.test",
      details: {
        contractId: "CTR-120",
        contractNumber: 120,
        numberSource: "automatico",
        suggestedId: "CTR-120",
        origin: "contrato_direto",
        counterBefore: 119,
        counterAfter: 120,
        installments: 3,
        actorName: "Admin Novo",
      },
    });
    expect(audit[0].createdAt).toBeTruthy();
  });

  it("número alterado manualmente fica registrado como manual", async () => {
    await create("newAdmin", "CTR-130", "CTR-120");
    const [audit] = await adminList("auditLogs");
    expect(audit.details).toMatchObject({ contractId: "CTR-130", numberSource: "manual", suggestedId: "CTR-120" });
  });
});

describe("5–7. duplicidade e formato", () => {
  it("5. número de contrato existente é bloqueado sem gravar nada", async () => {
    const before = await snapshot();
    const err = await create("newAdmin", "CTR-118").catch((e) => e);

    expect(err).toBeInstanceOf(ContractNumberTakenError);
    expect(err.message).toBe("Já existe um contrato com o número CTR-118.");
    expect(await snapshot()).toEqual(before);
  });

  it("6. número de contrato na Lixeira é bloqueado (em qualquer forma de digitação)", async () => {
    const before = await snapshot();
    for (const typed of ["CTR-100", "ctr-100", "100", "CTR-0100"]) {
      const err = await create("newAdmin", typed).catch((e) => e);
      expect(err).toBeInstanceOf(ContractNumberTakenError);
      expect(err.message).toBe("Já existe um contrato com o número CTR-100.");
    }
    expect(await snapshot()).toEqual(before);
    expect((await adminRead("contracts/CTR-100"))?.deletedAt).toBeTruthy();
  });

  it("7. formatos inválidos são recusados sem gravar nada", async () => {
    const before = await snapshot();
    for (const typed of ["", "   ", "CTR-", "CTR-0", "000", "CTR-12A", "ABC-120", "CTR-12.5", "-5", "CTR-1000000"]) {
      await expect(create("newAdmin", typed)).rejects.toThrow();
    }
    expect(await snapshot()).toEqual(before);
  });

  it("7. as regras recusam IDs fora do formato canônico mesmo sem passar pela interface", async () => {
    const db = dbAs("newAdmin");
    const raw = (id: string, data: any = {}) => setDoc(doc(db, "contracts", id), { id, clientId: "CLI-001", items: [], ...data });
    await assertFails(raw("CTR-50")); // deveria ser CTR-050
    await assertFails(raw("CTR-000"));
    await assertFails(raw("ctr-099"));
    await assertFails(raw("CTR-12A"));
    await assertFails(raw("X-001"));
    await assertFails(raw("CTR-099", { id: "CTR-098" })); // campo id diferente do documento
    await assertSucceeds(raw("CTR-099")); // canônico e abaixo do contador
  });
});

describe("8. criações simultâneas", () => {
  it("dois usuários com o mesmo número: exatamente um cria, o outro recebe erro de duplicidade", async () => {
    const results = await Promise.allSettled([
      create("newAdmin", "CTR-120"),
      create("legacyAdmin", "CTR-120"),
      create("creator", "120"),
    ]);

    const ok = results.filter((r) => r.status === "fulfilled");
    const failed = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
    expect(ok).toHaveLength(1);
    expect(failed).toHaveLength(2);
    for (const f of failed) expect(f.reason).toBeInstanceOf(ContractNumberTakenError);

    // Estoque baixado uma única vez, parcelas e auditoria de um único contrato.
    expect(await stock("EQP-001")).toBe(8);
    expect(await stock("EQP-009")).toBe(3);
    expect((await adminList("revenues")).length).toBe(3);
    expect((await adminList("auditLogs")).length).toBe(1);
    expect(await counter()).toBe(120);
  });

  it("muitos números diferentes em paralelo (em qualquer ordem de commit): todos criam", async () => {
    const numbers = ["CTR-124", "CTR-120", "CTR-123", "CTR-060", "CTR-121", "CTR-122"];
    const users = ["newAdmin", "legacyAdmin", "creator"];
    const results = await Promise.allSettled(
      numbers.map((n, i) => create(users[i % users.length], n, null, draft({ items: [{ equipmentId: "EQP-001", quantity: 1, unitPrice: 10 }] }))),
    );
    expect(results.filter((r) => r.status === "rejected")).toEqual([]);
    expect(await counter()).toBe(124);
    expect(await stock("EQP-001")).toBe(4);
    expect((await adminList("auditLogs")).length).toBe(6);
  });

  it("números diferentes em paralelo: todos criam e o contador fica no maior", async () => {
    const results = await Promise.allSettled([
      create("newAdmin", "CTR-120"),
      create("legacyAdmin", "CTR-121"),
      create("creator", "CTR-060"),
    ]);
    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
    expect(await counter()).toBe(121);
    expect(await stock("EQP-001")).toBe(4);
  });
});

describe("10. conversão de orçamento", () => {
  const convert = (uid: string, contractNumber: string, suggestedId: string | null = "CTR-120") =>
    convertQuoteToContract(dbAs(uid), { quoteId: "ORC-010", client: { id: "CLI-001" }, contractNumber, suggestedId, actor: actor(uid) });

  it("com o número sugerido: cria o contrato e aprova o orçamento na mesma transação", async () => {
    const result = await convert("newAdmin", "CTR-120");

    expect(result.contractId).toBe("CTR-120");
    expect(await adminRead("contracts/CTR-120")).toMatchObject({
      quoteId: "ORC-010",
      totalValue: 240,
      numbering: { source: "automatico", origin: "conversao_orcamento" },
    });
    expect(await adminRead("quotes/ORC-010")).toMatchObject({ status: "Aprovado", contractId: "CTR-120" });
    expect(await stock("EQP-001")).toBe(7);
    expect((await adminList("revenues")).length).toBe(3);
    const [audit] = await adminList("auditLogs");
    expect(audit.details).toMatchObject({ origin: "conversao_orcamento", quoteId: "ORC-010", numberSource: "automatico" });
    expect(await counter()).toBe(120);
  });

  it("com número editado: usa o número escolhido e registra como manual", async () => {
    await convert("newAdmin", "ctr-200");
    expect(await adminRead("quotes/ORC-010")).toMatchObject({ contractId: "CTR-200" });
    expect(await counter()).toBe(200);
    const [audit] = await adminList("auditLogs");
    expect(audit.details).toMatchObject({ numberSource: "manual", contractId: "CTR-200" });
  });

  it("número duplicado: orçamento continua pendente e nada é gravado", async () => {
    const before = await snapshot();
    await expect(convert("newAdmin", "CTR-118")).rejects.toBeInstanceOf(ContractNumberTakenError);
    await expect(convert("newAdmin", "CTR-100")).rejects.toBeInstanceOf(ContractNumberTakenError);
    expect(await snapshot()).toEqual(before);
  });

  it("o mesmo orçamento não vira dois contratos (duplo clique / dois usuários)", async () => {
    const results = await Promise.allSettled([convert("newAdmin", "CTR-120"), convert("legacyAdmin", "CTR-121")]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const contracts = (await adminList("contracts")).filter((c) => c.quoteId === "ORC-010");
    expect(contracts).toHaveLength(1);
    expect(await stock("EQP-001")).toBe(7);
  });

  it("quem tem orcamentos.convert mas não contratos.create não converte", async () => {
    const before = await snapshot();
    await assertFails(convert("converter", "CTR-120"));
    expect(await snapshot()).toEqual(before);
  });
});

describe("11–12. permissões", () => {
  it("11. administrador antigo (permission: admin, sem profile) cria com número sugerido e manual", async () => {
    await assertSucceeds(create("legacyAdmin", "CTR-120"));
    await assertSucceeds(create("legacyAdmin", "CTR-140", "CTR-121"));
    await assertSucceeds(create("legacyAdmin", "CTR-070", "CTR-141"));
    expect(await counter()).toBe(140);
  });

  it("usuário com contratos.create (perfil personalizado) cria", async () => {
    await assertSucceeds(create("creator", "CTR-120"));
  });

  it("12. sem contratos.create não cria (nem com número editado) e nada é gravado", async () => {
    const before = await snapshot();
    for (const uid of ["viewer", "editor", "comercial", "converter"]) {
      await assertFails(create(uid, "CTR-120"));
      await assertFails(create(uid, "CTR-300", "CTR-120"));
    }
    expect(await snapshot()).toEqual(before);
  });

  it("12. sem contratos.create não mexe no contador de contratos", async () => {
    for (const uid of ["viewer", "editor", "comercial"]) {
      await assertFails(setDoc(doc(dbAs(uid), "counters/contracts"), { currentNumber: 120 }));
    }
    expect(await counter()).toBe(119);
    // Os demais contadores continuam liberados para usuários ativos, como antes.
    await assertSucceeds(setDoc(doc(dbAs("viewer"), "counters/clients"), { currentNumber: 5 }));
  });
});

describe("regras do contador", () => {
  const setCounter = (uid: string, n: any) => setDoc(doc(dbAs(uid), "counters/contracts"), { currentNumber: n });

  it("nunca diminui, não aceita valor não inteiro e não pode ser apagado", async () => {
    await assertFails(setCounter("newAdmin", 50));
    await assertFails(setCounter("newAdmin", 118));
    await assertFails(setCounter("newAdmin", "120"));
    await assertFails(setCounter("newAdmin", 120.5));
    await assertFails(deleteDoc(doc(dbAs("newAdmin"), "counters/contracts")));
    expect(await counter()).toBe(119);
  });

  it("regravar o mesmo valor é inofensivo e aceito (transação concorrente desatualizada)", async () => {
    await assertSucceeds(setCounter("newAdmin", 119));
    expect(await counter()).toBe(119);
    await assertFails(setCounter("viewer", 119)); // ainda exige contratos.create
  });

  it("não salta para um número sem que o contrato seja criado na mesma operação", async () => {
    await assertFails(setCounter("newAdmin", 500));
    expect(await counter()).toBe(119);
  });

  it("contrato acima do contador sem avançar o contador é negado", async () => {
    await assertFails(setDoc(doc(dbAs("newAdmin"), "contracts/CTR-500"), { id: "CTR-500", clientId: "CLI-001", items: [] }));
  });

  it("compatível com a versão anterior do app (getNextId +1 e depois grava o contrato)", async () => {
    const db = dbAs("creator");
    await assertSucceeds(setCounter("creator", 120));
    await assertSucceeds(setDoc(doc(db, "contracts/CTR-120"), { id: "CTR-120", clientId: "CLI-001", items: [] }));
  });
});

describe("13. falhas não deixam dados parcialmente criados", () => {
  it("estoque insuficiente em um item: nada de contrato, parcelas, estoque, contador ou auditoria", async () => {
    const before = await snapshot();
    const d = draft({
      items: [
        { equipmentId: "EQP-001", quantity: 2, unitPrice: 100 }, // teria estoque
        { equipmentId: "EQP-009", quantity: 5, unitPrice: 50 }, // só há 4
      ],
    });
    await expect(create("newAdmin", "CTR-150", "CTR-120", d)).rejects.toThrow(/Estoque insuficiente para Gatilho Scan/);
    expect(await snapshot()).toEqual(before);
  });

  it("equipamento inexistente: nada é gravado", async () => {
    const before = await snapshot();
    const d = draft({ items: [{ equipmentId: "EQP-404", quantity: 1, unitPrice: 10 }] });
    await expect(create("newAdmin", "CTR-120", "CTR-120", d)).rejects.toThrow(/não existe mais/);
    expect(await snapshot()).toEqual(before);
  });

  it("dados inválidos (sem cliente, sem itens, data inválida): nada é gravado", async () => {
    const before = await snapshot();
    await expect(create("newAdmin", "CTR-120", "CTR-120", draft({ clientId: "" }))).rejects.toThrow(/cliente/);
    await expect(create("newAdmin", "CTR-120", "CTR-120", draft({ items: [] }))).rejects.toThrow(/equipamento/);
    await expect(create("newAdmin", "CTR-120", "CTR-120", draft({ endDate: new Date("x") }))).rejects.toThrow(/inválida/);
    expect(await snapshot()).toEqual(before);
  });

  it("falha na etapa do orçamento (não está mais pendente): nada é gravado", async () => {
    await adminWrite("quotes/ORC-010", { ...(await adminRead("quotes/ORC-010")), status: "Recusado" });
    const before = await snapshot();
    await expect(
      convertQuoteToContract(dbAs("newAdmin"), {
        quoteId: "ORC-010", client: null, contractNumber: "CTR-150", suggestedId: "CTR-120", actor: actor("newAdmin"),
      }),
    ).rejects.toThrow(/pendentes/);
    expect(await snapshot()).toEqual(before);
  });

  it("negação das regras no meio da transação (sem permissão) não deixa nada gravado", async () => {
    const before = await snapshot();
    await assertFails(create("viewer", "CTR-150"));
    await assertFails(convertQuoteToContract(dbAs("viewer"), {
      quoteId: "ORC-010", client: null, contractNumber: "CTR-150", suggestedId: "CTR-120", actor: actor("viewer"),
    }));
    expect(await snapshot()).toEqual(before);
  });
});
