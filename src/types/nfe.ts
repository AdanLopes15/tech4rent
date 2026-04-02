export type NFeEnvironment = "homologacao" | "producao";

export type NFePaymentMethod = "dinheiro" | "pix" | "cartao";

export type NFeStatus =
  | "pendente"
  | "autorizada"
  | "rejeitada"
  | "cancelada"
  | "denegada";

export type NFeDocumentType = "cpf" | "cnpj";

export interface NFeItem {
  id: string;
  description: string;
  ncm: string;
  cest: string;
  cfop: string;
  unit: string;
  quantity: number;
  unitPrice: number;
}

export interface NFeEmitter {
  cnpj: string;
  ie: string;
  razaoSocial: string;
  crt: string;
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  municipio: string;
  uf: string;
  cMun: string;
}

export interface NFeRecipient {
  type: NFeDocumentType;
  document: string;
  name: string;
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  municipio: string;
  uf: string;
  cMun: string;
}

export interface NFeFormData {
  environment: NFeEnvironment;
  naturezaOperacao: string;
  emitter: NFeEmitter;
  recipient: NFeRecipient;
  items: NFeItem[];
  paymentMethod: NFePaymentMethod;
  observations: string;
}

export interface NFeHistoryEntry {
  id: string;
  nuvemFiscalId: string;
  status: NFeStatus;
  chave: string;
  numero: string;
  serie: string;
  valor: number;
  createdAt: string;
  xmlUrl?: string;
  pdfUrl?: string;
}
