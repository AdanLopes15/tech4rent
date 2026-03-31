import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function getNextId(collectionName: string): Promise<string> {
  const colRef = collection(db, collectionName);
  const q = query(colRef, orderBy("__name__", "desc"), limit(1));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return "0001";
  }

  const lastId = snapshot.docs[0].id;
  const numericId = parseInt(lastId, 10);

  if (isNaN(numericId)) {
    return "0001";
  }

  return String(numericId + 1).padStart(4, "0");
}
