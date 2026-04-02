//src/types/nfe.ts

export type DestType = "CPF" | "CNPJ";
export type Ambiente = "homologacao" | "producao";
export type Uf = string;

export type NfeItemForm = {
  descricao: string;
  ncm: string;
  cest?: string;
  cfop: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
};

export type FormaPagamentoNfe =
  | "01"
  | "03"
  | "04"
  | "05"
  | "10"
  | "11"
  | "12"
  | "13"
  | "14"
  | "15"
  | "16"
  | "17"
  | "18"
  | "19"
  | "90"
  | "99";

export type NfeFormState = {
  ambiente: Ambiente;
  naturezaOperacao: string;

  emitCnpj: string;
  emitRazao: string;
  emitIe: string;
  emitCrt: number;
  emitCep: string;
  emitLogradouro: string;
  emitNumero: string;
  emitBairro: string;
  emitMun: string;
  emitUf: Uf;
  emitCMun: number;

  destTipo: DestType;
  destCpfCnpj: string;
  destNome: string;
  destCep: string;
  destLogradouro: string;
  destNumero: string;
  destBairro: string;
  destMun: string;
  destUf: Uf;
  destCMun: number;

  formaPagamento: FormaPagamentoNfe;
  observacoes?: string;

  itens: NfeItemForm[];
};

export type EmitResponseBody = {
  id?: string;
  ambiente?: string;
  created_at?: string;
  status?: "autorizado" | "rejeitado" | string;
  data_emissao?: string;
  serie?: number;
  numero?: number;
  valor_total?: number;
  chave?: string;
  autorizacao?: {
    codigo_status?: number;
    motivo_status?: string;
    numero_protocolo?: string;
    status?: string;
  };
};

export type EmitResponse = {
  ok: boolean;
  status: number;
  body: EmitResponseBody | { raw: string } | unknown;
};

export type SavedNfe = {
  id: string;
  createdAt?: string;
  ambiente?: string;
  status?: string;
  chave?: string;
  numero?: number;
  serie?: number;
  valor_total?: number;
  motivo?: string;
  protocolo?: string;
};
