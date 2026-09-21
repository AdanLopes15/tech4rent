// src/store/methods/contractCreate.ts
// Criação de contratos em transação única do Firestore: verificação de
// duplicidade do número, contrato, parcelas, baixa de estoque, contador,
// orçamento (na conversão) e auditoria são gravados juntos ou nada é gravado.
// A transação relê contador, contrato, orçamento e estoque no servidor (não
// confia no estado local nem em consultas feitas antes pela interface) e o SDK
// a repete automaticamente se houver escrita concorrente. As regras do
// Firestore repetem as garantias essenciais (formato do ID, contador que
// nunca diminui e que cobre o número usado, permissão contratos.create).

import {
  collection,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  Timestamp,
  type Firestore,
  type Transaction,
} from "firebase/firestore";
import { addMonths, differenceInMonths, getDate } from "date-fns";
import { aggregateItems, type TrashActor } from "@/lib/contract-trash";
import {
  duplicateContractMessage,
  formatContractId,
  nextCounterValue,
  requireContractNumber,
  type ContractCreationOrigin,
  type ContractNumberSource,
} from "@/lib/contract-number";

export class ContractNumberTakenError extends Error {
  contractId: string;

  constructor(contractId: string) {
    super(duplicateContractMessage(contractId));
    this.name = "ContractNumberTakenError";
    this.contractId = contractId;
  }
}

export type ContractDraft = {
  clientId: string;
  client: any;
  startDate: Date;
  endDate: Date;
  firstInstallmentDate: Date;
  items: any[];
  totalValue: number;
  status?: string;
  [key: string]: any;
};

type NumberChoice = {
  /** O que está no campo "Número do contrato" (aceita "120", "ctr-120"...). */
  contractNumber: string;
  /** Número sugerido quando o formulário foi aberto. */
  suggestedId: string | null;
  actor: TrashActor;
};

export type CreateContractResult = {
  contractId: string;
  numberSource: ContractNumberSource;
  counterBefore: number;
  counterAfter: number;
  contract: Record<string, any>;
};

const counterRef = (db: Firestore) => doc(db, "counters", "contracts");

const readCounter = (data: any): number => {
  const n = Number(data?.currentNumber);
  return Number.isInteger(n) && n > 0 ? n : 0;
};

/**
 * Próximo número automático: contador + 1, pulando números já ocupados
 * (inclusive por contratos na Lixeira). Apenas lê; nada é reservado.
 */
export async function getSuggestedContractNumber(db: Firestore): Promise<string> {
  let n = readCounter((await getDoc(counterRef(db))).data()) + 1;
  for (let i = 0; i < 50; i++) {
    const id = formatContractId(n);
    if (!(await getDoc(doc(db, "contracts", id))).exists()) return id;
    n++;
  }
  return formatContractId(n);
}

/** Vencimentos das parcelas (mesma regra de recalculateContractInstallments). */
export function planInstallmentDueDates(startDate: Date, endDate: Date, firstInstallmentDate: Date): Date[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let totalMonths = differenceInMonths(end, start);
  if (getDate(end) > getDate(start)) totalMonths++;
  if (totalMonths <= 0) totalMonths = 1;

  const dates: Date[] = [];
  let due = new Date(firstInstallmentDate);
  for (let i = 0; i < totalMonths; i++) {
    dates.push(due);
    due = addMonths(due, 1);
  }
  return dates;
}

function validateDraft(draft: ContractDraft) {
  if (!draft.clientId) throw new Error("Selecione um cliente.");
  if (!Array.isArray(draft.items) || draft.items.length === 0) throw new Error("Adicione ao menos um equipamento.");
  if (draft.items.some((i) => !i?.equipmentId || !(Number(i.quantity) > 0))) {
    throw new Error("Todos os itens precisam de equipamento e quantidade maior que zero.");
  }
  for (const [label, d] of [
    ["retirada", draft.startDate],
    ["devolução", draft.endDate],
    ["1ª parcela", draft.firstInstallmentDate],
  ] as const) {
    if (!(d instanceof Date) || isNaN(d.getTime())) throw new Error(`Data de ${label} inválida.`);
  }
}

/**
 * Lê (fase de leitura da transação) tudo o que a criação precisa e devolve uma
 * função que faz as gravações. O Firestore exige todas as leituras antes das escritas.
 */
async function prepareContractWrite(
  tx: Transaction,
  db: Firestore,
  draft: ContractDraft,
  choice: NumberChoice,
  origin: ContractCreationOrigin,
) {
  const parsed = requireContractNumber(choice.contractNumber);
  const contractId = parsed.id;
  validateDraft(draft);

  const counterSnap = await tx.get(counterRef(db));
  const contractRef = doc(db, "contracts", contractId);
  const existing = await tx.get(contractRef);
  // Contratos na Lixeira continuam existindo no banco e ocupam o número.
  if (existing.exists()) throw new ContractNumberTakenError(contractId);

  const entries = aggregateItems(draft.items);
  const stock = new Map<string, { stock: number; name: string }>();
  for (const entry of entries) {
    const snap = await tx.get(doc(db, "equipments", entry.equipmentId));
    const name = snap.data()?.name || entry.equipmentId;
    const available = Number(snap.data()?.stock) || 0;
    if (!snap.exists()) throw new Error(`Equipamento ${entry.equipmentId} não existe mais. Nenhum dado foi gravado.`);
    if (available < entry.quantity) {
      throw new Error(
        `Estoque insuficiente para ${name}: necessário ${entry.quantity}, disponível ${available}. Nenhum dado foi gravado.`,
      );
    }
    stock.set(entry.equipmentId, { stock: available, name });
  }

  const counterBefore = readCounter(counterSnap.data());
  const counterAfter = nextCounterValue(counterBefore, parsed.number);
  const numberSource: ContractNumberSource =
    choice.suggestedId && choice.suggestedId === contractId ? "automatico" : "manual";

  const write = (extraAudit: Record<string, any> = {}) => {
    const { client, items, startDate, endDate, firstInstallmentDate, ...rest } = draft;
    const monthlyValue = items.reduce((acc: number, i: any) => acc + Number(i.quantity) * Number(i.unitPrice || 0), 0);

    for (const entry of entries) {
      tx.update(doc(db, "equipments", entry.equipmentId), {
        stock: stock.get(entry.equipmentId)!.stock - entry.quantity,
      });
    }

    const contract = {
      // O Firestore recusa campos undefined.
      ...Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined)),
      id: contractId,
      client: client || null,
      items,
      startDate,
      endDate,
      totalValue: draft.totalValue,
      createdAt: serverTimestamp(),
      createdBy: choice.actor,
      numbering: { source: numberSource, suggestedId: choice.suggestedId || null, origin },
    };
    tx.set(contractRef, contract);

    const dueDates = planInstallmentDueDates(startDate, endDate, firstInstallmentDate);
    dueDates.forEach((due, i) => {
      tx.set(doc(collection(db, "revenues")), {
        clientId: draft.clientId,
        contractId,
        description: `Parcela ${i + 1}/${dueDates.length} do contrato ${contractId}`,
        valorTotal: monthlyValue,
        valorBruto: monthlyValue,
        dueDate: Timestamp.fromDate(due),
        status: "Pendente",
        createdAt: serverTimestamp(),
        costCenterId: rest.costCenterId || "",
        chartOfAccountId: rest.chartOfAccountId || "",
        bankAccountId: rest.bankAccountId || "",
      });
    });

    // Número menor que o contador: o contador não é tocado (nunca diminui).
    if (counterAfter !== counterBefore) tx.set(counterRef(db), { currentNumber: counterAfter }, { merge: true });

    tx.set(doc(collection(db, "auditLogs")), {
      action: "contract.create",
      actorUid: choice.actor.uid,
      actorEmail: choice.actor.email,
      details: {
        contractId,
        contractNumber: parsed.number,
        numberSource,
        suggestedId: choice.suggestedId || null,
        origin,
        clientId: draft.clientId,
        counterBefore,
        counterAfter,
        installments: dueDates.length,
        actorName: choice.actor.name,
        ...extraAudit,
      },
      createdAt: serverTimestamp(),
    });

    return { contractId, numberSource, counterBefore, counterAfter, contract };
  };

  return { contractId, write };
}

const MAX_ATTEMPTS = 3;

/**
 * Criações concorrentes podem fazer as regras negarem uma transação que leu
 * dados já desatualizados (PERMISSION_DENIED, que o SDK não repete):
 *  - outro usuário criou o mesmo número → a escrita virou "update" de um
 *    contrato existente: a falha é traduzida para a mensagem de duplicidade;
 *  - outro usuário levou o contador acima do valor lido → a transação é
 *    repetida do zero, relendo tudo (nada foi gravado na tentativa negada).
 * Uma negação real (sem permissão) continua negada em todas as tentativas.
 */
async function explainConflict<T>(db: Firestore, contractNumber: string, run: () => Promise<T>): Promise<T> {
  const { id } = requireContractNumber(contractNumber);
  for (let attempt = 1; ; attempt++) {
    try {
      return await run();
    } catch (err: any) {
      if (err?.code !== "permission-denied") throw err;
      const exists = await getDoc(doc(db, "contracts", id)).then((s) => s.exists(), () => false);
      if (exists) throw new ContractNumberTakenError(id);
      if (attempt >= MAX_ATTEMPTS) throw err;
    }
  }
}

/** Criação direta pela tela de Contratos. */
export async function createContract(
  db: Firestore,
  { draft, ...choice }: NumberChoice & { draft: ContractDraft },
): Promise<CreateContractResult> {
  return explainConflict(db, choice.contractNumber, () =>
    runTransaction(db, async (tx) => {
      const { write } = await prepareContractWrite(tx, db, draft, choice, "contrato_direto");
      return write();
    }),
  );
}

/**
 * Conversão de orçamento de locação em contrato. O orçamento é relido e
 * marcado como Aprovado na mesma transação: dois cliques (ou dois usuários)
 * não geram dois contratos para o mesmo orçamento.
 */
export async function convertQuoteToContract(
  db: Firestore,
  { quoteId, client, ...choice }: NumberChoice & { quoteId: string; client?: any },
): Promise<CreateContractResult> {
  return explainConflict(db, choice.contractNumber, () => runTransaction(db, async (tx) => {
    const quoteRef = doc(db, "quotes", quoteId);
    const quoteSnap = await tx.get(quoteRef);
    if (!quoteSnap.exists()) throw new Error("Orçamento não encontrado.");
    const quote: any = quoteSnap.data();
    if (quote.status !== "Pendente") throw new Error("Apenas orçamentos pendentes podem ser convertidos.");
    if (quote.budgetType !== "locacao") throw new Error("Este orçamento não é de locação.");

    const toDate = (v: any) => (v?.toDate ? v.toDate() : new Date(v));
    const startDate = toDate(quote.startDate);
    const draft: ContractDraft = {
      clientId: quote.clientId,
      client: client || null,
      startDate,
      endDate: toDate(quote.endDate),
      firstInstallmentDate: addMonths(startDate, 1),
      items: quote.items || [],
      totalValue: quote.totalValue,
      status: "Em Andamento",
      quoteId,
      costCenterId: quote.costCenterId || "",
      chartOfAccountId: quote.chartOfAccountId || "",
      bankAccountId: quote.bankAccountId || "",
    };

    const { contractId, write } = await prepareContractWrite(tx, db, draft, choice, "conversao_orcamento");
    const result = write({ quoteId });
    tx.update(quoteRef, { status: "Aprovado", contractId });
    return result;
  }));
}
