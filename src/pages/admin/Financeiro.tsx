import { useState, useMemo } from "react";
import { useStore } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, TrendingUp, TrendingDown, Info } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, isSameMonth, subMonths, isWithinInterval, addDays, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { DateRange } from "react-day-picker";
import { useNavigate } from "react-router-dom";

const PIE_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

const Financeiro = () => {
  const navigate = useNavigate();
  const { revenues, expenses, loading } = useStore();
  const now = new Date();

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(now),
    to: endOfMonth(now),
  });

  const [activeTab, setActiveTab] = useState("visao-geral");

  // Summary for the month (top bar)
  const monthSummary = useMemo(() => {
    const recebidoMes = revenues
      .filter((r: any) => r.dueDate && isSameMonth(new Date(r.dueDate), now) && r.status === "recebido")
      .reduce((s: number, r: any) => s + (r.valorTotal || 0), 0);
    const faturadoReceitas = revenues
      .filter((r: any) => r.dueDate && isSameMonth(new Date(r.dueDate), now))
      .reduce((s: number, r: any) => s + (r.valorTotal || 0), 0);
    const previstoReceitas = revenues
      .filter((r: any) => r.dueDate && isSameMonth(new Date(r.dueDate), now) && r.status !== "recebido")
      .reduce((s: number, r: any) => s + (r.valorTotal || 0), 0);

    const pagoMes = expenses
      .filter((e: any) => e.dueDate && isSameMonth(new Date(e.dueDate), now) && e.status === "pago")
      .reduce((s: number, e: any) => s + (e.valorTotal || 0), 0);
    const faturadoDespesas = expenses
      .filter((e: any) => e.dueDate && isSameMonth(new Date(e.dueDate), now))
      .reduce((s: number, e: any) => s + (e.valorTotal || 0), 0);
    const previstoDespesas = expenses
      .filter((e: any) => e.dueDate && isSameMonth(new Date(e.dueDate), now) && e.status !== "pago")
      .reduce((s: number, e: any) => s + (e.valorTotal || 0), 0);

    return { recebidoMes, faturadoReceitas, previstoReceitas, pagoMes, faturadoDespesas, previstoDespesas };
  }, [revenues, expenses, now]);

  // Period-filtered cards
  const periodSummary = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return { aReceber: 0, aPagar: 0, saldoPrevisto: 0, recebido: 0 };
    const interval = { start: dateRange.from, end: dateRange.to };

    const aReceber = revenues
      .filter((r: any) => r.dueDate && isWithinInterval(new Date(r.dueDate), interval) && r.status !== "recebido")
      .reduce((s: number, r: any) => s + (r.valorTotal || 0), 0);

    const aPagar = expenses
      .filter((e: any) => e.dueDate && isWithinInterval(new Date(e.dueDate), interval) && e.status !== "pago")
      .reduce((s: number, e: any) => s + (e.valorTotal || 0), 0);

    const recebido = revenues
      .filter((r: any) => r.dueDate && isWithinInterval(new Date(r.dueDate), interval) && r.status === "recebido")
      .reduce((s: number, r: any) => s + (r.valorTotal || 0), 0);

    return { aReceber, aPagar, saldoPrevisto: aReceber - aPagar, recebido };
  }, [revenues, expenses, dateRange]);

  // Chart data - last 6 months
  const chartData = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => {
      const monthDate = subMonths(now, 5 - i);
      const receitas = revenues
        .filter((r: any) => r.dueDate && isSameMonth(new Date(r.dueDate), monthDate))
        .reduce((s: number, r: any) => s + (r.valorTotal || 0), 0);
      const despesas = expenses
        .filter((e: any) => e.dueDate && isSameMonth(new Date(e.dueDate), monthDate))
        .reduce((s: number, e: any) => s + (e.valorTotal || 0), 0);
      return { name: format(monthDate, "MMM/yy", { locale: ptBR }), receitas, despesas };
    });
  }, [revenues, expenses, now]);

  // Pie chart - status of receivables in period
  const pieData = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return [];
    const interval = { start: dateRange.from, end: dateRange.to };
    const inPeriod = revenues.filter((r: any) => r.dueDate && isWithinInterval(new Date(r.dueDate), interval));

    const statusMap: Record<string, number> = {};
    inPeriod.forEach((r: any) => {
      const status = r.status === "recebido" ? "Recebido" : r.status === "vencido" ? "Vencido" : "Pendente";
      statusMap[status] = (statusMap[status] || 0) + (r.valorTotal || 0);
    });

    return Object.entries(statusMap).map(([name, value]) => ({ name, value }));
  }, [revenues, dateRange]);

  // Upcoming receivables (next 7 days)
  const upcomingReceivables = useMemo(() => {
    const limit = addDays(now, 7);
    return revenues
      .filter((r: any) => {
        if (!r.dueDate || r.status === "recebido") return false;
        const d = new Date(r.dueDate);
        return d >= now && d <= limit;
      })
      .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 10);
  }, [revenues, now]);

  // Upcoming payables (next 7 days)
  const upcomingPayables = useMemo(() => {
    const limit = addDays(now, 7);
    return expenses
      .filter((e: any) => {
        if (!e.dueDate || e.status === "pago") return false;
        const d = new Date(e.dueDate);
        return d >= now && d <= limit;
      })
      .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 10);
  }, [expenses, now]);

  const tabItems = [
    { value: "visao-geral", label: "Visão Geral" },
    { value: "receber", label: "Contas a Receber", path: "/admin/financeiro/receber" },
    { value: "pagar", label: "Contas a Pagar", path: "/admin/financeiro/pagar" },
    { value: "fluxo-caixa", label: "Fluxo de Caixa", path: "/admin/financeiro/fluxo-caixa" },
    { value: "extrato", label: "Extrato", path: "/admin/financeiro/extrato" },
    { value: "dre", label: "DRE", path: "/admin/financeiro/dre" },
    { value: "relatorios", label: "Relatórios" },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => {
        const tab = tabItems.find(t => t.value === val);
        if (tab && "path" in tab && tab.path) {
          navigate(tab.path);
        } else {
          setActiveTab(val);
        }
      }}>
        <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-0 h-auto p-0">
          {tabItems.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2 text-sm"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Top Summary - Recebimentos e Pagamentos do mês */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-success/20 p-3">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">Recebimentos do mês</p>
              <p className="text-xs text-muted-foreground">
                Realizado: <span className="text-success">{formatCurrency(monthSummary.recebidoMes)}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Fatur.: <span className="text-foreground">{formatCurrency(monthSummary.faturadoReceitas)}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Previsto: <span className="text-foreground">{formatCurrency(monthSummary.previstoReceitas)}</span>
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-destructive/20 p-3">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">Pagamentos do mês</p>
              <p className="text-xs text-muted-foreground">
                Realizado: <span className="text-destructive">{formatCurrency(monthSummary.pagoMes)}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Fatur.: <span className="text-foreground">{formatCurrency(monthSummary.faturadoDespesas)}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Previsto: <span className="text-foreground">{formatCurrency(monthSummary.previstoDespesas)}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtro de período */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1">Filtros da Visão Geral</h3>
          <p className="text-xs text-muted-foreground mb-3">Selecione um período para filtrar os valores nos cards de resumo.</p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Período:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {dateRange?.from ? format(dateRange.from, "dd/MM/yyyy") : ""} - {dateRange?.to ? format(dateRange.to, "dd/MM/yyyy") : ""}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  locale={ptBR}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Period Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">A Receber (Período)</span>
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <p className="text-xl font-bold text-foreground">{loading ? "..." : formatCurrency(periodSummary.aReceber)}</p>
            <p className="text-xs text-muted-foreground">Soma das contas pendentes no período.</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">A Pagar (Período)</span>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </div>
            <p className="text-xl font-bold text-foreground">{loading ? "..." : formatCurrency(periodSummary.aPagar)}</p>
            <p className="text-xs text-muted-foreground">Soma das despesas pendentes no período.</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Saldo Previsto (Período)</span>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xl font-bold text-foreground">{loading ? "..." : formatCurrency(periodSummary.saldoPrevisto)}</p>
            <p className="text-xs text-muted-foreground">Diferença entre pendências no período.</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Recebido no Período</span>
              <Info className="h-4 w-4 text-info" />
            </div>
            <p className={`text-xl font-bold ${periodSummary.recebido > 0 ? "text-success" : "text-destructive"}`}>
              {loading ? "..." : formatCurrency(periodSummary.recebido)}
            </p>
            <p className="text-xs text-muted-foreground">Total recebido de clientes no período.</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="border-border lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg">Receitas vs. Despesas (Competência)</CardTitle>
            <p className="text-xs text-muted-foreground">Balanço dos últimos 6 meses.</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                  formatter={(value: number) => [formatCurrency(value), undefined]}
                />
                <Legend />
                <Bar dataKey="receitas" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="receitas" />
                <Bar dataKey="despesas" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} name="despesas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Status das Contas a Receber</CardTitle>
            <p className="text-xs text-muted-foreground">Distribuição das faturas no período selecionado.</p>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name }) => name}>
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [formatCurrency(value), undefined]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-10">Nenhum dado no período.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Próximos Vencimentos (7 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingReceivables.length > 0 ? (
                  upcomingReceivables.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm">{r.clientName || r.description || "-"}</TableCell>
                      <TableCell className="text-sm">{r.dueDate ? format(new Date(r.dueDate), "dd/MM/yyyy") : "-"}</TableCell>
                      <TableCell className="text-sm text-right">{formatCurrency(r.valorTotal || 0)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-sm text-success py-6">
                      Nenhuma conta a receber nos próximos 7 dias.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Próximos Pagamentos (7 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingPayables.length > 0 ? (
                  upcomingPayables.map((e: any) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-sm">{e.supplierName || e.description || "-"}</TableCell>
                      <TableCell className="text-sm">{e.dueDate ? format(new Date(e.dueDate), "dd/MM/yyyy") : "-"}</TableCell>
                      <TableCell className="text-sm text-right">{formatCurrency(e.valorTotal || 0)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-6">
                      Nenhum pagamento nos próximos 7 dias.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Financeiro;
