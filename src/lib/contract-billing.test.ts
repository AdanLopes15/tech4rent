// Testes unitários da normalização do tipo de cobrança (lib/contract-billing.ts).
// Rodar com: npm test

import { describe, expect, it } from "vitest";

import {
  BILLING_TYPES,
  billingMismatchMessage,
  invalidBillingTypesFor,
  isRentalBillingType,
  isSaleBillingType,
  normalizeBillingType,
  normalizeItemsBillingType,
} from "@/lib/contract-billing";

describe("normalizeBillingType: tipos conhecidos", () => {
  it("mensal em qualquer caixa vira Mensal", () => {
    for (const entrada of ["mensal", "Mensal", "MENSAL", "MeNsAl"]) {
      expect(normalizeBillingType(entrada), entrada).toBe("Mensal");
    }
  });

  it("semanal em qualquer caixa vira Semanal", () => {
    for (const entrada of ["semanal", "Semanal", "SEMANAL", "SeMaNaL"]) {
      expect(normalizeBillingType(entrada), entrada).toBe("Semanal");
    }
  });

  it("diario/diária/diaria/diário, com qualquer caixa, viram Diário", () => {
    for (const entrada of [
      "diario",
      "diário",
      "diaria",
      "diária",
      "Diario",
      "Diário",
      "Diaria",
      "Diária",
      "DIARIO",
      "DIÁRIO",
      "DIARIA",
      "DIÁRIA",
    ]) {
      expect(normalizeBillingType(entrada), entrada).toBe("Diário");
    }
  });

  it("espaços em volta e no meio não atrapalham", () => {
    expect(normalizeBillingType("  mensal  ")).toBe("Mensal");
    expect(normalizeBillingType("\tSEMANAL\n")).toBe("Semanal");
    expect(normalizeBillingType(" di ária ")).toBe("Diário");
  });

  it("valores já canônicos continuam idênticos", () => {
    for (const canonico of BILLING_TYPES) {
      expect(normalizeBillingType(canonico)).toBe(canonico);
    }
  });
});

describe("normalizeBillingType: ausente e desconhecido", () => {
  it("valor ausente devolve vazio, deixando o padrão para o formulário", () => {
    for (const vazio of [undefined, null, "", "   ", 0, false, {}, []]) {
      expect(normalizeBillingType(vazio), String(vazio)).toBe("");
    }
  });

  it("valor desconhecido volta INTACTO, nunca convertido em Mensal", () => {
    for (const desconhecido of ["quinzenal", "venda", "anual", "Bimestral", "xpto", "mensalidade"]) {
      expect(normalizeBillingType(desconhecido), desconhecido).toBe(desconhecido);
      expect(normalizeBillingType(desconhecido)).not.toBe("Mensal");
    }
  });

  it("um desconhecido com espaços também volta como veio", () => {
    expect(normalizeBillingType("  quinzenal  ")).toBe("  quinzenal  ");
  });
});

describe("normalizeItemsBillingType", () => {
  const item = (billingType: unknown) => ({ equipmentId: "EQP-001", quantity: 3, unitPrice: 150, billingType });

  it("normaliza só o tipo de cobrança e preserva os demais campos", () => {
    const [normalizado] = normalizeItemsBillingType([item("mensal")]);
    expect(normalizado).toEqual({ equipmentId: "EQP-001", quantity: 3, unitPrice: 150, billingType: "Mensal" });
  });

  it("não altera a lista original", () => {
    const original = [item("mensal")];
    const copia = JSON.stringify(original);
    normalizeItemsBillingType(original);
    expect(JSON.stringify(original)).toBe(copia);
  });

  it("itens já canônicos voltam como o MESMO objeto (nada é reescrito à toa)", () => {
    const original = item("Mensal");
    const [resultado] = normalizeItemsBillingType([original]);
    expect(resultado).toBe(original);
  });

  it("item com tipo desconhecido ou ausente é devolvido intocado", () => {
    const desconhecido = item("quinzenal");
    const ausente = item(undefined);
    const [a, b] = normalizeItemsBillingType([desconhecido, ausente]);
    expect(a).toBe(desconhecido);
    expect(b).toBe(ausente);
  });

  it("mistura de itens: cada um segue a sua regra", () => {
    const resultado = normalizeItemsBillingType([item("mensal"), item("Semanal"), item("DIÁRIA"), item("quinzenal")]);
    expect(resultado.map((i) => i.billingType)).toEqual(["Mensal", "Semanal", "Diário", "quinzenal"]);
    expect(resultado.map((i) => i.quantity)).toEqual([3, 3, 3, 3]);
    expect(resultado.map((i) => i.unitPrice)).toEqual([150, 150, 150, 150]);
  });
});

describe("classificação locação x venda", () => {
  it("os tipos de locação (e variantes) são aceitos como locação", () => {
    for (const v of ["Mensal", "mensal", " MENSAL ", "Semanal", "semanal", "Diário", "diario", "diária", "DIARIA"]) {
      expect(isRentalBillingType(v), v).toBe(true);
      expect(isSaleBillingType(v), v).toBe(false);
    }
  });

  it("venda é venda, e nunca locação", () => {
    for (const v of ["venda", "Venda", "VENDA", " venda "]) {
      expect(isSaleBillingType(v), v).toBe(true);
      expect(isRentalBillingType(v), v).toBe(false);
    }
  });

  it("desconhecidos e ausentes não são nem um nem outro", () => {
    for (const v of ["quinzenal", "anual", "", "   ", undefined, null, 7]) {
      expect(isRentalBillingType(v), String(v)).toBe(false);
      expect(isSaleBillingType(v), String(v)).toBe(false);
    }
  });
});

describe("invalidBillingTypesFor / billingMismatchMessage", () => {
  const itens = (...tipos: unknown[]) => tipos.map((billingType) => ({ equipmentId: "EQP-001", billingType }));

  it("orçamento de locação só aceita tipos de locação", () => {
    expect(invalidBillingTypesFor("locacao", itens("mensal", "Semanal", "diária"))).toEqual([]);
    expect(billingMismatchMessage("locacao", itens("mensal", "Semanal"))).toBeNull();
  });

  it("orçamento de locação recusa venda, desconhecido e item sem tipo", () => {
    expect(invalidBillingTypesFor("locacao", itens("venda"))).toEqual(['"venda"']);
    expect(invalidBillingTypesFor("locacao", itens("quinzenal"))).toEqual(['"quinzenal"']);
    expect(invalidBillingTypesFor("locacao", itens(undefined))).toEqual(["sem tipo de cobrança"]);
  });

  it("orçamento de venda só aceita venda", () => {
    expect(invalidBillingTypesFor("venda", itens("venda", "Venda"))).toEqual([]);
    expect(invalidBillingTypesFor("venda", itens("mensal"))).toEqual(['"mensal"']);
  });

  it("não repete o mesmo valor e mantém a ordem de aparição", () => {
    expect(invalidBillingTypesFor("locacao", itens("venda", "quinzenal", "venda", "mensal"))).toEqual([
      '"venda"',
      '"quinzenal"',
    ]);
  });

  it("lista vazia ou ausente não acusa nada", () => {
    expect(billingMismatchMessage("locacao", [])).toBeNull();
    expect(billingMismatchMessage("locacao", undefined)).toBeNull();
  });

  it("a mensagem diz o tipo do orçamento, o que está errado e o que se espera", () => {
    const msg = billingMismatchMessage("locacao", itens("venda"))!;
    expect(msg).toContain("locação");
    expect(msg).toContain('"venda"');
    expect(msg).toContain("Mensal, Semanal, Diário");

    const msgVenda = billingMismatchMessage("venda", itens("mensal"))!;
    expect(msgVenda).toContain("venda");
    expect(msgVenda).toContain('"mensal"');
  });

  it("'venda' NÃO entrou na tabela canônica de contratos", () => {
    expect(BILLING_TYPES).toEqual(["Mensal", "Semanal", "Diário"]);
    expect(normalizeBillingType("venda")).toBe("venda");
    expect(normalizeItemsBillingType([{ billingType: "venda" }])[0].billingType).toBe("venda");
  });
});
