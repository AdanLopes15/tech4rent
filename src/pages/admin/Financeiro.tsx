//src/pages/admin/Financeiro.tsx

import { useState, useMemo } from "react";
import { useStore } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, TrendingUp, TrendingDown, Info, CircleDollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  format,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  subMonths,
  isWithinInterval,
  addDays,
  isBefore,
  startOfToday,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { DateRange } from "react-day-picker";
import { useNavigate } from "react-router-dom";

const PIE_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-5))", "hsl(var(--chart-2))"];

const Financeiro = () => {
  const navigate = useNavigate();
  const { revenues, expenses, clients, suppliers, loading } = useStore();
  const today = new Date();

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(today),
    to: endOfMonth(today),
  });

  const [activeTab, setActiveTab] = useState("visao-geral");

  const tabItems = [
    { value: "visao-geral", label: "Visão Geral" },
    { value: "receber", label: "Contas a Receber", path: "/admin/financeiro/receber" },
    { value: "pagar", label: "Contas a Pagar", path: "/admin/financeiro/pagar" },
    { value: "fluxo-caixa", label: "Fluxo de Caixa", path: "/admin/financeiro/fluxo-caixa" },
    { value: "extrato", label: "Extrato", path: "/admin/financeiro/extrato" },
    { value: "dre", label: "DRE", path: "/admin/financeiro/dre" },
    { value: "relatorios", label: "Relatórios", path: "/admin/financeiro/relatorios" },
  ];

  const getClientName = (id?: string) => clients.find((client: any) => client.id === id)?.razaoSocial || "N/A";

  const getSupplierName = (id?: string) => suppliers.find((supplier: any) => supplier.id === id)?.razaoSocial || "N/A";

  const monthSummary = useMemo(() => {
    const currentMonthStart = startOfMonth(today);
    const currentMonthEnd = endOfMonth(today);

    const monthRevenues = revenues.filter(
      (revenue: any) =>
        revenue.dueDate &&
        isWithinInterval(new Date(revenue.dueDate), {
          start: currentMonthStart,
          end: currentMonthEnd,
        }),
    );

    const monthExpenses = expenses.filter(
      (expense: any) =>
        expense.dueDate &&
        isWithinInterval(new Date(expense.dueDate), {
          start: currentMonthStart,
          end: currentMonthEnd,
        }),
    );

    const totalRecebido = monthRevenues
      .filter((revenue: any) => revenue.status === "recebido")
      .reduce((sum: number, revenue: any) => sum + (revenue.valorTotal || 0), 0);

    const totalPrevistoReceitas = monthRevenues
      .filter((revenue: any) => revenue.status !== "cancelado" && revenue.status !== "Cancelado")
      .reduce((sum: number, revenue: any) => sum + (revenue.valorTotal || 0), 0);

    const faltaReceber = totalPrevistoReceitas - totalRecebido;

    const totalPago = monthExpenses
      .filter((expense: any) => expense.status === "pago")
      .reduce((sum: number, expense: any) => sum + (expense.valorTotal || 0), 0);

    const totalPrevistoDespesas = monthExpenses
      .filter((expense: any) => expense.status !== "cancelado" && expense.status !== "Cancelado")
      .reduce((sum: number, expense: any) => sum + (expense.valorTotal || 0), 0);

    const faltaPagar = totalPrevistoDespesas - totalPago;

    return {
      totalRecebido,
      totalPrevistoReceitas,
      faltaReceber,
      totalPago,
      totalPrevistoDespesas,
      faltaPagar,
    };
  }, [revenues, expenses, today]);

  const periodSummary = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) {
      return {
        aReceber: 0,
        aPagar: 0,
        saldoPrevisto: 0,
        recebidoNoPeriodo: 0,
      };
    }

    const interval = {
      start: dateRange.from,
      end: dateRange.to,
    };

    const periodRevenues = revenues.filter(
      (revenue: any) => revenue.dueDate && isWithinInterval(new Date(revenue.dueDate), interval),
    );

    const periodExpenses = expenses.filter(
      (expense: any) => expense.dueDate && isWithinInterval(new Date(expense.dueDate), interval),
    );

    const aReceber = periodRevenues
      .filter((revenue: any) => revenue.status === "pendente" || revenue.status === "Pendente")
      .reduce((sum: number, revenue: any) => sum + (revenue.valorTotal || 0), 0);

    const aPagar = periodExpenses
      .filter((expense: any) => expense.status === "pendente" || expense.status === "Pendente")
      .reduce((sum: number, expense: any) => sum + (expense.valorTotal || 0), 0);

    const recebidoNoPeriodo = periodRevenues
      .filter((revenue: any) => revenue.status === "recebido")
      .reduce((sum: number, revenue: any) => sum + (revenue.valorTotal || 0), 0);

    return {
      aReceber,
      aPagar,
      saldoPrevisto: aReceber - aPagar,
      recebidoNoPeriodo,
    };
  }, [revenues, expenses, dateRange]);

  const chartData = useMemo(() => {
    return Array.from({ length: 6 }).map((_, index) => {
      const monthDate = subMonths(today, 5 - index);

      const receitas = revenues
        .filter(
          (revenue: any) =>
            revenue.dueDate && isSameMonth(new Date(revenue.dueDate), monthDate) && revenue.status === "recebido",
        )
        .reduce((sum: number, revenue: any) => sum + (revenue.valorTotal || 0), 0);

      const despesas = expenses
        .filter(
          (expense: any) =>
            expense.dueDate && isSameMonth(new Date(expense.dueDate), monthDate) && expense.status === "pago",
        )
        .reduce((sum: number, expense: any) => sum + (expense.valorTotal || 0), 0);

      return {
        name: format(monthDate, "MMM/yy", { locale: ptBR }),
        receitas,
        despesas,
      };
    });
  }, [revenues, expenses, today]);

  const pieData = useMemo(() => {
    const baseToday = startOfToday();

    const periodRevenues =
      dateRange?.from && dateRange?.to
        ? revenues.filter(
            (revenue: any) =>
              revenue.dueDate &&
              isWithinInterval(new Date(revenue.dueDate), {
                start: dateRange.from!,
                end: dateRange.to!,
              }),
          )
        : revenues;

    let emAberto = 0;
    let vencido = 0;
    let recebido = 0;

    periodRevenues.forEach((revenue: any) => {
      const value = revenue.valorTotal || 0;
      const dueDate = revenue.dueDate ? new Date(revenue.dueDate) : null;
      const status = String(revenue.status || "").toLowerCase();

      if (status === "recebido") {
        recebido += value;
      } else if (status === "pendente") {
        if (dueDate && isBefore(dueDate, baseToday)) {
          vencido += value;
        } else {
          emAberto += value;
        }
      }
    });

    return [
      { name: "Em Aberto", value: emAberto },
      { name: "Vencido", value: vencido },
      { name: "Recebido", value: recebido },
    ].filter((item) => item.value > 0);
  }, [revenues, dateRange]);

  const upcomingReceivables = useMemo(() => {
    const next7Days = {
      start: startOfToday(),
      end: addDays(startOfToday(), 7),
    };

    return revenues
      .filter((revenue: any) => {
        if (!revenue.dueDate) return false;
        const status = String(revenue.status || "").toLowerCase();
        if (status !== "pendente") return false;

        return isWithinInterval(new Date(revenue.dueDate), next7Days);
      })
      .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 10);
  }, [revenues]);

  const upcomingPayables = useMemo(() => {
    const next7Days = {
      start: startOfToday(),
      end: addDays(startOfToday(), 7),
    };

    return expenses
      .filter((expense: any) => {
        if (!expense.dueDate) return false;
        const status = String(expense.status || "").toLowerCase();
        if (status !== "pendente") return false;

        return isWithinInterval(new Date(expense.dueDate), next7Days);
      })
      .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 10);
  }, [expenses]);

  return (
    <div className="space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          const selectedTab = tabItems.find((tab) => tab.value === value);

          if (selectedTab && "path" in selectedTab && selectedTab.path) {
            navigate(selectedTab.path);
          } else {
            setActiveTab(value);
          }
        }}
      >
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
                Realizado: <span className="text-success">{formatCurrency(monthSummary.totalRecebido)}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Falta: <span className="text-foreground">{formatCurrency(monthSummary.faltaReceber)}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Previsto: <span className="text-foreground">{formatCurrency(monthSummary.totalPrevistoReceitas)}</span>
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
                Realizado: <span className="text-destructive">{formatCurrency(monthSummary.totalPago)}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Falta: <span className="text-foreground">{formatCurrency(monthSummary.faltaPagar)}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Previsto: <span className="text-foreground">{formatCurrency(monthSummary.totalPrevistoDespesas)}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1">Filtros da Visão Geral</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Selecione um período para filtrar os valores nos cards de resumo.
          </p>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Período:</span>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {dateRange?.from ? format(dateRange.from, "dd/MM/yyyy") : "Selecione"}
                  {" - "}
                  {dateRange?.to ? format(dateRange.to, "dd/MM/yyyy") : "Selecione"}
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="range" selected={dateRange} onSelect={setDateRange} locale={ptBR} numberOfMonths={2} />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">A Receber (Período)</span>
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <p className="text-xl font-bold text-foreground">
              {loading ? "..." : formatCurrency(periodSummary.aReceber)}
            </p>
            <p className="text-xs text-muted-foreground">Soma das contas pendentes no período.</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">A Pagar (Período)</span>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </div>
            <p className="text-xl font-bold text-foreground">
              {loading ? "..." : formatCurrency(periodSummary.aPagar)}
            </p>
            <p className="text-xs text-muted-foreground">Soma das despesas pendentes no período.</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Saldo Previsto (Período)</span>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xl font-bold text-foreground">
              {loading ? "..." : formatCurrency(periodSummary.saldoPrevisto)}
            </p>
            <p className="text-xs text-muted-foreground">Diferença entre pendências no período.</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Recebido no Período</span>
              <CircleDollarSign className="h-4 w-4 text-info" />
            </div>
            <p
              className={`text-xl font-bold ${
                periodSummary.recebidoNoPeriodo > 0 ? "text-success" : "text-foreground"
              }`}
            >
              {loading ? "..." : formatCurrency(periodSummary.recebidoNoPeriodo)}
            </p>
            <p className="text-xs text-muted-foreground">Total recebido de clientes no período.</p>
          </CardContent>
        </Card>
      </div>

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
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                  formatter={(value: number) => [formatCurrency(value), ""]}
                />
                <Legend />
                <Bar dataKey="receitas" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Receitas" />
                <Bar dataKey="despesas" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} name="Despesas" />
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
                  <Tooltip formatter={(value: number) => [formatCurrency(value), ""]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-10">Nenhum dado no período.</p>
            )}
          </CardContent>
        </Card>
      </div>

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
                  upcomingReceivables.map((revenue: any) => (
                    <TableRow key={revenue.id}>
                      <TableCell className="text-sm">{getClientName(revenue.clientId)}</TableCell>
                      <TableCell className="text-sm">
                        {revenue.dueDate ? format(new Date(revenue.dueDate), "dd/MM/yyyy") : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-right">{formatCurrency(revenue.valorTotal || 0)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-6">
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
                  upcomingPayables.map((expense: any) => (
                    <TableRow key={expense.id}>
                      <TableCell className="text-sm">{getSupplierName(expense.entityId)}</TableCell>
                      <TableCell className="text-sm">
                        {expense.dueDate ? format(new Date(expense.dueDate), "dd/MM/yyyy") : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-right">{formatCurrency(expense.valorTotal || 0)}</TableCell>
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
