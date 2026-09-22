// src/lib/contract-duplicate.ts
// Regras puras da duplicação de contrato. Não acessa o Firestore: recebe um
// contrato já carregado e devolve apenas os valores comerciais que o
// formulário de criação (components/contratos/AddContractDialog.tsx) sabe
// editar. Coberto por testes unitários.
//
// O mapeamento é campo a campo DE PROPÓSITO. Uma cópia do objeto inteiro
// (spread) arrastaria junto número, status, anexos, pagamentos, auditoria e os
// campos da Lixeira — e passaria a arrastar qualquer campo novo que alguém
// adicione ao contrato no futuro sem perceber. Aqui, campo novo só é copiado
// se for escrito nesta lista.

import { normalizeBillingType } from "@/lib/contract-billing";
import { parseContractNumber } from "@/lib/contract-number";

/** Um item como o formulário o edita. */
export type DuplicableContractItem = {
  equipmentId: string;
  quantity: number;
  billingType: string;
  unitPrice: number;
};

/** Data como vem de um contrato carregado: Date, ISO, epoch ou Timestamp. */
export type ContractDateValue = Date | string | number | { toDate(): Date };

/**
 * Um contrato já carregado, como a interface o recebe. Os campos são todos
 * opcionais porque contratos antigos não têm os mais novos; o índice final
 * aceita o resto do documento sem convidar ninguém a copiá-lo.
 */
export type ContractLike = {
  id?: string;
  clientId?: string;
  unitOperation?: string;
  startDate?: ContractDateValue;
  endDate?: ContractDateValue;
  firstInstallmentDate?: ContractDateValue;
  items?: Partial<DuplicableContractItem>[];
  costCenterId?: string;
  chartOfAccountId?: string;
  bankAccountId?: string;
  [field: string]: unknown;
};

/** Exatamente os campos editáveis do formulário de novo contrato. */
export type DuplicableContractValues = {
  clientId: string;
  unitOperation: string;
  startDate?: Date;
  endDate?: Date;
  firstInstallmentDate?: Date;
  items: DuplicableContractItem[];
  costCenterId: string;
  chartOfAccountId: string;
  bankAccountId: string;
};

/**
 * Campos que a duplicação NUNCA copia, com o motivo. Serve de documentação e é
 * usado pelos testes para provar que nenhum deles vaza para o novo contrato.
 */
export const NEVER_DUPLICATED_FIELDS: Record<string, string> = {
  id: "número do contrato: o novo vem da sugestão sequencial",
  numbering: "como o número do original foi escolhido",
  status: "estado operacional: a cópia nasce em Em Andamento",
  finalizedAt: "encerramento do original",
  quoteId: "associação com orçamento",
  signedContractUrl: "contrato assinado anexado",
  signedContractPath: "contrato assinado anexado",
  createdAt: "data de criação do original",
  updatedAt: "data de alteração do original",
  createdBy: "quem criou o original",
  deletedAt: "Lixeira",
  deletedBy: "Lixeira",
  deletionReason: "Lixeira",
  stockReturned: "estoque devolvido pela exclusão do original",
  restoredAt: "Lixeira",
  restoredBy: "Lixeira",
  lastDeletion: "Lixeira",
  duplicatedFromContractId: "rastreabilidade do original; a cópia aponta para o contrato duplicado, não para o avô",
};

/** Um documento do Firestore, do jeito que chega: sem garantia de forma. */
type LooseDoc = Record<string, unknown>;

const asDoc = (v: unknown): LooseDoc => (v && typeof v === "object" ? (v as LooseDoc) : {});

const text = (v: unknown): string => (typeof v === "string" ? v : "");

/** Datas chegam como Date, string ISO ou Timestamp do Firestore. */
const toDate = (v: unknown): Date | undefined => {
  if (v === null || v === undefined || v === "") return undefined;
  const timestamp = v as { toDate?: () => Date };
  const d = typeof timestamp.toDate === "function" ? timestamp.toDate() : new Date(v as string | number | Date);
  return d instanceof Date && !isNaN(d.getTime()) ? d : undefined;
};

const toPositiveInt = (v: unknown): number => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) && n > 0 ? n : 1;
};

const toMoney = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

/** Só os quatro campos que a linha de item do formulário edita. */
function duplicableItem(item: unknown): DuplicableContractItem {
  const i = asDoc(item);
  return {
    equipmentId: text(i.equipmentId),
    quantity: toPositiveInt(i.quantity),
    // Contratos antigos gravaram "mensal": o select só exibe a forma canônica.
    billingType: normalizeBillingType(i.billingType) || "Mensal",
    unitPrice: toMoney(i.unitPrice),
  };
}

export const EMPTY_CONTRACT_ITEM: DuplicableContractItem = {
  equipmentId: "",
  quantity: 1,
  billingType: "Mensal",
  unitPrice: 0,
};

/**
 * Valores comerciais do contrato de origem para preencher o formulário.
 * Contratos antigos, sem os campos mais novos, caem nos mesmos padrões de um
 * formulário em branco — nenhum campo ausente vira undefined dentro do draft.
 */
export function duplicableContractValues(contract: unknown): DuplicableContractValues {
  const c = asDoc(contract);
  const items = Array.isArray(c.items) ? c.items.map(duplicableItem) : [];

  return {
    clientId: text(c.clientId),
    unitOperation: text(c.unitOperation),
    startDate: toDate(c.startDate),
    endDate: toDate(c.endDate),
    firstInstallmentDate: toDate(c.firstInstallmentDate),
    items: items.length ? items : [{ ...EMPTY_CONTRACT_ITEM }],
    costCenterId: text(c.costCenterId),
    chartOfAccountId: text(c.chartOfAccountId),
    bankAccountId: text(c.bankAccountId),
  };
}

/** Texto do aviso exibido no topo do formulário em modo duplicação. */
export const duplicatingContractMessage = (contractId: string): string =>
  `Duplicando o contrato ${contractId} — revise os dados antes de salvar.`;

/**
 * O ID do contrato de origem só é guardado se for um número de contrato
 * canônico. Evita gravar lixo em duplicatedFromContractId.
 */
export function sourceContractId(contract: unknown): string | null {
  const id = asDoc(contract).id;
  const parsed = parseContractNumber(id);
  return parsed.ok && parsed.id === id ? parsed.id : null;
}
