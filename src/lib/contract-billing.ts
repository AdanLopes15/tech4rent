// src/lib/contract-billing.ts
// Tipo de cobrança dos itens de contrato (o select "Cobrança"). Regras puras,
// sem acesso ao Firestore, cobertas por testes unitários.
//
// Por que existe: contratos antigos gravaram o tipo em minúsculas ("mensal"),
// enquanto o select oferece as formas canônicas ("Mensal", "Semanal",
// "Diário"). Um <Select> do Radix só exibe a opção cujo value bate exatamente,
// então "mensal" aparecia em branco. A normalização acontece na APLICAÇÃO, ao
// carregar e ao salvar um formulário — nenhum dado existente é migrado.

export const BILLING_TYPES = ["Mensal", "Semanal", "Diário"] as const;
export type BillingType = (typeof BILLING_TYPES)[number];

// Chave comparável: sem acentos, sem espaços, minúscula.
const CANONICAL_BY_KEY: Record<string, BillingType> = {
  mensal: "Mensal",
  semanal: "Semanal",
  diario: "Diário",
  diaria: "Diário",
};

const foldKey = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // tira acentos: diário/diária → diario/diaria
    .replace(/\s+/g, "")
    .toLowerCase();

/**
 * Devolve a forma canônica de um tipo de cobrança conhecido.
 *
 * - "mensal", " MENSAL ", "Mensal"            → "Mensal"
 * - "semanal", "SEMANAL"                      → "Semanal"
 * - "diario", "diária", "DIARIA", "Diário"    → "Diário"
 * - ausente, vazio ou não-texto               → "" (o formulário decide o padrão)
 * - qualquer outro valor                      → devolvido INTACTO
 *
 * Um valor desconhecido nunca vira "Mensal": preferimos que o select apareça
 * vazio a gravar em cima de um dado cujo significado não conhecemos.
 */
export function normalizeBillingType(value: unknown): string {
  if (typeof value !== "string") return "";
  if (!value.trim()) return "";
  return CANONICAL_BY_KEY[foldKey(value)] ?? value;
}

// ---------------------------------------------------------------------------
// Classificação: locação x venda
//
// "venda" NÃO é tipo de cobrança de contrato — contrato é sempre de locação, e
// orçamento de venda vira documento em sales/, não contrato. Por isso "venda"
// não entra na tabela canônica acima: ele é RECUSADO na fronteira (orçamento e
// conversão), em vez de ser convertido para uma forma bonita que nenhuma tela
// de contrato oferece.
// ---------------------------------------------------------------------------

/** Rótulo usado por orçamentos de venda. */
export const SALE_BILLING_TYPE = "venda";

/** Serve para locação? (Mensal/Semanal/Diário e suas variantes). */
export function isRentalBillingType(value: unknown): boolean {
  return (BILLING_TYPES as readonly string[]).includes(normalizeBillingType(value));
}

/** É o tipo de venda? */
export function isSaleBillingType(value: unknown): boolean {
  return typeof value === "string" && !!value.trim() && foldKey(value) === SALE_BILLING_TYPE;
}

/** Como o valor aparece numa mensagem de erro. */
const billingLabel = (value: unknown): string =>
  typeof value === "string" && value.trim() ? `"${value.trim()}"` : "sem tipo de cobrança";

/**
 * Itens que não servem para o tipo de orçamento/contrato indicado, já
 * descritos para mensagem (sem repetições e na ordem em que aparecem).
 *
 * - "locacao": recusa venda, desconhecidos e itens sem tipo.
 * - "venda":   recusa qualquer coisa que não seja venda.
 */
export function invalidBillingTypesFor(
  kind: "locacao" | "venda",
  items: { billingType?: unknown }[] | undefined,
): string[] {
  const aceita = kind === "locacao" ? isRentalBillingType : isSaleBillingType;
  const invalidos: string[] = [];
  for (const item of items || []) {
    if (aceita(item?.billingType)) continue;
    const label = billingLabel(item?.billingType);
    if (!invalidos.includes(label)) invalidos.push(label);
  }
  return invalidos;
}

/** Mensagem pronta para o usuário, ou null quando está tudo certo. */
export function billingMismatchMessage(
  kind: "locacao" | "venda",
  items: { billingType?: unknown }[] | undefined,
): string | null {
  const invalidos = invalidBillingTypesFor(kind, items);
  if (invalidos.length === 0) return null;

  const esperado = kind === "locacao" ? `${BILLING_TYPES.join(", ")}` : "Venda";
  const tipo = kind === "locacao" ? "locação" : "venda";
  return (
    `Este orçamento é de ${tipo}, mas ${invalidos.length === 1 ? "há item" : "há itens"} com ` +
    `${invalidos.join(", ")}. Corrija os itens para o tipo selecionado (${esperado}).`
  );
}

// Vocabulário INTERNO de telas que escolhem a tarifa do equipamento por tipo
// (EditContractDialog: dailyRate / weeklyRate / monthlyRate). Não é o que vai
// para o banco — a gravação sempre converte para a forma canônica.
const INTERNAL_BY_KEY: Record<string, string> = {
  mensal: "mensal",
  semanal: "semanal",
  diario: "diaria",
  diaria: "diaria",
};

/**
 * Converte um tipo de cobrança (canônico do banco ou legado em minúsculas)
 * para o vocabulário interno dessas telas. Segue as mesmas garantias de
 * `normalizeBillingType`: ausente vira "" e desconhecido volta intacto.
 *
 * - "Mensal", "mensal"   → "mensal"
 * - "Semanal", "semanal" → "semanal"
 * - "Diário", "diaria"   → "diaria"
 */
export function toInternalBillingType(value: unknown): string {
  if (typeof value !== "string") return "";
  if (!value.trim()) return "";
  return INTERNAL_BY_KEY[foldKey(value)] ?? value;
}

/**
 * Normaliza o tipo de cobrança de uma lista de itens, preservando todos os
 * demais campos (quantidade, preço, equipamento...). Itens que já estão
 * canônicos — ou cujo valor é desconhecido — voltam como o mesmo objeto.
 */
export function normalizeItemsBillingType<T extends { billingType?: unknown }>(items: T[]): T[] {
  if (!Array.isArray(items)) return items;
  return items.map((item) => {
    const canonical = normalizeBillingType(item?.billingType);
    if (!canonical || canonical === item?.billingType) return item;
    return { ...item, billingType: canonical };
  });
}
