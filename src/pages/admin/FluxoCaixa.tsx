//src/pages/admin/FluxoCaixa.tsx

import { useState, useMemo, useEffect } from "react";
import { useStore } from "@/store";
import { cn, formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Wallet, TrendingUp, TrendingDown, BookOpen } from "lucide-react";
import { format, startOfDay, endOfDay, eachDayOfInterval, isSameDay, isBefore, compareAsc } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

type DailyFlowRow = {
  date: string;
  fullDate: string;
  entradas: number;
  saidas: number;
  saldo: number;
  saldoAcumulado: number;
};

const FluxoCaixa = () => {
  const navigate = useNavigate();
  const { revenues, expenses, bankAccounts, loading, fetchAllData } = useStore();

  const now = new Date();

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(now.getFullYear(), now.getMonth(), 1),
    to: new Date(now.getFullYear(), now.getMonth() + 1, 0),
  });

  const [selectedAccountId, setSelectedAccountId] = useState("all");

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const tabItems = [
    { value: "visao-geral", label: "Visão Geral", path: "/admin/financeiro" },
    { value: "receber", label: "Contas a Receber", path: "/admin/financeiro/receber" },
    { value: "pagar", label: "Contas a Pagar", path: "/admin/financeiro/pagar" },
    { value: "fluxo-caixa", label: "Fluxo de Caixa" },
    { value: "extrato", label: "Extrato", path: "/admin/financeiro/extrato" },
    { value: "dre", label: "DRE", path: "/admin/financeiro/dre" },
    { value: "relatorios", label: "Relatórios", path: "/admin/financeiro/relatorios" },
  ];

  const allTransactions = useMemo(() => {
    const receivableRevenues = revenues
      .filter((revenue: any) => String(revenue.status || "").toLowerCase() !== "cancelado")
      .map((revenue: any) => ({
        ...revenue,
        type: "entrada" as const,
        date: revenue.dueDate ? new Date(revenue.dueDate) : undefined,
      }));

    const payableExpenses = expenses
      .filter((expense: any) => String(expense.status || "").toLowerCase() !== "cancelado")
      .map((expense: any) => ({
        ...expense,
        type: "saida" as const,
        date: expense.dueDate ? new Date(expense.dueDate) : undefined,
      }));

    return [...receivableRevenues, ...payableExpenses].filter((item) => item.date);
  }, [revenues, expenses]);

  const filteredData = useMemo(() => {
    const from = dateRange?.from ? startOfDay(dateRange.from) : new Date(0);
    const to = dateRange?.to ? endOfDay(dateRange.to) : new Date();

    const accountFilter = (transaction: any) =>
      selectedAccountId === "all" || transaction.bankAccountId === selectedAccountId;

    const realizedRevenues = revenues.filter(
      (revenue: any) => String(revenue.status || "").toLowerCase() === "recebido" && revenue.paymentDate,
    );

    const realizedExpenses = expenses.filter(
      (expense: any) => String(expense.status || "").toLowerCase() === "pago" && expense.paymentDate,
    );

    const previousRealizedRevenues = realizedRevenues.filter(
      (transaction: any) =>
        transaction.paymentDate && isBefore(new Date(transaction.paymentDate), from) && accountFilter(transaction),
    );

    const previousRealizedExpenses = realizedExpenses.filter(
      (transaction: any) =>
        transaction.paymentDate && isBefore(new Date(transaction.paymentDate), from) && accountFilter(transaction),
    );

    let startingBalance = 0;

    if (selectedAccountId === "all") {
      startingBalance = bankAccounts.reduce(
        (accumulator: number, account: any) => accumulator + (account.initialBalance || 0),
        0,
      );
    } else {
      const account = bankAccounts.find((item: any) => item.id === selectedAccountId);
      startingBalance = account?.initialBalance || 0;
    }

    const initialBalance =
      previousRealizedRevenues.reduce(
        (accumulator: number, transaction: any) => accumulator + (transaction.valorTotal || 0),
        0,
      ) -
      previousRealizedExpenses.reduce(
        (accumulator: number, transaction: any) => accumulator + (transaction.valorTotal || 0),
        0,
      ) +
      startingBalance;

    const periodTransactions = allTransactions.filter(
      (transaction: any) => transaction.date >= from && transaction.date <= to && accountFilter(transaction),
    );

    const dailyData: DailyFlowRow[] = [];

    if (dateRange?.from && dateRange?.to) {
      const intervalDays = eachDayOfInterval({
        start: dateRange.from,
        end: dateRange.to,
      });

      let runningBalance = initialBalance;

      for (const day of intervalDays) {
        const dayTransactions = periodTransactions.filter((transaction: any) => isSameDay(transaction.date, day));

        const entradas = dayTransactions
          .filter((transaction: any) => transaction.type === "entrada")
          .reduce((sum: number, transaction: any) => sum + (transaction.valorTotal || 0), 0);

        const saidas = dayTransactions
          .filter((transaction: any) => transaction.type === "saida")
          .reduce((sum: number, transaction: any) => sum + (transaction.valorTotal || 0), 0);

        const saldoDia = entradas - saidas;
        runningBalance += saldoDia;

        dailyData.push({
          date: format(day, "dd/MM"),
          fullDate: format(day, "dd/MM/yyyy"),
          entradas,
          saidas,
          saldo: saldoDia,
          saldoAcumulado: runningBalance,
        });
      }
    }

    const totalEntradas = dailyData.reduce((sum, day) => sum + day.entradas, 0);
    const totalSaidas = dailyData.reduce((sum, day) => sum + day.saidas, 0);
    const saldoPeriodo = totalEntradas - totalSaidas;

    return {
      dailyData,
      initialBalance,
      totalEntradas,
      totalSaidas,
      saldoPeriodo,
    };
  }, [allTransactions, revenues, expenses, dateRange, selectedAccountId, bankAccounts]);

  const accountBalances = useMemo(() => {
    return bankAccounts.map((account: any) => {
      const initialBalance = account.initialBalance || 0;

      const accountRevenues = revenues
        .filter(
          (revenue: any) =>
            revenue.bankAccountId === account.id &&
            String(revenue.status || "").toLowerCase() === "recebido" &&
            revenue.paymentDate,
        )
        .reduce((sum: number, revenue: any) => sum + (revenue.valorTotal || 0), 0);

      const accountExpenses = expenses
        .filter(
          (expense: any) =>
            expense.bankAccountId === account.id &&
            String(expense.status || "").toLowerCase() === "pago" &&
            expense.paymentDate,
        )
        .reduce((sum: number, expense: any) => sum + (expense.valorTotal || 0), 0);

      return {
        ...account,
        balance: initialBalance + accountRevenues - accountExpenses,
      };
    });
  }, [bankAccounts, revenues, expenses]);

  const chartTitle = dateRange?.from ? format(dateRange.from, "MM/yyyy") : "";

  return (
    <div className="space-y-6">
      <Tabs
        value="fluxo-caixa"
        onValueChange={(value) => {
          const tab = tabItems.find((item) => item.value === value);
          if (tab?.path) navigate(tab.path);
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

      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1">Relatório de Fluxo de Caixa</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Filtre por período e conta para analisar as projeções de entrada e saída de caixa.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Período de Análise</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                        </>
                      ) : (
                        format(dateRange.from, "dd/MM/yyyy")
                      )
                    ) : (
                      <span>Selecione um período</span>
                    )}
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Conta Bancária</Label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Contas</SelectItem>
                  {bankAccounts.map((account: any) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Saldo Anterior</span>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xl font-bold text-foreground">
              {loading ? "..." : formatCurrency(filteredData.initialBalance)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Total de Entradas</span>
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <p className="text-xl font-bold text-success">
              {loading ? "..." : formatCurrency(filteredData.totalEntradas)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Total de Saídas</span>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </div>
            <p className="text-xl font-bold text-destructive">
              {loading ? "..." : formatCurrency(filteredData.totalSaidas)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Saldo do Período</span>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xl font-bold text-foreground">
              {loading ? "..." : formatCurrency(filteredData.saldoPeriodo)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Fluxo Diário</CardTitle>
            <span className="text-xs text-muted-foreground">{chartTitle}</span>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={filteredData.dailyData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickFormatter={(value) => formatCurrency(value as number)}
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--foreground))",
                }}
                formatter={(value: number) => [formatCurrency(value), undefined]}
                labelFormatter={(label) => {
                  const day = filteredData.dailyData.find((item) => item.date === label);
                  return day?.fullDate || String(label);
                }}
              />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="saldoAcumulado"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Saldo Atual por Conta</CardTitle>
            <p className="text-xs text-muted-foreground">Visão geral dos saldos em cada conta bancária.</p>
          </CardHeader>

          <CardContent>
            {accountBalances.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {accountBalances.map((account: any, index: number) => (
                  <div key={account.id} className="flex items-center gap-3 rounded-lg border border-border p-4">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: account.color || COLORS[index % COLORS.length] }}
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">{account.name}</p>
                      <p className="text-sm text-muted-foreground">{formatCurrency(account.balance)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma conta cadastrada.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Saldos em Gráfico</CardTitle>
            <p className="text-xs text-muted-foreground">Representação visual dos saldos por conta.</p>
          </CardHeader>

          <CardContent>
            {accountBalances.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={accountBalances}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickFormatter={(value) => formatCurrency(value as number)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                    formatter={(value: number) => [formatCurrency(value), undefined]}
                  />
                  <Bar dataKey="balance" radius={[4, 4, 0, 0]}>
                    {accountBalances.map((account: any, index: number) => (
                      <Cell key={account.id} fill={account.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">Nenhuma conta cadastrada.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Detalhes do Fluxo de Caixa</CardTitle>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Entradas</TableHead>
                <TableHead className="text-right">Saídas</TableHead>
                <TableHead className="text-right">Saldo do Dia</TableHead>
                <TableHead className="text-right">Saldo Acumulado</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredData.dailyData.length > 0 ? (
                filteredData.dailyData.map((day, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-sm">{day.fullDate}</TableCell>
                    <TableCell className="text-sm text-right text-success">{formatCurrency(day.entradas)}</TableCell>
                    <TableCell className="text-sm text-right text-destructive">{formatCurrency(day.saidas)}</TableCell>
                    <TableCell className="text-sm text-right">{formatCurrency(day.saldo)}</TableCell>
                    <TableCell className="text-sm text-right font-medium">
                      {formatCurrency(day.saldoAcumulado)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">
                    Nenhum dado para exibir no período selecionado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default FluxoCaixa;
