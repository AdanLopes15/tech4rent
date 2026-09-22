// Testes de integração da DUPLICAÇÃO de contrato com o Firestore Emulator
// (projeto fictício demo-tech4rent). Executa a transação real de criação
// contra as regras reais de firestore.rules.
// Rodar com: npm run test:emulator  (nunca acessa a produção)
//
// A duplicação não tem fluxo próprio: o formulário é preenchido com os dados
// comerciais do original (lib/contract-duplicate.ts) e a gravação usa o mesmo
// createContract da criação normal. Estes testes provam isso ponta a ponta.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { collection, doc, getDoc, getDocs, setDoc, Timestamp, type Firestore } from "firebase/firestore";

import type { TrashActor } from "@/lib/contract-trash";
import { duplicableContractValues, NEVER_DUPLICATED_FIELDS } from "@/lib/contract-duplicate";
import {
  ContractNumberTakenError,
  createContract,
  getSuggestedContractNumber,
  type ContractDraft,
} from "@/store/methods/contractCreate";

let env: RulesTestEnvironment;

/** Um documento do Firestore como os helpers deste teste o devolvem. */
type DocData = Record<string, unknown>;

/** Só os campos que estes testes leem de uma parcela e de um registro de auditoria. */
type RevenueDoc = DocData & { contractId?: string; dueDate?: { toDate(): Date } };
type AuditDoc = DocData & { details: DocData };

type TestUser = {
  name: string;
  email: string;
  status: string;
  profile?: string;
  permission?: string;
  permissions?: string[];
};

const USERS: Record<string, TestUser> = {
  newAdmin: { name: "Admin Novo", email: "novo@t4r.test", profile: "admin", permission: "admin", status: "ativo" },
  legacyAdmin: { name: "Admin Legado", email: "legado@t4r.test", permission: "admin", status: "ativo" },
  creator: {
    name: "Cria",
    email: "cria@t4r.test",
    profile: "custom",
    permissions: ["contratos.view", "contratos.create"],
    status: "ativo",
  },
  // Edita contratos, mas NÃO pode criar: também não pode duplicar.
  editor: {
    name: "Edita",
    email: "edita@t4r.test",
    profile: "custom",
    permissions: ["contratos.view", "contratos.edit"],
    status: "ativo",
  },
  viewer: { name: "Leitor", email: "leitor@t4r.test", profile: "custom", permissions: ["contratos.view"], status: "ativo" },
};

const actor = (uid: string): TrashActor => ({ uid, email: USERS[uid].email, name: USERS[uid].name });
const dbAs = (uid: string) => env.authenticatedContext(uid).firestore() as unknown as Firestore;

// O contrato de origem, como existe no banco: dados comerciais + tudo o que um
// contrato acumula (status, anexo, orçamento, pagamentos, histórico...).
const ORIGINAL = {
  id: "CTR-118",
  clientId: "CLI-001",
  unitOperation: "Unidade Sumaré",
  client: { id: "CLI-001", razaoSocial: "Cliente Teste" },
  startDate: Timestamp.fromDate(new Date(2026, 9, 1)),
  endDate: Timestamp.fromDate(new Date(2027, 0, 1)),
  firstInstallmentDate: Timestamp.fromDate(new Date(2026, 10, 1)),
  items: [
    { equipmentId: "EQP-001", quantity: 2, billingType: "Mensal", unitPrice: 100 },
    { equipmentId: "EQP-009", quantity: 1, billingType: "Mensal", unitPrice: 50 },
  ],
  totalValue: 250,
  status: "Finalizado",
  finalizedAt: Timestamp.fromDate(new Date(2027, 0, 2)),
  quoteId: "ORC-010",
  signedContractUrl: "https://exemplo/CTR-118.pdf",
  costCenterId: "CC-1",
  chartOfAccountId: "PC-1",
  bankAccountId: "BCO-1",
  createdAt: Timestamp.fromDate(new Date(2026, 8, 1)),
  createdBy: { uid: "legacyAdmin", email: "legado@t4r.test", name: "Admin Legado" },
  numbering: { source: "manual", suggestedId: "CTR-110", origin: "contrato_direto" },
};

/**
 * Exatamente o que a interface monta ao duplicar: os valores comerciais
 * copiados do original + o que o formulário sempre define numa criação.
 */
function duplicateDraft(source: unknown, overrides: Partial<ContractDraft> = {}): ContractDraft {
  const values = duplicableContractValues(source);
  return {
    clientId: values.clientId,
    client: { id: values.clientId, razaoSocial: "Cliente Teste" },
    unitOperation: values.unitOperation,
    startDate: values.startDate!,
    endDate: values.endDate!,
    firstInstallmentDate: values.firstInstallmentDate!,
    items: values.items,
    totalValue: values.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0),
    status: "Em Andamento",
    costCenterId: values.costCenterId,
    chartOfAccountId: values.chartOfAccountId,
    bankAccountId: values.bankAccountId,
    ...overrides,
  };
}

const duplicate = (
  uid: string,
  contractNumber: string,
  suggestedId: string | null = "CTR-120",
  draft = duplicateDraft(ORIGINAL),
  from: string | null = "CTR-118",
) =>
  createContract(dbAs(uid), {
    draft,
    contractNumber,
    suggestedId,
    duplicatedFromContractId: from,
    actor: actor(uid),
  });

async function adminRead<T extends DocData = DocData>(path: string): Promise<T | undefined> {
  let data: T | undefined;
  await env.withSecurityRulesDisabled(async (ctx) => {
    const snap = await getDoc(doc(ctx.firestore() as unknown as Firestore, path));
    data = snap.exists() ? (snap.data() as T) : undefined;
  });
  return data;
}

async function adminWrite(path: string, data: DocData) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore() as unknown as Firestore, path), data);
  });
}

async function adminList<T extends DocData = DocData>(col: string): Promise<(T & { id: string })[]> {
  let rows: (T & { id: string })[] = [];
  await env.withSecurityRulesDisabled(async (ctx) => {
    const snap = await getDocs(collection(ctx.firestore() as unknown as Firestore, col));
    rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) }));
  });
  return rows;
}

const counter = async () => (await adminRead("counters/contracts"))?.currentNumber;
const stock = async (id: string) => (await adminRead(`equipments/${id}`))?.stock;

/** Estado completo do que uma duplicação pode alterar. */
async function snapshot() {
  return {
    contracts: (await adminList("contracts")).map((c) => c.id).sort(),
    revenues: (await adminList("revenues")).length,
    audit: (await adminList("auditLogs")).length,
    counter: await counter(),
    stock: [await stock("EQP-001"), await stock("EQP-009")],
    original: JSON.stringify(await adminRead("contracts/CTR-118")),
  };
}

/** O contrato original, serializado, para comparação byte a byte. */
const originalBytes = () => adminRead("contracts/CTR-118").then((d) => JSON.stringify(d));

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
    await setDoc(doc(db, "contracts", "CTR-118"), ORIGINAL);
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
    // Parcelas e pagamentos do original: não podem ser copiados.
    await setDoc(doc(db, "revenues", "REV-ANTIGA-1"), {
      clientId: "CLI-001",
      contractId: "CTR-118",
      description: "Parcela 1/3 do contrato CTR-118",
      valorTotal: 250,
      status: "recebido",
      boletoUrl: "https://exemplo/boleto-118.pdf",
      dueDate: Timestamp.fromDate(new Date(2026, 10, 1)),
    });
  });
});

describe("4. número: a cópia usa o próximo sequencial, nunca o número do original", () => {
  it("a sugestão continua vindo do contador, sem relação com o contrato duplicado", async () => {
    expect(await getSuggestedContractNumber(dbAs("newAdmin"))).toBe("CTR-120");
    expect(await counter()).toBe(119);
  });

  it("duplicar CTR-118 aceitando o sugerido cria CTR-120 e registra como automático", async () => {
    const result = await duplicate("newAdmin", "CTR-120");

    expect(result).toMatchObject({
      contractId: "CTR-120",
      numberSource: "automatico",
      counterBefore: 119,
      counterAfter: 120,
    });
    expect(await counter()).toBe(120);
  });

  it("5. o CTR continua editável: número manual maior avança o contador", async () => {
    const result = await duplicate("newAdmin", "ctr-150");
    expect(result).toMatchObject({ contractId: "CTR-150", numberSource: "manual", counterAfter: 150 });
    expect(await counter()).toBe(150);
  });

  it("5. número manual menor é aceito e o contador não diminui", async () => {
    await duplicate("newAdmin", "50");
    expect(await adminRead("contracts/CTR-050")).toMatchObject({ id: "CTR-050" });
    expect(await counter()).toBe(119);
  });
});

describe("8. salvar cria um novo contrato e novas parcelas", () => {
  it("grava contrato, parcelas novas, estoque, contador e auditoria", async () => {
    await duplicate("newAdmin", "CTR-120");

    const copy = await adminRead("contracts/CTR-120");
    expect(copy).toMatchObject({
      id: "CTR-120",
      clientId: "CLI-001",
      unitOperation: "Unidade Sumaré",
      totalValue: 250,
      status: "Em Andamento",
      costCenterId: "CC-1",
      chartOfAccountId: "PC-1",
      bankAccountId: "BCO-1",
      createdBy: actor("newAdmin"),
      numbering: { source: "automatico", suggestedId: "CTR-120", origin: "duplicacao" },
      duplicatedFromContractId: "CTR-118",
    });
    expect(copy?.items).toEqual([
      { equipmentId: "EQP-001", quantity: 2, billingType: "Mensal", unitPrice: 100 },
      { equipmentId: "EQP-009", quantity: 1, billingType: "Mensal", unitPrice: 50 },
    ]);
  });

  it("as parcelas são novas, com IDs próprios, e não reaproveitam as do original", async () => {
    await duplicate("newAdmin", "CTR-120");

    const copies = (await adminList("revenues")).filter((r) => r.contractId === "CTR-120");
    expect(copies).toHaveLength(3);
    expect(copies.map((r) => r.id)).not.toContain("REV-ANTIGA-1");
    expect(copies.every((r) => r.status === "Pendente")).toBe(true);
    expect(copies.map((r) => r.description).sort()[0]).toBe("Parcela 1/3 do contrato CTR-120");
    // Nenhum vestígio de pagamento/boleto do original.
    expect(copies.some((r) => "boletoUrl" in r)).toBe(false);

    // As parcelas do original continuam intactas.
    const old = (await adminList("revenues")).filter((r) => r.contractId === "CTR-118");
    expect(old).toHaveLength(1);
    expect(old[0]).toMatchObject({ status: "recebido", boletoUrl: "https://exemplo/boleto-118.pdf" });
  });

  it("as parcelas seguem as datas REVISADAS no formulário, não as do original", async () => {
    // Usuário encurtou o período para 1 mês antes de salvar.
    const draft = duplicateDraft(ORIGINAL, {
      startDate: new Date(2026, 9, 1),
      endDate: new Date(2026, 10, 1),
      firstInstallmentDate: new Date(2026, 10, 15),
    });
    await duplicate("newAdmin", "CTR-120", "CTR-120", draft);

    const copies = (await adminList<RevenueDoc>("revenues")).filter((r) => r.contractId === "CTR-120");
    expect(copies).toHaveLength(1);
    expect(copies[0].dueDate!.toDate()).toEqual(new Date(2026, 10, 15));
  });

  it("9. o estoque é reduzido uma única vez, no salvamento", async () => {
    expect(await stock("EQP-001")).toBe(10);
    await duplicate("newAdmin", "CTR-120");
    expect(await stock("EQP-001")).toBe(8);
    expect(await stock("EQP-009")).toBe(3);
  });
});

describe("13. auditoria", () => {
  it("registra contract.create com origem de duplicação e o contrato original", async () => {
    await duplicate("newAdmin", "CTR-120");

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
        origin: "duplicacao",
        duplicatedFromContractId: "CTR-118",
        clientId: "CLI-001",
        counterBefore: 119,
        counterAfter: 120,
        installments: 3,
        actorName: "Admin Novo",
      },
    });
    expect(audit[0].createdAt).toBeTruthy();
  });

  it("uma criação normal continua sem marca de duplicação", async () => {
    await duplicate("newAdmin", "CTR-120", "CTR-120", duplicateDraft(ORIGINAL), null);

    const [audit] = await adminList<AuditDoc>("auditLogs");
    expect(audit.details.origin).toBe("contrato_direto");
    expect(audit.details).not.toHaveProperty("duplicatedFromContractId");
    expect(await adminRead("contracts/CTR-120")).not.toHaveProperty("duplicatedFromContractId");
  });
});

describe("7 e 14. o original e seus dados não são tocados", () => {
  it("7. o contrato original continua byte a byte igual após a duplicação", async () => {
    const before = await originalBytes();
    await duplicate("newAdmin", "CTR-120");
    expect(await originalBytes()).toBe(before);
  });

  it("14. nenhum pagamento, boleto, anexo, histórico ou orçamento é copiado", async () => {
    await duplicate("newAdmin", "CTR-120");
    const copy = (await adminRead("contracts/CTR-120")) as Record<string, unknown>;

    // A cópia gera os seus próprios valores para estes; o que importa é que não
    // são herdados do original (conferido logo abaixo, um a um).
    const PROPRIOS = ["id", "numbering", "status", "createdAt", "createdBy", "duplicatedFromContractId"];
    for (const field of Object.keys(NEVER_DUPLICATED_FIELDS)) {
      if (PROPRIOS.includes(field)) continue;
      expect(copy, `campo proibido copiado: ${field}`).not.toHaveProperty(field);
    }
    // Próprios, e diferentes dos do original.
    expect(copy.id).toBe("CTR-120");
    expect(copy.createdBy).toEqual(actor("newAdmin"));
    expect(copy.numbering).toMatchObject({ origin: "duplicacao", suggestedId: "CTR-120" });
    expect(copy.createdAt).not.toEqual(ORIGINAL.createdAt);
    expect(copy).not.toHaveProperty("quoteId");
    expect(copy).not.toHaveProperty("signedContractUrl");
    expect(copy).not.toHaveProperty("finalizedAt");
    // A cópia nasce em andamento, não herda o status do original.
    expect(copy.status).toBe("Em Andamento");
    expect(copy.duplicatedFromContractId).toBe("CTR-118");
    // O orçamento do original continua ligado só a ele.
    expect((await adminList("contracts")).filter((c) => c.quoteId === "ORC-010").map((c) => c.id)).toEqual(["CTR-118"]);
  });

  it("duplicar um contrato que está na Lixeira não o altera nem o restaura", async () => {
    const before = JSON.stringify(await adminRead("contracts/CTR-100"));
    await duplicate("newAdmin", "CTR-120", "CTR-120", duplicateDraft(ORIGINAL), "CTR-100");

    expect(JSON.stringify(await adminRead("contracts/CTR-100"))).toBe(before);
    expect((await adminRead("contracts/CTR-100"))?.deletedAt).toBeTruthy();
    expect(await adminRead("contracts/CTR-120")).toMatchObject({ duplicatedFromContractId: "CTR-100" });
  });
});

describe("10 e 11. a duplicação não escapa das travas da criação", () => {
  it("10. estoque insuficiente impede toda a operação", async () => {
    const before = await snapshot();
    const draft = duplicateDraft(ORIGINAL, {
      items: [
        { equipmentId: "EQP-001", quantity: 2, billingType: "Mensal", unitPrice: 100 },
        { equipmentId: "EQP-009", quantity: 5, billingType: "Mensal", unitPrice: 50 }, // só há 4
      ],
    });

    await expect(duplicate("newAdmin", "CTR-120", "CTR-120", draft)).rejects.toThrow(
      /Estoque insuficiente para Gatilho Scan/,
    );
    expect(await snapshot()).toEqual(before);
  });

  it("11. o número do contrato duplicado é recusado (ele mesmo já ocupa o número)", async () => {
    const before = await snapshot();
    const err = await duplicate("newAdmin", "CTR-118").catch((e) => e);

    expect(err).toBeInstanceOf(ContractNumberTakenError);
    expect(err.message).toBe("Já existe um contrato com o número CTR-118.");
    expect(await snapshot()).toEqual(before);
  });

  it("11. número já ocupado por contrato na Lixeira é recusado sem gravar nada", async () => {
    const before = await snapshot();
    for (const typed of ["CTR-100", "ctr-100", "100"]) {
      await expect(duplicate("newAdmin", typed)).rejects.toBeInstanceOf(ContractNumberTakenError);
    }
    expect(await snapshot()).toEqual(before);
  });

  it("dados revisados inválidos: nada é gravado", async () => {
    const before = await snapshot();
    await expect(duplicate("newAdmin", "CTR-120", "CTR-120", duplicateDraft(ORIGINAL, { clientId: "" }))).rejects.toThrow(
      /cliente/,
    );
    await expect(duplicate("newAdmin", "CTR-120", "CTR-120", duplicateDraft(ORIGINAL, { items: [] }))).rejects.toThrow(
      /equipamento/,
    );
    expect(await snapshot()).toEqual(before);
  });

  it("equipamento do original que não existe mais: nada é gravado", async () => {
    const before = await snapshot();
    const draft = duplicateDraft(ORIGINAL, { items: [{ equipmentId: "EQP-404", quantity: 1, unitPrice: 10 }] });
    await expect(duplicate("newAdmin", "CTR-120", "CTR-120", draft)).rejects.toThrow(/não existe mais/);
    expect(await snapshot()).toEqual(before);
  });
});

describe("12. duplicações concorrentes", () => {
  it("dois usuários com o mesmo número sugerido: só um cria, o outro recebe erro e nada é sobrescrito", async () => {
    const results = await Promise.allSettled([
      duplicate("newAdmin", "CTR-120"),
      duplicate("legacyAdmin", "CTR-120"),
      duplicate("creator", "120"),
    ]);

    const ok = results.filter((r) => r.status === "fulfilled");
    const failed = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
    expect(ok).toHaveLength(1);
    expect(failed).toHaveLength(2);
    for (const f of failed) expect(f.reason).toBeInstanceOf(ContractNumberTakenError);

    // Um único contrato, um único conjunto de parcelas, estoque baixado uma vez.
    expect((await adminList("contracts")).filter((c) => c.id === "CTR-120")).toHaveLength(1);
    expect((await adminList("revenues")).filter((r) => r.contractId === "CTR-120")).toHaveLength(3);
    expect((await adminList("auditLogs"))).toHaveLength(1);
    expect(await stock("EQP-001")).toBe(8);
    expect(await stock("EQP-009")).toBe(3);
    expect(await counter()).toBe(120);
  });

  it("o contrato criado primeiro não é sobrescrito pelo segundo usuário", async () => {
    await duplicate("creator", "CTR-120");
    const criado = await adminRead("contracts/CTR-120");

    // O segundo usuário ainda tem CTR-120 sugerido na tela e com outros dados.
    const outro = duplicateDraft(ORIGINAL, { clientId: "CLI-999", unitOperation: "Outra unidade" });
    await expect(duplicate("newAdmin", "CTR-120", "CTR-120", outro)).rejects.toBeInstanceOf(ContractNumberTakenError);

    expect(await adminRead("contracts/CTR-120")).toEqual(criado);
    expect((await adminRead("contracts/CTR-120"))?.clientId).toBe("CLI-001");
  });

  it("duplicações em números diferentes convivem; o contador fica no maior", async () => {
    const results = await Promise.allSettled([
      duplicate("newAdmin", "CTR-120", "CTR-120", duplicateDraft(ORIGINAL, { items: [{ equipmentId: "EQP-001", quantity: 1, billingType: "Mensal", unitPrice: 10 }] })),
      duplicate("creator", "CTR-121", "CTR-120", duplicateDraft(ORIGINAL, { items: [{ equipmentId: "EQP-001", quantity: 1, billingType: "Mensal", unitPrice: 10 }] })),
      duplicate("legacyAdmin", "CTR-060", "CTR-120", duplicateDraft(ORIGINAL, { items: [{ equipmentId: "EQP-001", quantity: 1, billingType: "Mensal", unitPrice: 10 }] })),
    ]);

    expect(results.filter((r) => r.status === "rejected")).toEqual([]);
    expect(await counter()).toBe(121);
    expect(await stock("EQP-001")).toBe(7);
  });

  it("6. abrir e cancelar (nenhuma chamada de criação) não muda contador, estoque nem nada", async () => {
    const before = await snapshot();
    // Abrir o formulário = ler a sugestão. Cancelar = não chamar createContract.
    expect(await getSuggestedContractNumber(dbAs("newAdmin"))).toBe("CTR-120");
    expect(await getSuggestedContractNumber(dbAs("creator"))).toBe("CTR-120");
    expect(await snapshot()).toEqual(before);
    expect(await counter()).toBe(119);
  });
});

describe("2. permissões: duplicar exige contratos.create", () => {
  it("quem pode criar contrato pode duplicar", async () => {
    await assertSucceeds(duplicate("creator", "CTR-120"));
    await assertSucceeds(duplicate("legacyAdmin", "CTR-121", "CTR-120"));
  });

  it("sem contratos.create a duplicação é negada pelas regras, mesmo chamada direto", async () => {
    const before = await snapshot();
    for (const uid of ["viewer", "editor"]) {
      await assertFails(duplicate(uid, "CTR-120"));
      await assertFails(duplicate(uid, "CTR-300", "CTR-120"));
    }
    expect(await snapshot()).toEqual(before);
  });

  it("contratos.edit não vira contratos.create por causa da duplicação", async () => {
    // O editor continua podendo editar o contrato existente...
    await assertSucceeds(setDoc(doc(dbAs("editor"), "contracts/CTR-118"), { ...ORIGINAL, unitOperation: "Nova" }));
    // ...mas não criar um novo, nem mexer no contador.
    await assertFails(duplicate("editor", "CTR-120"));
    await assertFails(setDoc(doc(dbAs("editor"), "counters/contracts"), { currentNumber: 120 }));
    expect(await counter()).toBe(119);
  });
});

describe("tipo de cobrança: contratos antigos gravaram 'mensal'", () => {
  it("a cópia de um contrato com 'mensal' é gravada com o tipo canônico", async () => {
    // Como o CTR-004 de produção.
    await adminWrite("contracts/CTR-060", {
      ...ORIGINAL,
      id: "CTR-060",
      items: [{ equipmentId: "EQP-001", quantity: 2, billingType: "mensal", unitPrice: 100 }],
    });
    const antigoAntes = JSON.stringify(await adminRead("contracts/CTR-060"));

    const legado = await adminRead("contracts/CTR-060");
    await createContract(dbAs("newAdmin"), {
      draft: duplicateDraft(legado),
      contractNumber: "CTR-120",
      suggestedId: "CTR-120",
      duplicatedFromContractId: "CTR-060",
      actor: actor("newAdmin"),
    });

    expect((await adminRead("contracts/CTR-120"))?.items).toEqual([
      { equipmentId: "EQP-001", quantity: 2, billingType: "Mensal", unitPrice: 100 },
    ]);
    // O contrato antigo continua com o valor dele: nada foi migrado.
    expect(JSON.stringify(await adminRead("contracts/CTR-060"))).toBe(antigoAntes);
    expect((await adminRead("contracts/CTR-060"))?.items?.[0]?.billingType).toBe("mensal");
  });

  it("estoque, parcelas, contador e auditoria não mudam por causa da normalização", async () => {
    await adminWrite("contracts/CTR-060", {
      ...ORIGINAL,
      id: "CTR-060",
      items: [{ equipmentId: "EQP-001", quantity: 2, billingType: "mensal", unitPrice: 100 }],
    });
    const legado = await adminRead("contracts/CTR-060");

    const result = await createContract(dbAs("newAdmin"), {
      draft: duplicateDraft(legado),
      contractNumber: "CTR-120",
      suggestedId: "CTR-120",
      duplicatedFromContractId: "CTR-060",
      actor: actor("newAdmin"),
    });

    expect(result).toMatchObject({ contractId: "CTR-120", numberSource: "automatico", counterAfter: 120 });
    expect(await counter()).toBe(120);
    expect(await stock("EQP-001")).toBe(8);
    expect((await adminList("revenues")).filter((r) => r.contractId === "CTR-120")).toHaveLength(3);
    const [audit] = (await adminList<AuditDoc>("auditLogs")).filter((a) => a.details.contractId === "CTR-120");
    expect(audit.details).toMatchObject({ origin: "duplicacao", duplicatedFromContractId: "CTR-060" });
  });
});

describe("15. contratos antigos, sem os campos novos", () => {
  it("duplicar um contrato legado (sem unitOperation, sem numbering) funciona", async () => {
    await adminWrite("contracts/CTR-003", {
      id: "CTR-003",
      clientId: "CLI-001",
      status: "Em Andamento",
      startDate: Timestamp.fromDate(new Date(2026, 9, 1)),
      endDate: Timestamp.fromDate(new Date(2026, 11, 1)),
      items: [{ equipmentId: "EQP-001", quantity: 1, unitPrice: 70 }],
      totalValue: 70,
    });
    const legacy = await adminRead("contracts/CTR-003");
    const draft = duplicateDraft(legacy, { firstInstallmentDate: new Date(2026, 10, 1) });

    const result = await createContract(dbAs("newAdmin"), {
      draft,
      contractNumber: "CTR-120",
      suggestedId: "CTR-120",
      duplicatedFromContractId: "CTR-003",
      actor: actor("newAdmin"),
    });

    expect(result.contractId).toBe("CTR-120");
    expect(await adminRead("contracts/CTR-120")).toMatchObject({
      clientId: "CLI-001",
      unitOperation: "",
      duplicatedFromContractId: "CTR-003",
      numbering: { origin: "duplicacao" },
    });
    expect(await stock("EQP-001")).toBe(9);
  });

  it("um contrato antigo continua legível e editável depois de existirem cópias", async () => {
    await duplicate("newAdmin", "CTR-120");
    const antigo = await adminRead("contracts/CTR-118");
    expect(antigo).not.toHaveProperty("duplicatedFromContractId");
    await assertSucceeds(getDoc(doc(dbAs("viewer"), "contracts/CTR-118")));
    await assertSucceeds(setDoc(doc(dbAs("editor"), "contracts/CTR-118"), { ...ORIGINAL, unitOperation: "Nova" }));
  });
});
