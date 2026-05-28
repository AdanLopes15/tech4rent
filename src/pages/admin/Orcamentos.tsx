//src/pages/admin/Orcamentos.tsx

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { useStore } from "@/store";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, cn } from "@/lib/utils";
import { generateQuotePDF } from "@/lib/pdf-utils";

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
  const { quotes, clients, deleteQuote, updateQuote, convertQuoteToContract, addSale } = useStore();

  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<any>(null);
  const [viewingQuote, setViewingQuote] = useState<any>(null);
  const [quoteForDownload, setQuoteForDownload] = useState<any>(null);

  const [clientFilter, setClientFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  const [locacaoOpen, setLocacaoOpen] = useState(true);
  const [vendaOpen, setVendaOpen] = useState(true);

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
    return quotes.filter((quote: any) => {
      const normalizedQuoteStatus = normalizeStatus(quote.status);

      const matchesClient = clientFilter === "todos" || quote.clientId === clientFilter;

      const matchesStatus = statusFilter === "todos" || normalizedQuoteStatus === statusFilter;

      let matchesDate = true;

      if (dateRange.from || dateRange.to) {
        const quoteDate = quote.createdAt
          ? typeof quote.createdAt?.toDate === "function"
            ? quote.createdAt.toDate()
            : new Date(quote.createdAt)
          : null;

        if (quoteDate && !isNaN(quoteDate.getTime())) {
          if (dateRange.from && quoteDate < dateRange.from) {
            matchesDate = false;
          }

          if (dateRange.to) {
            const endOfDay = new Date(dateRange.to);
            endOfDay.setHours(23, 59, 59, 999);

            if (quoteDate > endOfDay) {
              matchesDate = false;
            }
          }
        }
      }

      return matchesClient && matchesStatus && matchesDate;
    });
  }, [quotes, clientFilter, statusFilter, dateRange]);

  const locacaoQuotes = filteredQuotes.filter((quote: any) => quote.budgetType === "locacao");

  const vendaQuotes = filteredQuotes.filter((quote: any) => quote.budgetType === "venda");

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

  const handleConvertToContract = async (quoteId: string) => {
    try {
      await convertQuoteToContract(quoteId);
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

  const confirmDownloadPDF = (quote: any) => {
    const { companySettings, clients, equipments } = useStore.getState();
    const client = clients.find((c: any) => c.id === quote.clientId);
    generateQuotePDF(quote, client, companySettings, equipments);
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
        {quotesList.length > 0 ? (
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
                        <DropdownMenuItem onClick={() => handleConvertToContract(quote.id)}>
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
        <AlertDialog open={!!quoteForDownload} onOpenChange={() => setQuoteForDownload(null)}>
          <AlertDialogContent className="max-w-3xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Pré-visualização do Orçamento {quoteForDownload.id}</AlertDialogTitle>
              <AlertDialogDescription>Confira os dados antes de gerar o PDF.</AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto text-sm p-4 border rounded-md">
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
              <AlertDialogCancel onClick={() => setQuoteForDownload(null)}>Cancelar</AlertDialogCancel>
              <Button onClick={() => confirmDownloadPDF(quoteForDownload)}>
                <FileDown className="mr-2 h-4 w-4" />
                Gerar e Baixar PDF
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
