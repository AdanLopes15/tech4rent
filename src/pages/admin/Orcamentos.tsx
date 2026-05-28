//src/pages/admin/Orcamentos.tsx

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { format } from "date-fns";
import { useStore } from "@/store";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, cn } from "@/lib/utils";
import { generateQuotePDF } from "@/lib/pdf-utils";
import { 
  DocumentContainer, 
  DocumentHeader, 
  DocumentSection, 
  DocumentTable, 
  DocumentSummary, 
  SignatureBlock, 
  DocumentFooter 
} from "@/components/admin/operacional/documents";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import {
  PlusCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  FileCheck,
  ShoppingCart,
  RefreshCw,
  ChevronUp,
  CalendarIcon,
  FileDown,
} from "lucide-react";

import { AddQuoteDialog } from "@/components/orcamentos/AddQuoteDialog";

const statusColors: Record<string, string> = {
  Pendente: "bg-amber-400 hover:bg-amber-500 text-white",
  Aprovado: "bg-green-600 hover:bg-green-700 text-white",
  Reprovado: "bg-red-600 hover:bg-red-700 text-white",
  Recusado: "bg-red-600 hover:bg-red-700 text-white",
  Cancelado: "bg-muted text-muted-foreground",
};

export default function Orcamentos() {
  const { quotes, clients, loading, fetchAllData, deleteQuote, updateQuote, convertQuoteToContract, addSale } = useStore();

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const { toast } = useToast();
  const quotePrintRef = useRef<HTMLDivElement>(null);
  const contractPrintRef = useRef<HTMLDivElement>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<any>(null);
  const [viewingQuote, setViewingQuote] = useState<any>(null);
  const [quoteForDownload, setQuoteForDownload] = useState<any>(null);
  const [quoteForApproval, setQuoteForApproval] = useState<any>(null);
  const [isContractGenerated, setIsContractGenerated] = useState(false);

  const [clientFilter, setClientFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  const [locacaoOpen, setLocacaoOpen] = useState(true);
  const [vendaOpen, setVendaOpen] = useState(true);

  const handlePrintDocument = (ref: React.RefObject<HTMLDivElement>) => {
    if (!ref.current) return;

    const content = ref.current.innerHTML;
    const printWindow = window.open("", "_blank");

    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Tech4Rent - Documento</title>
            <style>
              body { font-family: sans-serif; padding: 20px; color: #333; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
              th { background-color: #f4f4f4; }
              .text-primary { color: #f97316; }
              .font-bold { font-weight: bold; }
              .uppercase { text-transform: uppercase; }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
              .text-xs { font-size: 10px; }
              .text-sm { font-size: 12px; }
              .text-lg { font-size: 18px; }
              .border-b { border-bottom: 1px solid #eee; }
              .pb-4 { padding-bottom: 16px; }
              .pt-4 { padding-top: 16px; }
              .mb-6 { margin-bottom: 24px; }
              .mt-10 { margin-top: 40px; }
              .flex { display: flex; }
              .justify-between { justify-content: space-between; }
              .items-start { align-items: flex-start; }
              .grid { display: grid; }
              .grid-cols-2 { grid-template-columns: 1fr 1fr; }
              .gap-6 { gap: 24px; }
              .border { border: 1px solid #ddd; }
              .rounded-md { border-radius: 4px; }
              .p-4 { padding: 16px; }
              .p-6 { padding: 24px; }
              .bg-zinc-50 { background-color: #fafafa; }
              .shadow-inner { box-shadow: inset 0 2px 4px 0 rgba(0,0,0,0.06); }
              .font-serif { font-family: serif; }
              .leading-relaxed { line-height: 1.625; }
              .italic { font-style: italic; }
              .border-l-4 { border-left-width: 4px; }
              .border-zinc-300 { border-color: #d4d4d8; }
              .pl-4 { padding-left: 16px; }
              .w-48 { width: 12rem; }
              @media print {
                body { padding: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            ${content}
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() { window.close(); };
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const normalizeStatus = (status?: string) => {
    if (!status) return "Pendente";
    if (status === "Recusado") return "Reprovado";
    return status;
  };

  const formatDate = (date: any) => {
    if (!date) return "—";

    try {
      const parsed = typeof date?.toDate === "function" ? date.toDate() : new Date(date);

      if (isNaN(parsed.getTime())) return "—";

      return format(parsed, "dd/MM/yyyy");
    } catch {
      return "—";
    }
  };

  const getClientName = (clientId: string, fallbackName?: string) => {
    const client = clients.find((c: any) => c.id === clientId);
    return client?.razaoSocial || client?.name || fallbackName || "N/A";
  };

  const filteredQuotes = useMemo(() => {
    if (!quotes || !Array.isArray(quotes)) return [];

    return quotes.filter((quote: any) => {
      // 1. Status Filter
      const normalizedQuoteStatus = normalizeStatus(quote.status);
      const matchesStatus = statusFilter === "todos" || normalizedQuoteStatus === statusFilter;
      if (!matchesStatus) return false;

      // 2. Client Filter
      const matchesClient = clientFilter === "todos" || quote.clientId === clientFilter;
      if (!matchesClient) return false;

      // 3. Date Filter
      if (dateRange?.from || dateRange?.to) {
        const quoteDate = quote.createdAt
          ? typeof quote.createdAt?.toDate === "function"
            ? quote.createdAt.toDate()
            : new Date(quote.createdAt)
          : null;

        if (quoteDate && !isNaN(quoteDate.getTime())) {
          if (dateRange.from && quoteDate < dateRange.from) return false;
          if (dateRange.to) {
            const endOfDay = new Date(dateRange.to);
            endOfDay.setHours(23, 59, 59, 999);
            if (quoteDate > endOfDay) return false;
          }
        } else {
          // If a date filter is applied but the quote has no valid date, hide it
          return false;
        }
      }

      return true;
    });
  }, [quotes, clientFilter, statusFilter, dateRange]);

  const locacaoQuotes = useMemo(() => 
    filteredQuotes.filter((quote: any) => quote.budgetType === "locacao"),
    [filteredQuotes]
  );

  const vendaQuotes = useMemo(() => 
    filteredQuotes.filter((quote: any) => quote.budgetType === "venda"),
    [filteredQuotes]
  );

  const handleAddNew = () => {
    setEditingQuote(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (quote: any) => {
    setEditingQuote(quote);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = (open: boolean) => {
    if (!open) {
      setEditingQuote(null);
    }
    setIsDialogOpen(open);
  };

  const handleView = (quote: any) => {
    setViewingQuote(quote);
  };

  const handleDelete = async (quoteId: string) => {
    try {
      await deleteQuote(quoteId);
      toast({ title: "Orçamento excluído com sucesso!" });
    } catch (error: any) {
      toast({
        title: "Erro ao excluir orçamento",
        description: error?.message || "Não foi possível excluir.",
        variant: "destructive",
      });
    }
  };

  const handleChangeStatus = async (quoteId: string, newStatus: string) => {
    try {
      await updateQuote({ id: quoteId, status: newStatus });
      toast({ title: `Status alterado para ${newStatus}` });
    } catch (error: any) {
      toast({
        title: "Erro ao alterar status",
        description: error?.message || "Não foi possível alterar o status.",
        variant: "destructive",
      });
    }
  };

  const handleConvertToContract = (quote: any) => {
    setIsContractGenerated(false);
    setQuoteForApproval(quote);
  };

  const confirmConvertToContract = async (quoteId: string) => {
    try {
      await convertQuoteToContract(quoteId);
      setIsContractGenerated(true);
      toast({ title: "Contrato gerado com sucesso!" });
    } catch (error: any) {
      toast({
        title: "Erro ao gerar contrato",
        description: error?.message || "Não foi possível converter o orçamento.",
        variant: "destructive",
      });
    }
  };

  const handleConvertToSale = async (quote: any) => {
    try {
      const saleData = {
        clientId: quote.clientId,
        clientName: quote.clientName || getClientName(quote.clientId),
        items: quote.items || [],
        paymentMethods: quote.paymentMethods || [],
        quoteId: quote.id,
        costCenterId: quote.costCenterId || "",
        chartOfAccountId: quote.chartOfAccountId || "",
        bankAccountId: quote.bankAccountId || "",
        totalValue: quote.totalValue || 0,
        saleDate: quote.saleDate || new Date().toISOString(),
      };

      await addSale(saleData);
      await updateQuote({ id: quote.id, status: "Aprovado" });

      toast({ title: "Venda criada a partir do orçamento!" });
    } catch (error: any) {
      toast({
        title: "Erro ao criar venda",
        description: error?.message || "Não foi possível criar a venda.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPDF = (quote: any) => {
    setQuoteForDownload(quote);
  };

  const renderQuoteTable = (quotesList: any[], type: "locacao" | "venda") => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-primary">Orçamento</TableHead>
          <TableHead className="text-primary">Cliente</TableHead>
          <TableHead className="text-primary">Data</TableHead>
          <TableHead className="text-primary">Valor Total</TableHead>
          <TableHead className="text-primary">Status</TableHead>
          <TableHead className="text-right text-primary">Ações</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-10">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Carregando orçamentos...</p>
            </TableCell>
          </TableRow>
        ) : quotesList.length > 0 ? (
          quotesList.map((quote: any) => {
            const displayStatus = normalizeStatus(quote.status);

            return (
              <TableRow key={quote.id}>
                <TableCell className="font-medium">{quote.id}</TableCell>
                <TableCell>{getClientName(quote.clientId, quote.clientName)}</TableCell>
                <TableCell>{formatDate(quote.createdAt)}</TableCell>
                <TableCell>{formatCurrency(Number(quote.totalValue || 0))}</TableCell>
                <TableCell>
                  <Badge className={statusColors[displayStatus] || "bg-muted"}>{displayStatus}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleView(quote)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalhes
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => handleEdit(quote)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => handleDownloadPDF(quote)}>
                        <FileDown className="mr-2 h-4 w-4" />
                        Baixar PDF
                      </DropdownMenuItem>

                      {type === "locacao" && displayStatus === "Pendente" && (
                        <DropdownMenuItem onClick={() => handleConvertToContract(quote)}>
                          <FileCheck className="mr-2 h-4 w-4" />
                          Aprovar e Gerar Contrato
                        </DropdownMenuItem>
                      )}

                      {type === "venda" && displayStatus === "Pendente" && (
                        <DropdownMenuItem onClick={() => handleConvertToSale(quote)}>
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Criar Venda a Partir do Orçamento
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Mudar Status
                        </DropdownMenuSubTrigger>

                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            {["Pendente", "Aprovado", "Reprovado", "Cancelado"].map((status) => (
                              <DropdownMenuItem key={status} onClick={() => handleChangeStatus(quote.id, status)}>
                                {status}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Essa ação não pode ser desfeita. Isso excluirá permanentemente o orçamento.
                            </AlertDialogDescription>
                          </AlertDialogHeader>

                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(quote.id)}>Continuar</AlertDialogAction>
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
            <TableCell colSpan={6} className="text-center text-muted-foreground h-20">
              Nenhum orçamento encontrado.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Orçamentos</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Período de Criação</label>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from
                      ? dateRange.to
                        ? `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`
                        : format(dateRange.from, "dd/MM/yyyy")
                      : "Selecione"}
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange.from ? { from: dateRange.from, to: dateRange.to } : undefined}
                    onSelect={(range) =>
                      setDateRange({
                        from: range?.from,
                        to: range?.to,
                      })
                    }
                    numberOfMonths={2}
                  />
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
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Aprovado">Aprovado</SelectItem>
                  <SelectItem value="Reprovado">Reprovado</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Orçamento Interno
        </Button>
      </div>

      <Collapsible open={locacaoOpen} onOpenChange={setLocacaoOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Orçamentos de Locação</CardTitle>
              <ChevronUp className={cn("h-5 w-5 transition-transform", !locacaoOpen && "rotate-180")} />
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0">{renderQuoteTable(locacaoQuotes, "locacao")}</CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Collapsible open={vendaOpen} onOpenChange={setVendaOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Orçamentos de Venda</CardTitle>
              <ChevronUp className={cn("h-5 w-5 transition-transform", !vendaOpen && "rotate-180")} />
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0">{renderQuoteTable(vendaQuotes, "venda")}</CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <AddQuoteDialog open={isDialogOpen} onOpenChange={handleCloseDialog} quote={editingQuote} />

      {viewingQuote && (
        <AlertDialog open={!!viewingQuote} onOpenChange={() => setViewingQuote(null)}>
          <AlertDialogContent className="max-w-3xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Detalhes do Orçamento {viewingQuote.id}</AlertDialogTitle>
              <AlertDialogDescription>Visualização rápida do orçamento.</AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold">Cliente:</span>{" "}
                  {getClientName(viewingQuote.clientId, viewingQuote.clientName)}
                </div>
                <div>
                  <span className="font-semibold">Tipo:</span>{" "}
                  {viewingQuote.budgetType === "locacao" ? "Locação" : "Venda"}
                </div>
                <div>
                  <span className="font-semibold">Data:</span> {formatDate(viewingQuote.createdAt)}
                </div>
                <div>
                  <span className="font-semibold">Status:</span> {normalizeStatus(viewingQuote.status)}
                </div>
              </div>

              {viewingQuote.budgetType === "locacao" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-semibold">Início:</span> {formatDate(viewingQuote.startDate)}
                  </div>
                  <div>
                    <span className="font-semibold">Fim:</span> {formatDate(viewingQuote.endDate)}
                  </div>
                </div>
              )}

              {viewingQuote.budgetType === "venda" && viewingQuote.prazoEntrega && (
                <div>
                  <span className="font-semibold">Prazo de Entrega:</span> {viewingQuote.prazoEntrega}
                </div>
              )}

              <div>
                <div className="font-semibold mb-2">Itens</div>
                <div className="space-y-2">
                  {(viewingQuote.items || []).map((item: any, index: number) => {
                    const equipment = (useStore.getState().equipments || []).find(
                      (eq: any) => eq.id === item.equipmentId,
                    );

                    return (
                      <div
                        key={`${item.equipmentId}-${index}`}
                        className="border rounded-md p-3 flex items-center justify-between gap-4"
                      >
                        <div>
                          <div className="font-medium">{equipment?.name || "Equipamento"}</div>
                          <div className="text-muted-foreground text-xs">Qtd: {item.quantity}</div>
                        </div>

                        <div className="text-right">
                          <div>{formatCurrency(Number(item.unitPrice || 0))}</div>
                          <div className="text-xs text-muted-foreground">
                            Total: {formatCurrency(Number(item.quantity || 0) * Number(item.unitPrice || 0))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="font-semibold">Informações Fiscais:</span>
                <div className="mt-1 text-muted-foreground">
                  {viewingQuote.informacoesFiscais || viewingQuote.fiscalInfo || "Nenhuma informação fiscal fornecida."}
                </div>
              </div>

              <div>
                <span className="font-semibold">Observações:</span>
                <div className="mt-1 text-muted-foreground">
                  {viewingQuote.observations || "Nenhuma observação fornecida."}
                </div>
              </div>

              <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg p-4">
                <span className="font-bold">Valor Total</span>
                <span className="text-lg font-bold">{formatCurrency(Number(viewingQuote.totalValue || 0))}</span>
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setViewingQuote(null)}>Fechar</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {quoteForDownload && (
        <AlertDialog open={!!quoteForDownload} onOpenChange={(open) => {
          if (!open) setQuoteForDownload(null);
        }}>
          <AlertDialogContent className="max-w-3xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Pré-visualização do Orçamento {quoteForDownload.id}</AlertDialogTitle>
              <AlertDialogDescription>Confira os dados antes de gerar o PDF.</AlertDialogDescription>
            </AlertDialogHeader>

            <div ref={quotePrintRef} className="space-y-4 max-h-[70vh] overflow-y-auto text-sm p-4 border rounded-md">
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h3 className="text-lg font-bold text-primary">TECH4RENT</h3>
                  <p className="text-xs text-muted-foreground">Orçamento de {quoteForDownload.budgetType === "locacao" ? "Locação" : "Venda"}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">Nº {quoteForDownload.id}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(quoteForDownload.createdAt)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div>
                  <h4 className="font-semibold text-xs uppercase text-muted-foreground mb-2">Dados do Cliente</h4>
                  <p className="font-medium">{getClientName(quoteForDownload.clientId, quoteForDownload.clientName)}</p>
                  <p className="text-xs text-muted-foreground">ID do Cliente: {quoteForDownload.clientId}</p>
                </div>
                {quoteForDownload.budgetType === "locacao" && (
                  <div>
                    <h4 className="font-semibold text-xs uppercase text-muted-foreground mb-2">Período do Contrato</h4>
                    <p className="font-medium">
                      {formatDate(quoteForDownload.startDate)} até {formatDate(quoteForDownload.endDate)}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-xs uppercase text-muted-foreground mb-2">Itens do Orçamento</h4>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="h-8 text-xs">Equipamento</TableHead>
                        <TableHead className="h-8 text-xs text-center">Qtd</TableHead>
                        <TableHead className="h-8 text-xs text-right">Unitário</TableHead>
                        <TableHead className="h-8 text-xs text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(quoteForDownload.items || []).map((item: any, index: number) => {
                        const equipment = (useStore.getState().equipments || []).find(
                          (eq: any) => eq.id === item.equipmentId,
                        );
                        return (
                          <TableRow key={index}>
                            <TableCell className="py-2 text-xs">{equipment?.name || "Equipamento"}</TableCell>
                            <TableCell className="py-2 text-xs text-center">{item.quantity}</TableCell>
                            <TableCell className="py-2 text-xs text-right">{formatCurrency(Number(item.unitPrice || 0))}</TableCell>
                            <TableCell className="py-2 text-xs text-right font-medium">
                              {formatCurrency(Number(item.quantity || 0) * Number(item.unitPrice || 0))}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {quoteForDownload.observations && (
                <div>
                  <h4 className="font-semibold text-xs uppercase text-muted-foreground mb-1">Observações</h4>
                  <p className="text-xs border p-2 rounded bg-muted/30">{quoteForDownload.observations}</p>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-4 border-t">
                {quoteForDownload.budgetType === "locacao" && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Valor Mensal:</span>
                    <span className="font-semibold">{formatCurrency(Number(quoteForDownload.totalValue || 0))}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-base font-bold text-primary">
                  <span>VALOR TOTAL:</span>
                  <span>{formatCurrency(Number(quoteForDownload.totalValue || 0))}</span>
                </div>
              </div>
            </div>

            <AlertDialogFooter className="flex flex-row gap-2 justify-end">
              <AlertDialogCancel onClick={() => setQuoteForDownload(null)}>Fechar</AlertDialogCancel>
              <Button type="button" onClick={() => handlePrintDocument(quotePrintRef)}>
                <FileDown className="mr-2 h-4 w-4" />
                Imprimir / Baixar PDF
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {quoteForApproval && (
        <AlertDialog open={!!quoteForApproval} onOpenChange={(open) => {
          if (!open) {
            setQuoteForApproval(null);
            setIsContractGenerated(false);
          }
        }}>
          <AlertDialogContent className="max-w-4xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Aprovação e Geração de Contrato</AlertDialogTitle>
              <AlertDialogDescription>
                Revise os termos do contrato abaixo antes de confirmar a aprovação.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div ref={contractPrintRef} className="space-y-6 max-h-[70vh] overflow-y-auto p-6 border rounded-md bg-zinc-50 font-serif text-zinc-900 shadow-inner">
              <div className="text-center space-y-2 border-b pb-6 mb-6">
                <h2 className="text-2xl font-bold uppercase tracking-wider">Contrato de Locação de Equipamentos</h2>
                <p className="text-sm font-medium">Contrato vinculada ao Orçamento nº {quoteForApproval.id}</p>
              </div>

              <div className="space-y-4 text-justify leading-relaxed">
                <section>
                  <h3 className="font-bold mb-2">1. DAS PARTES</h3>
                  <p className="text-sm">
                    <strong>LOCADORA:</strong> TECH4RENT LTDA, com sede em São Paulo/SP, inscrita no CNPJ sob o nº 00.111.222/0001-33.
                  </p>
                  <p className="text-sm">
                    <strong>LOCATÁRIA:</strong> {getClientName(quoteForApproval.clientId, quoteForApproval.clientName)}, inscrita no CNPJ/CPF conforme cadastro no sistema.
                  </p>
                </section>

                <section>
                  <h3 className="font-bold mb-2">2. DO OBJETO</h3>
                  <p className="text-sm mb-2">
                    O presente contrato tem por objeto a locação dos seguintes equipamentos:
                  </p>
                  <div className="border rounded overflow-hidden mb-2 bg-white">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-zinc-100 hover:bg-zinc-100">
                          <TableHead className="h-8 font-bold text-zinc-900">Descrição do Equipamento</TableHead>
                          <TableHead className="h-8 font-bold text-zinc-900 text-center">Qtd</TableHead>
                          <TableHead className="h-8 font-bold text-zinc-900 text-right">Vl. Unitário</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(quoteForApproval.items || []).map((item: any, index: number) => {
                          const equipment = (useStore.getState().equipments || []).find(
                            (eq: any) => eq.id === item.equipmentId,
                          );
                          return (
                            <TableRow key={index} className="hover:bg-zinc-50 border-zinc-200">
                              <TableCell className="py-2">{equipment?.name || "Equipamento"}</TableCell>
                              <TableCell className="py-2 text-center">{item.quantity}</TableCell>
                              <TableCell className="py-2 text-right">{formatCurrency(Number(item.unitPrice || 0))}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </section>

                <section>
                  <h3 className="font-bold mb-2">3. DO PRAZO E VALORES</h3>
                  <p className="text-sm">
                    A locação terá início em <strong>{formatDate(quoteForApproval.startDate)}</strong> e término em <strong>{formatDate(quoteForApproval.endDate)}</strong>.
                  </p>
                  <p className="text-sm mt-2">
                    O valor mensal da locação é de <strong>{formatCurrency(Number(quoteForApproval.totalValue || 0))}</strong>, a ser pago conforme as condições comerciais acordadas.
                  </p>
                </section>

                <section>
                  <h3 className="font-bold mb-2">4. DAS OBRIGAÇÕES</h3>
                  <p className="text-xs text-zinc-600">
                    A LOCATÁRIA obriga-se a manter os equipamentos em perfeito estado de conservação e uso, respondendo por eventuais danos causados por mau uso, negligência ou imprudência. Os equipamentos deverão ser devolvidos à LOCADORA ao final do prazo estabelecido.
                  </p>
                </section>

                {quoteForApproval.observations && (
                  <section>
                    <h3 className="font-bold mb-2">5. OBSERVAÇÕES ADICIONAIS</h3>
                    <p className="text-sm italic border-l-4 border-zinc-300 pl-4">{quoteForApproval.observations}</p>
                  </section>
                )}
              </div>

              <div className="pt-10 flex justify-between items-end border-t mt-10">
                <div className="w-48 border-t border-zinc-400 text-center pt-2">
                  <p className="text-[10px] uppercase font-bold">Tech4Rent</p>
                </div>
                <div className="w-48 border-t border-zinc-400 text-center pt-2">
                  <p className="text-[10px] uppercase font-bold">Locatária</p>
                </div>
              </div>
            </div>

            <AlertDialogFooter className="flex flex-row gap-2 justify-end sm:justify-end">
              {isContractGenerated ? (
                <>
                  <Button variant="outline" type="button" onClick={() => {
                    setQuoteForApproval(null);
                    setIsContractGenerated(false);
                  }}>
                    Fechar
                  </Button>
                  <Button 
                    type="button"
                    className="bg-primary hover:bg-primary/90 text-white" 
                    onClick={() => handlePrintDocument(contractPrintRef)}
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Imprimir / Baixar Contrato
                  </Button>
                </>
              ) : (
                <>
                  <AlertDialogCancel type="button" onClick={() => {
                    setQuoteForApproval(null);
                    setIsContractGenerated(false);
                  }}>Cancelar</AlertDialogCancel>
                  <Button 
                    type="button"
                    className="bg-green-600 hover:bg-green-700 text-white" 
                    onClick={() => confirmConvertToContract(quoteForApproval.id)}
                  >
                    <FileCheck className="mr-2 h-4 w-4" />
                    Confirmar Aprovação e Gerar Contrato
                  </Button>
                </>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
