import { doc, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function getNextId(collectionName: string): Promise<string> {
  const prefixes: { [key: string]: string } = {
    clients: "CLI",
    suppliers: "FOR",
    employees: "FUNC",
    equipments: "EQP",
    contracts: "CTR",
    sales: "VND",
    quotes: "ORC",
    purchaseOrders: "OC",
    collaborators: "COL",
  };

  const counterRef = doc(db, "counters", collectionName);
  let newId: string;

  try {
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
  } catch (e) {
    console.error("Transaction failed: ", e);
    throw e;
  }

  return newId!;
}
