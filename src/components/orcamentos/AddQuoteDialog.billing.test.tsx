// Testes de interface (jsdom + Testing Library) da validação que impede salvar
// um orçamento cujos itens não batem com o tipo escolhido.
//
// O radio "Tipo de Orçamento" continua editável de propósito: trocar o tipo de
// um orçamento existente NÃO reescreve os itens (não mexemos em preço sem o
// usuário pedir). Quem barra é esta validação, no salvamento.
// Rodar com: npm test

import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AddQuoteDialog } from "@/components/orcamentos/AddQuoteDialog";

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
const globalScope = globalThis as typeof globalThis & { ResizeObserver?: unknown };
globalScope.ResizeObserver = globalScope.ResizeObserver || ResizeObserverStub;

const elementProto = Element.prototype as Element & {
  scrollIntoView: () => void;
  hasPointerCapture: () => boolean;
  setPointerCapture: () => void;
  releasePointerCapture: () => void;
};
elementProto.scrollIntoView = elementProto.scrollIntoView || (() => {});
elementProto.hasPointerCapture = () => false;
elementProto.setPointerCapture = () => {};
elementProto.releasePointerCapture = () => {};

const addQuote = vi.fn().mockResolvedValue({ id: "ORC-100" });
const updateQuote = vi.fn().mockResolvedValue(undefined);
const toast = vi.fn();

vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast }) }));

vi.mock("@/store", () => ({
  useStore: () => ({
    clients: [{ id: "CLI-001", razaoSocial: "Cliente Teste" }],
    equipments: [
      { id: "EQP-001", name: "PDA TC60", stock: 10, purpose: "aluguel", dailyRate: 11, weeklyRate: 55, monthlyRate: 235 },
      { id: "EQP-009", name: "Gatilho Scan", stock: 4, purpose: "venda", salePrice: 900 },
    ],
    addQuote,
    updateQuote,
  }),
}));

const dia = (n: number) => new Date(Date.now() + n * 86400000).toISOString();

/** Orçamento existente, como está no banco. */
const orcamento = (budgetType: string, billingType: string) => ({
  id: "ORC-050",
  clientId: "CLI-001",
  status: "Pendente",
  budgetType,
  startDate: dia(1),
  endDate: dia(91),
  items: [{ id: 1, equipmentId: budgetType === "venda" ? "EQP-009" : "EQP-001", quantity: 1, billingType, unitPrice: 100 }],
  totalValue: 100,
  paymentMethods: [],
});

const salvar = () => fireEvent.click(screen.getByRole("button", { name: /Salvar Alterações|Criar Orçamento/ }));

/** Marca o radio do tipo de orçamento, como o usuário faria. */
const escolherTipo = (rotulo: "Locação" | "Venda") => fireEvent.click(screen.getByLabelText(rotulo));

async function abrir(quote: ReturnType<typeof orcamento>) {
  render(<AddQuoteDialog open onOpenChange={vi.fn()} quote={quote} />);
  await waitFor(() => expect(screen.getByLabelText("Locação")).toBeInTheDocument());
}

const mensagemDoToast = () => toast.mock.calls.map(([arg]) => `${arg?.title} ${arg?.description}`).join(" | ");

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  addQuote.mockResolvedValue({ id: "ORC-100" });
  updateQuote.mockResolvedValue(undefined);
});

describe("orçamento com itens incompatíveis não pode ser salvo", () => {
  it("orçamento de venda alterado para locação, mantendo item 'venda', é bloqueado", async () => {
    await abrir(orcamento("venda", "venda"));

    escolherTipo("Locação");
    salvar();

    await waitFor(() => expect(toast).toHaveBeenCalled());
    expect(updateQuote).not.toHaveBeenCalled();
    expect(addQuote).not.toHaveBeenCalled();
    expect(mensagemDoToast()).toContain("Itens incompatíveis com o tipo de orçamento");
    expect(mensagemDoToast()).toContain('"venda"');
  });

  it("orçamento de locação com item desconhecido é bloqueado", async () => {
    await abrir(orcamento("locacao", "quinzenal"));

    salvar();

    await waitFor(() => expect(toast).toHaveBeenCalled());
    expect(updateQuote).not.toHaveBeenCalled();
    expect(mensagemDoToast()).toContain('"quinzenal"');
  });

  it("orçamento de venda com item de locação é bloqueado", async () => {
    await abrir(orcamento("venda", "mensal"));

    salvar();

    await waitFor(() => expect(toast).toHaveBeenCalled());
    expect(updateQuote).not.toHaveBeenCalled();
    expect(mensagemDoToast()).toContain('"mensal"');
  });

  it("o bloqueio não altera itens nem preços silenciosamente", async () => {
    await abrir(orcamento("venda", "venda"));

    escolherTipo("Locação");
    salvar();

    await waitFor(() => expect(toast).toHaveBeenCalled());
    // Nada foi gravado — o orçamento no banco continua exatamente como estava.
    expect(updateQuote).not.toHaveBeenCalled();
    expect(addQuote).not.toHaveBeenCalled();
  });
});

describe("orçamentos válidos continuam salvando normalmente", () => {
  it("orçamento de locação válido é salvo", async () => {
    await abrir(orcamento("locacao", "mensal"));

    salvar();

    await waitFor(() => expect(updateQuote).toHaveBeenCalledTimes(1));
    const payload = updateQuote.mock.calls[0][0];
    expect(payload.budgetType).toBe("locacao");
    expect(payload.items[0].billingType).toBe("mensal");
  });

  it("orçamento de venda válido é salvo", async () => {
    await abrir(orcamento("venda", "venda"));

    salvar();

    await waitFor(() => expect(updateQuote).toHaveBeenCalledTimes(1));
    const payload = updateQuote.mock.calls[0][0];
    expect(payload.budgetType).toBe("venda");
    expect(payload.items[0].billingType).toBe("venda");
  });

  it("locação com variantes de caixa e acento continua válida", async () => {
    for (const tipo of ["Mensal", "SEMANAL", "diária"]) {
      cleanup();
      vi.clearAllMocks();
      await abrir(orcamento("locacao", tipo));
      salvar();
      await waitFor(() => expect(updateQuote).toHaveBeenCalledTimes(1));
      expect(updateQuote.mock.calls[0][0].items[0].billingType).toBe(tipo);
    }
  });
});
