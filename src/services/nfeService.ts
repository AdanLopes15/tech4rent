import type {
  NFeFormData,
  NFeHistoryEntry,
  NFeItem,
  NFeEmitter,
  NFeRecipient,
} from "@/types/nfe";

const HISTORY_KEY = "nfe_history";
const MAX_HISTORY = 50;

// ── Default data ──────────────────────────────────────────────

export const createDefaultItem = (): NFeItem => ({
  id: crypto.randomUUID(),
  description: "PRODUTO TESTE",
  ncm: "9403300",
  cest: "2806300",
  cfop: "5102",
  unit: "UN",
  quantity: 1,
  unitPrice: 10,
});

export const defaultEmitter: NFeEmitter = {
  cnpj: "44740821000130",
  ie: "587446757113",
  razaoSocial: "IAPONIRA CARDOSO DE OLIVEIRA GAVIOTA",
  crt: "4",
  cep: "13506610",
  logradouro: "44 A",
  numero: "499",
  bairro: "VILA NOVA",
  municipio: "RIO CLARO",
  uf: "SP",
  cMun: "3543907",
};

export const defaultRecipient: NFeRecipient = {
  type: "cpf",
  document: "51510796894",
  name: "JOAO VITOR MORAIS",
  cep: "13506175",
  logradouro: "Rua 5",
  numero: "296",
  bairro: "PARQUE MAE PRETA",
  municipio: "RIO CLARO",
  uf: "SP",
  cMun: "3543907",
};

export const defaultFormData: NFeFormData = {
  environment: "homologacao",
  naturezaOperacao: "VENDA",
  emitter: { ...defaultEmitter },
  recipient: { ...defaultRecipient },
  items: [createDefaultItem()],
  paymentMethod: "dinheiro",
  observations: "",
};

// ── Calculations ──────────────────────────────────────────────

export function calculateItemTotal(item: NFeItem): number {
  return item.quantity * item.unitPrice;
}

export function calculateInvoiceTotal(items: NFeItem[]): number {
  return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
}

// ── History (localStorage) ────────────────────────────────────

export function getHistory(): NFeHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as NFeHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveToHistory(entry: NFeHistoryEntry): NFeHistoryEntry[] {
  const history = [entry, ...getHistory()].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  return history;
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

// ── Emit (stub) ───────────────────────────────────────────────

export async function emitNFe(
  _data: NFeFormData,
): Promise<{ success: boolean; message: string; entry?: NFeHistoryEntry }> {
  // TODO: integrate with Nuvem Fiscal API via edge function
  return {
    success: false,
    message:
      "Emissão ainda não integrada. Configure a API da Nuvem Fiscal para emitir NF-e.",
  };
}

// ── Download stubs ────────────────────────────────────────────

export async function downloadXml(
  _nuvemFiscalId: string,
): Promise<{ success: boolean; message: string }> {
  return {
    success: false,
    message: "Download de XML ainda não integrado.",
  };
}

export async function downloadPdf(
  _nuvemFiscalId: string,
): Promise<{ success: boolean; message: string }> {
  return {
    success: false,
    message: "Download de PDF (DANFE) ainda não integrado.",
  };
}
