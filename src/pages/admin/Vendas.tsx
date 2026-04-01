import { useState, useMemo } from "react";
import { useStore } from "@/store";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import {
  PlusCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  FileText,
  ChevronUp,
  CalendarIcon,
  Search,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AddSaleDialog } from "@/components/vendas/AddSaleDialog";

const statusColors: Record<string, string> = {
  "Concluída": "bg-green-600 hover:bg-green-700 text-white",
  Cancelada: "bg-red-600 hover:bg-red-700 text-white",
};

export default function Vendas() {
  const { sales, clients, cancelSale, deleteSale } = useStore();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<any>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [clientNameFilter, setClientNameFilter] = useState("");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(true);

  const filtered = useMemo(() => {
    return sales.filter((s: any) => {
      const clientName = (s.clientName || "").toLowerCase();
      const matchesName = !clientNameFilter || clientName.includes(clientNameFilter.toLowerCase());

      let matchesDate = true;
      if (dateRange.from || dateRange.to) {
        const sDate = s.saleDate ? new Date(s.saleDate) : null;
        if (sDate) {
          if (dateRange.from && sDate < dateRange.from) matchesDate = false;
          if (dateRange.to) {
            const end = new Date(dateRange.to);
            end.setHours(23, 59, 59, 999);
            if (sDate > end) matchesDate = false;
          }
        }
      }

      const total = s.totalValue || 0;
      const matchesMin = !minValue || total >= Number(minValue);
      const matchesMax = !maxValue || total <= Number(maxValue);

      return matchesName && matchesDate && matchesMin && matchesMax;
    });
  }, [sales, clientNameFilter, dateRange, minValue, maxValue]);

  const handleEdit = (sale: any) => {
    setEditingSale(sale);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingSale(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingSale(null);
    setIsDialogOpen(false);
  };

  const handleCancel = async () => {
    if (!cancelId) return;
    try {
      await cancelSale(cancelId);
      toast({ title: "Venda cancelada com sucesso!" });
    } catch (err: any) {
      toast({ title: err.message || "Erro ao cancelar", variant: "destructive" });
    }
    setCancelId(null);
  };

  const clearFilters = () => {
    setClientNameFilter("");
    setDateRange({});
    setMinValue("");
    setMaxValue("");
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

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Venda de Equipamentos</CardTitle>
            <CardDescription>Gerencie suas vendas diretas e faturas correspondentes.</CardDescription>
          </div>
          <Button variant="outline" onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Venda
          </Button>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Filtros de Busca</CardTitle>
              <ChevronUp className={cn("h-5 w-5 transition-transform", !filtersOpen && "rotate-180")} />
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Nome do Cliente</label>
                  <Input
                    placeholder="Filtrar por nome do cliente..."
                    value={clientNameFilter}
                    onChange={(e) => setClientNameFilter(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Vencimento</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateRange.from && "text-muted-foreground"
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
                  <label className="text-sm font-medium">Valor Mín.</label>
                  <Input
                    type="number"
                    placeholder="0,00"
                    value={minValue}
                    onChange={(e) => setMinValue(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Valor Máx.</label>
                  <Input
                    type="number"
                    placeholder="1000,00"
                    value={maxValue}
                    onChange={(e) => setMaxValue(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Search className="mr-2 h-4 w-4" />
                  Buscar
                </Button>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Limpar
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de Faturas de Venda</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-primary">Fatura</TableHead>
                <TableHead className="text-primary">Cliente</TableHead>
                <TableHead className="text-primary">Data</TableHead>
                <TableHead className="text-primary">Valor</TableHead>
                <TableHead className="text-primary">Status</TableHead>
                <TableHead className="text-right text-primary">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length > 0 ? (
                filtered.map((sale: any) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.id}</TableCell>
                    <TableCell>{sale.clientName || "N/A"}</TableCell>
                    <TableCell>{formatDate(sale.saleDate)}</TableCell>
                    <TableCell>{formatCurrency(sale.totalValue)}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[sale.status] || "bg-muted"}>
                        {sale.status || "Concluída"}
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
                          <DropdownMenuItem>
                            <FileText className="mr-2 h-4 w-4" />
                            Visualizar Recibo
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(sale)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          {sale.status !== "Cancelada" && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setCancelId(sale.id)}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancelar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground h-20">
                    Nenhuma venda encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddSaleDialog open={isDialogOpen} onOpenChange={handleCloseDialog} sale={editingSale} />

      <AlertDialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar venda?</AlertDialogTitle>
            <AlertDialogDescription>
              O estoque será devolvido e as parcelas pendentes serão canceladas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel}>Confirmar Cancelamento</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
