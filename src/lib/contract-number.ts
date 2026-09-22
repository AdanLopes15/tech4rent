// src/lib/contract-number.ts
// Regras puras do número de contrato (CTR-XXX). Não acessa o Firestore: é
// usado pela transação de criação (store/methods/contractCreate.ts) e pela
// interface, e é coberto por testes unitários.
//
// O número é o próprio ID do documento em contracts/. Por isso existe uma
// única forma canônica por número: "CTR-" + no mínimo 3 dígitos, sem zeros à
// esquerda além do preenchimento (50 → CTR-050, 1234 → CTR-1234). Assim
// "CTR-50" e "CTR-0050" não podem virar documentos diferentes para o mesmo número.

export const CONTRACT_PREFIX = "CTR";
export const MAX_CONTRACT_NUMBER = 999999;

// Mesma expressão usada em firestore.rules (allow create em contracts).
export const CANONICAL_CONTRACT_ID = /^CTR-(00[1-9]|0[1-9][0-9]|[1-9][0-9]{2,5})$/;

export type ContractNumberSource = "automatico" | "manual";
export type ContractCreationOrigin = "contrato_direto" | "conversao_orcamento" | "duplicacao";

export const formatContractId = (n: number): string => `${CONTRACT_PREFIX}-${String(n).padStart(3, "0")}`;

// ok=true traz id/number; ok=false traz error. (O projeto não usa strict, então
// uma união discriminada não seria estreitada pelo TypeScript.)
export type ParsedContractNumber = { ok: boolean; id?: string; number?: number; error?: string };

/**
 * Normaliza o que o usuário digitou: remove espaços, aceita "ctr" minúsculo e
 * aceita só os dígitos ("120" → CTR-120). Qualquer outro caractere é recusado.
 */
export function parseContractNumber(input: unknown): ParsedContractNumber {
  const raw = typeof input === "string" ? input.replace(/\s+/g, "").toUpperCase() : "";
  if (!raw) return { ok: false, error: "Informe o número do contrato." };

  const match = /^(?:CTR-?)?(\d+)$/.exec(raw);
  if (!match) {
    return { ok: false, error: "Número inválido. Use o formato CTR- seguido de números, por exemplo CTR-120." };
  }

  const digits = match[1].replace(/^0+/, "");
  if (!digits) return { ok: false, error: "O número do contrato deve ser maior que zero." };
  if (digits.length > String(MAX_CONTRACT_NUMBER).length || Number(digits) > MAX_CONTRACT_NUMBER) {
    return { ok: false, error: `O número do contrato deve ser no máximo ${formatContractId(MAX_CONTRACT_NUMBER)}.` };
  }

  const number = Number(digits);
  return { ok: true, id: formatContractId(number), number };
}

/** Igual a parseContractNumber, mas lança o erro de validação. */
export function requireContractNumber(input: unknown): { id: string; number: number } {
  const parsed = parseContractNumber(input);
  if (!parsed.ok) throw new Error(parsed.error);
  return { id: parsed.id!, number: parsed.number! };
}

export const duplicateContractMessage = (id: string): string => `Já existe um contrato com o número ${id}.`;

/** Novo valor do contador: nunca diminui; avança se o número usado for maior. */
export const nextCounterValue = (current: number, used: number): number => Math.max(current, used);
