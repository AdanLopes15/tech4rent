import { useState, useMemo, useEffect } from "react";
import { useStore } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, Wallet, TrendingUp, TrendingDown, Info, ArrowLeftRight, Download } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, isBefore, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { useNavigate } from "react-router-dom";
import { TransferDialog } from "@/components/financeiro/TransferDialog";

const Extrato = () => {
  const navigate = useNavigate();
  const { revenues, expenses, bankAccounts, loading, fetchAllData } = useStore();
  const now = new Date();

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(now),
    to: endOfMonth(now),
  });
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [showTransfer, setShowTransfer] = useState(false);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  const tabItems = [
    { value: "visao-geral", label: "Visão Geral", path: "/admin/financeiro" },
    { value: "receber", label: "Contas a Receber", path: "/admin/financeiro/receber" },
    { value: "pagar", label: "Contas a Pagar", path: "/admin/financeiro/pagar" },
    { value: "fluxo-caixa", label: "Fluxo de Caixa", path: "/admin/financeiro/fluxo-caixa" },
    { value: "extrato", label: "Extrato" },
    { value: "dre", label: "DRE", path: "/admin/financeiro/dre" },
    { value: "relatorios", label: "Relatórios", path: "/admin/financeiro/relatorios" },
  ];

  const filteredRevenues = useMemo(() => {
    if (selectedAccount === "all") return revenues;
    return revenues.filter((r: any) => r.bankAccountId === selectedAccount);
  }, [revenues, selectedAccount]);

  const filteredExpenses = useMemo(() => {
    if (selectedAccount === "all") return expenses;
    return expenses.filter((e: any) => e.bankAccountId === selectedAccount);
  }, [expenses, selectedAccount]);

  const summary = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return { saldoAnterior: 0, entradas: 0, saidas: 0, saldoFinal: 0 };
    const interval = { start: dateRange.from, end: dateRange.to };

    const recBefore = filteredRevenues
      .filter((r: any) => r.dueDate && r.status === "recebido" && isBefore(new Date(r.dueDate), dateRange.from!))
      .reduce((s: number, r: any) => s + (r.valorTotal || 0), 0);
    const expBefore = filteredExpenses
      .filter((e: any) => e.dueDate && e.status === "pago" && isBefore(new Date(e.dueDate), dateRange.from!))
      .reduce((s: number, e: any) => s + (e.valorTotal || 0), 0);
    const saldoAnterior = recBefore - expBefore;

    const entradas = filteredRevenues
      .filter((r: any) => r.dueDate && r.status === "recebido" && isWithinInterval(new Date(r.dueDate), interval))
      .reduce((s: number, r: any) => s + (r.valorTotal || 0), 0);
    const saidas = filteredExpenses
      .filter((e: any) => e.dueDate && e.status === "pago" && isWithinInterval(new Date(e.dueDate), interval))
      .reduce((s: number, e: any) => s + (e.valorTotal || 0), 0);

    return { saldoAnterior, entradas, saidas, saldoFinal: saldoAnterior + entradas - saidas };
  }, [filteredRevenues, filteredExpenses, dateRange]);

  // Build statement entries
  const entries = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return [];
    const interval = { start: dateRange.from, end: dateRange.to };

    const items: { date: Date; description: string; entrada: number; saida: number }[] = [];

    filteredRevenues
      .filter((r: any) => r.dueDate && r.status === "recebido" && isWithinInterval(new Date(r.dueDate), interval))
      .forEach((r: any) => items.push({ date: new Date(r.dueDate), description: r.description || r.clientName || "Receita", entrada: r.valorTotal || 0, saida: 0 }));

    filteredExpenses
      .filter((e: any) => e.dueDate && e.status === "pago" && isWithinInterval(new Date(e.dueDate), interval))
      .forEach((e: any) => items.push({ date: new Date(e.dueDate), description: e.description || e.supplierName || "Despesa", entrada: 0, saida: e.valorTotal || 0 }));

    items.sort((a, b) => a.date.getTime() - b.date.getTime());

    let running = summary.saldoAnterior;
    return items.map((item) => {
      running += item.entrada - item.saida;
      return { ...item, saldo: running };
    });
  }, [filteredRevenues, filteredExpenses, dateRange, summary.saldoAnterior]);

  const exportCSV = () => {
    const header = "Data,Descrição,Entradas,Saídas,Saldo\n";
    const rows = entries.map((e) =>
      `${format(e.date, "dd/MM/yyyy")},"${e.description}",${e.entrada},${e.saida},${e.saldo}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "extrato.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Tabs value="extrato" onValueChange={(val) => {
        const tab = tabItems.find(t => t.value === val);
        if (tab && "path" in tab && tab.path) navigate(tab.path);
      }}>
        <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-0 h-auto p-0">
          {tabItems.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 text-sm">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Filters */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1">Relatório de Extrato Bancário</h3>
          <p className="text-xs text-muted-foreground mb-3">Visualize o extrato consolidado de suas contas para conciliação.</p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Período de Análise</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? format(dateRange.from, "dd/MM/yyyy") : ""} - {dateRange?.to ? format(dateRange.to, "dd/MM/yyyy") : ""}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="range" selected={dateRange} onSelect={setDateRange} locale={ptBR} numberOfMonths={2} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Conta Bancária</span>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Contas</SelectItem>
                  {bankAccounts.map((ba: any) => <SelectItem key={ba.id} value={ba.id}>{ba.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full gap-2" onClick={() => setShowTransfer(true)}>
                <ArrowLeftRight className="h-4 w-4" /> Transferência
              </Button>
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full gap-2" onClick={exportCSV}>
                <Download className="h-4 w-4" /> Exportar CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Saldo Anterior</span>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xl font-bold text-foreground">{loading ? "..." : formatCurrency(summary.saldoAnterior)}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Total de Entradas</span>
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <p className="text-xl font-bold text-success">{loading ? "..." : formatCurrency(summary.entradas)}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Total de Saídas</span>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </div>
            <p className="text-xl font-bold text-destructive">{loading ? "..." : formatCurrency(summary.saidas)}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Saldo Final</span>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xl font-bold text-foreground">{loading ? "..." : formatCurrency(summary.saldoFinal)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Statement Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Lançamentos do Período</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Entradas</TableHead>
                <TableHead>Saídas</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Saldo Anterior row */}
              <TableRow className="bg-muted/30 font-semibold">
                <TableCell colSpan={4} className="text-sm font-bold">SALDO ANTERIOR</TableCell>
                <TableCell className="text-sm text-right font-bold">{formatCurrency(summary.saldoAnterior)}</TableCell>
              </TableRow>

              {entries.length > 0 ? entries.map((e, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm">{format(e.date, "dd/MM/yyyy")}</TableCell>
                  <TableCell className="text-sm">{e.description}</TableCell>
                  <TableCell className="text-sm text-success">{e.entrada > 0 ? formatCurrency(e.entrada) : "-"}</TableCell>
                  <TableCell className="text-sm text-destructive">{e.saida > 0 ? formatCurrency(e.saida) : "-"}</TableCell>
                  <TableCell className="text-sm text-right">{formatCurrency(e.saldo)}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">
                    Nenhum lançamento para exibir.
                  </TableCell>
                </TableRow>
              )}

              {/* Saldo Final row */}
              <TableRow className="bg-muted/30 font-semibold">
                <TableCell colSpan={4} className="text-sm font-bold">SALDO FINAL</TableCell>
                <TableCell className="text-sm text-right font-bold">{formatCurrency(summary.saldoFinal)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <TransferDialog open={showTransfer} onOpenChange={setShowTransfer} />
    </div>
  );
};

export default Extrato;
