//src/pages/admin/Contratos.tsx

import React, { useMemo, useRef, useState } from "react";
import { format, compareAsc } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

import { useStore } from "@/store";
import { CompanyLogo } from "@/components/admin/CompanyLogo";
import { useToast } from "@/hooks/use-toast";
import { cn, formatCurrency } from "@/lib/utils";
import { DocumentItemRow } from "@/components/admin/operacional/documents";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  CalendarIcon,
  PlusCircle,
  MoreHorizontal,
  RefreshCw,
  ChevronUp,
  FileText,
  Receipt,
  Pencil,
  Upload,
  Trash2,
  FileCheck,
  Download,
  Link as LinkIcon,
  Truck,
  Printer,
} from "lucide-react";

import { AddContractDialog } from "@/components/contratos/AddContractDialog";
import { ViewContractDialog } from "@/components/contratos/ViewContractDialog";
import { EditContractDialog } from "@/components/contratos/EditContractDialog";
import { DeliveryReceiptDialog } from "@/components/contratos/DeliveryReceiptDialog";
import { FinalizeContractDialog } from "@/components/contratos/FinalizeContractDialog";
import { RentalInvoiceDialog } from "@/components/contratos/RentalInvoiceDialog";
import { AttachSignedContractDialog } from "@/components/contratos/AttachSignedContractDialog";

const statusColors: Record<string, string> = {
  "Em Andamento": "bg-blue-600 hover:bg-blue-700 text-white",
  Finalizado: "bg-green-600 hover:bg-green-700 text-white",
  Cancelado: "bg-muted text-muted-foreground",
};

const safeToDate = (dateInput: any): Date | null => {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return dateInput;

  if (typeof dateInput === "string" || typeof dateInput === "number") {
    const d = new Date(dateInput);
    if (!isNaN(d.getTime())) return d;
  }

  if (dateInput?.seconds) {
    const d = new Date(dateInput.seconds * 1000);
    if (!isNaN(d.getTime())) return d;
  }

  if (typeof dateInput?.toDate === "function") {
    const d = dateInput.toDate();
    if (!isNaN(d.getTime())) return d;
  }

  return null;
};

const formatDatePt = (dateInput: any, dateFormat = "dd/MM/yyyy") => {
  const d = safeToDate(dateInput);
  if (!d) return "—";

  try {
    return format(d, dateFormat, { locale: ptBR });
  } catch {
    return "—";
  }
};

const findCurrentInstallment = (allInstallments: any[]) => {
  if (!allInstallments?.length) return null;

  const sorted = allInstallments
    .map((inst) => ({
      ...inst,
      dueDateObj: safeToDate(inst.dueDate),
    }))
    .filter((inst) => inst.dueDateObj)
    .sort((a, b) => compareAsc(a.dueDateObj!, b.dueDateObj!));

  const firstPending = sorted.find((inst) => inst.status !== "recebido");
  if (firstPending) return firstPending;

  return sorted[sorted.length - 1] || null;
};

function RentalInvoicePrintable({
  contract,
  companySettings,
  equipments,
  revenues,
}: {
  contract: any;
  companySettings: any;
  equipments: any[];
  revenues: any[];
}) {
  if (!contract) return null;

  const allInstallments = revenues.filter((r) => r.contractId === contract.id);
  const currentInstallment = findCurrentInstallment(allInstallments);

  if (!currentInstallment) {
    return (
      <div className="p-6 bg-white text-black">
        <h2 className="text-lg font-bold">Fatura não encontrada</h2>
        <p className="text-sm text-gray-500">Nenhuma fatura foi encontrada para este contrato.</p>
      </div>
    );
  }

  const sortedInstallments = allInstallments
    .map((inst) => ({
      ...inst,
      dueDateObj: safeToDate(inst.dueDate),
    }))
    .filter((inst) => inst.dueDateObj)
    .sort((a, b) => compareAsc(a.dueDateObj!, b.dueDateObj!));

  const currentInstallmentNumber = sortedInstallments.findIndex((r) => r.id === currentInstallment.id) + 1;
  const totalInstallments = sortedInstallments.length;

  const getEquipmentDetails = (equipmentId: string) => equipments.find((eq: any) => eq.id === equipmentId);

  return (
    <div className="p-6 bg-white text-black">
      <header className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <CompanyLogo 
            isDark={false} 
            className="h-20 w-20" 
          />

          <div>
            <h1 className="text-2xl font-bold">{companySettings?.fantasyName || companySettings?.name}</h1>
            <p className="text-sm text-gray-500">CNPJ: {companySettings?.cnpj}</p>
          </div>
        </div>

        <div className="text-right">
          <h2 className="text-xl font-bold">FATURA DE LOCAÇÃO</h2>
          <p className="text-sm text-gray-500">Contrato: {contract.id}</p>
          <p className="text-sm text-gray-500">
            Fatura: {currentInstallmentNumber} / {totalInstallments}
          </p>
          <p className="text-sm text-gray-500">Vencimento: {formatDatePt(currentInstallment.dueDate)}</p>
        </div>
      </header>

      <div className="my-6 border-t border-gray-200" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="font-semibold text-lg mb-2">LOCADOR</h3>
          <p className="font-bold">{companySettings?.name}</p>
          <p>CNPJ: {companySettings?.cnpj}</p>
          <p>
            {companySettings?.address?.logradouro}, {companySettings?.address?.numero}
          </p>
          <p>
            {companySettings?.address?.bairro}, {companySettings?.address?.localidade} - {companySettings?.address?.uf}
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-2">LOCATÁRIO</h3>
          <p className="font-bold">{contract?.client?.razaoSocial}</p>
          <p>Documento: {contract?.client?.cnpj || contract?.client?.cpf}</p>
          <p>
            {contract?.client?.address?.street}, {contract?.client?.address?.number}
          </p>
          <p>
            {contract?.client?.address?.neighborhood}, {contract?.client?.address?.city} -{" "}
            {contract?.client?.address?.state}
          </p>
        </div>
      </div>

      <section className="mb-8">
        <h3 className="font-bold text-lg mb-2 uppercase">Itens da Locação</h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left p-2 font-semibold">Equipamento</th>
                <th className="text-center p-2 font-semibold">Qtd.</th>
                <th className="text-right p-2 font-semibold">Vl. Unit.</th>
                <th className="text-right p-2 font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {contract.items?.map((item: any, index: number) => {
                const equipment = getEquipmentDetails(item.equipmentId);
                const itemTotal = item.quantity * item.unitPrice;

                return (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="p-2 align-top">
                      <DocumentItemRow item={item} equipments={equipments} />
                    </td>
                    <td className="p-2 text-center align-top">{item.quantity}</td>
                    <td className="p-2 text-right align-top">{formatCurrency(item.unitPrice)}</td>
                    <td className="p-2 text-right align-top font-bold">{formatCurrency(itemTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="font-bold text-lg">
                <td colSpan={3} className="text-right p-2 border-t-2">
                  Valor da Fatura
                </td>
                <td className="text-right p-2 border-t-2">{formatCurrency(currentInstallment.valorTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <div className="my-6 border-t border-gray-200" />

      <div className="mb-8">
        <h3 className="font-bold text-lg mb-2 uppercase">Termos e Condições</h3>
        <p className="text-sm text-gray-500">
          Período de referência da locação: {formatDatePt(contract.startDate)} a {formatDatePt(contract.endDate)}.
        </p>

        <h4 className="font-semibold mt-4">Informações Adicionais:</h4>
        <div className="space-y-1 text-sm text-gray-500">
          <p>Não é fato gerador do ISSQN a locação de bens móveis.</p>
          <p>Dispensado da emissão de notas fiscais. Conforme Lei Complementar 116 de 31/07/2003.</p>
          <p>Natureza da operação: Locação de Bens Móveis sem fornecimento de mão de obra.</p>
        </div>

        <p className="text-xs text-center font-bold text-gray-500 mt-4">
          Válido como recibo a partir da quitação do boleto correspondente.
        </p>
      </div>

      <div className="text-center mt-16">
        <p className="text-sm">
          {companySettings?.address?.localidade}, {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>
    </div>
  );
}

export default function Contratos() {
  const {
    contracts,
    clients,
    revenues,
    deleteContract,
    deleteSignedContract,
    recalculateContractInstallments,
    companySettings,
    equipments,
  } = useStore();

  const { toast } = useToast();

  const [date, setDate] = useState<DateRange | undefined>();
  const [clientFilter, setClientFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");

  const [locacaoOpen, setLocacaoOpen] = useState(true);

  const [isNewContractDialogOpen, setIsNewContractDialogOpen] = useState(false);
  const [isViewContractDialogOpen, setIsViewContractDialogOpen] = useState(false);
  const [isEditContractDialogOpen, setIsEditContractDialogOpen] = useState(false);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [isFinalizeDialogOpen, setIsFinalizeDialogOpen] = useState(false);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [isAttachDialogOpen, setIsAttachDialogOpen] = useState(false);

  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  const bulkPrintableRef = useRef<HTMLDivElement | null>(null);

  const filteredContracts = useMemo(() => {
    return contracts.filter((contract: any) => {
      const matchesClient = clientFilter === "todos" || contract.clientId === clientFilter;

      const matchesStatus = statusFilter === "todos" || contract.status === statusFilter;

      let matchesDate = true;

      if (date?.from || date?.to) {
        const endDate = safeToDate(contract.endDate);

        if (endDate) {
          if (date.from && endDate < date.from) matchesDate = false;

          if (date.to) {
            const endOfDay = new Date(date.to);
            endOfDay.setHours(23, 59, 59, 999);
            if (endDate > endOfDay) matchesDate = false;
          }
        }
      }

      return matchesClient && matchesStatus && matchesDate;
    });
  }, [contracts, clientFilter, statusFilter, date]);

  const selectedCount = useMemo(() => Object.values(selectedIds).filter(Boolean).length, [selectedIds]);

  const selectedContracts = useMemo(() => {
    const ids = new Set(
      Object.entries(selectedIds)
        .filter(([, value]) => value)
        .map(([id]) => id),
    );

    return filteredContracts.filter((contract: any) => ids.has(contract.id));
  }, [filteredContracts, selectedIds]);

  const allSelectableIds = useMemo(() => filteredContracts.map((contract: any) => contract.id), [filteredContracts]);

  const allSelected = useMemo(() => {
    if (allSelectableIds.length === 0) return false;
    return allSelectableIds.every((id) => selectedIds[id]);
  }, [allSelectableIds, selectedIds]);

  const handleOpenDialog = (setter: React.Dispatch<React.SetStateAction<boolean>>, contract: any) => {
    setSelectedContract(contract);
    setter(true);
  };

  const handleDeleteContract = async (contractId: string) => {
    try {
      await deleteContract(contractId);

      toast({
        title: "Contrato excluído com sucesso!",
      });

      setSelectedIds((prev) => {
        const next = { ...prev };
        delete next[contractId];
        return next;
      });
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error?.message || "Não foi possível excluir o contrato.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSigned = async (contractId: string) => {
    try {
      await deleteSignedContract(contractId);
      toast({ title: "Anexo removido com sucesso!" });
    } catch (error: any) {
      toast({
        title: "Erro ao remover anexo",
        description: error?.message || "Não foi possível remover o anexo.",
        variant: "destructive",
      });
    }
  };

  const handleRecalculateInstallments = async (contractId: string) => {
    try {
      await recalculateContractInstallments(contractId);
      toast({
        title: "Sucesso!",
        description: "As parcelas do contrato foram recalculadas.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao recalcular",
        description: error?.message || "Não foi possível recalcular.",
        variant: "destructive",
      });
    }
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds({});
      return;
    }

    const next: Record<string, boolean> = {};
    for (const id of allSelectableIds) next[id] = true;
    setSelectedIds(next);
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handlePrintBulk = async () => {
    if (selectedContracts.length === 0) {
      toast({
        title: "Seleção vazia",
        description: "Selecione pelo menos 1 contrato para gerar as faturas.",
        variant: "destructive",
      });
      return;
    }

    const container = bulkPrintableRef.current;
    if (!container) {
      toast({
        title: "Erro",
        description: "Não foi possível preparar as faturas para impressão.",
        variant: "destructive",
      });
      return;
    }

    const pages = Array.from(container.querySelectorAll("[data-bulk-page='true']"))
      .map((el) => (el as HTMLElement).innerHTML)
      .join("");

    const printWindow = window.open("", "", "height=900,width=900");

    if (!printWindow) {
      toast({
        title: "Pop-up bloqueado",
        description: "Permita pop-ups para gerar o PDF.",
        variant: "destructive",
      });
      return;
    }

    const headLinksAndStyles = Array.from(document.querySelectorAll("link[rel='stylesheet'], style"))
      .map((node) => node.outerHTML)
      .join("\n");

    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>Faturas de Locação</title>
          ${headLinksAndStyles}
          <style>
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .bulk-page {
                page-break-after: always;
              }
              .bulk-page:last-child {
                page-break-after: auto;
              }
            }
            body {
              margin: 0;
              padding: 0;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${pages}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();

    const images = Array.from(printWindow.document.images);
    await Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) return resolve();
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }),
      ),
    );

    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const getClientName = (clientId: string) => {
    const client = clients.find((c: any) => c.id === clientId);
    return client?.razaoSocial || client?.name || "N/A";
  };

  const getInstallmentsInfo = (contractId: string) => {
    const contractRevenues = revenues
      .filter((r: any) => r.contractId === contractId)
      .sort((a: any, b: any) => {
        const dateA = safeToDate(a.dueDate);
        const dateB = safeToDate(b.dueDate);
        if (!dateA || !dateB) return 0;
        return compareAsc(dateA, dateB);
      });

    const total = contractRevenues.length;
    const paid = contractRevenues.filter((r: any) => r.status === "recebido").length;

    return { paid, total };
  };

  const getMonthlyValue = (contract: any) => {
    return contract.items?.reduce((acc: number, item: any) => acc + item.quantity * item.unitPrice, 0) || 0;
  };

  const getTotalItems = (contract: any) => {
    return contract.items?.reduce((acc: number, item: any) => acc + (item.quantity || 0), 0) || 0;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="hidden">
        <div ref={bulkPrintableRef}>
          {selectedContracts.map((contract: any) => (
            <div key={contract.id} data-bulk-page="true" className="bulk-page" style={{ background: "white" }}>
              <RentalInvoicePrintable
                contract={contract}
                companySettings={companySettings}
                equipments={equipments}
                revenues={revenues}
              />
            </div>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Filtros de Contratos</CardTitle>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={selectedCount === 0} onClick={handlePrintBulk}>
              <Printer className="mr-2 h-4 w-4" />
              Gerar faturas (PDF)
              {selectedCount > 0 ? ` • ${selectedCount}` : ""}
            </Button>

            <Button size="sm" onClick={() => setIsNewContractDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Contrato
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Período de Vencimento</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !date?.from && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from
                      ? date.to
                        ? `${format(date.from, "dd/MM/yyyy")} - ${format(date.to, "dd/MM/yyyy")}`
                        : format(date.from, "dd/MM/yyyy")
                      : "Selecione"}
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="range" selected={date} onSelect={setDate} numberOfMonths={2} />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Cliente</label>
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os Clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Clientes</SelectItem>
                  {clients.map((client: any) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.razaoSocial || client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                  <SelectItem value="Finalizado">Finalizado</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Collapsible open={locacaoOpen} onOpenChange={setLocacaoOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Contratos de Locação</CardTitle>

              <div className="flex items-center gap-2">
                {selectedCount > 0 && (
                  <Badge className="bg-primary text-primary-foreground">{selectedCount} selecionado(s)</Badge>
                )}
                <ChevronUp className={cn("h-5 w-5 transition-transform", !locacaoOpen && "rotate-180")} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={filteredContracts.length > 0 && allSelected}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="text-primary">Contrato</TableHead>
                    <TableHead className="text-primary">Cliente</TableHead>
                    <TableHead className="text-primary">Itens</TableHead>
                    <TableHead className="text-primary">Parcelas</TableHead>
                    <TableHead className="text-primary">Vencimento Final</TableHead>
                    <TableHead className="text-primary">Valores (Mensal / Total)</TableHead>
                    <TableHead className="text-primary">Status</TableHead>
                    <TableHead className="text-right text-primary">Ações</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredContracts.length > 0 ? (
                    filteredContracts.map((contract: any) => {
                      const installments = getInstallmentsInfo(contract.id);
                      const monthlyValue = getMonthlyValue(contract);
                      const totalItems = getTotalItems(contract);

                      return (
                        <TableRow key={contract.id}>
                          <TableCell>
                            <Checkbox
                              checked={!!selectedIds[contract.id]}
                              onCheckedChange={() => toggleOne(contract.id)}
                            />
                          </TableCell>

                          <TableCell className="font-medium text-primary">{contract.id}</TableCell>

                          <TableCell>{getClientName(contract.clientId)}</TableCell>

                          <TableCell>{totalItems}</TableCell>

                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {installments.paid}/{installments.total}
                            </Badge>
                          </TableCell>

                          <TableCell>{formatDatePt(contract.endDate)}</TableCell>

                          <TableCell>
                            <div>
                              <span className="font-semibold">{formatCurrency(monthlyValue)}</span>
                              <br />
                              <span className="text-xs text-muted-foreground">
                                Total: {formatCurrency(contract.totalValue || 0)}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge className={statusColors[contract.status] || "bg-muted"}>
                              {contract.status || "Em Andamento"}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>

                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleOpenDialog(setIsViewContractDialogOpen, contract)}
                                >
                                  <FileText className="mr-2 h-4 w-4" />
                                  Ver Detalhes
                                </DropdownMenuItem>

                                <DropdownMenuItem onClick={() => handleOpenDialog(setIsInvoiceDialogOpen, contract)}>
                                  <Receipt className="mr-2 h-4 w-4" />
                                  Fatura de Locação
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => handleOpenDialog(setIsEditContractDialogOpen, contract)}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>

                                <DropdownMenuItem onClick={() => handleRecalculateInstallments(contract.id)}>
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  Recalcular Parcelas
                                </DropdownMenuItem>

                                <DropdownMenuItem onClick={() => handleOpenDialog(setIsReceiptDialogOpen, contract)}>
                                  <Truck className="mr-2 h-4 w-4" />
                                  Recibo de Entrega
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem onClick={() => handleOpenDialog(setIsAttachDialogOpen, contract)}>
                                  <Upload className="mr-2 h-4 w-4" />
                                  Anexar Contrato
                                </DropdownMenuItem>

                                {contract.signedContractUrl && (
                                  <>
                                    <DropdownMenuItem onClick={() => window.open(contract.signedContractUrl, "_blank")}>
                                      <LinkIcon className="mr-2 h-4 w-4" />
                                      Ver Contrato Assinado
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() => handleDeleteSigned(contract.id)}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Excluir Anexo
                                    </DropdownMenuItem>
                                  </>
                                )}

                                <DropdownMenuSeparator />

                                {contract.status === "Em Andamento" && (
                                  <DropdownMenuItem onClick={() => handleOpenDialog(setIsFinalizeDialogOpen, contract)}>
                                    <FileCheck className="mr-2 h-4 w-4" />
                                    Finalizar Contrato
                                  </DropdownMenuItem>
                                )}

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Excluir
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>

                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Você realmente deseja excluir?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Essa ação não pode ser desfeita. Isso excluirá permanentemente o contrato e
                                        todas as suas faturas associadas.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>

                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteContract(contract.id)}>
                                        Confirmar Exclusão
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground h-20">
                        Nenhum contrato encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <AddContractDialog open={isNewContractDialogOpen} onOpenChange={setIsNewContractDialogOpen} />

      {selectedContract && (
        <>
          <ViewContractDialog
            open={isViewContractDialogOpen}
            onOpenChange={setIsViewContractDialogOpen}
            contract={selectedContract}
          />

          <EditContractDialog
            open={isEditContractDialogOpen}
            onOpenChange={setIsEditContractDialogOpen}
            contract={selectedContract}
          />

          <DeliveryReceiptDialog
            open={isReceiptDialogOpen}
            onOpenChange={setIsReceiptDialogOpen}
            contract={selectedContract}
          />

          <FinalizeContractDialog
            open={isFinalizeDialogOpen}
            onOpenChange={setIsFinalizeDialogOpen}
            contract={selectedContract}
          />

          <RentalInvoiceDialog
            open={isInvoiceDialogOpen}
            onOpenChange={setIsInvoiceDialogOpen}
            contract={selectedContract}
          />

          <AttachSignedContractDialog
            open={isAttachDialogOpen}
            onOpenChange={setIsAttachDialogOpen}
            contract={selectedContract}
          />
        </>
      )}
    </div>
  );
}
