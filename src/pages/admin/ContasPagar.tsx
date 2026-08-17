//src/pages/admin/ContasPagar.tsx

import { useState, useMemo, useEffect } from "react";
import { useStore } from "@/store";
import { cn, formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  TrendingDown,
  AlertCircle,
  Plus,
  ArrowLeftRight,
  Search,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  CheckCircle,
  Upload,
  Undo2,
  CalendarIcon,
  ArrowUp,
  ArrowDown,
  Link as LinkIcon,
} from "lucide-react";
import {
  format,
  isBefore,
  startOfToday,
  isSameDay,
  startOfDay,
  endOfDay,
  isWithinInterval,
  compareAsc,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { useNavigate } from "react-router-dom";
import { AddExpenseDialog } from "@/components/financeiro/AddExpenseDialog";
import { TransferDialog } from "@/components/financeiro/TransferDialog";
import { AttachReceiptDialog } from "@/components/financeiro/AttachReceiptDialog";
import { toast } from "sonner";
import { openPrivateFile } from "@/lib/private-file";

type SortableKeys = "dueDate" | "description" | "valorTotal" | "currentStatus";

const ContasPagar = () => {
  const navigate = useNavigate();

  const {
    expenses,
    bankAccounts,
    loading,
    fetchAllData,
    markExpenseAsPaid,
    unmarkExpenseAsPaid,
    deleteExpense,
    deleteReceiptFromExpense,
  } = useStore();

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showAttachReceipt, setShowAttachReceipt] = useState(false);

  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [viewingExpense, setViewingExpense] = useState<any>(null);
  const [expenseToAttach, setExpenseToAttach] = useState<any>(null);

  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<any>({});

  const [idFilter, setIdFilter] = useState("");
  const [descriptionFilter, setDescriptionFilter] = useState("");
  const [vencimentoDateFilter, setVencimentoDateFilter] = useState<DateRange | undefined>();
  const [competenceFilter, setCompetenceFilter] = useState("");
  const [minValueFilter, setMinValueFilter] = useState("");
  const [maxValueFilter, setMaxValueFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [bankAccountIdFilter, setBankAccountIdFilter] = useState("todos");

  const [sortConfig, setSortConfig] = useState<{
    key: SortableKeys;
    direction: "ascending" | "descending";
  } | null>({ key: "dueDate", direction: "ascending" });

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleSort = (key: SortableKeys) => {
    let direction: "ascending" | "descending" = "ascending";

    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }

    setSortConfig({ key, direction });
  };

  const handleSearch = () => {
    setActiveFilters({
      id: idFilter,
      description: descriptionFilter,
      vencimentoDate: vencimentoDateFilter,
      competence: competenceFilter,
      minValue: minValueFilter ? parseFloat(minValueFilter) : undefined,
      maxValue: maxValueFilter ? parseFloat(maxValueFilter) : undefined,
      status: statusFilter,
      bankAccountId: bankAccountIdFilter,
    });
  };

  const handleClearFilters = () => {
    setIdFilter("");
    setDescriptionFilter("");
    setVencimentoDateFilter(undefined);
    setCompetenceFilter("");
    setMinValueFilter("");
    setMaxValueFilter("");
    setStatusFilter("todos");
    setBankAccountIdFilter("todos");
    setActiveFilters({});
  };

  const {
    processedExpenses,
    totalAtrasado,
    totalPagarHoje,
  }: {
    processedExpenses: any[];
    totalAtrasado: number;
    totalPagarHoje: number;
  } = useMemo(() => {
    const today = startOfToday();

    const allExpensesWithStatus = expenses.map((expense: any) => {
      const dueDate = expense.dueDate ? new Date(expense.dueDate) : undefined;
      const statusNormalized = String(expense.status || "").toLowerCase();
      const isOverdue = dueDate && statusNormalized === "pendente" && isBefore(dueDate, today);

      return {
        ...expense,
        dueDate,
        currentStatus: isOverdue ? "atrasado" : statusNormalized,
        competenceMonth: expense.competenceDate
          ? format(new Date(expense.competenceDate), "MM/yyyy")
          : expense.competence
            ? format(new Date(expense.competence), "MM/yyyy")
            : null,
      };
    });

    const filtered = allExpensesWithStatus.filter((expense: any) => {
      const { id, description, vencimentoDate, competence, minValue, maxValue, status, bankAccountId } = activeFilters;

      if (id && !String(expense.id).toLowerCase().includes(id.toLowerCase())) return false;

      if (
        description &&
        !String(expense.description || "")
          .toLowerCase()
          .includes(description.toLowerCase())
      ) {
        return false;
      }

      if (
        vencimentoDate?.from &&
        expense.dueDate &&
        !isWithinInterval(expense.dueDate, {
          start: startOfDay(vencimentoDate.from),
          end: endOfDay(vencimentoDate.to || vencimentoDate.from),
        })
      ) {
        return false;
      }

      if (competence && expense.competenceMonth !== competence) return false;
      if (minValue !== undefined && (expense.valorTotal || 0) < minValue) return false;
      if (maxValue !== undefined && (expense.valorTotal || 0) > maxValue) return false;
      if (status && status !== "todos" && expense.currentStatus !== status) return false;
      if (bankAccountId && bankAccountId !== "todos" && expense.bankAccountId !== bankAccountId) return false;

      return true;
    });

    if (sortConfig) {
      filtered.sort((a: any, b: any) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        let comparison = 0;

        if (sortConfig.key === "dueDate" && aValue instanceof Date && bValue instanceof Date) {
          comparison = compareAsc(aValue, bValue);
        } else if (typeof aValue === "string" && typeof bValue === "string") {
          comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === "number" && typeof bValue === "number") {
          comparison = aValue - bValue;
        }

        return sortConfig.direction === "descending" ? comparison * -1 : comparison;
      });
    }

    const totalAtrasado = allExpensesWithStatus
      .filter((expense: any) => expense.currentStatus === "atrasado")
      .reduce((sum: number, expense: any) => sum + (expense.valorTotal || 0), 0);

    const totalPagarHoje = allExpensesWithStatus
      .filter(
        (expense: any) =>
          expense.dueDate &&
          String(expense.status || "").toLowerCase() === "pendente" &&
          isSameDay(expense.dueDate, today),
      )
      .reduce((sum: number, expense: any) => sum + (expense.valorTotal || 0), 0);

    return { processedExpenses: filtered, totalAtrasado, totalPagarHoje };
  }, [expenses, activeFilters, sortConfig]);

  const renderSortArrow = (key: SortableKeys) => {
    if (sortConfig?.key === key) {
      return sortConfig.direction === "ascending" ? (
        <ArrowUp className="h-4 w-4 ml-1 inline" />
      ) : (
        <ArrowDown className="h-4 w-4 ml-1 inline" />
      );
    }
    return null;
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "pago":
        return <Badge className="bg-success/20 text-success border-0 capitalize">Pago</Badge>;
      case "atrasado":
        return <Badge className="bg-destructive/20 text-destructive border-0 capitalize">Atrasado</Badge>;
      case "cancelado":
        return <Badge className="bg-muted text-muted-foreground border-0 capitalize">Cancelado</Badge>;
      default:
        return <Badge className="bg-warning/20 text-warning border-0 capitalize">Pendente</Badge>;
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await markExpenseAsPaid(id);
      toast.success("Marcado como pago!");
    } catch {
      toast.error("Erro ao marcar como pago.");
    }
  };

  const handleUnmarkPaid = async (id: string) => {
    try {
      await unmarkExpenseAsPaid(id);
      toast.success("Pagamento desmarcado!");
    } catch {
      toast.error("Erro ao desmarcar pagamento.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteExpense(id);
      toast.success("Despesa excluída!");
    } catch {
      toast.error("Erro ao excluir.");
    }
  };

  const handleDeleteReceipt = async (id: string) => {
    try {
      await deleteReceiptFromExpense(id);
      toast.success("Comprovante excluído!");
    } catch {
      toast.error("Erro ao excluir comprovante.");
    }
  };

  const handleAddNew = () => {
    setEditingExpense(null);
    setViewingExpense(null);
    setShowAddExpense(true);
  };

  const handleEdit = (expense: any) => {
    setEditingExpense(expense);
    setViewingExpense(null);
    setShowAddExpense(true);
  };

  const handleView = (expense: any) => {
    setEditingExpense(null);
    setViewingExpense(expense);
    setShowAddExpense(true);
  };

  const handleAttachReceipt = (expense: any) => {
    setExpenseToAttach(expense);
    setShowAttachReceipt(true);
  };

  const handleCloseExpenseDialog = (open: boolean) => {
    if (!open) {
      setEditingExpense(null);
      setViewingExpense(null);
    }
    setShowAddExpense(open);
  };

  return (
    <div className="space-y-6">
      <Tabs
        value="pagar"
        onValueChange={(value) => {
          if (value === "receber") navigate("/admin/financeiro/receber");
        }}
      >
        <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-0 h-auto p-0">
          <TabsTrigger
            value="receber"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 text-sm"
          >
            Contas a Receber
          </TabsTrigger>
          <TabsTrigger
            value="pagar"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 text-sm"
          >
            Contas a Pagar
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">A Pagar Hoje</span>
              <TrendingDown className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-xl font-bold text-foreground">{loading ? "..." : formatCurrency(totalPagarHoje)}</p>
            <p className="text-xs text-muted-foreground">Soma das despesas com vencimento hoje.</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Contas Atrasadas</span>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </div>
            <p className="text-xl font-bold text-destructive">{loading ? "..." : formatCurrency(totalAtrasado)}</p>
            <p className="text-xs text-muted-foreground">Total de contas com pagamento vencido.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Busca Avançada</h3>
              <p className="text-xs text-muted-foreground">Utilize os filtros para refinar sua busca.</p>
            </div>

            <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowFilters(!showFilters)}>
              <Search className="h-4 w-4" />
              Mostrar/Ocultar Filtros
              {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </div>

          {showFilters && (
            <div className="mt-4 border-t pt-4 grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-4">
              <div className="space-y-2">
                <Label>Código</Label>
                <Input
                  placeholder="ID do lançamento..."
                  value={idFilter}
                  onChange={(e) => setIdFilter(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  placeholder="Parte da descrição..."
                  value={descriptionFilter}
                  onChange={(e) => setDescriptionFilter(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Período de Vencimento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !vencimentoDateFilter && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {vencimentoDateFilter?.from ? (
                        vencimentoDateFilter.to ? (
                          <>
                            {format(vencimentoDateFilter.from, "dd/MM/yyyy")} -{" "}
                            {format(vencimentoDateFilter.to, "dd/MM/yyyy")}
                          </>
                        ) : (
                          format(vencimentoDateFilter.from, "dd/MM/yyyy")
                        )
                      ) : (
                        <span>Selecione</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      selected={vencimentoDateFilter}
                      onSelect={setVencimentoDateFilter}
                      numberOfMonths={2}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Mês de Competência</Label>
                <Input
                  placeholder="mm/aaaa"
                  value={competenceFilter}
                  onChange={(e) => setCompetenceFilter(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Valor Mín.</Label>
                <Input
                  placeholder="0,00"
                  type="number"
                  value={minValueFilter}
                  onChange={(e) => setMinValueFilter(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Valor Máx.</Label>
                <Input
                  placeholder="1000,00"
                  type="number"
                  value={maxValueFilter}
                  onChange={(e) => setMaxValueFilter(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Situação</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="atrasado">Atrasado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Conta Bancária</Label>
                <Select value={bankAccountIdFilter} onValueChange={setBankAccountIdFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    {bankAccounts.map((account: any) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-4 flex items-center gap-2 mt-2">
                <Button onClick={handleSearch}>
                  <Search className="mr-2 h-4 w-4" />
                  Buscar
                </Button>
                <Button variant="destructive" onClick={handleClearFilters}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Limpar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Contas a Pagar</CardTitle>
              <CardDescription>Gerencie suas despesas e faturas de fornecedores.</CardDescription>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowTransfer(true)}>
                <ArrowLeftRight className="h-4 w-4" />
                Transferência
              </Button>

              <Button size="sm" className="gap-2" onClick={handleAddNew}>
                <Plus className="h-4 w-4" />
                Nova Despesa
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => handleSort("dueDate")}>
                  Vencimento {renderSortArrow("dueDate")}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("description")}>
                  Descrição {renderSortArrow("description")}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("valorTotal")}>
                  Valor {renderSortArrow("valorTotal")}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("currentStatus")}>
                  Status {renderSortArrow("currentStatus")}
                </TableHead>
                <TableHead>Ação de Pagar</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {processedExpenses.length > 0 ? (
                processedExpenses.map((expense: any) => (
                  <TableRow key={expense.id}>
                    <TableCell className="text-sm">
                      {expense.dueDate ? format(expense.dueDate, "dd/MM/yyyy") : "-"}
                    </TableCell>

                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        {expense.isTransfer && <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />}
                        <span>{expense.description || "-"}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-sm">{formatCurrency(expense.valorTotal || 0)}</TableCell>

                    <TableCell>{getStatusBadge(expense.currentStatus)}</TableCell>

                    <TableCell>
                      {(expense.currentStatus === "pendente" || expense.currentStatus === "atrasado") && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleMarkPaid(expense.id)}
                        >
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          Marcar como Pago
                        </Button>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(expense)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => handleEdit(expense)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>

                          {expense.currentStatus === "pago" && (
                            <DropdownMenuItem onClick={() => handleUnmarkPaid(expense.id)}>
                              <Undo2 className="h-4 w-4 mr-2" />
                              Desmarcar Pago
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />

                          {expense.receiptUrl ? (
                            <>
                              <DropdownMenuItem onClick={() => openPrivateFile(expense.receiptUrl)}>
                                <LinkIcon className="h-4 w-4 mr-2" />
                                Visualizar Comprovante
                              </DropdownMenuItem>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir Comprovante
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>

                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir comprovante?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir este comprovante? Esta ação não poderá ser
                                      desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>

                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteReceipt(expense.id)}>
                                      Excluir comprovante
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          ) : (
                            <DropdownMenuItem onClick={() => handleAttachReceipt(expense)}>
                              <Upload className="h-4 w-4 mr-2" />
                              Anexar Comprovante
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />

                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(expense.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">
                    Nenhuma despesa encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddExpenseDialog
        open={showAddExpense}
        onOpenChange={handleCloseExpenseDialog}
        expense={editingExpense || viewingExpense}
        viewOnly={!!viewingExpense}
      />

      <TransferDialog open={showTransfer} onOpenChange={setShowTransfer} />

      <AttachReceiptDialog open={showAttachReceipt} onOpenChange={setShowAttachReceipt} expense={expenseToAttach} />
    </div>
  );
};

export default ContasPagar;
