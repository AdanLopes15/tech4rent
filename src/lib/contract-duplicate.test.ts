// Testes unitários do mapeamento de duplicação de contrato (lib/contract-duplicate.ts).
// Rodar com: npm test

import { describe, expect, it } from "vitest";
import { Timestamp } from "firebase/firestore";

import {
  duplicableContractValues,
  duplicatingContractMessage,
  NEVER_DUPLICATED_FIELDS,
  sourceContractId,
} from "@/lib/contract-duplicate";

// Contrato "sujo": além dos dados comerciais, carrega tudo o que um contrato
// acumula em produção (status, anexos, orçamento, Lixeira, auditoria...).
const fullContract = {
  id: "CTR-118",
  clientId: "CLI-001",
  unitOperation: "Unidade Sumaré",
  client: { id: "CLI-001", razaoSocial: "Cliente Teste" },
  startDate: "2026-10-01T00:00:00.000Z",
  endDate: "2027-01-01T00:00:00.000Z",
  firstInstallmentDate: "2026-11-01T00:00:00.000Z",
  items: [
    { equipmentId: "EQP-001", quantity: 2, billingType: "Mensal", unitPrice: 100, quantityReturned: 1, serial: "X1" },
    { equipmentId: "EQP-009", quantity: 1, billingType: "Semanal", unitPrice: 50 },
  ],
  totalValue: 250,
  costCenterId: "CC-1",
  chartOfAccountId: "PC-1",
  bankAccountId: "BCO-1",
  // Nada abaixo desta linha pode ser copiado.
  status: "Finalizado",
  finalizedAt: "2027-01-02T00:00:00.000Z",
  quoteId: "ORC-010",
  signedContractUrl: "https://exemplo/contrato.pdf",
  signedContractPath: "contratos/CTR-118.pdf",
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-10T00:00:00.000Z",
  createdBy: { uid: "u1", email: "a@t4r.test", name: "Antigo" },
  numbering: { source: "manual", suggestedId: "CTR-110", origin: "contrato_direto" },
  deletedAt: "2026-09-21T00:00:00.000Z",
  deletedBy: { uid: "u2", email: "b@t4r.test", name: "Outro" },
  deletionReason: "Lançado em duplicidade",
  stockReturned: [{ equipmentId: "EQP-001", quantity: 2 }],
  restoredAt: "2026-09-22T00:00:00.000Z",
  restoredBy: { uid: "u2" },
  lastDeletion: { deletedAt: "2026-09-21T00:00:00.000Z" },
  duplicatedFromContractId: "CTR-010",
};

describe("duplicableContractValues: campos copiados", () => {
  it("copia exatamente os campos comerciais editáveis do formulário", () => {
    const values = duplicableContractValues(fullContract);

    expect(values).toEqual({
      clientId: "CLI-001",
      unitOperation: "Unidade Sumaré",
      startDate: new Date("2026-10-01T00:00:00.000Z"),
      endDate: new Date("2027-01-01T00:00:00.000Z"),
      firstInstallmentDate: new Date("2026-11-01T00:00:00.000Z"),
      items: [
        { equipmentId: "EQP-001", quantity: 2, billingType: "Mensal", unitPrice: 100 },
        { equipmentId: "EQP-009", quantity: 1, billingType: "Semanal", unitPrice: 50 },
      ],
      costCenterId: "CC-1",
      chartOfAccountId: "PC-1",
      bankAccountId: "BCO-1",
    });
  });

  it("aceita datas em Timestamp do Firestore", () => {
    const values = duplicableContractValues({
      ...fullContract,
      startDate: Timestamp.fromDate(new Date("2026-10-01T00:00:00.000Z")),
      endDate: Timestamp.fromDate(new Date("2027-01-01T00:00:00.000Z")),
    });

    expect(values.startDate).toEqual(new Date("2026-10-01T00:00:00.000Z"));
    expect(values.endDate).toEqual(new Date("2027-01-01T00:00:00.000Z"));
  });

  it("não devolve o mesmo objeto de item do original (alterar a cópia não afeta o contrato)", () => {
    const values = duplicableContractValues(fullContract);
    values.items[0].quantity = 99;

    expect(fullContract.items[0].quantity).toBe(2);
    expect(values.items[0]).not.toBe(fullContract.items[0]);
  });
});

describe("duplicableContractValues: campos deliberadamente removidos", () => {
  it("nenhum campo proibido aparece no resultado", () => {
    const values = duplicableContractValues(fullContract) as Record<string, unknown>;

    for (const field of Object.keys(NEVER_DUPLICATED_FIELDS)) {
      expect(values, `campo proibido copiado: ${field}`).not.toHaveProperty(field);
    }
    // Também não copia o cliente embutido nem o total (recalculado pelo formulário).
    expect(values).not.toHaveProperty("client");
    expect(values).not.toHaveProperty("totalValue");
  });

  it("o item copiado tem só os quatro campos que o formulário edita", () => {
    const [item] = duplicableContractValues(fullContract).items;
    expect(Object.keys(item).sort()).toEqual(["billingType", "equipmentId", "quantity", "unitPrice"]);
  });

  it("um campo novo no contrato não passa a ser copiado sozinho", () => {
    const values = duplicableContractValues({ ...fullContract, campoNovoQualquer: "x", boletoUrl: "y" });
    expect(values).not.toHaveProperty("campoNovoQualquer");
    expect(values).not.toHaveProperty("boletoUrl");
  });

  it("não altera o contrato de origem", () => {
    const snapshot = JSON.stringify(fullContract);
    duplicableContractValues(fullContract);
    expect(JSON.stringify(fullContract)).toBe(snapshot);
  });
});

describe("contratos antigos, sem os campos mais novos", () => {
  it("um contrato legado vira um formulário válido, sem undefined nos campos de texto", () => {
    const legacy = { id: "CTR-003", clientId: "CLI-009", items: [{ equipmentId: "EQP-001", quantity: 3 }] };

    expect(duplicableContractValues(legacy)).toEqual({
      clientId: "CLI-009",
      unitOperation: "",
      startDate: undefined,
      endDate: undefined,
      firstInstallmentDate: undefined,
      items: [{ equipmentId: "EQP-001", quantity: 3, billingType: "Mensal", unitPrice: 0 }],
      costCenterId: "",
      chartOfAccountId: "",
      bankAccountId: "",
    });
  });

  it("contrato sem itens (ou com itens inválidos) abre com uma linha em branco", () => {
    expect(duplicableContractValues({ id: "CTR-003" }).items).toEqual([
      { equipmentId: "", quantity: 1, billingType: "Mensal", unitPrice: 0 },
    ]);
    expect(duplicableContractValues({ items: [] }).items).toHaveLength(1);
  });

  it("valores estranhos viram padrões seguros, nunca NaN", () => {
    const values = duplicableContractValues({
      items: [{ equipmentId: "EQP-001", quantity: "abc", unitPrice: "abc" }],
      startDate: "data-invalida",
      unitOperation: 42,
    });

    expect(values.items[0]).toEqual({ equipmentId: "EQP-001", quantity: 1, billingType: "Mensal", unitPrice: 0 });
    expect(values.startDate).toBeUndefined();
    expect(values.unitOperation).toBe("");
  });
});

describe("sourceContractId", () => {
  it("aceita apenas o ID canônico do contrato de origem", () => {
    expect(sourceContractId({ id: "CTR-118" })).toBe("CTR-118");
    expect(sourceContractId({ id: "CTR-1234" })).toBe("CTR-1234");
  });

  it("recusa IDs fora do formato canônico", () => {
    for (const id of ["CTR-50", "ctr-050", "CTR-12A", "X-001", "", null, undefined, 118]) {
      expect(sourceContractId({ id })).toBeNull();
    }
    expect(sourceContractId(null)).toBeNull();
  });
});

describe("duplicatingContractMessage", () => {
  it("avisa qual contrato está sendo duplicado e pede revisão", () => {
    expect(duplicatingContractMessage("CTR-118")).toBe(
      "Duplicando o contrato CTR-118 — revise os dados antes de salvar.",
    );
  });
});
