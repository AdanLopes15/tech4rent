//src/pages/admin/Orcamentos.tsx

import { useState, useMemo } from "react";
import { useStore } from "@/store";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AddQuoteDialog } from "@/components/orcamentos/AddQuoteDialog";

const statusColors: Record<string, string> = {
  Pendente: "bg-yellow-500 hover:bg-yellow-600 text-black",
  Aprovado: "bg-green-600 hover:bg-green-700 text-white",
  Recusado: "bg-red-600 hover:bg-red-700 text-white",
  Cancelado: "bg-muted text-muted-foreground",
};

export default function Orcamentos() {
  const { quotes, clients, deleteQuote, updateQuote, convertQuoteToContract, addSale } = useStore();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [clientFilter, setClientFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [locacaoOpen, setLocacaoOpen] = useState(true);
  const [vendaOpen, setVendaOpen] = useState(true);

  const filtered = useMemo(() => {
    return quotes.filter((q: any) => {
      const matchesClient = clientFilter === "todos" || q.clientId === clientFilter;
      const matchesStatus = statusFilter === "todos" || q.status === statusFilter;

      let matchesDate = true;
      if (dateRange.from || dateRange.to) {
        const qDate = q.createdAt ? new Date(q.createdAt) : null;
        if (qDate) {
          if (dateRange.from && qDate < dateRange.from) matchesDate = false;
          if (dateRange.to) {
            const endOfDay = new Date(dateRange.to);
            endOfDay.setHours(23, 59, 59, 999);
            if (qDate > endOfDay) matchesDate = false;
          }
        }
      }

      return matchesClient && matchesStatus && matchesDate;
    });
  }, [quotes, clientFilter, statusFilter, dateRange]);

  const locacaoQuotes = filtered.filter((q: any) => q.budgetType === "locacao");
  const vendaQuotes = filtered.filter((q: any) => q.budgetType === "venda");

  const handleEdit = (quote: any) => {
    setEditingQuote(quote);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingQuote(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingQuote(null);
    setIsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteQuote(deleteId);
      toast({ title: "Orçamento excluído com sucesso!" });
    } catch {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
    setDeleteId(null);
  };

  const handleChangeStatus = async (quoteId: string, newStatus: string) => {
    try {
      await updateQuote({ id: quoteId, status: newStatus });
      toast({ title: `Status alterado para ${newStatus}` });
    } catch {
      toast({ title: "Erro ao alterar status", variant: "destructive" });
    }
  };

  const handleConvertToContract = async (quoteId: string) => {
    try {
      await convertQuoteToContract(quoteId);
      toast({ title: "Contrato gerado com sucesso!" });
    } catch (err: any) {
      toast({ title: err.message || "Erro ao gerar contrato", variant: "destructive" });
    }
  };

  const handleConvertToSale = async (quote: any) => {
    try {
      const saleData = {
        clientId: quote.clientId,
        items: quote.items,
        paymentMethods: quote.paymentMethods || [],
        quoteId: quote.id,
        costCenterId: quote.costCenterId || "",
        chartOfAccountId: quote.chartOfAccountId || "",
        bankAccountId: quote.bankAccountId || "",
      };
      await addSale(saleData);
      await updateQuote({ id: quote.id, status: "Aprovado" });
      toast({ title: "Venda criada a partir do orçamento!" });
    } catch (err: any) {
      toast({ title: err.message || "Erro ao criar venda", variant: "destructive" });
    }
  };

  const formatDate = (date: any) => {
    if (!date) return "—";
    try {
      const d = date?.toDate ? date.toDate() : new Date(date);
      return format(d, "dd/MM/yyyy");
    } catch {
      return "—";
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find((c: any) => c.id === clientId);
    return client?.razaoSocial || client?.name || "N/A";
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
          quotesList.map((quote: any) => (
            <TableRow key={quote.id}>
              <TableCell className="font-medium">{quote.id}</TableCell>
              <TableCell>{getClientName(quote.clientId)}</TableCell>
              <TableCell>{formatDate(quote.createdAt)}</TableCell>
              <TableCell>{formatCurrency(quote.totalValue)}</TableCell>
              <TableCell>
                <Badge className={statusColors[quote.status] || "bg-muted"}>{quote.status || "Pendente"}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(quote)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Detalhes
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEdit(quote)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    {type === "locacao" && quote.status === "Pendente" && (
                      <DropdownMenuItem onClick={() => handleConvertToContract(quote.id)}>
                        <FileCheck className="mr-2 h-4 w-4" />
                        Aprovar e Gerar Contrato
                      </DropdownMenuItem>
                    )}
                    {type === "venda" && quote.status === "Pendente" && (
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
                      <DropdownMenuSubContent>
                        {["Pendente", "Aprovado", "Recusado", "Cancelado"].map((s) => (
                          <DropdownMenuItem key={s} onClick={() => handleChangeStatus(quote.id, s)}>
                            {s}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(quote.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))
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
      {/* Filters */}
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
                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
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
                  {clients.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.razaoSocial || c.name}
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
                  <SelectItem value="Recusado">Recusado</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* New Quote Button */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Orçamento Interno
        </Button>
      </div>

      {/* Locação Table */}
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

      {/* Venda Table */}
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

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
