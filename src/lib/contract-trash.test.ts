import { describe, it, expect } from "vitest";
import {
  aggregateItems,
  confirmationMatches,
  isContractDeleted,
  partitionContracts,
  partitionRevenues,
  planStockDebit,
  planStockReturn,
  shouldReturnStock,
  stripTrashFields,
  validateDeletionReason,
  type EquipmentStock,
} from "./contract-trash";

const stock = (entries: Record<string, Partial<EquipmentStock>>) =>
  new Map(Object.entries(entries).map(([id, v]) => [id, { exists: true, stock: 0, ...v } as EquipmentStock]));

describe("partitionContracts / partitionRevenues", () => {
  const contracts = [
    { id: "CTR-001" },
    { id: "CTR-002", deletedAt: "2026-09-20T22:00:00.000Z" },
    { id: "CTR-003", deletedAt: null, restoredAt: "2026-09-21T10:00:00.000Z" },
  ];

  it("oculta contratos excluídos da lista ativa e os envia para a Lixeira", () => {
    const { active, deleted } = partitionContracts(contracts);
    expect(active.map((c) => c.id)).toEqual(["CTR-001", "CTR-003"]);
    expect(deleted.map((c) => c.id)).toEqual(["CTR-002"]);
    expect(isContractDeleted(contracts[1])).toBe(true);
    expect(isContractDeleted(contracts[2])).toBe(false);
  });

  it("separa as parcelas de contratos na Lixeira sem perder nenhuma", () => {
    const revenues = [
      { id: "r1", contractId: "CTR-001" },
      { id: "r2", contractId: "CTR-002" },
      { id: "r3" }, // receita avulsa
      { id: "r4", contractId: "CTR-002", status: "recebido" },
    ];
    const { active, trashed } = partitionRevenues(revenues, new Set(["CTR-002"]));
    expect(active.map((r) => r.id)).toEqual(["r1", "r3"]);
    expect(trashed.map((r) => r.id)).toEqual(["r2", "r4"]);
    expect(active.length + trashed.length).toBe(revenues.length);
  });
});

describe("validateDeletionReason / confirmationMatches", () => {
  it("exige motivo com pelo menos 10 caracteres úteis", () => {
    expect(() => validateDeletionReason("")).toThrow(/motivo/);
    expect(() => validateDeletionReason("   curto   ")).toThrow(/motivo/);
    expect(() => validateDeletionReason(undefined)).toThrow(/motivo/);
    expect(validateDeletionReason("  lançado em duplicidade  ")).toBe("lançado em duplicidade");
  });

  it("confirma apenas quando o ID digitado coincide", () => {
    expect(confirmationMatches("ctr-117 ", "CTR-117")).toBe(true);
    expect(confirmationMatches("CTR-17", "CTR-117")).toBe(false);
    expect(confirmationMatches("", "CTR-117")).toBe(false);
  });
});

describe("estoque", () => {
  it("devolve estoque apenas de contratos em andamento", () => {
    expect(shouldReturnStock({ status: "Em Andamento" })).toBe(true);
    expect(shouldReturnStock({})).toBe(true);
    expect(shouldReturnStock({ status: "Finalizado" })).toBe(false);
    expect(shouldReturnStock({ status: "Cancelado" })).toBe(false);
  });

  it("agrega itens repetidos e ignora quantidades inválidas", () => {
    expect(
      aggregateItems([
        { equipmentId: "EQP-001", quantity: 2 },
        { equipmentId: "EQP-001", quantity: "3" },
        { equipmentId: "EQP-009", quantity: 1 },
        { equipmentId: "EQP-010", quantity: 0 },
        { quantity: 5 },
      ]),
    ).toEqual([
      { equipmentId: "EQP-001", quantity: 5 },
      { equipmentId: "EQP-009", quantity: 1 },
    ]);
  });

  it("na exclusão devolve o estoque e registra só equipamentos existentes", () => {
    const { updates, returned } = planStockReturn(
      [
        { equipmentId: "EQP-001", quantity: 5 },
        { equipmentId: "EQP-404", quantity: 1 },
      ],
      stock({ "EQP-001": { stock: 10 }, "EQP-404": { exists: false } }),
    );
    expect(updates).toEqual([{ equipmentId: "EQP-001", newStock: 15 }]);
    expect(returned).toEqual([{ equipmentId: "EQP-001", quantity: 5 }]);
  });

  it("na restauração debita tudo quando há estoque", () => {
    const { conflicts, updates } = planStockDebit(
      [
        { equipmentId: "EQP-001", quantity: 5 },
        { equipmentId: "EQP-009", quantity: 1 },
      ],
      stock({ "EQP-001": { stock: 5 }, "EQP-009": { stock: 3 } }),
    );
    expect(conflicts).toEqual([]);
    expect(updates).toEqual([
      { equipmentId: "EQP-001", newStock: 0 },
      { equipmentId: "EQP-009", newStock: 2 },
    ]);
  });

  it("não faz restauração parcial: qualquer conflito zera as atualizações", () => {
    const { conflicts, updates } = planStockDebit(
      [
        { equipmentId: "EQP-001", quantity: 5 },
        { equipmentId: "EQP-009", quantity: 4 },
        { equipmentId: "EQP-404", quantity: 1 },
      ],
      stock({ "EQP-001": { stock: 50, name: "PDA" }, "EQP-009": { stock: 3, name: "Gatilho" }, "EQP-404": { exists: false } }),
    );
    expect(updates).toEqual([]);
    expect(conflicts).toEqual([
      { equipmentId: "EQP-009", name: "Gatilho", required: 4, available: 3, reason: "insufficient" },
      { equipmentId: "EQP-404", name: "EQP-404", required: 1, available: 0, reason: "missing" },
    ]);
  });
});

describe("stripTrashFields", () => {
  it("remove os campos da Lixeira de um payload de edição", () => {
    const payload = {
      status: "Em Andamento",
      deletedAt: null,
      deletedBy: { uid: "x" },
      deletionReason: "abc",
      stockReturned: [],
      restoredAt: "2026-09-21T10:00:00.000Z",
      restoredBy: { uid: "y" },
      lastDeletion: {},
    };
    expect(stripTrashFields(payload)).toEqual({ status: "Em Andamento" });
  });
});
