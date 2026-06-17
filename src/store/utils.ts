import { doc, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Remove recursivamente qualquer valor `undefined` de objetos e arrays,
 * para que o Firestore nunca receba campos undefined (que causam erro).
 * Mantém null, "", 0, [] e Timestamps/Dates intactos.
 */
export function removeUndefined<T>(value: T): T {
  if (value === undefined) return null as any;
  if (value === null) return value;

  // Não percorrer Date, Timestamp ou outros objetos com toDate/seconds
  if (
    value instanceof Date ||
    typeof (value as any)?.toDate === "function" ||
    typeof (value as any)?.toMillis === "function"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => removeUndefined(item)) as any;
  }

  if (typeof value === "object") {
    const result: any = {};
    for (const [key, val] of Object.entries(value as any)) {
      if (val === undefined) continue;
      result[key] = removeUndefined(val);
    }
    return result;
  }

  return value;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  boleto: "Boleto",
  entrada_boleto: "Entrada + Boleto",
  pix: "PIX",
  cartao_credito: "Cartão de Crédito",
  transferencia: "Transferência",
};

function describePaymentMethod(pm: any): string {
  const label = PAYMENT_METHOD_LABELS[pm?.paymentMethod] || pm?.paymentMethod || "Pagamento";
  const installments = Number(pm?.installments || 1);
  if (pm?.paymentMethod === "pix" || pm?.paymentMethod === "transferencia" || installments <= 1) {
    return `${label} à vista`;
  }
  return `${label} em ${installments}x`;
}

const PAYMENT_CONDITION_REGEX =
  /^\s*Condi[çc][õo]es?\s+de\s+pagamento:[\s\S]*?(?:\n{2,}|$)/i;

/**
 * Monta o texto de condição de pagamento a partir das formas de pagamento e
 * insere/atualiza no início das observações, sem duplicar.
 */
export function buildObservationsWithPaymentCondition(
  observations: string,
  paymentMethods: any[],
): string {
  // Remove qualquer bloco de condição de pagamento já existente no início
  const userText = (observations || "").replace(PAYMENT_CONDITION_REGEX, "").trimStart();

  if (!paymentMethods || paymentMethods.length === 0) {
    return userText;
  }

  let conditionBlock: string;
  if (paymentMethods.length === 1) {
    conditionBlock = `Condição de pagamento: ${describePaymentMethod(paymentMethods[0])}.`;
  } else {
    const options = paymentMethods
      .map((pm, i) => `Opção ${i + 1}: ${describePaymentMethod(pm)}.`)
      .join("\n");
    conditionBlock = `Condições de pagamento:\n${options}`;
  }

  return userText ? `${conditionBlock}\n\n${userText}` : conditionBlock;
}

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
    catalogItems: "CAT",
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
