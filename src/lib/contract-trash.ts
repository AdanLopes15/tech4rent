// src/lib/contract-trash.ts
// Regras puras da Lixeira de contratos (exclusão lógica e restauração).
// Não acessa o Firestore: é usado pelas transações em store/methods/contractTrash.ts
// e pela interface, e é coberto por testes unitários.

export const MIN_DELETION_REASON_LENGTH = 10;

// Campos controlados exclusivamente pelo fluxo de Lixeira. As regras do
// Firestore impedem que uma edição comum os altere.
export const TRASH_FIELDS = ["deletedAt", "deletedBy", "deletionReason", "stockReturned"] as const;
export const RESTORE_FIELDS = ["restoredAt", "restoredBy", "lastDeletion"] as const;

export type TrashActor = { uid: string; email: string | null; name: string | null };

export type StockEntry = { equipmentId: string; quantity: number };

export type EquipmentStock = { exists: boolean; stock: number; name?: string };

export type StockConflict = {
  equipmentId: string;
  name: string;
  required: number;
  available: number;
  reason: "missing" | "insufficient";
};

export const isContractDeleted = (contract: any): boolean => !!contract?.deletedAt;

export function partitionContracts<T = any>(contracts: T[]): { active: T[]; deleted: T[] } {
  const active: T[] = [];
  const deleted: T[] = [];
  for (const c of contracts) (isContractDeleted(c) ? deleted : active).push(c);
  return { active, deleted };
}

// Parcelas de contratos na Lixeira ficam intactas no banco, mas saem das
// telas financeiras (Contas a Receber, Fluxo de Caixa, DRE, Dashboard...).
export function partitionRevenues<T extends { contractId?: string }>(
  revenues: T[],
  deletedContractIds: Set<string>,
): { active: T[]; trashed: T[] } {
  const active: T[] = [];
  const trashed: T[] = [];
  for (const r of revenues) {
    (r.contractId && deletedContractIds.has(r.contractId) ? trashed : active).push(r);
  }
  return { active, trashed };
}

export function validateDeletionReason(reason: unknown): string {
  const trimmed = typeof reason === "string" ? reason.trim() : "";
  if (trimmed.length < MIN_DELETION_REASON_LENGTH) {
    throw new Error(`Informe o motivo da exclusão (mínimo de ${MIN_DELETION_REASON_LENGTH} caracteres).`);
  }
  return trimmed;
}

// Confirmação digitada: o ID precisa coincidir exatamente (ignorando espaços
// nas pontas e maiúsculas/minúsculas).
export const confirmationMatches = (typed: string, contractId: string): boolean =>
  typed.trim().toUpperCase() === String(contractId).trim().toUpperCase();

// Somente contratos em andamento têm equipamentos fora do estoque. Contratos
// finalizados já devolveram os itens em finalizeContract; devolvê-los de novo
// inflaria o estoque.
export const shouldReturnStock = (contract: any): boolean =>
  !contract?.status || contract.status === "Em Andamento";

// Soma quantidades por equipamento (um contrato pode repetir o mesmo item).
export function aggregateItems(items: any[] | undefined): StockEntry[] {
  const totals = new Map<string, number>();
  for (const item of items || []) {
    const id = item?.equipmentId;
    const qty = Number(item?.quantity) || 0;
    if (!id || qty <= 0) continue;
    totals.set(id, (totals.get(id) || 0) + qty);
  }
  return [...totals.entries()].map(([equipmentId, quantity]) => ({ equipmentId, quantity }));
}

// Na exclusão: devolve ao estoque apenas o que existe. Equipamentos que não
// existem mais ficam de fora de stockReturned e não serão debitados na restauração.
export function planStockReturn(
  entries: StockEntry[],
  stockById: Map<string, EquipmentStock>,
): { updates: { equipmentId: string; newStock: number }[]; returned: StockEntry[] } {
  const updates: { equipmentId: string; newStock: number }[] = [];
  const returned: StockEntry[] = [];
  for (const entry of entries) {
    const eq = stockById.get(entry.equipmentId);
    if (!eq?.exists) continue;
    updates.push({ equipmentId: entry.equipmentId, newStock: (Number(eq.stock) || 0) + entry.quantity });
    returned.push(entry);
  }
  return { updates, returned };
}

// Na restauração: tudo ou nada. Havendo qualquer conflito, nenhuma
// atualização é devolvida.
export function planStockDebit(
  entries: StockEntry[],
  stockById: Map<string, EquipmentStock>,
): { conflicts: StockConflict[]; updates: { equipmentId: string; newStock: number }[] } {
  const conflicts: StockConflict[] = [];
  const updates: { equipmentId: string; newStock: number }[] = [];
  for (const entry of entries) {
    const eq = stockById.get(entry.equipmentId);
    const available = Number(eq?.stock) || 0;
    const name = eq?.name || entry.equipmentId;
    if (!eq?.exists) {
      conflicts.push({ equipmentId: entry.equipmentId, name, required: entry.quantity, available: 0, reason: "missing" });
    } else if (available < entry.quantity) {
      conflicts.push({ equipmentId: entry.equipmentId, name, required: entry.quantity, available, reason: "insufficient" });
    } else {
      updates.push({ equipmentId: entry.equipmentId, newStock: available - entry.quantity });
    }
  }
  return { conflicts, updates: conflicts.length ? [] : updates };
}

// Remove do payload de edição os campos da Lixeira, para que uma edição
// comum nunca apague ou sobrescreva o registro da exclusão/restauração.
export function stripTrashFields<T extends Record<string, any>>(data: T): T {
  const copy: Record<string, any> = { ...data };
  for (const key of [...TRASH_FIELDS, ...RESTORE_FIELDS]) delete copy[key];
  return copy as T;
}

export function describeConflict(c: StockConflict): string {
  return c.reason === "missing"
    ? `${c.name}: equipamento não existe mais (necessário ${c.required})`
    : `${c.name}: necessário ${c.required}, disponível ${c.available}`;
}
