import { useState, useMemo, useEffect } from "react";
import { useStore } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, Wallet, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isBefore, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const FluxoCaixa = () => {
  const navigate = useNavigate();
  const { revenues, expenses, bankAccounts, loading, fetchAllData } = useStore();
  const now = new Date();

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(now),
    to: endOfMonth(now),
  });
  const [selectedAccount, setSelectedAccount] = useState("all");

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  const tabItems = [
    { value: "visao-geral", label: "Visão Geral", path: "/admin/financeiro" },
    { value: "receber", label: "Contas a Receber", path: "/admin/financeiro/receber" },
    { value: "pagar", label: "Contas a Pagar", path: "/admin/financeiro/pagar" },
    { value: "fluxo-caixa", label: "Fluxo de Caixa" },
    { value: "extrato", label: "Extrato", path: "/admin/financeiro/extrato" },
    { value: "dre", label: "DRE", path: "/admin/financeiro/dre" },
    { value: "relatorios", label: "Relatórios", path: "/admin/financeiro/relatorios" },
  ];

  // Filter by account
  const filteredRevenues = useMemo(() => {
    if (selectedAccount === "all") return revenues;
    return revenues.filter((r: any) => r.bankAccountId === selectedAccount);
  }, [revenues, selectedAccount]);

  const filteredExpenses = useMemo(() => {
    if (selectedAccount === "all") return expenses;
    return expenses.filter((e: any) => e.bankAccountId === selectedAccount);
  }, [expenses, selectedAccount]);

  // Summary cards
  const summary = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return { saldoAnterior: 0, entradas: 0, saidas: 0, saldoPeriodo: 0 };
    const interval = { start: dateRange.from, end: dateRange.to };

    // Saldo anterior: all received before period start minus all paid before period start
    const recBeforePeriod = filteredRevenues
      .filter((r: any) => r.dueDate && r.status === "recebido" && isBefore(new Date(r.dueDate), dateRange.from!))
      .reduce((s: number, r: any) => s + (r.valorTotal || 0), 0);
    const expBeforePeriod = filteredExpenses
      .filter((e: any) => e.dueDate && e.status === "pago" && isBefore(new Date(e.dueDate), dateRange.from!))
      .reduce((s: number, e: any) => s + (e.valorTotal || 0), 0);
    const saldoAnterior = recBeforePeriod - expBeforePeriod;

    const entradas = filteredRevenues
      .filter((r: any) => r.dueDate && r.status === "recebido" && isWithinInterval(new Date(r.dueDate), interval))
      .reduce((s: number, r: any) => s + (r.valorTotal || 0), 0);

    const saidas = filteredExpenses
      .filter((e: any) => e.dueDate && e.status === "pago" && isWithinInterval(new Date(e.dueDate), interval))
      .reduce((s: number, e: any) => s + (e.valorTotal || 0), 0);

    return { saldoAnterior, entradas, saidas, saldoPeriodo: saldoAnterior + entradas - saidas };
  }, [filteredRevenues, filteredExpenses, dateRange]);

  // Daily flow chart + table
  const dailyData = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return [];
    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    let accumulated = summary.saldoAnterior;

    return days.map((day) => {
      const entradas = filteredRevenues
        .filter((r: any) => r.dueDate && r.status === "recebido" && isSameDay(new Date(r.dueDate), day))
        .reduce((s: number, r: any) => s + (r.valorTotal || 0), 0);
      const saidas = filteredExpenses
        .filter((e: any) => e.dueDate && e.status === "pago" && isSameDay(new Date(e.dueDate), day))
        .reduce((s: number, e: any) => s + (e.valorTotal || 0), 0);
      const saldoDia = entradas - saidas;
      accumulated += saldoDia;
      return {
        date: format(day, "dd/MM"),
        label: format(day, "dd/MM/yyyy"),
        entradas,
        saidas,
        saldoDia,
        acumulado: accumulated,
      };
    });
  }, [filteredRevenues, filteredExpenses, dateRange, summary.saldoAnterior]);

  // Account balances
  const accountBalances = useMemo(() => {
    return bankAccounts.map((ba: any) => {
      const rec = revenues
        .filter((r: any) => r.bankAccountId === ba.id && r.status === "recebido")
        .reduce((s: number, r: any) => s + (r.valorTotal || 0), 0);
      const exp = expenses
        .filter((e: any) => e.bankAccountId === ba.id && e.status === "pago")
        .reduce((s: number, e: any) => s + (e.valorTotal || 0), 0);
      return { name: ba.name, balance: (ba.initialBalance || 0) + rec - exp };
    });
  }, [bankAccounts, revenues, expenses]);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <Tabs value="fluxo-caixa" onValueChange={(val) => {
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
          <h3 className="text-sm font-semibold text-foreground mb-1">Relatório de Fluxo de Caixa</h3>
          <p className="text-xs text-muted-foreground mb-3">Filtre por período e conta para analisar as projeções de entrada e saída de caixa.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  {bankAccounts.map((ba: any) => (
                    <SelectItem key={ba.id} value={ba.id}>{ba.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
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
              <span className="text-sm text-muted-foreground">Saldo do Período</span>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xl font-bold text-foreground">{loading ? "..." : formatCurrency(summary.saldoPeriodo)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Flow Line Chart */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Fluxo Diário</CardTitle>
            <span className="text-xs text-muted-foreground">{dateRange?.from ? format(dateRange.from, "MM/yyyy") : ""}</span>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => formatCurrency(v)} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }}
                formatter={(value: number) => [formatCurrency(value), undefined]}
              />
              <Line type="monotone" dataKey="acumulado" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Account Balances */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Saldo Atual por Conta</CardTitle>
            <p className="text-xs text-muted-foreground">Visão geral dos saldos em cada conta bancária.</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {accountBalances.length > 0 ? accountBalances.map((ab, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-border p-4">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{ab.name}</p>
                    <p className="text-sm text-muted-foreground">{formatCurrency(ab.balance)}</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground col-span-2 text-center py-4">Nenhuma conta cadastrada.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Saldos em Gráfico</CardTitle>
            <p className="text-xs text-muted-foreground">Representação visual dos saldos por conta.</p>
          </CardHeader>
          <CardContent>
            {accountBalances.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={accountBalances}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => formatCurrency(v)} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} formatter={(value: number) => [formatCurrency(value), undefined]} />
                  <Bar dataKey="balance" radius={[4, 4, 0, 0]}>
                    {accountBalances.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">Nenhuma conta cadastrada.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily Details Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Detalhes do Fluxo de Caixa</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Entradas</TableHead>
                <TableHead>Saídas</TableHead>
                <TableHead>Saldo do Dia</TableHead>
                <TableHead className="text-right">Saldo Acumulado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailyData.map((d, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm">{d.label}</TableCell>
                  <TableCell className="text-sm text-success">{formatCurrency(d.entradas)}</TableCell>
                  <TableCell className="text-sm text-destructive">{formatCurrency(d.saidas)}</TableCell>
                  <TableCell className={`text-sm ${d.saldoDia >= 0 ? "" : "text-destructive"}`}>{formatCurrency(d.saldoDia)}</TableCell>
                  <TableCell className="text-sm text-right">{formatCurrency(d.acumulado)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default FluxoCaixa;
