import { useState, useMemo, useEffect, useRef } from "react";
import { useStore } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TrendingDown, AlertCircle, Plus, ArrowLeftRight, Search, ChevronDown, ChevronUp, MoreHorizontal, Eye, Pencil, Trash2, CheckCircle, Upload, Undo2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format, isToday, isBefore, startOfDay } from "date-fns";
import { useNavigate } from "react-router-dom";
import { AddExpenseDialog } from "@/components/financeiro/AddExpenseDialog";
import { TransferDialog } from "@/components/financeiro/TransferDialog";
import { toast } from "sonner";

const ContasPagar = () => {
  const navigate = useNavigate();
  const { expenses, loading, fetchAllData, markExpenseAsPaid, unmarkExpenseAsPaid, deleteExpense, attachReceiptToExpense } = useStore();

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterSearch, setFilterSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachingId, setAttachingId] = useState<string | null>(null);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  const aPagarHoje = useMemo(() =>
    expenses.filter((e: any) => e.dueDate && isToday(new Date(e.dueDate)) && e.status !== "pago")
      .reduce((s: number, e: any) => s + (e.valorTotal || 0), 0),
    [expenses]
  );

  const contasAtrasadas = useMemo(() =>
    expenses.filter((e: any) => e.dueDate && isBefore(new Date(e.dueDate), startOfDay(new Date())) && e.status !== "pago")
      .reduce((s: number, e: any) => s + (e.valorTotal || 0), 0),
    [expenses]
  );

  const filteredExpenses = useMemo(() => {
    let filtered = [...expenses];
    if (filterStatus !== "todos") filtered = filtered.filter((e: any) => e.status === filterStatus);
    if (filterSearch) {
      const search = filterSearch.toLowerCase();
      filtered = filtered.filter((e: any) =>
        (e.description || "").toLowerCase().includes(search) ||
        (e.supplierName || "").toLowerCase().includes(search)
      );
    }
    return filtered.sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [expenses, filterStatus, filterSearch]);

  const handleMarkPaid = async (id: string) => {
    try { await markExpenseAsPaid(id); toast.success("Marcado como pago!"); }
    catch { toast.error("Erro ao marcar."); }
  };

  const handleUnmarkPaid = async (id: string) => {
    try { await unmarkExpenseAsPaid(id); toast.success("Desmarcado!"); }
    catch { toast.error("Erro ao desmarcar."); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteExpense(id); toast.success("Despesa excluída!"); }
    catch { toast.error("Erro ao excluir."); }
  };

  const handleAttachReceipt = (id: string) => {
    setAttachingId(id);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !attachingId) return;
    try {
      await attachReceiptToExpense(attachingId, file);
      toast.success("Comprovante anexado!");
    } catch { toast.error("Erro ao anexar."); }
    finally { setAttachingId(null); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "pago": return <Badge className="bg-success/20 text-success border-0">Pago</Badge>;
      case "atrasado": return <Badge className="bg-destructive/20 text-destructive border-0">Atrasado</Badge>;
      default: return <Badge className="bg-warning/20 text-warning border-0">Pendente</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileChange} />

      {/* Tabs */}
      <Tabs value="pagar" onValueChange={(val) => { if (val === "receber") navigate("/admin/financeiro/receber"); }}>
        <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-0 h-auto p-0">
          <TabsTrigger value="receber" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 text-sm">Contas a Receber</TabsTrigger>
          <TabsTrigger value="pagar" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 text-sm">Contas a Pagar</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">A Pagar Hoje</span>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xl font-bold text-foreground">{loading ? "..." : formatCurrency(aPagarHoje)}</p>
            <p className="text-xs text-muted-foreground">Soma das despesas com vencimento hoje.</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Contas Atrasadas</span>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </div>
            <p className="text-xl font-bold text-destructive">{loading ? "..." : formatCurrency(contasAtrasadas)}</p>
            <p className="text-xs text-muted-foreground">Total de contas com pagamento vencido.</p>
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
              <Input placeholder="Buscar por descrição ou fornecedor..." value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)} />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Contas a Pagar</CardTitle>
              <p className="text-xs text-muted-foreground">Gerencie suas despesas e faturas de fornecedores.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowTransfer(true)}>
                <ArrowLeftRight className="h-4 w-4" /> Transferência
              </Button>
              <Button size="sm" className="gap-2" onClick={() => { setEditingExpense(null); setShowAddExpense(true); }}>
                <Plus className="h-4 w-4" /> Nova Despesa
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vencimento</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ação de Pagar</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((e: any) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-sm">{e.dueDate ? format(new Date(e.dueDate), "dd/MM/yyyy") : "-"}</TableCell>
                    <TableCell className="text-sm">{e.description || "-"}</TableCell>
                    <TableCell className="text-sm">{formatCurrency(e.valorTotal || 0)}</TableCell>
                    <TableCell>{getStatusBadge(e.status)}</TableCell>
                    <TableCell>
                      {e.status !== "pago" && (
                        <Button variant="outline" size="sm" className="gap-1 text-success border-success/50 hover:bg-success/10" onClick={() => handleMarkPaid(e.id)}>
                          <CheckCircle className="h-3 w-3" /> Marcar como Pago
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditingExpense(e); setShowAddExpense(true); }}>
                            <Pencil className="h-4 w-4 mr-2" /> Editar
                          </DropdownMenuItem>
                          {e.status === "pago" && (
                            <DropdownMenuItem onClick={() => handleUnmarkPaid(e.id)}>
                              <Undo2 className="h-4 w-4 mr-2" /> Desmarcar Pago
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleAttachReceipt(e.id)}>
                            <Upload className="h-4 w-4 mr-2" /> Anexar Comprovante
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(e.id)}>
                            <Trash2 className="h-4 w-4 mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">Nenhuma despesa encontrada.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddExpenseDialog open={showAddExpense} onOpenChange={setShowAddExpense} editingExpense={editingExpense} />
      <TransferDialog open={showTransfer} onOpenChange={setShowTransfer} />
    </div>
  );
};

export default ContasPagar;
