import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getNextId } from "../utils";
import { format } from "date-fns";

export async function addSale(get: any, set: any, saleData: any) {
  const newId = await getNextId("sales");

  const competence = format(
    saleData.saleDate ? new Date(saleData.saleDate) : new Date(),
    "yyyy-MM"
  );

  const dataToSave: any = {
    ...saleData,
    id: newId,
    competence,
    createdAt: serverTimestamp(),
    saleDate: Timestamp.fromDate(
      saleData.saleDate ? new Date(saleData.saleDate) : new Date()
    ),
  };

  if (saleData.downPaymentDate) {
    dataToSave.downPaymentDate = Timestamp.fromDate(new Date(saleData.downPaymentDate));
  }

  const batch = writeBatch(db);

  const saleRef = doc(db, "sales", newId);
  batch.set(saleRef, dataToSave);

  // Update equipment stock
  const { equipments } = get();
  for (const item of saleData.items || []) {
    const equipment = equipments.find((e: any) => e.id === item.equipmentId);
    if (equipment) {
      const newStock = (equipment.stock || 0) - (item.quantity || 0);
      const equipmentRef = doc(db, "equipments", item.equipmentId);
      batch.update(equipmentRef, { stock: newStock });
    }
  }

  // Create revenue entry
  const revenueRef = doc(collection(db, "revenues"));
  batch.set(revenueRef, {
    clientId: saleData.clientId,
    saleId: newId,
    description: `Venda ${newId}`,
    valorTotal: saleData.totalValue || 0,
    valorBruto: saleData.totalValue || 0,
    dueDate: Timestamp.fromDate(
      saleData.saleDate ? new Date(saleData.saleDate) : new Date()
    ),
    status: "Pendente",
    competence,
    createdAt: serverTimestamp(),
  });

  await batch.commit();
  await get().fetchAllData();
  return { id: newId };
}

export async function updateSale(get: any, set: any, saleData: any) {
  const { id, ...data } = saleData;
  if (!id) throw new Error("ID da venda é obrigatório para atualização.");

  const dataToSave: any = { ...data };

  if (saleData.saleDate) {
    dataToSave.saleDate = Timestamp.fromDate(new Date(saleData.saleDate));
  }
  if (saleData.downPaymentDate) {
    dataToSave.downPaymentDate = Timestamp.fromDate(new Date(saleData.downPaymentDate));
  }

  const saleRef = doc(db, "sales", id);
  await updateDoc(saleRef, dataToSave);
  await get().fetchAllData();
}

export async function cancelSale(get: any, set: any, saleId: string) {
  const { sales, equipments, revenues } = get();
  const sale = sales.find((s: any) => s.id === saleId);
  if (!sale) throw new Error("Venda não encontrada.");

  const batch = writeBatch(db);

  // Restore equipment stock
  for (const item of sale.items || []) {
    const equipment = equipments.find((e: any) => e.id === item.equipmentId);
    if (equipment) {
      const newStock = (equipment.stock || 0) + (item.quantity || 0);
      const equipmentRef = doc(db, "equipments", item.equipmentId);
      batch.update(equipmentRef, { stock: newStock });
    }
  }

  // Cancel related revenues
  const saleRevenues = revenues.filter((r: any) => r.saleId === saleId && r.status === "Pendente");
  for (const revenue of saleRevenues) {
    const revenueRef = doc(db, "revenues", revenue.id);
    batch.update(revenueRef, { status: "Cancelado" });
  }

  const saleRef = doc(db, "sales", saleId);
  batch.update(saleRef, { status: "Cancelada" });

  await batch.commit();
  await get().fetchAllData();
}

export async function deleteSale(get: any, set: any, saleId: string) {
  const { revenues } = get();
  const batch = writeBatch(db);

  // Delete related revenues
  const saleRevenues = revenues.filter((r: any) => r.saleId === saleId);
  for (const revenue of saleRevenues) {
    const revenueRef = doc(db, "revenues", revenue.id);
    batch.delete(revenueRef);
  }

  const saleRef = doc(db, "sales", saleId);
  batch.delete(saleRef);

  await batch.commit();
  await get().fetchAllData();
}
