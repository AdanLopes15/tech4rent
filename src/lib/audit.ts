// src/lib/audit.ts
// Registro de auditoria simples em Firestore (coleção auditLogs).

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

export type AuditAction =
  | "login"
  | "access.denied"
  | "user.create"
  | "user.update"
  | "user.activate"
  | "user.deactivate"
  | "user.delete"
  | "user.permissions"
  | "user.resetPassword"
  | "quote.create"
  | "quote.update"
  // Gravadas na mesma transação da operação (store/methods/contractCreate.ts e
  // contractTrash.ts) e, no caso de purge, pelo script administrativo.
  | "contract.create"
  | "contract.delete"
  | "contract.restore"
  | "contract.purge";

export async function logAudit(action: AuditAction, details: Record<string, any> = {}) {
  try {
    const actor = auth.currentUser;
    await addDoc(collection(db, "auditLogs"), {
      action,
      actorUid: actor?.uid || null,
      actorEmail: actor?.email || null,
      details,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    // auditoria nunca deve quebrar o fluxo principal
    console.warn("Falha ao registrar auditoria:", err);
  }
}
