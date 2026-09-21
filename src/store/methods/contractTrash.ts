// src/store/methods/contractTrash.ts
// Exclusão lógica e restauração de contratos em transação única do Firestore:
// contrato, estoque e auditoria são gravados juntos ou nada é gravado.
// A transação relê contrato e equipamentos no servidor (não confia no estado
// local) e é repetida automaticamente pelo SDK se houver escrita concorrente.

import {
  collection,
  deleteField,
  doc,
  runTransaction,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";
import {
  aggregateItems,
  describeConflict,
  isContractDeleted,
  planStockDebit,
  planStockReturn,
  shouldReturnStock,
  validateDeletionReason,
  type EquipmentStock,
  type StockConflict,
  type StockEntry,
  type TrashActor,
} from "@/lib/contract-trash";

export class ContractRestoreConflictError extends Error {
  conflicts: StockConflict[];

  constructor(contractId: string, conflicts: StockConflict[]) {
    super(
      `Não foi possível restaurar o contrato ${contractId}: estoque indisponível para ` +
        conflicts.map(describeConflict).join("; ") +
        ". Nenhum dado foi alterado.",
    );
    this.name = "ContractRestoreConflictError";
    this.conflicts = conflicts;
  }
}

const auditEntry = (action: string, actor: TrashActor, details: Record<string, any>) => ({
  action,
  actorUid: actor.uid,
  actorEmail: actor.email,
  details,
  createdAt: serverTimestamp(),
});

export async function moveContractToTrash(
  db: Firestore,
  { contractId, reason, actor }: { contractId: string; reason: string; actor: TrashActor },
): Promise<{ stockReturned: StockEntry[] }> {
  const deletionReason = validateDeletionReason(reason);

  return runTransaction(db, async (tx) => {
    const contractRef = doc(db, "contracts", contractId);
    const contractSnap = await tx.get(contractRef);
    if (!contractSnap.exists()) throw new Error("Contrato não encontrado.");
    const contract = contractSnap.data();
    if (isContractDeleted(contract)) throw new Error("Este contrato já está na Lixeira.");

    const entries = shouldReturnStock(contract) ? aggregateItems(contract.items) : [];
    const stockById = new Map<string, EquipmentStock>();
    for (const entry of entries) {
      const snap = await tx.get(doc(db, "equipments", entry.equipmentId));
      stockById.set(entry.equipmentId, {
        exists: snap.exists(),
        stock: Number(snap.data()?.stock) || 0,
        name: snap.data()?.name,
      });
    }
    const { updates, returned } = planStockReturn(entries, stockById);

    for (const u of updates) tx.update(doc(db, "equipments", u.equipmentId), { stock: u.newStock });
    tx.update(contractRef, {
      deletedAt: serverTimestamp(),
      deletedBy: actor,
      deletionReason,
      stockReturned: returned,
    });
    tx.set(
      doc(collection(db, "auditLogs")),
      auditEntry("contract.delete", actor, {
        contractId,
        clientId: contract.clientId || null,
        status: contract.status || null,
        reason: deletionReason,
        stockReturned: returned,
      }),
    );

    return { stockReturned: returned };
  });
}

export async function restoreContractFromTrash(
  db: Firestore,
  { contractId, actor }: { contractId: string; actor: TrashActor },
): Promise<{ stockDebited: StockEntry[] }> {
  return runTransaction(db, async (tx) => {
    const contractRef = doc(db, "contracts", contractId);
    const contractSnap = await tx.get(contractRef);
    if (!contractSnap.exists()) throw new Error("Contrato não encontrado.");
    const contract = contractSnap.data();
    if (!isContractDeleted(contract)) throw new Error("Este contrato não está na Lixeira.");

    // Debita exatamente o que foi devolvido na exclusão.
    const entries: StockEntry[] = Array.isArray(contract.stockReturned) ? contract.stockReturned : [];
    const stockById = new Map<string, EquipmentStock>();
    for (const entry of entries) {
      const snap = await tx.get(doc(db, "equipments", entry.equipmentId));
      stockById.set(entry.equipmentId, {
        exists: snap.exists(),
        stock: Number(snap.data()?.stock) || 0,
        name: snap.data()?.name,
      });
    }
    const { conflicts, updates } = planStockDebit(entries, stockById);

    // Lançar dentro da transação a aborta sem gravar nada: o contrato
    // continua na Lixeira e nenhum estoque é alterado.
    if (conflicts.length) throw new ContractRestoreConflictError(contractId, conflicts);

    for (const u of updates) tx.update(doc(db, "equipments", u.equipmentId), { stock: u.newStock });
    tx.update(contractRef, {
      deletedAt: deleteField(),
      deletedBy: deleteField(),
      deletionReason: deleteField(),
      stockReturned: deleteField(),
      restoredAt: serverTimestamp(),
      restoredBy: actor,
      lastDeletion: {
        deletedAt: contract.deletedAt,
        deletedBy: contract.deletedBy || null,
        reason: contract.deletionReason || null,
      },
    });
    tx.set(
      doc(collection(db, "auditLogs")),
      auditEntry("contract.restore", actor, {
        contractId,
        clientId: contract.clientId || null,
        deletionReason: contract.deletionReason || null,
        stockDebited: entries,
      }),
    );

    return { stockDebited: entries };
  });
}
