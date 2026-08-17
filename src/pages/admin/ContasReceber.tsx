//src/pages/admin/ContasReceber.tsx

import { useState, useMemo } from "react";
import { useStore } from "@/store";
import { cn, formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  TrendingUp,
  AlertCircle,
  Plus,
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  Search,
  MoreHorizontal,
  RefreshCw,
  Pencil,
  Trash2,
  Eye,
  CheckCircle,
  CalendarIcon,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import {
  format,
  isToday,
  isBefore,
  startOfDay,
  endOfDay,
  isWithinInterval,
  startOfToday,
  isSameDay,
  compareAsc,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { useNavigate } from "react-router-dom";
import { AddRevenueDialog } from "@/components/financeiro/AddRevenueDialog";
import { TransferDialog } from "@/components/financeiro/TransferDialog";
import { toast } from "sonner";

type SortableKeys = "dueDate" | "clientName" | "description" | "valorTotal" | "status";

interface RevenueGroup {
  key: string;
  contractId?: string;
  clientName: string;
  status: string;
  totalValue: number;
  installments: any[];
}

const ContasReceber = () => {
  const navigate = useNavigate();

  const {
    revenues,
    clients,
    contracts,
    bankAccounts,
    loading,
    markRevenueAsReceived,
    markRevenueAsPending,
    deleteRevenue,
  } = useStore();

  const [showAddRevenue, setShowAddRevenue] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [editingRevenue, setEditingRevenue] = useState<any>(null);
  const [viewingRevenue, setViewingRevenue] = useState<any>(null);

  const [showFilters, setShowFilters] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const [activeFilters, setActiveFilters] = useState<any>({});

  const [idFilter, setIdFilter] = useState("");
  const [descriptionFilter, setDescriptionFilter] = useState("");
  const [clientIdFilter, setClientIdFilter] = useState("todos");
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

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const getClientName = (id?: string) => clients.find((client: any) => client.id === id)?.razaoSocial || "N/A";

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
      clientId: clientIdFilter,
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
    setClientIdFilter("todos");
    setVencimentoDateFilter(undefined);
    setCompetenceFilter("");
    setMinValueFilter("");
    setMaxValueFilter("");
    setStatusFilter("todos");
    setBankAccountIdFilter("todos");
    setActiveFilters({});
  };

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

  const {
    groupedRevenues,
    totalVencido,
    totalReceberHoje,
  }: {
    groupedRevenues: RevenueGroup[];
    totalVencido: number;
    totalReceberHoje: number;
  } = useMemo(() => {
    const today = startOfToday();

    const allRevenuesWithDetails = revenues.map((revenue: any) => {
      const dueDate = revenue.dueDate ? new Date(revenue.dueDate) : undefined;
      const statusNormalized = String(revenue.status || "").toLowerCase();
      const isOverdue = dueDate && statusNormalized === "pendente" && isBefore(dueDate, today);

      return {
        ...revenue,
        dueDate,
        clientName: getClientName(revenue.clientId),
        currentStatus: isOverdue ? "atrasado" : statusNormalized,
        competenceMonth: revenue.competenceDate
          ? format(new Date(revenue.competenceDate), "MM/yyyy")
          : revenue.competence
            ? format(new Date(revenue.competence), "MM/yyyy")
            : null,
      };
    });

    let filtered = allRevenuesWithDetails.filter((revenue: any) => {
      const { id, description, clientId, vencimentoDate, competence, minValue, maxValue, status, bankAccountId } =
        activeFilters;

      if (id && !String(revenue.id).toLowerCase().includes(id.toLowerCase())) return false;
      if (
        description &&
        !String(revenue.description || "")
          .toLowerCase()
          .includes(description.toLowerCase())
      )
        return false;
      if (clientId && clientId !== "todos" && revenue.clientId !== clientId) return false;

      if (
        vencimentoDate?.from &&
        revenue.dueDate &&
        !isWithinInterval(revenue.dueDate, {
          start: startOfDay(vencimentoDate.from),
          end: endOfDay(vencimentoDate.to || vencimentoDate.from),
        })
      )
        return false;

      if (competence && revenue.competenceMonth !== competence) return false;
      if (minValue !== undefined && (revenue.valorTotal || 0) < minValue) return false;
      if (maxValue !== undefined && (revenue.valorTotal || 0) > maxValue) return false;

      if (status && status !== "todos") {
        if (status === "atrasado") {
          if (revenue.currentStatus !== "atrasado") return false;
        } else if (String(revenue.status || "").toLowerCase() !== status) {
          return false;
        }
      }

      if (bankAccountId && bankAccountId !== "todos" && revenue.bankAccountId !== bankAccountId) return false;

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

    const grouped = filtered.reduce<Record<string, RevenueGroup>>((acc, revenue: any) => {
      const key = revenue.contractId || `avulso-${revenue.clientId || "sem-cliente"}`;

      if (!acc[key]) {
        const contract = contracts.find((c: any) => c.id === revenue.contractId);

        acc[key] = {
          key,
          contractId: revenue.contractId,
          clientName: revenue.clientName,
          totalValue: contract?.totalValue || 0,
          status: contract?.status || "Avulso",
          installments: [],
        };
      }

      acc[key].installments.push(revenue);
      return acc;
    }, {});

    const sortedGroups: RevenueGroup[] = Object.values(grouped).sort((a: RevenueGroup, b: RevenueGroup) => {
      if (!a.contractId && b.contractId) return -1;
      if (a.contractId && !b.contractId) return 1;

      if (a.contractId && b.contractId) {
        return String(a.contractId).localeCompare(String(b.contractId), undefined, {
          numeric: true,
        });
      }

      return a.clientName.localeCompare(b.clientName);
    });

    const totalVencido = allRevenuesWithDetails
      .filter((revenue: any) => revenue.currentStatus === "atrasado")
      .reduce((sum: number, revenue: any) => sum + (revenue.valorTotal || 0), 0);

    const totalReceberHoje = allRevenuesWithDetails
      .filter(
        (revenue: any) =>
          revenue.dueDate &&
          String(revenue.status || "").toLowerCase() === "pendente" &&
          isSameDay(revenue.dueDate, today),
      )
      .reduce((sum: number, revenue: any) => sum + (revenue.valorTotal || 0), 0);

    return { groupedRevenues: sortedGroups, totalVencido, totalReceberHoje };
  }, [revenues, contracts, clients, activeFilters, sortConfig]);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "recebido":
        return <Badge className="bg-success/20 text-success border-0 capitalize">Recebido</Badge>;
      case "atrasado":
        return <Badge className="bg-destructive/20 text-destructive border-0 capitalize">Atrasado</Badge>;
      case "cancelado":
        return <Badge className="bg-muted text-muted-foreground border-0 capitalize">Cancelado</Badge>;
      default:
        return <Badge className="bg-warning/20 text-warning border-0 capitalize">Pendente</Badge>;
    }
  };

  const handleMarkReceived = async (id: string) => {
    try {
      await markRevenueAsReceived(id);
      toast.success("Marcado como recebido!");
    } catch {
      toast.error("Erro ao marcar como recebido.");
    }
  };

  const handleMarkPending = async (id: string) => {
    try {
      await markRevenueAsPending(id);
      toast.success("Marcado como aberto!");
    } catch {
      toast.error("Erro ao marcar como aberto.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRevenue(id);
      toast.success("Receita excluída!");
    } catch {
      toast.error("Erro ao excluir.");
    }
  };

  const handleAddNew = () => {
    setEditingRevenue(null);
    setViewingRevenue(null);
    setShowAddRevenue(true);
  };

  const handleEdit = (revenue: any) => {
    setEditingRevenue(revenue);
    setViewingRevenue(null);
    setShowAddRevenue(true);
  };

  const handleView = (revenue: any) => {
    setEditingRevenue(null);
    setViewingRevenue(revenue);
    setShowAddRevenue(true);
  };

  const handleCloseRevenueDialog = (open: boolean) => {
    if (!open) {
      setEditingRevenue(null);
      setViewingRevenue(null);
    }
    setShowAddRevenue(open);
  };

  return (
    <div className="space-y-6">
      <Tabs
        value="receber"
        onValueChange={(value) => {
          if (value === "pagar") navigate("/admin/financeiro/pagar");
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
              <span className="text-sm text-muted-foreground">A Receber Hoje</span>
              <TrendingUp className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-xl font-bold text-foreground">{loading ? "..." : formatCurrency(totalReceberHoje)}</p>
            <p className="text-xs text-muted-foreground">Soma das faturas com vencimento hoje.</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Contas Vencidas</span>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </div>
            <p className="text-xl font-bold text-destructive">{loading ? "..." : formatCurrency(totalVencido)}</p>
            <p className="text-xs text-muted-foreground">Total de faturas com pagamento vencido.</p>
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
                <Label>Cliente</Label>
                <Select value={clientIdFilter} onValueChange={setClientIdFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {clients.map((client: any) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.razaoSocial}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    <SelectItem value="recebido">Recebido</SelectItem>
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
              <CardTitle className="text-lg">Contas a Receber</CardTitle>
              <p className="text-xs text-muted-foreground">Gerencie suas faturas de clientes.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowTransfer(true)}>
                <ArrowLeftRight className="h-4 w-4" />
                Transferência
              </Button>
              <Button size="sm" className="gap-2" onClick={handleAddNew}>
                <Plus className="h-4 w-4" />
                Nova Receita
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-2">
          {groupedRevenues.length > 0 ? (
            groupedRevenues.map((group, index) => {
              const groupKey = group.contractId || `avulso-${index}`;
              const isOpen = expandedGroups.has(groupKey);

              return (
                <Collapsible key={groupKey} open={isOpen} onOpenChange={() => toggleGroup(groupKey)}>
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {group.contractId ? `Contrato ${group.contractId}` : "Receitas Avulsas"}
                        </p>
                        <p className="text-xs text-muted-foreground">{group.clientName}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        {group.contractId ? (
                          <Badge className="bg-success/20 text-success border-0">{group.status}</Badge>
                        ) : null}

                        <span className="text-sm font-semibold text-foreground">
                          {formatCurrency(
                            group.installments.reduce((sum: number, item: any) => sum + (item.valorTotal || 0), 0),
                          )}
                        </span>

                        {isOpen ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="border border-border border-t-0 rounded-b-lg overflow-hidden">
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
                            <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
                              Status {renderSortArrow("status")}
                            </TableHead>
                            <TableHead>Ação Rápida</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {group.installments.map((revenue: any) => (
                            <TableRow key={revenue.id}>
                              <TableCell className="text-sm">
                                {revenue.dueDate ? format(revenue.dueDate, "dd/MM/yyyy") : "-"}
                              </TableCell>

                              <TableCell className="text-sm">{revenue.description || "-"}</TableCell>

                              <TableCell className="text-sm">{formatCurrency(revenue.valorTotal || 0)}</TableCell>

                              <TableCell>{getStatusBadge(revenue.currentStatus)}</TableCell>

                              <TableCell>
                                {revenue.currentStatus === "pendente" || revenue.currentStatus === "atrasado" ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1"
                                    onClick={() => handleMarkReceived(revenue.id)}
                                  >
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                    Marcar como Recebido
                                  </Button>
                                ) : revenue.status === "recebido" ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1"
                                    onClick={() => handleMarkPending(revenue.id)}
                                  >
                                    <RefreshCw className="h-3 w-3 text-amber-500" />
                                    Marcar como Aberto
                                  </Button>
                                ) : null}
                              </TableCell>

                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>

                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleView(revenue)}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Visualizar
                                    </DropdownMenuItem>

                                    <DropdownMenuItem onClick={() => handleEdit(revenue)}>
                                      <Pencil className="h-4 w-4 mr-2" />
                                      Editar
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() => handleDelete(revenue.id)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Excluir
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })
          ) : (
            <div className="rounded-lg bg-muted/50 p-6 text-center text-sm text-muted-foreground">
              Nenhuma conta a receber encontrada com os filtros atuais.
            </div>
          )}
        </CardContent>
      </Card>

      <AddRevenueDialog
        open={showAddRevenue}
        onOpenChange={handleCloseRevenueDialog}
        revenue={editingRevenue || viewingRevenue}
        viewOnly={!!viewingRevenue}
      />

      <TransferDialog open={showTransfer} onOpenChange={setShowTransfer} />
    </div>
  );
};

export default ContasReceber;
