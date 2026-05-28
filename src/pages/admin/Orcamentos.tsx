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
            <script src="https://cdn.tailwindcss.com"></script>
            <script>
              tailwind.config = {
                theme: {
                  extend: {
                    colors: {
                      primary: {
                        DEFAULT: '#f97316',
                        foreground: '#ffffff',
                      },
                    }
                  }
                }
              }
            </script>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
              
              body { 
                font-family: 'Inter', sans-serif;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              @page {
                size: A4;
                margin: 0;
              }

              @media print {
                body {
                  margin: 0;
                  padding: 0;
                }
                .no-print {
                  display: none;
                }
              }
            </style>
          </head>
          <body class="bg-white">
            <div class="p-0">
              ${content}
            </div>
            <script>
              // Wait for Tailwind to process and fonts to load
              window.onload = function() {
                setTimeout(() => {
                  window.print();
                  window.onafterprint = function() { window.close(); };
                }, 500);
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

            <div ref={quotePrintRef} className="max-h-[70vh] overflow-y-auto border rounded-md bg-zinc-100 p-2 md:p-8">
              <DocumentContainer>
                <DocumentHeader 
                  title={quoteForDownload.budgetType === "locacao" ? "PROPOSTA COMERCIAL" : "ORÇAMENTO DE VENDA"} 
                  documentNumber={quoteForDownload.id} 
                  date={formatDate(quoteForDownload.createdAt)} 
                />

                <DocumentSection title="DADOS DO CLIENTE" columns={2}>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Nome do Cliente</span>
                    <span className="font-semibold text-zinc-800">{getClientName(quoteForDownload.clientId, quoteForDownload.clientName)}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">ID do Cliente</span>
                    <span className="font-medium text-zinc-700">{quoteForDownload.clientId}</span>
                  </div>
                </DocumentSection>

                {quoteForDownload.budgetType === "locacao" && (
                  <DocumentSection title="PERÍODO DO CONTRATO">
                    <div className="flex items-center gap-8">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Início</span>
                        <span className="font-semibold text-zinc-800">{formatDate(quoteForDownload.startDate)}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Término</span>
                        <span className="font-semibold text-zinc-800">{formatDate(quoteForDownload.endDate)}</span>
                      </div>
                    </div>
                  </DocumentSection>
                )}

                <div className="flex flex-col gap-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-primary/80 border-l-4 border-primary pl-3 py-0.5 bg-primary/5">
                    ITENS DO ORÇAMENTO
                  </h3>
                  <DocumentTable 
                    headers={["Equipamento", "Qtd", "Vl. Unitário", "Vl. Total"]}
                    alignments={["left", "center", "right", "right"]}
                    rows={(quoteForDownload.items || []).map((item: any) => {
                      const equipment = (useStore.getState().equipments || []).find(
                        (eq: any) => eq.id === item.equipmentId,
                      );
                      return [
                        equipment?.name || "Equipamento",
                        item.quantity.toString(),
                        formatCurrency(Number(item.unitPrice || 0)),
                        formatCurrency(Number(item.quantity || 0) * Number(item.unitPrice || 0))
                      ];
                    })}
                  />
                </div>

                {quoteForDownload.observations && (
                  <DocumentSection title="OBSERVAÇÕES">
                    <p className="text-xs text-zinc-600 italic">
                      {quoteForDownload.observations}
                    </p>
                  </DocumentSection>
                )}

                <DocumentSummary 
                  items={[
                    ...(quoteForDownload.budgetType === "locacao" ? [{ label: "Valor Mensal", value: formatCurrency(Number(quoteForDownload.totalValue || 0)) }] : []),
                    { label: "Valor Total", value: formatCurrency(Number(quoteForDownload.totalValue || 0)), isTotal: true }
                  ]}
                />

                <DocumentFooter />
              </DocumentContainer>
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

            <div ref={contractPrintRef} className="max-h-[70vh] overflow-y-auto border rounded-md bg-zinc-100 p-2 md:p-8">
              <DocumentContainer>
                <DocumentHeader 
                  title="CONTRATO DE LOCAÇÃO" 
                  documentNumber={quoteForApproval.id} 
                  date={formatDate(quoteForApproval.createdAt)} 
                  type="contrato"
                />

                <div className="text-center my-4">
                  <h2 className="text-xl font-black text-zinc-800 uppercase tracking-widest border-y border-zinc-200 py-3">
                    CONTRATO DE LOCAÇÃO DE EQUIPAMENTOS
                  </h2>
                  <p className="text-[10px] text-zinc-500 mt-2 font-medium tracking-tight">
                    ESTE DOCUMENTO VINCULA-SE À PROPOSTA COMERCIAL Nº {quoteForApproval.id}
                  </p>
                </div>

                <div className="space-y-6 text-sm">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-800">1. DAS PARTES</h3>
                    <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-lg flex flex-col gap-3">
                      <p className="text-xs leading-relaxed">
                        <span className="font-bold text-primary mr-1">LOCADORA:</span> 
                        <span className="font-semibold">TECH4RENT LTDA</span>, com sede em São Paulo/SP, inscrita no CNPJ sob o nº 00.111.222/0001-33.
                      </p>
                      <p className="text-xs leading-relaxed">
                        <span className="font-bold text-primary mr-1">LOCATÁRIA:</span> 
                        <span className="font-semibold uppercase">{getClientName(quoteForApproval.clientId, quoteForApproval.clientName)}</span>, inscrita no CNPJ/CPF conforme cadastro no sistema Tech4Rent.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-800">2. DO OBJETO</h3>
                    <p className="text-xs text-zinc-600 px-1">
                      O presente contrato tem por objeto a locação dos seguintes equipamentos e acessórios:
                    </p>
                    <DocumentTable 
                      headers={["Descrição do Equipamento", "Qtd", "Vl. Unitário"]}
                      alignments={["left", "center", "right"]}
                      rows={(quoteForApproval.items || []).map((item: any) => {
                        const equipment = (useStore.getState().equipments || []).find(
                          (eq: any) => eq.id === item.equipmentId,
                        );
                        return [
                          equipment?.name || "Equipamento",
                          item.quantity.toString(),
                          formatCurrency(Number(item.unitPrice || 0))
                        ];
                      })}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-800">3. DO PRAZO E VALORES</h3>
                    <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-lg grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Início da Locação</span>
                        <span className="font-bold text-zinc-800 underline decoration-primary/30 decoration-2">{formatDate(quoteForApproval.startDate)}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Término da Locação</span>
                        <span className="font-bold text-zinc-800 underline decoration-primary/30 decoration-2">{formatDate(quoteForApproval.endDate)}</span>
                      </div>
                      <div className="col-span-2 mt-2 pt-2 border-t border-zinc-200/60">
                        <p className="text-xs">
                          O valor mensal total da locação é de <span className="font-bold text-primary text-sm">{formatCurrency(Number(quoteForApproval.totalValue || 0))}</span>, a ser pago conforme condições comerciais previamente acordadas.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-800">4. DAS OBRIGAÇÕES</h3>
                    <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-lg">
                      <p className="text-[11px] text-zinc-600 leading-relaxed text-justify">
                        A <span className="font-bold">LOCATÁRIA</span> obriga-se a manter os equipamentos em perfeito estado de conservação e uso, respondendo por eventuais danos causados por mau uso, negligência ou imprudência. Os equipamentos deverão ser devolvidos à <span className="font-bold">LOCADORA</span> ao final do prazo estabelecido, nas mesmas condições em que foram entregues.
                      </p>
                    </div>
                  </div>

                  {quoteForApproval.observations && (
                    <div className="flex flex-col gap-2">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-800">5. OBSERVAÇÕES</h3>
                      <p className="text-xs text-zinc-600 italic bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                        {quoteForApproval.observations}
                      </p>
                    </div>
                  )}

                  <SignatureBlock />
                </div>

                <DocumentFooter />
              </DocumentContainer>
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
