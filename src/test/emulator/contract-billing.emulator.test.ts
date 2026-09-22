// Testes de integração da NORMALIZAÇÃO DO TIPO DE COBRANÇA na fronteira de
// gravação, com o Firestore Emulator (projeto fictício demo-tech4rent).
// Rodar com: npm run test:emulator  (nunca acessa a produção)
//
// A garantia aqui não depende de nenhum componente visual: os itens são
// normalizados dentro da transação de criação, então qualquer origem (criação
// direta, duplicação ou conversão de orçamento) grava a forma canônica.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, doc, getDoc, getDocs, setDoc, Timestamp, type Firestore } from "firebase/firestore";

import type { TrashActor } from "@/lib/contract-trash";
import {
  convertQuoteToContract,
  createContract,
  type ContractDraft,
} from "@/store/methods/contractCreate";

let env: RulesTestEnvironment;

type DocData = Record<string, unknown>;
type ContractItemDoc = { equipmentId?: string; quantity?: number; unitPrice?: number; billingType?: string };
type ContractDoc = DocData & { items?: ContractItemDoc[] };
type AuditDoc = DocData & { details: DocData };

const ADMIN = { name: "Admin Novo", email: "novo@t4r.test", profile: "admin", permission: "admin", status: "ativo" };
const actor: TrashActor = { uid: "newAdmin", email: ADMIN.email, name: ADMIN.name };
const dbAsAdmin = () => env.authenticatedContext("newAdmin").firestore() as unknown as Firestore;

const draft = (items: ContractItemDoc[]): ContractDraft => ({
  clientId: "CLI-001",
  client: { id: "CLI-001", razaoSocial: "Cliente Teste" },
  startDate: new Date(2026, 9, 1),
  endDate: new Date(2027, 0, 1),
  firstInstallmentDate: new Date(2026, 10, 1),
  items,
  totalValue: items.reduce((s, i) => s + (i.quantity || 0) * (i.unitPrice || 0), 0),
  status: "Em Andamento",
  costCenterId: "",
  chartOfAccountId: "",
  bankAccountId: "",
});

async function adminRead<T extends DocData = DocData>(path: string): Promise<T | undefined> {
  let data: T | undefined;
  await env.withSecurityRulesDisabled(async (ctx) => {
    const snap = await getDoc(doc(ctx.firestore() as unknown as Firestore, path));
    data = snap.exists() ? (snap.data() as T) : undefined;
  });
  return data;
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
const billingTypesOf = async (contractId: string) =>
  ((await adminRead<ContractDoc>(`contracts/${contractId}`))?.items || []).map((i) => i.billingType);

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
    await setDoc(doc(db, "users", "newAdmin"), ADMIN);
    await setDoc(doc(db, "equipments", "EQP-001"), { name: "PDA TC60", stock: 10 });
    await setDoc(doc(db, "equipments", "EQP-009"), { name: "Gatilho Scan", stock: 4 });
    await setDoc(doc(db, "counters", "contracts"), { currentNumber: 119 });
    // Contrato antigo, como os de produção: tipo em minúsculas.
    await setDoc(doc(db, "contracts", "CTR-060"), {
      id: "CTR-060",
      clientId: "CLI-001",
      status: "Em Andamento",
      items: [{ equipmentId: "EQP-001", quantity: 2, billingType: "mensal", unitPrice: 100 }],
      totalValue: 200,
    });
    // Orçamento de locação cujos itens usam o vocabulário minúsculo da tela de
    // orçamentos ("mensal"/"diaria"), que é o que a conversão recebe.
    await setDoc(doc(db, "quotes", "ORC-010"), {
      id: "ORC-010",
      clientId: "CLI-001",
      status: "Pendente",
      budgetType: "locacao",
      startDate: Timestamp.fromDate(new Date(2026, 9, 1)),
      endDate: Timestamp.fromDate(new Date(2027, 0, 1)),
      items: [
        { equipmentId: "EQP-001", quantity: 3, billingType: "mensal", unitPrice: 80 },
        { equipmentId: "EQP-009", quantity: 1, billingType: "diaria", unitPrice: 20 },
      ],
      totalValue: 260,
    });
  });
});

describe("1. criação direta", () => {
  it("recebendo 'mensal' grava 'Mensal'", async () => {
    await createContract(dbAsAdmin(), {
      draft: draft([{ equipmentId: "EQP-001", quantity: 2, billingType: "mensal", unitPrice: 100 }]),
      contractNumber: "CTR-120",
      suggestedId: "CTR-120",
      actor,
    });

    expect(await billingTypesOf("CTR-120")).toEqual(["Mensal"]);
  });

  it("normaliza todas as variações conhecidas de uma vez", async () => {
    await createContract(dbAsAdmin(), {
      draft: draft([
        { equipmentId: "EQP-001", quantity: 1, billingType: "mensal", unitPrice: 10 },
        { equipmentId: "EQP-001", quantity: 1, billingType: " SEMANAL ", unitPrice: 10 },
        { equipmentId: "EQP-009", quantity: 1, billingType: "diária", unitPrice: 10 },
        { equipmentId: "EQP-009", quantity: 1, billingType: "Diario", unitPrice: 10 },
      ]),
      contractNumber: "CTR-120",
      suggestedId: "CTR-120",
      actor,
    });

    expect(await billingTypesOf("CTR-120")).toEqual(["Mensal", "Semanal", "Diário", "Diário"]);
  });

  it("valores já canônicos continuam iguais", async () => {
    await createContract(dbAsAdmin(), {
      draft: draft([
        { equipmentId: "EQP-001", quantity: 1, billingType: "Mensal", unitPrice: 10 },
        { equipmentId: "EQP-009", quantity: 1, billingType: "Diário", unitPrice: 10 },
      ]),
      contractNumber: "CTR-120",
      suggestedId: "CTR-120",
      actor,
    });

    expect(await billingTypesOf("CTR-120")).toEqual(["Mensal", "Diário"]);
  });
});

describe("2. duplicação", () => {
  it("duplicar um contrato com 'mensal' grava 'Mensal' e não toca no original", async () => {
    const original = await adminRead<ContractDoc>("contracts/CTR-060");
    const antes = JSON.stringify(original);

    await createContract(dbAsAdmin(), {
      // Como a interface monta: os itens vêm do contrato de origem.
      draft: draft(original!.items!),
      contractNumber: "CTR-120",
      suggestedId: "CTR-120",
      duplicatedFromContractId: "CTR-060",
      actor,
    });

    expect(await billingTypesOf("CTR-120")).toEqual(["Mensal"]);
    // 10. o contrato antigo não é migrado nem alterado.
    expect(JSON.stringify(await adminRead("contracts/CTR-060"))).toBe(antes);
    expect(await billingTypesOf("CTR-060")).toEqual(["mensal"]);
  });
});

describe("3 e 4. conversão de orçamento", () => {
  it("orçamento com 'mensal'/'diaria' vira contrato com 'Mensal'/'Diário'", async () => {
    await convertQuoteToContract(dbAsAdmin(), {
      quoteId: "ORC-010",
      client: { id: "CLI-001" },
      contractNumber: "CTR-120",
      suggestedId: "CTR-120",
      actor,
    });

    expect(await billingTypesOf("CTR-120")).toEqual(["Mensal", "Diário"]);
  });

  it("4. os itens do orçamento original continuam como estavam", async () => {
    const antes = JSON.stringify((await adminRead("quotes/ORC-010"))?.items);

    await convertQuoteToContract(dbAsAdmin(), {
      quoteId: "ORC-010",
      client: { id: "CLI-001" },
      contractNumber: "CTR-120",
      suggestedId: "CTR-120",
      actor,
    });

    const depois = await adminRead("quotes/ORC-010");
    expect(JSON.stringify(depois?.items)).toBe(antes);
    expect((depois?.items as ContractItemDoc[]).map((i) => i.billingType)).toEqual(["mensal", "diaria"]);
    // Só o que a conversão sempre mexeu mudou no orçamento.
    expect(depois).toMatchObject({ status: "Aprovado", contractId: "CTR-120" });
  });
});

describe("8. valores desconhecidos", () => {
  it("não viram 'Mensal' na criação direta nem na conversão", async () => {
    await createContract(dbAsAdmin(), {
      draft: draft([
        { equipmentId: "EQP-001", quantity: 1, billingType: "quinzenal", unitPrice: 10 },
        { equipmentId: "EQP-009", quantity: 1, billingType: "mensal", unitPrice: 10 },
      ]),
      contractNumber: "CTR-120",
      suggestedId: "CTR-120",
      actor,
    });

    expect(await billingTypesOf("CTR-120")).toEqual(["quinzenal", "Mensal"]);
  });

  it("item sem tipo de cobrança continua sem o campo (nada é inventado)", async () => {
    await createContract(dbAsAdmin(), {
      draft: draft([{ equipmentId: "EQP-001", quantity: 1, unitPrice: 10 }]),
      contractNumber: "CTR-120",
      suggestedId: "CTR-120",
      actor,
    });

    const [item] = (await adminRead<ContractDoc>("contracts/CTR-120"))!.items!;
    expect(item.billingType).toBeUndefined();
    expect(item).toMatchObject({ equipmentId: "EQP-001", quantity: 1, unitPrice: 10 });
  });
});

describe("9. a normalização não afeta mais nada", () => {
  it("estoque, parcelas, contador, auditoria e número seguem idênticos", async () => {
    const result = await createContract(dbAsAdmin(), {
      draft: draft([
        { equipmentId: "EQP-001", quantity: 2, billingType: "mensal", unitPrice: 100 },
        { equipmentId: "EQP-009", quantity: 1, billingType: "diaria", unitPrice: 50 },
      ]),
      contractNumber: "CTR-120",
      suggestedId: "CTR-120",
      actor,
    });

    expect(result).toMatchObject({
      contractId: "CTR-120",
      numberSource: "automatico",
      counterBefore: 119,
      counterAfter: 120,
    });
    expect(await counter()).toBe(120);
    expect(await stock("EQP-001")).toBe(8);
    expect(await stock("EQP-009")).toBe(3);

    const parcelas = (await adminList("revenues")).filter((r) => r.contractId === "CTR-120");
    expect(parcelas).toHaveLength(3);
    // Valor da parcela = quantidade x preço; o tipo de cobrança não entra na conta.
    expect(parcelas.every((p) => p.valorTotal === 250)).toBe(true);

    const [audit] = await adminList<AuditDoc>("auditLogs");
    expect(audit.details).toMatchObject({ contractId: "CTR-120", installments: 3, counterAfter: 120 });

    // Quantidades e preços dos itens intactos: só o tipo mudou.
    const itens = (await adminRead<ContractDoc>("contracts/CTR-120"))!.items!;
    expect(itens).toEqual([
      { equipmentId: "EQP-001", quantity: 2, billingType: "Mensal", unitPrice: 100 },
      { equipmentId: "EQP-009", quantity: 1, billingType: "Diário", unitPrice: 50 },
    ]);
  });
});

describe("conversão recusa itens que não são de locação", () => {
  /** Estado completo do que uma conversão poderia alterar. */
  async function retrato() {
    return {
      contratos: (await adminList("contracts")).map((c) => c.id).sort(),
      parcelas: (await adminList("revenues")).length,
      auditoria: (await adminList("auditLogs")).length,
      contador: await counter(),
      estoque: [await stock("EQP-001"), await stock("EQP-009")],
      orcamento: JSON.stringify(await adminRead("quotes/ORC-010")),
    };
  }

  const converter = () =>
    convertQuoteToContract(dbAsAdmin(), {
      quoteId: "ORC-010",
      client: { id: "CLI-001" },
      contractNumber: "CTR-120",
      suggestedId: "CTR-120",
      actor,
    });

  /** Reescreve os itens do orçamento como um orçamento antigo/inválido faria. */
  const comItens = async (items: ContractItemDoc[]) => {
    const atual = await adminRead("quotes/ORC-010");
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore() as unknown as Firestore, "quotes/ORC-010"), { ...atual, items });
    });
  };

  it("item 'venda' num orçamento de locação é recusado, com mensagem clara", async () => {
    await comItens([
      { equipmentId: "EQP-001", quantity: 2, billingType: "mensal", unitPrice: 100 },
      { equipmentId: "EQP-009", quantity: 1, billingType: "venda", unitPrice: 900 },
    ]);
    const antes = await retrato();

    const erro = await converter().catch((e) => e);

    expect(erro).toBeInstanceOf(Error);
    expect(erro.message).toContain('"venda"');
    expect(erro.message).toContain("Mensal, Semanal, Diário");
    // Nada foi gravado nem alterado.
    expect(await retrato()).toEqual(antes);
    expect(await adminRead("contracts/CTR-120")).toBeUndefined();
    expect((await adminRead("quotes/ORC-010"))?.status).toBe("Pendente");
  });

  it("tipo desconhecido ('quinzenal') também é recusado sem gravar nada", async () => {
    await comItens([{ equipmentId: "EQP-001", quantity: 1, billingType: "quinzenal", unitPrice: 10 }]);
    const antes = await retrato();

    await expect(converter()).rejects.toThrow(/quinzenal/);

    expect(await retrato()).toEqual(antes);
  });

  it("item sem tipo de cobrança é recusado sem gravar nada", async () => {
    await comItens([{ equipmentId: "EQP-001", quantity: 1, unitPrice: 10 }]);
    const antes = await retrato();

    await expect(converter()).rejects.toThrow(/sem tipo de cobrança/);

    expect(await retrato()).toEqual(antes);
  });

  it("a recusa vale para orçamento inválido já existente no banco (sem passar pela tela)", async () => {
    // Orçamento gravado direto, como um dado antigo do banco.
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore() as unknown as Firestore, "quotes/ORC-099"), {
        id: "ORC-099",
        clientId: "CLI-001",
        status: "Pendente",
        budgetType: "locacao",
        startDate: Timestamp.fromDate(new Date(2026, 9, 1)),
        endDate: Timestamp.fromDate(new Date(2027, 0, 1)),
        items: [{ equipmentId: "EQP-001", quantity: 1, billingType: "venda", unitPrice: 900 }],
        totalValue: 900,
      });
    });
    const antes = await retrato();

    await expect(
      convertQuoteToContract(dbAsAdmin(), {
        quoteId: "ORC-099",
        client: { id: "CLI-001" },
        contractNumber: "CTR-120",
        suggestedId: "CTR-120",
        actor,
      }),
    ).rejects.toThrow(/"venda"/);

    expect(await retrato()).toEqual(antes);
    expect((await adminRead("quotes/ORC-099"))?.status).toBe("Pendente");
  });

  it("conversão válida com mensal, semanal e diária segue funcionando e grava canônico", async () => {
    await comItens([
      { equipmentId: "EQP-001", quantity: 1, billingType: "mensal", unitPrice: 100 },
      { equipmentId: "EQP-001", quantity: 1, billingType: "semanal", unitPrice: 40 },
      { equipmentId: "EQP-009", quantity: 1, billingType: "diária", unitPrice: 10 },
    ]);

    const result = await convertQuoteToContract(dbAsAdmin(), {
      quoteId: "ORC-010",
      client: { id: "CLI-001" },
      contractNumber: "CTR-120",
      suggestedId: "CTR-120",
      actor,
    });

    expect(result.contractId).toBe("CTR-120");
    expect(await billingTypesOf("CTR-120")).toEqual(["Mensal", "Semanal", "Diário"]);
    expect(await adminRead("quotes/ORC-010")).toMatchObject({ status: "Aprovado", contractId: "CTR-120" });
    expect(await stock("EQP-001")).toBe(8);
    expect(await stock("EQP-009")).toBe(3);
    expect(await counter()).toBe(120);
  });
});
