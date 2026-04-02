//src/services/nfeService.ts

import type { EmitResponse, EmitResponseBody, NfeFormState, NfeItemForm, SavedNfe } from "@/types/nfe";

const STORAGE_KEY = "nfe_history_v1";

export const EMITIR_URL =
  import.meta.env.VITE_NUVEMFISCAL_EMITIR_URL || "https://nuvemfiscalemitirnfe-yqrvsfh46a-rj.a.run.app";

export const BAIXAR_XML_URL =
  import.meta.env.VITE_NUVEMFISCAL_BAIXAR_XML_URL ||
  "https://southamerica-east1-st4r-f404e.cloudfunctions.net/nuvemfiscalBaixarXml";

export const BAIXAR_DANFE_URL =
  import.meta.env.VITE_NUVEMFISCAL_BAIXAR_DANFE_URL ||
  "https://southamerica-east1-st4r-f404e.cloudfunctions.net/nuvemfiscalBaixarDanfePdf";

export const UF_TO_CUF: Record<string, number> = {
  RO: 11,
  AC: 12,
  AM: 13,
  RR: 14,
  PA: 15,
  AP: 16,
  TO: 17,
  MA: 21,
  PI: 22,
  CE: 23,
  RN: 24,
  PB: 25,
  PE: 26,
  AL: 27,
  SE: 28,
  BA: 29,
  MG: 31,
  ES: 32,
  RJ: 33,
  SP: 35,
  PR: 41,
  SC: 42,
  RS: 43,
  MS: 50,
  MT: 51,
  GO: 52,
  DF: 53,
};

export function onlyDigits(v: string) {
  return (v || "").replace(/\D+/g, "");
}

export function nowIsoWithOffset() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");

  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hour = pad(d.getHours());
  const min = pad(d.getMinutes());
  const sec = pad(d.getSeconds());

  const tzMin = d.getTimezoneOffset();
  const sign = tzMin <= 0 ? "+" : "-";
  const abs = Math.abs(tzMin);
  const offH = pad(Math.floor(abs / 60));
  const offM = pad(abs % 60);

  return `${year}-${month}-${day}T${hour}:${min}:${sec}${sign}${offH}:${offM}`;
}

export function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export function readNfeHistory(): SavedNfe[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as SavedNfe[];
  } catch {
    return [];
  }
}

export function writeNfeHistory(items: SavedNfe[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function openXml(id: string) {
  const url = `${BAIXAR_XML_URL}?id=${encodeURIComponent(id)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function openPdf(id: string) {
  const url = `${BAIXAR_DANFE_URL}?id=${encodeURIComponent(id)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function copyText(text: string) {
  navigator.clipboard?.writeText(text).catch(() => {});
}

export function calculateTotalProdutos(itens: NfeItemForm[]) {
  return itens.reduce<number>((acc, it) => {
    const q = Number(it.quantidade || 0);
    const v = Number(it.valorUnitario || 0);
    return acc + q * v;
  }, 0);
}

export function getSuggestedCfop(emitUf: string, destUf: string) {
  const euf = (emitUf || "").trim().toUpperCase();
  const duf = (destUf || "").trim().toUpperCase();
  const sameUf = !!euf && !!duf && euf === duf;

  return {
    sameUf,
    suggestedCfop: sameUf ? "5102" : "6102",
  };
}

export function buildNfePayload(form: NfeFormState) {
  const emitCnpj = onlyDigits(form.emitCnpj);
  const emitIe = onlyDigits(form.emitIe);
  const destDoc = onlyDigits(form.destCpfCnpj);

  const uf = (form.emitUf || "SP").toUpperCase();
  const cUF = UF_TO_CUF[uf] ?? 35;

  const { suggestedCfop } = getSuggestedCfop(form.emitUf, form.destUf);
  const totalProdutos = calculateTotalProdutos(form.itens);

  const det = form.itens.map((it, index) => {
    const vUn = Number(it.valorUnitario || 0);
    const q = Number(it.quantidade || 0);
    const vProd = Number((vUn * q).toFixed(2));

    const prod: Record<string, unknown> = {
      cProd: String(index + 1),
      cEAN: "SEM GTIN",
      xProd: it.descricao || `ITEM ${index + 1}`,
      NCM: onlyDigits(it.ncm),
      CFOP: onlyDigits(it.cfop || suggestedCfop),
      uCom: it.unidade || "UN",
      qCom: q,
      vUnCom: vUn,
      vProd,
      cEANTrib: "SEM GTIN",
      uTrib: it.unidade || "UN",
      qTrib: q,
      vUnTrib: vUn,
      indTot: 1,
    };

    const cest = onlyDigits(it.cest || "");
    if (cest) prod.CEST = cest;

    return {
      nItem: index + 1,
      prod,
      imposto: {
        ICMS: {
          ICMSSN102: { orig: 0, CSOSN: "102" },
        },
        PIS: { PISNT: { CST: "08" } },
        COFINS: { COFINSNT: { CST: "08" } },
      },
    };
  });

  return {
    ambiente: form.ambiente,
    infNFe: {
      versao: "4.00",
      ide: {
        cUF,
        natOp: form.naturezaOperacao || "VENDA",
        mod: 55,
        serie: 1,
        nNF: 1,
        dhEmi: nowIsoWithOffset(),
        tpNF: 1,
        idDest: 1,
        cMunFG: Number(form.emitCMun),
        tpImp: 1,
        tpEmis: 1,
        finNFe: 1,
        indFinal: 1,
        indPres: 1,
        procEmi: 0,
        verProc: "1.0.0",
      },
      emit: {
        CNPJ: emitCnpj,
        xNome: form.emitRazao,
        IE: emitIe,
        CRT: Number(form.emitCrt),
        enderEmit: {
          xLgr: form.emitLogradouro,
          nro: form.emitNumero,
          xBairro: form.emitBairro,
          cMun: Number(form.emitCMun),
          xMun: form.emitMun,
          UF: form.emitUf,
          CEP: onlyDigits(form.emitCep),
          cPais: 1058,
          xPais: "BRASIL",
        },
      },
      dest: {
        ...(form.destTipo === "CPF" ? { CPF: destDoc } : { CNPJ: destDoc }),
        xNome: form.destNome,
        indIEDest: 9,
        enderDest: {
          xLgr: form.destLogradouro,
          nro: form.destNumero,
          xBairro: form.destBairro,
          cMun: Number(form.destCMun),
          xMun: form.destMun,
          UF: form.destUf,
          CEP: onlyDigits(form.destCep),
          cPais: 1058,
          xPais: "BRASIL",
        },
      },
      det,
      total: {
        ICMSTot: {
          vBC: 0,
          vICMS: 0,
          vProd: Number(totalProdutos.toFixed(2)),
          vNF: Number(totalProdutos.toFixed(2)),
          vPIS: 0,
          vCOFINS: 0,
          vFrete: 0,
          vSeg: 0,
          vDesc: 0,
          vOutro: 0,
          vII: 0,
          vIPI: 0,
          vBCST: 0,
          vST: 0,
          vFCP: 0,
          vFCPST: 0,
          vFCPSTRet: 0,
          vIPIDevol: 0,
          vICMSDeson: 0,
        },
      },
      transp: { modFrete: 9 },
      pag: {
        detPag: [
          {
            indPag: 0,
            tPag: form.formaPagamento,
            vPag: Number(totalProdutos.toFixed(2)),
          },
        ],
      },
      infAdic: form.observacoes ? { infCpl: form.observacoes } : undefined,
    },
  };
}

export async function emitirNfe(form: NfeFormState): Promise<EmitResponse> {
  if (!form.itens.length) {
    return {
      ok: false,
      status: 400,
      body: { raw: "Adicione ao menos 1 item." },
    };
  }

  const payload = buildNfePayload(form);

  const r = await fetch(EMITIR_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nfe: payload }),
  });

  const text = await r.text();
  return safeJsonParse(text) as EmitResponse;
}

export function mapEmitResponseToSavedNfe(body: EmitResponseBody): SavedNfe {
  return {
    id: body.id || "",
    createdAt: body.created_at,
    ambiente: body.ambiente,
    status: body.status,
    chave: body.chave,
    numero: body.numero,
    serie: body.serie,
    valor_total: body.valor_total,
    motivo: body.autorizacao?.motivo_status,
    protocolo: body.autorizacao?.numero_protocolo,
  };
}
