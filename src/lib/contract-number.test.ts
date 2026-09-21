import { describe, expect, it } from "vitest";
import {
  CANONICAL_CONTRACT_ID,
  duplicateContractMessage,
  formatContractId,
  nextCounterValue,
  parseContractNumber,
  requireContractNumber,
} from "./contract-number";
import { planInstallmentDueDates } from "@/store/methods/contractCreate";

describe("parseContractNumber", () => {
  it.each([
    ["CTR-120", "CTR-120", 120],
    ["ctr-120", "CTR-120", 120],
    ["  CTR - 120 ", "CTR-120", 120],
    ["120", "CTR-120", 120],
    ["CTR120", "CTR-120", 120],
    ["CTR-50", "CTR-050", 50],
    ["CTR-0050", "CTR-050", 50],
    ["7", "CTR-007", 7],
    ["1234", "CTR-1234", 1234],
    ["999999", "CTR-999999", 999999],
  ])("normaliza %j para %s", (input, id, number) => {
    expect(parseContractNumber(input)).toEqual({ ok: true, id, number });
  });

  it.each([
    ["", /Informe/],
    ["   ", /Informe/],
    ["CTR-", /inválido/],
    ["CTR-0", /maior que zero/],
    ["000", /maior que zero/],
    ["CTR-12A", /inválido/],
    ["ABC-120", /inválido/],
    ["CTR--120", /inválido/],
    ["CTR-12.0", /inválido/],
    ["-120", /inválido/],
    ["CTR-1e3", /inválido/],
    ["CTR-１２０", /inválido/], // dígitos de largura total
    ["CTR-120;DROP", /inválido/],
    ["CTR-1000000", /no máximo/],
  ])("recusa %j", (input, message) => {
    const r = parseContractNumber(input);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(message);
  });

  it("recusa valores que não são texto", () => {
    expect(parseContractNumber(undefined).ok).toBe(false);
    expect(parseContractNumber(120 as any).ok).toBe(false);
  });

  it("requireContractNumber lança a mensagem de validação", () => {
    expect(requireContractNumber("ctr-9")).toEqual({ id: "CTR-009", number: 9 });
    expect(() => requireContractNumber("CTR-0")).toThrow(/maior que zero/);
  });
});

describe("formato canônico", () => {
  it("formatContractId preenche 3 dígitos", () => {
    expect(formatContractId(1)).toBe("CTR-001");
    expect(formatContractId(120)).toBe("CTR-120");
    expect(formatContractId(1000)).toBe("CTR-1000");
  });

  it("todo ID normalizado passa na mesma expressão das regras do Firestore", () => {
    for (const n of [1, 9, 10, 99, 100, 119, 120, 999, 1000, 999999]) {
      expect(formatContractId(n)).toMatch(CANONICAL_CONTRACT_ID);
    }
    for (const bad of ["CTR-000", "CTR-50", "CTR-0050", "CTR-0120", "ctr-120", "CTR-1000000"]) {
      expect(bad).not.toMatch(CANONICAL_CONTRACT_ID);
    }
  });

  it("mensagem de duplicidade", () => {
    expect(duplicateContractMessage("CTR-120")).toBe("Já existe um contrato com o número CTR-120.");
  });
});

describe("nextCounterValue", () => {
  it("aceitar o sugerido avança 1", () => expect(nextCounterValue(119, 120)).toBe(120));
  it("número menor não reduz o contador", () => expect(nextCounterValue(119, 50)).toBe(119));
  it("número maior avança o contador até ele", () => expect(nextCounterValue(119, 150)).toBe(150));
});

describe("planInstallmentDueDates", () => {
  it("gera uma parcela por mês a partir da 1ª parcela", () => {
    const dates = planInstallmentDueDates(new Date(2026, 0, 10), new Date(2026, 3, 10), new Date(2026, 1, 10));
    expect(dates.map((d) => d.getMonth())).toEqual([1, 2, 3]);
  });

  it("período menor que um mês gera uma parcela", () => {
    expect(planInstallmentDueDates(new Date(2026, 0, 10), new Date(2026, 0, 10), new Date(2026, 1, 10))).toHaveLength(1);
  });
});
