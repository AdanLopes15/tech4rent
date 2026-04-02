// src/store/methods/sales.ts

import { collection, doc, getDocs, query, Timestamp, where, writeBatch, serverTimestamp } from "firebase/firestore";
import { addMonths, format, getDate, setDate as setDayOfMonth } from "date-fns";
import { db } from "@/lib/firebase";

export const addSale = async (get: any, set: any, saleData: any) => {
  const { equipments, clients } = get();
  const newSaleId = await get().getNextId("sales");
  const batch = writeBatch(db);

  for (const item of saleData.items) {
    const equipment = equipments.find((e: any) => e.id === item.equipmentId);
    if (!equipment || equipment.stock < item.quantity) {
      throw new Error(`Estoque insuficiente para ${equipment?.name || "equipamento"}.`);
    }
  }

  const client = clients.find((c: any) => c.id === saleData.clientId);
  const saleDate = new Date();

  for (const paymentMethod of saleData.paymentMethods || []) {
    if (paymentMethod.paymentMethod === "entrada_boleto") {
      const entryValue =
        paymentMethod.downPaymentType === "fixed"
          ? Number(paymentMethod.downPaymentValue || 0)
          : Number(paymentMethod.value || 0) * (Number(paymentMethod.downPaymentValue || 0) / 100);

      if (entryValue > 0 && paymentMethod.downPaymentDate) {
        const entryRevenueRef = doc(collection(db, "revenues"));
        batch.set(entryRevenueRef, {
          clientId: saleData.clientId,
          saleId: newSaleId,
          description: `Entrada da venda ${newSaleId} (${paymentMethod.paymentMethod})`,
          valorTotal: entryValue,
          valorBruto: entryValue,
          dueDate: Timestamp.fromDate(new Date(paymentMethod.downPaymentDate)),
          competence: format(new Date(paymentMethod.downPaymentDate), "MM/yyyy"),
          status: "Pendente",
          createdAt: serverTimestamp(),
          costCenterId: saleData.costCenterId || "",
          chartOfAccountId: saleData.chartOfAccountId || "",
          bankAccountId: saleData.bankAccountId || "",
        });
      }

      const remainingValue = Number(paymentMethod.value || 0) - entryValue;
      const installments = paymentMethod.installments || 1;
      const baseDateForInstallments = paymentMethod.downPaymentDate
        ? new Date(paymentMethod.downPaymentDate)
        : saleDate;

      if (installments > 0 && remainingValue > 0.009) {
        const installmentValue = remainingValue / installments;

        for (let i = 0; i < installments; i++) {
          const installmentBaseDate = addMonths(baseDateForInstallments, i);
          const dueDate = setDayOfMonth(addMonths(installmentBaseDate, 1), getDate(baseDateForInstallments));

          const revenueRef = doc(collection(db, "revenues"));
          batch.set(revenueRef, {
            clientId: saleData.clientId,
            saleId: newSaleId,
            description: `Parcela ${i + 1}/${installments} da venda ${newSaleId}`,
            valorTotal: installmentValue,
            valorBruto: installmentValue,
            dueDate: Timestamp.fromDate(dueDate),
            competence: format(dueDate, "MM/yyyy"),
            status: "Pendente",
            createdAt: serverTimestamp(),
            costCenterId: saleData.costCenterId || "",
            chartOfAccountId: saleData.chartOfAccountId || "",
            bankAccountId: saleData.bankAccountId || "",
          });
        }
      }
    } else {
      const installments = paymentMethod.installments || 1;
      const installmentValue = Number(paymentMethod.value || 0) / installments;
      const baseDateForInstallments = saleDate;

      for (let i = 0; i < installments; i++) {
        const installmentBaseDate = addMonths(baseDateForInstallments, i);
        const dueDate = setDayOfMonth(addMonths(installmentBaseDate, 1), getDate(baseDateForInstallments));

        const revenueRef = doc(collection(db, "revenues"));
        batch.set(revenueRef, {
          clientId: saleData.clientId,
          saleId: newSaleId,
          description: `Parcela ${i + 1}/${installments} da venda ${newSaleId} (${paymentMethod.paymentMethod})`,
          valorTotal: installmentValue,
          valorBruto: installmentValue,
          dueDate: Timestamp.fromDate(dueDate),
          competence: format(dueDate, "MM/yyyy"),
          status: "Pendente",
          createdAt: serverTimestamp(),
          costCenterId: saleData.costCenterId || "",
          chartOfAccountId: saleData.chartOfAccountId || "",
          bankAccountId: saleData.bankAccountId || "",
        });
      }
    }
  }

  for (const item of saleData.items) {
    const equipmentRef = doc(db, "equipments", item.equipmentId);
    const equipment = equipments.find((e: any) => e.id === item.equipmentId)!;
    const newStock = equipment.stock - item.quantity;
    batch.update(equipmentRef, { stock: newStock });
  }

  const finalSaleData: any = {
    ...saleData,
    id: newSaleId,
    clientName: client?.razaoSocial || client?.name || "N/A",
    status: "Concluída",
    saleDate: Timestamp.fromDate(saleDate),
    createdAt: serverTimestamp(),
    competence: format(saleDate, "MM/yyyy"),
  };

  const saleRef = doc(db, "sales", newSaleId);
  batch.set(saleRef, finalSaleData);

  await batch.commit();
  await get().fetchAllData();

  return { id: newSaleId, ...finalSaleData };
};

export const updateSale = async (get: any, set: any, saleData: any) => {
  const { id, ...dataToUpdate } = saleData;
  const batch = writeBatch(db);

  const q = query(collection(db, "revenues"), where("saleId", "==", id));
  const querySnapshot = await getDocs(q);

  querySnapshot.forEach((revenueDoc) => {
    batch.delete(revenueDoc.ref);
  });

  for (const paymentMethod of dataToUpdate.paymentMethods || []) {
    if (paymentMethod.paymentMethod === "entrada_boleto") {
      const entryValue =
        paymentMethod.downPaymentType === "fixed"
          ? Number(paymentMethod.downPaymentValue || 0)
          : Number(paymentMethod.value || 0) * (Number(paymentMethod.downPaymentValue || 0) / 100);

      if (entryValue > 0 && paymentMethod.downPaymentDate) {
        const entryRevenueRef = doc(collection(db, "revenues"));
        batch.set(entryRevenueRef, {
          clientId: dataToUpdate.clientId,
          saleId: id,
          description: `Entrada da venda ${id} (${paymentMethod.paymentMethod})`,
          valorTotal: entryValue,
          valorBruto: entryValue,
          dueDate: Timestamp.fromDate(new Date(paymentMethod.downPaymentDate)),
          competence: format(new Date(paymentMethod.downPaymentDate), "MM/yyyy"),
          status: "Pendente",
          createdAt: serverTimestamp(),
          costCenterId: dataToUpdate.costCenterId || "",
          chartOfAccountId: dataToUpdate.chartOfAccountId || "",
          bankAccountId: dataToUpdate.bankAccountId || "",
        });
      }

      const remainingValue = Number(paymentMethod.value || 0) - entryValue;
      const installments = paymentMethod.installments || 1;
      const baseDateForInstallments = paymentMethod.downPaymentDate
        ? new Date(paymentMethod.downPaymentDate)
        : new Date();

      if (installments > 0 && remainingValue > 0.009) {
        const installmentValue = remainingValue / installments;

        for (let i = 0; i < installments; i++) {
          const installmentBaseDate = addMonths(baseDateForInstallments, i);
          const dueDate = setDayOfMonth(addMonths(installmentBaseDate, 1), getDate(baseDateForInstallments));

          const revenueRef = doc(collection(db, "revenues"));
          batch.set(revenueRef, {
            clientId: dataToUpdate.clientId,
            saleId: id,
            description: `Parcela ${i + 1}/${installments} da venda ${id}`,
            valorTotal: installmentValue,
            valorBruto: installmentValue,
            dueDate: Timestamp.fromDate(dueDate),
            competence: format(dueDate, "MM/yyyy"),
            status: "Pendente",
            createdAt: serverTimestamp(),
            costCenterId: dataToUpdate.costCenterId || "",
            chartOfAccountId: dataToUpdate.chartOfAccountId || "",
            bankAccountId: dataToUpdate.bankAccountId || "",
          });
        }
      }
    } else {
      const installments = paymentMethod.installments || 1;
      const installmentValue = Number(paymentMethod.value || 0) / installments;
      const baseDateForInstallments = new Date();

      for (let i = 0; i < installments; i++) {
        const installmentBaseDate = addMonths(baseDateForInstallments, i);
        const dueDate = setDayOfMonth(addMonths(installmentBaseDate, 1), getDate(baseDateForInstallments));

        const revenueRef = doc(collection(db, "revenues"));
        batch.set(revenueRef, {
          clientId: dataToUpdate.clientId,
          saleId: id,
          description: `Parcela ${i + 1}/${installments} da venda ${id} (${paymentMethod.paymentMethod})`,
          valorTotal: installmentValue,
          valorBruto: installmentValue,
          dueDate: Timestamp.fromDate(dueDate),
          competence: format(dueDate, "MM/yyyy"),
          status: "Pendente",
          createdAt: serverTimestamp(),
          costCenterId: dataToUpdate.costCenterId || "",
          chartOfAccountId: dataToUpdate.chartOfAccountId || "",
          bankAccountId: dataToUpdate.bankAccountId || "",
        });
      }
    }
  }

  const saleRef = doc(db, "sales", id);
  batch.update(saleRef, dataToUpdate);

  await batch.commit();
  await get().fetchAllData();
};

export const cancelSale = async (get: any, set: any, saleId: string) => {
  const { sales, equipments, quotes, revenues } = get();
  const saleToCancel = sales.find((s: any) => s.id === saleId);

  if (!saleToCancel) {
    throw new Error("Venda não encontrada para cancelamento.");
  }

  const batch = writeBatch(db);

  for (const item of saleToCancel.items || []) {
    const equipment = equipments.find((e: any) => e.id === item.equipmentId);
    if (equipment) {
      const newStock = equipment.stock + item.quantity;
      const equipmentRef = doc(db, "equipments", item.equipmentId);
      batch.update(equipmentRef, { stock: newStock });
    }
  }

  if (saleToCancel.quoteId) {
    const quoteRef = doc(db, "quotes", saleToCancel.quoteId);
    const quoteExists = quotes.some((q: any) => q.id === saleToCancel.quoteId);

    if (quoteExists) {
      batch.update(quoteRef, { status: "Pendente" });
    }
  }

  const revenuesToCancel = revenues.filter((r: any) => r.saleId === saleId && r.status === "Pendente");

  for (const revenue of revenuesToCancel) {
    const revenueRef = doc(db, "revenues", revenue.id);
    batch.update(revenueRef, { status: "Cancelado" });
  }

  const saleRef = doc(db, "sales", saleId);
  batch.update(saleRef, { status: "Cancelada" });

  await batch.commit();
  await get().fetchAllData();
};

export const deleteSale = async (get: any, set: any, saleId: string) => {
  const { sales, revenues } = get();
  const saleToDelete = sales.find((s: any) => s.id === saleId);

  if (!saleToDelete) {
    throw new Error("Venda não encontrada para exclusão.");
  }

  if (saleToDelete.status !== "Cancelada") {
    throw new Error("Apenas vendas canceladas podem ser excluídas permanentemente.");
  }

  const batch = writeBatch(db);

  const revenuesToDelete = revenues.filter((r: any) => r.saleId === saleId);
  revenuesToDelete.forEach((revenue: any) => {
    const revenueRef = doc(db, "revenues", revenue.id);
    batch.delete(revenueRef);
  });

  const saleRef = doc(db, "sales", saleId);
  batch.delete(saleRef);

  await batch.commit();
  await get().fetchAllData();
};
