import { useState, useMemo, useEffect } from "react";
import { useStore } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TrendingUp, AlertCircle, Plus, ArrowLeftRight, ChevronDown, ChevronUp, Search, MoreHorizontal, RefreshCw, Pencil, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format, isToday, isBefore, startOfDay } from "date-fns";
import { useNavigate } from "react-router-dom";
import { AddRevenueDialog } from "@/components/financeiro/AddRevenueDialog";
import { TransferDialog } from "@/components/financeiro/TransferDialog";
import { toast } from "sonner";

interface RevenueGroup {
  key: string;
  title: string;
  subtitle: string;
  status?: string;
  total: number;
  items: any[];
}

const ContasReceber = () => {
  const navigate = useNavigate();
  const { revenues, contracts, clients, loading, fetchAllData, markRevenueAsReceived, markRevenueAsPending, deleteRevenue } = useStore();

  const [showAddRevenue, setShowAddRevenue] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [editingRevenue, setEditingRevenue] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterSearch, setFilterSearch] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // Summary cards
  const aReceberHoje = useMemo(() =>
    revenues
      .filter((r: any) => r.dueDate && isToday(new Date(r.dueDate)) && r.status !== "recebido")
      .reduce((s: number, r: any) => s + (r.valorTotal || 0), 0),
    [revenues]
  );

  const contasVencidas = useMemo(() =>
    revenues
      .filter((r: any) => r.dueDate && isBefore(new Date(r.dueDate), startOfDay(new Date())) && r.status !== "recebido")
      .reduce((s: number, r: any) => s + (r.valorTotal || 0), 0),
    [revenues]
  );

  // Group revenues by source (contract or avulsas)
  const groups: RevenueGroup[] = useMemo(() => {
    let filtered = [...revenues];

    if (filterStatus !== "todos") {
      filtered = filtered.filter((r: any) => r.status === filterStatus);
    }
    if (filterSearch) {
      const search = filterSearch.toLowerCase();
      filtered = filtered.filter((r: any) =>
        (r.description || "").toLowerCase().includes(search) ||
        (r.clientName || "").toLowerCase().includes(search)
      );
    }

    // Group by contractId or "avulsas-{clientId}"
    const map = new Map<string, RevenueGroup>();

    filtered.forEach((r: any) => {
      let key: string;
      let title: string;
      let subtitle: string;
      let status: string | undefined;

      if (r.contractId) {
        key = `contract-${r.contractId}`;
        const contract = contracts.find((c: any) => c.id === r.contractId);
        title = `Contrato ${r.contractId}`;
        subtitle = contract?.client?.razaoSocial || r.clientName || "N/A";
        status = contract?.status;
      } else {
        const clientKey = r.clientId || "no-client";
        key = `avulsas-${clientKey}`;
        title = "Receitas Avulsas";
        subtitle = r.clientName || "N/A";
      }

      if (!map.has(key)) {
        map.set(key, { key, title, subtitle, status, total: 0, items: [] });
      }
      const group = map.get(key)!;
      group.total += r.valorTotal || 0;
      group.items.push(r);
    });

    // Sort items within each group by dueDate
    map.forEach((group) => {
      group.items.sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    });

    return Array.from(map.values());
  }, [revenues, contracts, filterStatus, filterSearch]);

  const handleMarkReceived = async (id: string) => {
    try {
      await markRevenueAsReceived(id);
      toast.success("Marcado como recebido!");
    } catch { toast.error("Erro ao marcar."); }
  };

  const handleMarkPending = async (id: string) => {
    try {
      await markRevenueAsPending(id);
      toast.success("Marcado como aberto!");
    } catch { toast.error("Erro ao marcar."); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRevenue(id);
      toast.success("Receita excluída!");
    } catch { toast.error("Erro ao excluir."); }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "recebido":
        return <Badge className="bg-success/20 text-success border-0">Recebido</Badge>;
      case "vencido":
        return <Badge className="bg-destructive/20 text-destructive border-0">Vencido</Badge>;
      case "Cancelado":
        return <Badge className="bg-muted text-muted-foreground border-0">Cancelado</Badge>;
      default:
        return <Badge className="bg-warning/20 text-warning border-0">Pendente</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <Tabs value="receber" onValueChange={(val) => {
        if (val === "pagar") navigate("/admin/financeiro/pagar");
      }}>
        <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-0 h-auto p-0">
          <TabsTrigger value="receber" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 text-sm">
            Contas a Receber
          </TabsTrigger>
          <TabsTrigger value="pagar" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 text-sm">
            Contas a Pagar
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">A Receber Hoje</span>
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <p className="text-xl font-bold text-foreground">{loading ? "..." : formatCurrency(aReceberHoje)}</p>
            <p className="text-xs text-muted-foreground">Soma das faturas com vencimento hoje.</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Contas Vencidas</span>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </div>
            <p className="text-xl font-bold text-destructive">{loading ? "..." : formatCurrency(contasVencidas)}</p>
            <p className="text-xs text-muted-foreground">Total de faturas com pagamento vencido.</p>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Search */}
      <Card className="border-border">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Busca Avançada</h3>
              <p className="text-xs text-muted-foreground">Utilize os filtros para refinar sua busca.</p>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowFilters(!showFilters)}>
              <Search className="h-4 w-4" /> Mostrar/Ocultar Filtros
              {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </div>
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <Input placeholder="Buscar por descrição ou cliente..." value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="recebido">Recebido</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Contas a Receber</CardTitle>
              <p className="text-xs text-muted-foreground">Gerencie suas faturas de clientes.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowTransfer(true)}>
                <ArrowLeftRight className="h-4 w-4" /> Transferência
              </Button>
              <Button size="sm" className="gap-2" onClick={() => { setEditingRevenue(null); setShowAddRevenue(true); }}>
                <Plus className="h-4 w-4" /> Nova Receita
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {groups.length > 0 ? (
            groups.map((group) => (
              <Collapsible key={group.key} open={expandedGroups.has(group.key)} onOpenChange={() => toggleGroup(group.key)}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{group.title}</p>
                      <p className="text-xs text-muted-foreground">{group.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {group.status && (
                        <Badge className="bg-success/20 text-success border-0">{group.status}</Badge>
                      )}
                      <span className="text-sm font-semibold text-foreground">{formatCurrency(group.total)}</span>
                      {expandedGroups.has(group.key) ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="border border-border border-t-0 rounded-b-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Vencimento</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Ação Rápida</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.items.map((r: any) => (
                          <TableRow key={r.id}>
                            <TableCell className="text-sm">
                              {r.dueDate ? format(new Date(r.dueDate), "dd/MM/yyyy") : "-"}
                            </TableCell>
                            <TableCell className="text-sm">{r.description || "-"}</TableCell>
                            <TableCell className="text-sm">{formatCurrency(r.valorTotal || 0)}</TableCell>
                            <TableCell>{getStatusBadge(r.status)}</TableCell>
                            <TableCell>
                              {r.status === "recebido" ? (
                                <Button variant="outline" size="sm" className="gap-1" onClick={() => handleMarkPending(r.id)}>
                                  <RefreshCw className="h-3 w-3" /> Marcar como Aberto
                                </Button>
                              ) : (
                                <Button variant="outline" size="sm" className="gap-1 text-success border-success/50 hover:bg-success/10" onClick={() => handleMarkReceived(r.id)}>
                                  <RefreshCw className="h-3 w-3" /> Marcar como Recebido
                                </Button>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => { setEditingRevenue(r); setShowAddRevenue(true); }}>
                                    <Pencil className="h-4 w-4 mr-2" /> Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(r.id)}>
                                    <Trash2 className="h-4 w-4 mr-2" /> Excluir
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
            ))
          ) : (
            <div className="rounded-lg bg-muted/50 p-6 text-center text-sm text-muted-foreground">
              Nenhuma conta a receber encontrada.
            </div>
          )}
        </CardContent>
      </Card>

      <AddRevenueDialog open={showAddRevenue} onOpenChange={setShowAddRevenue} editingRevenue={editingRevenue} />
      <TransferDialog open={showTransfer} onOpenChange={setShowTransfer} />
    </div>
  );
};

export default ContasReceber;
