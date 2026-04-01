import { useState, useMemo } from "react";
import { useStore } from "@/store";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInMonths } from "date-fns";
import { formatCurrency } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  Eye,
  FileText,
  RefreshCw,
  ChevronUp,
  CalendarIcon,
  Upload,
  FileCheck,
  XCircle,
  CheckCircle,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AddContractDialog } from "@/components/contratos/AddContractDialog";

const statusColors: Record<string, string> = {
  "Em Andamento": "bg-blue-600 hover:bg-blue-700 text-white",
  Finalizado: "bg-green-600 hover:bg-green-700 text-white",
  Cancelado: "bg-muted text-muted-foreground",
};

export default function Contratos() {
  const {
    contracts,
    clients,
    revenues,
    deleteContract,
    recalculateContractInstallments,
    attachSignedContract,
    deleteSignedContract,
    finalizeContract,
  } = useStore();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [clientFilter, setClientFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [locacaoOpen, setLocacaoOpen] = useState(true);

  const filtered = useMemo(() => {
    return contracts.filter((c: any) => {
      const matchesClient = clientFilter === "todos" || c.clientId === clientFilter;
      const matchesStatus = statusFilter === "todos" || c.status === statusFilter;

      let matchesDate = true;
      if (dateRange.from || dateRange.to) {
        const endDate = c.endDate ? new Date(c.endDate) : null;
        if (endDate) {
          if (dateRange.from && endDate < dateRange.from) matchesDate = false;
          if (dateRange.to) {
            const end = new Date(dateRange.to);
            end.setHours(23, 59, 59, 999);
            if (endDate > end) matchesDate = false;
          }
        }
      }

      return matchesClient && matchesStatus && matchesDate;
    });
  }, [contracts, clientFilter, statusFilter, dateRange]);

  const handleEdit = (contract: any) => {
    setEditingContract(contract);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingContract(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingContract(null);
    setIsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteContract(deleteId);
      toast({ title: "Contrato excluído com sucesso!" });
    } catch {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
    setDeleteId(null);
  };

  const handleRecalculate = async (contractId: string) => {
    try {
      await recalculateContractInstallments(contractId);
      toast({ title: "Parcelas recalculadas com sucesso!" });
    } catch (err: any) {
      toast({ title: err.message || "Erro ao recalcular", variant: "destructive" });
    }
  };

  const handleAttachContract = async (contractId: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png";
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        await attachSignedContract(contractId, file);
        toast({ title: "Contrato assinado anexado!" });
      } catch (err: any) {
        toast({ title: err.message || "Erro ao anexar", variant: "destructive" });
      }
    };
    input.click();
  };

  const handleDeleteAttachment = async (contractId: string) => {
    try {
      await deleteSignedContract(contractId);
      toast({ title: "Anexo removido!" });
    } catch (err: any) {
      toast({ title: err.message || "Erro ao remover anexo", variant: "destructive" });
    }
  };

  const handleFinalize = async (contract: any) => {
    try {
      const itemStatuses = contract.items.map((item: any) => ({
        equipmentId: item.equipmentId,
        quantityRented: item.quantity,
        quantityReturned: item.quantity,
      }));
      await finalizeContract(contract.id, 0, itemStatuses);
      toast({ title: "Contrato finalizado com sucesso!" });
    } catch (err: any) {
      toast({ title: err.message || "Erro ao finalizar", variant: "destructive" });
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

  const getContractInstallments = (contractId: string) => {
    const contractRevenues = revenues.filter((r: any) => r.contractId === contractId);
    const total = contractRevenues.length;
    const paid = contractRevenues.filter((r: any) => r.status === "recebido").length;
    return { paid, total };
  };

  const getMonthlyValue = (contract: any) => {
    return contract.items?.reduce((acc: number, item: any) => acc + item.quantity * item.unitPrice, 0) || 0;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Filters */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Filtros de Contratos</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Gerar faturas (PDF)
            </Button>
            <Button variant="outline" size="sm" onClick={handleAddNew}>
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
                  <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                  <SelectItem value="Finalizado">Finalizado</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contratos de Locação */}
      <Collapsible open={locacaoOpen} onOpenChange={setLocacaoOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Contratos de Locação</CardTitle>
              <ChevronUp className={cn("h-5 w-5 transition-transform", !locacaoOpen && "rotate-180")} />
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox />
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
                  {filtered.length > 0 ? (
                    filtered.map((contract: any) => {
                      const installments = getContractInstallments(contract.id);
                      const monthlyValue = getMonthlyValue(contract);
                      const totalItems = contract.items?.reduce((acc: number, i: any) => acc + (i.quantity || 0), 0) || 0;

                      return (
                        <TableRow key={contract.id}>
                          <TableCell>
                            <Checkbox />
                          </TableCell>
                          <TableCell className="font-medium text-primary">{contract.id}</TableCell>
                          <TableCell>{getClientName(contract.clientId)}</TableCell>
                          <TableCell>{totalItems}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {installments.paid}/{installments.total}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(contract.endDate)}</TableCell>
                          <TableCell>
                            <div>
                              <span className="font-semibold">{formatCurrency(monthlyValue)}</span>
                              <br />
                              <span className="text-xs text-muted-foreground">
                                Total: {formatCurrency(contract.totalValue || monthlyValue * installments.total)}
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
                                <DropdownMenuItem onClick={() => handleEdit(contract)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver Detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <FileText className="mr-2 h-4 w-4" />
                                  Fatura de Locação
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEdit(contract)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRecalculate(contract.id)}>
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  Recalcular Parcelas
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <FileCheck className="mr-2 h-4 w-4" />
                                  Recibo de Entrega
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAttachContract(contract.id)}>
                                  <Upload className="mr-2 h-4 w-4" />
                                  Anexar Contrato
                                </DropdownMenuItem>
                                {contract.signedContractUrl && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => window.open(contract.signedContractUrl, "_blank")}
                                    >
                                      <FileCheck className="mr-2 h-4 w-4" />
                                      Ver Contrato Assinado
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() => handleDeleteAttachment(contract.id)}
                                    >
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Excluir Anexo
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {contract.status === "Em Andamento" && (
                                  <DropdownMenuItem onClick={() => handleFinalize(contract)}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Finalizar Contrato
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setDeleteId(contract.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
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

      <AddContractDialog open={isDialogOpen} onOpenChange={handleCloseDialog} contract={editingContract} />

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
