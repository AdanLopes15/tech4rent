//src/pages/admin/Vendas.tsx

import { useMemo, useState } from "react";
import { format } from "date-fns";

import { useStore } from "@/store";
import { useToast } from "@/hooks/use-toast";
import { cn, formatCurrency } from "@/lib/utils";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import { PlusCircle, MoreHorizontal, Pencil, Trash2, FileText, ChevronUp, CalendarIcon, Search } from "lucide-react";

import { AddSaleDialog } from "@/components/vendas/AddSaleDialog";
import { SaleReceiptDialog } from "@/components/vendas/SaleReceiptDialog";

const getStatusClasses = (status: string) => {
  switch ((status || "").toLowerCase()) {
    case "concluída":
      return "bg-green-500 hover:bg-green-600 text-white";
    case "cancelada":
      return "bg-red-500 hover:bg-red-600 text-white";
    default:
      return "bg-gray-500 hover:bg-gray-600 text-white";
  }
};

export default function Vendas() {
  const { sales, cancelSale, deleteSale } = useStore();
  const { toast } = useToast();

  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<any>(null);
  const [selectedSale, setSelectedSale] = useState<any>(null);

  const [clientNameFilter, setClientNameFilter] = useState("");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(true);

  const filteredSales = useMemo(() => {
    return sales.filter((sale: any) => {
      const clientName = (sale.clientName || "").toLowerCase();
      const matchesName = !clientNameFilter || clientName.includes(clientNameFilter.toLowerCase());

      let matchesDate = true;
      if (dateRange.from || dateRange.to) {
        const saleDate = sale.saleDate ? new Date(sale.saleDate) : null;
        if (saleDate) {
          if (dateRange.from && saleDate < dateRange.from) matchesDate = false;
          if (dateRange.to) {
            const end = new Date(dateRange.to);
            end.setHours(23, 59, 59, 999);
            if (saleDate > end) matchesDate = false;
          }
        }
      }

      const totalValue = Number(sale.totalValue || 0);
      const matchesMin = !minValue || totalValue >= Number(minValue);
      const matchesMax = !maxValue || totalValue <= Number(maxValue);

      return matchesName && matchesDate && matchesMin && matchesMax;
    });
  }, [sales, clientNameFilter, dateRange, minValue, maxValue]);

  const handleOpenReceipt = (sale: any) => {
    setSelectedSale(sale);
    setIsReceiptDialogOpen(true);
  };

  const handleEditSale = (sale: any) => {
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

  const handleCancelSale = async (saleId: string) => {
    try {
      await cancelSale(saleId);
      toast({ title: "Venda cancelada com sucesso!" });
    } catch (error: any) {
      toast({
        title: "Erro ao cancelar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteSale = async (saleId: string) => {
    try {
      await deleteSale(saleId);
      toast({ title: "Venda excluída com sucesso!" });
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    }
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
      const parsed = date?.toDate ? date.toDate() : new Date(date);
      return format(parsed, "dd/MM/yyyy");
    } catch {
      return "—";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Venda de Equipamentos</CardTitle>
            <CardDescription>Gerencie suas vendas diretas e faturas correspondentes.</CardDescription>
          </div>
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Venda
          </Button>
        </CardHeader>
      </Card>

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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de Faturas de Venda</CardTitle>
        </CardHeader>

        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fatura</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredSales.length > 0 ? (
                filteredSales.map((sale: any) => (
                  <TableRow key={sale.id}>
                    <TableCell>{sale.id}</TableCell>
                    <TableCell>{sale.clientName}</TableCell>
                    <TableCell>{formatDate(sale.saleDate)}</TableCell>
                    <TableCell>{formatCurrency(sale.totalValue)}</TableCell>
                    <TableCell>
                      <Badge className={cn(getStatusClasses(sale.status))}>{sale.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenReceipt(sale)}>
                            <FileText className="mr-2 h-4 w-4" />
                            Visualizar Recibo
                          </DropdownMenuItem>

                          {sale.status !== "Cancelada" && (
                            <DropdownMenuItem onClick={() => handleEditSale(sale)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                          )}

                          {sale.status !== "Cancelada" && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Cancelar
                                </DropdownMenuItem>
                              </AlertDialogTrigger>

                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Essa ação não pode ser desfeita. Isso irá cancelar a venda e suas faturas, e
                                    devolver os itens ao estoque. Se a venda foi gerada por um orçamento, ele voltará ao
                                    status "Pendente".
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Voltar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleCancelSale(sale.id)}>
                                    Confirmar Cancelamento
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}

                          {sale.status === "Cancelada" && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
                              </AlertDialogTrigger>

                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir Venda Permanentemente?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação é irreversível e removerá o registro da venda permanentemente. Apenas use
                                    se tiver certeza.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteSale(sale.id)}>
                                    Excluir Venda
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Nenhuma fatura de venda para exibir.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddSaleDialog open={isDialogOpen} onOpenChange={handleCloseDialog} sale={editingSale} />

      {selectedSale && (
        <SaleReceiptDialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen} sale={selectedSale} />
      )}
    </div>
  );
}
