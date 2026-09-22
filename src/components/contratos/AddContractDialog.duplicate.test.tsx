// Teste de interface (jsdom + Testing Library) do formulário em modo duplicação.
// Prova, sem banco, que abrir o formulário não grava nada, que os campos
// comerciais vêm preenchidos e que o número é o próximo sequencial — não o do
// contrato duplicado.
// Rodar com: npm test

import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AddContractDialog } from "@/components/contratos/AddContractDialog";

// jsdom não implementa o que o Radix usa nos Selects/Dialog.
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

const addContract = vi.fn().mockResolvedValue({ id: "CTR-120" });
const updateContract = vi.fn();
const getSuggestedContractNumber = vi.fn().mockResolvedValue("CTR-120");
const toast = vi.fn();

vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast }) }));

vi.mock("@/store", () => ({
  useStore: () => ({
    clients: [
      { id: "CLI-001", razaoSocial: "Cliente Teste" },
      { id: "CLI-002", razaoSocial: "Outro Cliente" },
    ],
    equipments: [
      { id: "EQP-001", name: "PDA TC60", stock: 10 },
      { id: "EQP-009", name: "Gatilho Scan", stock: 4 },
    ],
    costCenters: [{ id: "CC-1", name: "Centro 1" }],
    chartOfAccounts: [{ id: "PC-1", name: "Plano 1" }],
    bankAccounts: [{ id: "BCO-1", name: "Banco 1" }],
    contracts: [{ id: "CTR-118" }],
    deletedContracts: [{ id: "CTR-100" }],
    addContract,
    updateContract,
    getSuggestedContractNumber,
    addClient: vi.fn(),
  }),
}));

// Contrato de origem com dados comerciais + tudo que não pode ser copiado.
const ORIGINAL = {
  id: "CTR-118",
  clientId: "CLI-001",
  unitOperation: "Unidade Sumaré",
  // Datas locais: o formulário exibe dd/MM/yyyy no fuso da máquina.
  startDate: new Date(2026, 9, 1),
  endDate: new Date(2027, 0, 1),
  firstInstallmentDate: new Date(2026, 10, 1),
  items: [{ equipmentId: "EQP-001", quantity: 2, billingType: "Mensal", unitPrice: 100 }],
  costCenterId: "CC-1",
  chartOfAccountId: "PC-1",
  bankAccountId: "BCO-1",
  status: "Finalizado",
  quoteId: "ORC-010",
  signedContractUrl: "https://exemplo/CTR-118.pdf",
  createdBy: { uid: "outro", email: "outro@t4r.test", name: "Outro" },
};

const numberInput = () => screen.getByTestId("contract-number-input") as HTMLInputElement;

async function renderDuplicating() {
  const onOpenChange = vi.fn();
  render(<AddContractDialog open onOpenChange={onOpenChange} duplicateFrom={ORIGINAL} />);
  await waitFor(() => expect(numberInput().value).toBe("CTR-120"));
  return { onOpenChange };
}

beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  getSuggestedContractNumber.mockResolvedValue("CTR-120");
  addContract.mockResolvedValue({ id: "CTR-120" });
});

describe("3. o formulário abre em modo duplicação, com os campos comerciais preenchidos", () => {
  it("avisa claramente qual contrato está sendo duplicado", async () => {
    await renderDuplicating();

    expect(screen.getByTestId("duplicating-contract-banner")).toHaveTextContent(
      "Duplicando o contrato CTR-118 — revise os dados antes de salvar.",
    );
    expect(screen.getByRole("heading", { name: /Duplicar Contrato/ })).toBeInTheDocument();
  });

  it("preenche cliente, unidade, datas e itens do contrato de origem", async () => {
    await renderDuplicating();

    expect(screen.getByDisplayValue("Unidade Sumaré")).toBeInTheDocument();
    expect(screen.getByText("Cliente Teste")).toBeInTheDocument();
    expect(screen.getByText("PDA TC60")).toBeInTheDocument();
    expect(screen.getByText("01/10/2026")).toBeInTheDocument(); // retirada
    expect(screen.getByText("01/01/2027")).toBeInTheDocument(); // devolução
    expect(screen.getByText("01/11/2026")).toBeInTheDocument(); // 1ª parcela
    expect(screen.getByDisplayValue("2")).toBeInTheDocument(); // quantidade
    // Total recalculado a partir dos itens copiados (2 × 100).
    expect(screen.getByText("R$ 200,00")).toBeInTheDocument();
  });

  it("um formulário de criação normal continua em branco, sem aviso de duplicação", async () => {
    render(<AddContractDialog open onOpenChange={vi.fn()} />);
    await waitFor(() => expect(numberInput().value).toBe("CTR-120"));

    expect(screen.queryByTestId("duplicating-contract-banner")).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("Unidade Sumaré")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Criar Novo Contrato/ })).toBeInTheDocument();
  });
});

describe("4 e 5. número do contrato na duplicação", () => {
  it("4. exibe o próximo sequencial sugerido, e não o número do contrato duplicado", async () => {
    await renderDuplicating();

    expect(getSuggestedContractNumber).toHaveBeenCalled();
    expect(numberInput().value).toBe("CTR-120");
    expect(numberInput().value).not.toBe("CTR-118");
    expect(screen.getByTestId("contract-number-help")).toHaveTextContent("Sugerido automaticamente");
  });

  it("5. o CTR continua editável, com as mesmas validações da criação", async () => {
    await renderDuplicating();
    const input = numberInput();
    expect(input).not.toBeDisabled();

    fireEvent.change(input, { target: { value: "CTR-12A" } });
    expect(screen.getByTestId("contract-number-help")).toHaveTextContent("Número inválido");

    // O número do próprio contrato duplicado é recusado como duplicidade.
    fireEvent.change(input, { target: { value: "118" } });
    expect(screen.getByTestId("contract-number-help")).toHaveTextContent(
      "Já existe um contrato com o número CTR-118.",
    );

    // E o de um contrato na Lixeira também.
    fireEvent.change(input, { target: { value: "ctr-100" } });
    expect(screen.getByTestId("contract-number-help")).toHaveTextContent(
      "Já existe um contrato com o número CTR-100.",
    );

    fireEvent.change(input, { target: { value: "150" } });
    fireEvent.blur(input);
    expect(numberInput().value).toBe("CTR-150");
  });
});

describe("6. abrir e cancelar não grava nada", () => {
  it("abrir o formulário não chama nenhuma criação", async () => {
    await renderDuplicating();
    expect(addContract).not.toHaveBeenCalled();
    expect(updateContract).not.toHaveBeenCalled();
  });

  it("cancelar fecha o formulário sem gravar", async () => {
    const { onOpenChange } = await renderDuplicating();

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(addContract).not.toHaveBeenCalled();
    expect(updateContract).not.toHaveBeenCalled();
  });

  it("número inválido bloqueia o salvamento sem chamar a criação", async () => {
    await renderDuplicating();
    fireEvent.change(numberInput(), { target: { value: "118" } });

    fireEvent.click(screen.getByRole("button", { name: "Gerar Contrato" }));

    await waitFor(() => expect(toast).toHaveBeenCalled());
    expect(addContract).not.toHaveBeenCalled();
  });
});

describe("8. salvar envia uma criação com os dados revisados e a rastreabilidade", () => {
  it("chama a criação com o número sugerido e o contrato de origem", async () => {
    const { onOpenChange } = await renderDuplicating();

    fireEvent.click(screen.getByRole("button", { name: "Gerar Contrato" }));

    await waitFor(() => expect(addContract).toHaveBeenCalledTimes(1));
    const [payload, numbering] = addContract.mock.calls[0];

    expect(numbering).toEqual({
      contractNumber: "CTR-120",
      suggestedId: "CTR-120",
      duplicatedFromContractId: "CTR-118",
    });
    expect(payload).toMatchObject({
      clientId: "CLI-001",
      unitOperation: "Unidade Sumaré",
      status: "Em Andamento",
      totalValue: 200,
      costCenterId: "CC-1",
      chartOfAccountId: "PC-1",
      bankAccountId: "BCO-1",
      items: [{ equipmentId: "EQP-001", quantity: 2, billingType: "Mensal", unitPrice: 100 }],
    });
    // Nada do original que não pode ser copiado vai junto.
    for (const proibido of ["id", "quoteId", "signedContractUrl", "createdBy", "numbering", "finalizedAt"]) {
      expect(payload, `campo proibido enviado: ${proibido}`).not.toHaveProperty(proibido);
    }
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("o número editado à mão é o que vai para a criação", async () => {
    await renderDuplicating();
    fireEvent.change(numberInput(), { target: { value: "CTR-150" } });

    fireEvent.click(screen.getByRole("button", { name: "Gerar Contrato" }));

    await waitFor(() => expect(addContract).toHaveBeenCalledTimes(1));
    expect(addContract.mock.calls[0][1]).toMatchObject({
      contractNumber: "CTR-150",
      suggestedId: "CTR-120",
      duplicatedFromContractId: "CTR-118",
    });
  });
});

describe("a duplicação não vaza para a criação normal seguinte", () => {
  it("fechar a duplicação e abrir um novo contrato deixa o formulário limpo", async () => {
    // Mesma instância do formulário passando de duplicação para criação normal:
    // se algum estado sobrevivesse, apareceria aqui.
    const { rerender } = render(<AddContractDialog open onOpenChange={vi.fn()} duplicateFrom={ORIGINAL} />);
    await waitFor(() => expect(numberInput().value).toBe("CTR-120"));
    expect(screen.getByDisplayValue("Unidade Sumaré")).toBeInTheDocument();

    getSuggestedContractNumber.mockResolvedValue("CTR-121");
    rerender(<AddContractDialog open onOpenChange={vi.fn()} />);

    // Sem aviso, sem título de duplicação e sem nenhum dado do contrato anterior.
    await waitFor(() => expect(screen.queryByTestId("duplicating-contract-banner")).not.toBeInTheDocument());
    expect(screen.getByRole("heading", { name: /Criar Novo Contrato/ })).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Unidade Sumaré")).not.toBeInTheDocument();
    expect(screen.queryByText("Cliente Teste")).not.toBeInTheDocument();
    expect(screen.queryByText("PDA TC60")).not.toBeInTheDocument();
    expect(screen.getAllByText("Escolha uma data")).toHaveLength(3);
    expect(screen.getByText("R$ 0,00")).toBeInTheDocument();
  });

  it("duplicar outro contrato depois usa o novo original, não o anterior", async () => {
    const { rerender } = render(<AddContractDialog open onOpenChange={vi.fn()} duplicateFrom={ORIGINAL} />);
    await waitFor(() => expect(numberInput().value).toBe("CTR-120"));
    expect(screen.getByTestId("duplicating-contract-banner")).toHaveTextContent("CTR-118");

    // Fecha, volta ao formulário normal e duplica OUTRO contrato.
    rerender(<AddContractDialog open onOpenChange={vi.fn()} />);
    await waitFor(() => expect(screen.queryByTestId("duplicating-contract-banner")).not.toBeInTheDocument());

    const outro = {
      id: "CTR-003",
      clientId: "CLI-002",
      unitOperation: "Outra unidade",
      startDate: new Date(2026, 9, 1),
      endDate: new Date(2027, 0, 1),
      items: [{ equipmentId: "EQP-009", quantity: 4, billingType: "Mensal", unitPrice: 25 }],
    };
    rerender(<AddContractDialog open onOpenChange={vi.fn()} duplicateFrom={outro} />);

    await waitFor(() =>
      expect(screen.getByTestId("duplicating-contract-banner")).toHaveTextContent("Duplicando o contrato CTR-003"),
    );
    // Nada do primeiro contrato sobreviveu.
    expect(screen.queryByDisplayValue("Unidade Sumaré")).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("Outra unidade")).toBeInTheDocument();
    expect(screen.getByText("Gatilho Scan")).toBeInTheDocument();
    expect(screen.queryByText("PDA TC60")).not.toBeInTheDocument();

    // E o salvamento leva o contrato de origem CORRETO.
    fireEvent.click(screen.getByRole("button", { name: "Gerar Contrato" }));
    await waitFor(() => expect(addContract).toHaveBeenCalledTimes(1));
    expect(addContract.mock.calls[0][1].duplicatedFromContractId).toBe("CTR-003");
    expect(addContract.mock.calls[0][0].unitOperation).toBe("Outra unidade");
  });
});

describe("o modo de edição antigo continua como era", () => {
  it("edição preenche pelo contrato, sem campo de número e sem aviso de duplicação", async () => {
    render(<AddContractDialog open onOpenChange={vi.fn()} contract={ORIGINAL} />);

    await waitFor(() => expect(screen.getByDisplayValue("Unidade Sumaré")).toBeInTheDocument());
    expect(screen.getByRole("heading", { name: /Editar Contrato/ })).toBeInTheDocument();
    expect(screen.queryByTestId("duplicating-contract-banner")).not.toBeInTheDocument();
    // O número do contrato não é escolhido na edição: o campo nem existe.
    expect(screen.queryByTestId("contract-number-input")).not.toBeInTheDocument();
    expect(getSuggestedContractNumber).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Salvar Alterações" })).toBeInTheDocument();
  });

  it("salvar uma edição chama updateContract com o ID do próprio contrato", async () => {
    render(<AddContractDialog open onOpenChange={vi.fn()} contract={ORIGINAL} />);
    await waitFor(() => expect(screen.getByDisplayValue("Unidade Sumaré")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Salvar Alterações" }));

    await waitFor(() => expect(updateContract).toHaveBeenCalledTimes(1));
    expect(updateContract.mock.calls[0][0]).toMatchObject({ id: "CTR-118", unitOperation: "Unidade Sumaré" });
    expect(addContract).not.toHaveBeenCalled();
  });
});

describe("15. contrato antigo, sem os campos novos", () => {
  it("duplicar um contrato legado abre o formulário sem quebrar", async () => {
    render(
      <AddContractDialog
        open
        onOpenChange={vi.fn()}
        duplicateFrom={{ id: "CTR-003", clientId: "CLI-002", items: [{ equipmentId: "EQP-009", quantity: 1 }] }}
      />,
    );
    await waitFor(() => expect(numberInput().value).toBe("CTR-120"));

    expect(screen.getByTestId("duplicating-contract-banner")).toHaveTextContent("Duplicando o contrato CTR-003");
    expect(screen.getByText("Outro Cliente")).toBeInTheDocument();
    expect(screen.getByText("Gatilho Scan")).toBeInTheDocument();
    // Sem datas no original, o usuário precisa informá-las: nada é inventado.
    expect(screen.getAllByText("Escolha uma data")).toHaveLength(3);
  });
});
