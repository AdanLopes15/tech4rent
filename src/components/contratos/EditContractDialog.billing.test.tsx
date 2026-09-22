// Testes de interface (jsdom + Testing Library) do tipo de cobrança no
// EditContractDialog: esta tela NÃO tem select de cobrança e usa o vocabulário
// interno em minúsculas para escolher a tarifa do equipamento. O valor
// canônico entra ao carregar e volta a ser canônico ao gravar (no store).
// Rodar com: npm test

import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { EditContractDialog } from "@/components/contratos/EditContractDialog";

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

const updateContract = vi.fn().mockResolvedValue(undefined);
const toast = vi.fn();

vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast }) }));

// Tarifas bem diferentes entre si: qualquer troca errada fica evidente.
vi.mock("@/store", () => ({
  useStore: () => ({
    clients: [{ id: "CLI-001", razaoSocial: "Cliente Teste" }],
    equipments: [
      { id: "EQP-001", name: "PDA TC60", stock: 10, dailyRate: 11, weeklyRate: 55, monthlyRate: 235 },
      { id: "EQP-009", name: "Gatilho Scan", stock: 4, dailyRate: 7, weeklyRate: 35, monthlyRate: 140 },
    ],
    updateContract,
  }),
}));

const contrato = (billingType: unknown) => ({
  id: "CTR-004",
  clientId: "CLI-001",
  client: { id: "CLI-001", razaoSocial: "Cliente Teste" },
  unitOperation: "Unidade Sumaré",
  status: "Em Andamento",
  startDate: new Date(2026, 9, 1),
  endDate: new Date(2027, 0, 1),
  items: [{ id: 1, equipmentId: "EQP-001", quantity: 30, billingType, unitPrice: 235 }],
  totalValue: 7050,
});

/** Troca o equipamento do item, que é o que dispara o cálculo da tarifa. */
async function trocarEquipamento(nome: string) {
  const combos = screen.getAllByRole("combobox");
  fireEvent.click(combos[combos.length - 1]);
  const opcao = await screen.findByRole("option", { name: new RegExp(nome) });
  fireEvent.click(opcao);
}

// A mascara usa espaco nao-quebravel entre "R$" e o numero (U+00A0).
const NBSP = String.fromCharCode(160);
const precoUnitario = () =>
  (screen.getByPlaceholderText("R$ 0,00") as HTMLInputElement).value.split(NBSP).join(" ");

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  updateContract.mockResolvedValue(undefined);
});

describe("5. carrega contratos com 'mensal' e com 'Mensal'", () => {
  it.each([
    ["legado minúsculo", "mensal"],
    ["canônico do banco", "Mensal"],
  ])("contrato %s abre com os dados do item intactos", async (_rotulo, billingType) => {
    render(<EditContractDialog open onOpenChange={vi.fn()} contract={contrato(billingType)} />);

    await waitFor(() => expect(screen.getByDisplayValue("30")).toBeInTheDocument());
    expect(precoUnitario()).toBe("R$ 235,0000");
    expect(screen.getByDisplayValue("Unidade Sumaré")).toBeInTheDocument();
    // Esta tela não oferece escolha de cobrança ao usuário.
    expect(screen.queryByRole("option", { name: "Mensal" })).not.toBeInTheDocument();
  });
});

describe("6. a tarifa escolhida continua correta", () => {
  // O item começa no EQP-001 (R$ 235). Trocar para o EQP-009 dispara o cálculo,
  // e a tarifa escolhida revela qual ramo do switch rodou:
  // dailyRate 7 | weeklyRate 35 | monthlyRate 140. Se caísse no default, seria 0.
  it.each([
    ["Mensal", 140],
    ["mensal", 140],
    ["Semanal", 35],
    ["semanal", 35],
    ["Diário", 7],
    ["diario", 7],
    ["diaria", 7],
    ["diária", 7],
    ["DIÁRIA", 7],
  ])("contrato com '%s' pega a tarifa %s do novo equipamento", async (billingType, esperado) => {
    render(<EditContractDialog open onOpenChange={vi.fn()} contract={contrato(billingType)} />);
    await waitFor(() => expect(screen.getByDisplayValue("30")).toBeInTheDocument());

    await trocarEquipamento("Gatilho Scan");

    await waitFor(() => expect(precoUnitario()).toBe(`R$ ${esperado},0000`));
  });

  it("um tipo desconhecido continua caindo no padrão de antes (preço zerado)", async () => {
    render(<EditContractDialog open onOpenChange={vi.fn()} contract={contrato("quinzenal")} />);
    await waitFor(() => expect(screen.getByDisplayValue("30")).toBeInTheDocument());

    await trocarEquipamento("Gatilho Scan");

    await waitFor(() => expect(precoUnitario()).toBe("R$ 0,0000"));
  });
});

describe("7 e 8. o que a tela entrega para gravação", () => {
  it("mantém o vocabulário interno no estado, deixando a canonização para o store", async () => {
    render(<EditContractDialog open onOpenChange={vi.fn()} contract={contrato("Mensal")} />);
    await waitFor(() => expect(screen.getByDisplayValue("30")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Salvar Alterações" }));

    await waitFor(() => expect(updateContract).toHaveBeenCalledTimes(1));
    const payload = updateContract.mock.calls[0][0];
    expect(payload.id).toBe("CTR-004");
    // Internamente continua minúsculo — é assim que a tarifa é escolhida.
    // (A gravação canônica é garantida no store e coberta pelos testes do Emulator.)
    expect(payload.items[0].billingType).toBe("mensal");
    expect(payload.items[0]).toMatchObject({ equipmentId: "EQP-001", quantity: 30, unitPrice: 235 });
  });

  it("8. um tipo desconhecido não é convertido nem descartado", async () => {
    render(<EditContractDialog open onOpenChange={vi.fn()} contract={contrato("quinzenal")} />);
    await waitFor(() => expect(screen.getByDisplayValue("30")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Salvar Alterações" }));

    await waitFor(() => expect(updateContract).toHaveBeenCalledTimes(1));
    expect(updateContract.mock.calls[0][0].items[0].billingType).toBe("quinzenal");
  });

  it("item sem tipo cai no padrão interno da tela, como antes", async () => {
    render(<EditContractDialog open onOpenChange={vi.fn()} contract={contrato(undefined)} />);
    await waitFor(() => expect(screen.getByDisplayValue("30")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Salvar Alterações" }));

    await waitFor(() => expect(updateContract).toHaveBeenCalledTimes(1));
    expect(updateContract.mock.calls[0][0].items[0].billingType).toBe("mensal");
  });

  it("cancelar não grava nada", async () => {
    const onOpenChange = vi.fn();
    render(<EditContractDialog open onOpenChange={onOpenChange} contract={contrato("mensal")} />);
    await waitFor(() => expect(screen.getByDisplayValue("30")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(updateContract).not.toHaveBeenCalled();
  });
});
