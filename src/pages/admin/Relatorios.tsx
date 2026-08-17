//src/pages/admin/Relatorios.tsx

import { useState, useMemo } from "react";
import { useStore } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Search, Download, Printer, CheckCircle, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

type TipoLancamento = "todos" | "receitas" | "despesas";
type StatusFiltro = "todos" | "pago" | "pendente";

type ReportEntry = {
  id: string;
  type: "Receita" | "Despesa";
  name: string;
  description: string;
  dueDate: string | Date | null;
  status: string;
  value: number;
};

const Relatorios = () => {
  const navigate = useNavigate();
  const { revenues, expenses, clients, suppliers, loading } = useStore();
  const now = new Date();

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(now),
    to: endOfMonth(now),
  });
  const [tipoLancamento, setTipoLancamento] = useState<TipoLancamento>("todos");
  const [statusFilter, setStatusFilter] = useState<StatusFiltro>("todos");
  const [generated, setGenerated] = useState(false);

  const tabItems = [
    { value: "visao-geral", label: "Visão Geral", path: "/admin/financeiro" },
    { value: "receber", label: "Contas a Receber", path: "/admin/financeiro/receber" },
    { value: "pagar", label: "Contas a Pagar", path: "/admin/financeiro/pagar" },
    { value: "fluxo-caixa", label: "Fluxo de Caixa", path: "/admin/financeiro/fluxo-caixa" },
    { value: "extrato", label: "Extrato", path: "/admin/financeiro/extrato" },
    { value: "dre", label: "DRE", path: "/admin/financeiro/dre" },
    { value: "relatorios", label: "Relatórios" },
  ];

  const data = useMemo(() => {
    if (!generated || !dateRange?.from || !dateRange?.to) return null;

    const interval = {
      start: startOfDay(dateRange.from),
      end: endOfDay(dateRange.to),
    };

    let filteredRev = revenues.filter((revenue: any) => {
      if (!revenue.dueDate) return false;
      return isWithinInterval(new Date(revenue.dueDate), interval);
    });

    let filteredExp = expenses.filter((expense: any) => {
      if (!expense.dueDate) return false;
      return isWithinInterval(new Date(expense.dueDate), interval);
    });

    if (statusFilter !== "todos") {
      if (statusFilter === "pago") {
        filteredRev = filteredRev.filter((revenue: any) => revenue.status === "recebido");
        filteredExp = filteredExp.filter((expense: any) => expense.status === "pago");
      }

      if (statusFilter === "pendente") {
        filteredRev = filteredRev.filter((revenue: any) => revenue.status !== "recebido");
        filteredExp = filteredExp.filter((expense: any) => expense.status !== "pago");
      }
    }

    if (tipoLancamento === "receitas") filteredExp = [];
    if (tipoLancamento === "despesas") filteredRev = [];

    const totalRecebido = filteredRev
      .filter((revenue: any) => revenue.status === "recebido")
      .reduce((sum: number, revenue: any) => sum + (revenue.valorTotal || 0), 0);

    const pendenteReceber = filteredRev
      .filter((revenue: any) => revenue.status !== "recebido")
      .reduce((sum: number, revenue: any) => sum + (revenue.valorTotal || 0), 0);

    const totalPago = filteredExp
      .filter((expense: any) => expense.status === "pago")
      .reduce((sum: number, expense: any) => sum + (expense.valorTotal || 0), 0);

    const pendentePagar = filteredExp
      .filter((expense: any) => expense.status !== "pago")
      .reduce((sum: number, expense: any) => sum + (expense.valorTotal || 0), 0);

    const entries: ReportEntry[] = [];

    filteredRev.forEach((revenue: any) => {
      const clientName =
        clients.find((client: any) => client.id === revenue.clientId)?.razaoSocial ||
        revenue.clientName ||
        revenue.description ||
        "-";

      entries.push({
        id: `rev-${revenue.id}`,
        type: "Receita",
        name: clientName,
        description: revenue.description || "-",
        dueDate: revenue.dueDate || null,
        status: revenue.status === "recebido" ? "Recebido" : "Pendente",
        value: revenue.valorTotal || 0,
      });
    });

    filteredExp.forEach((expense: any) => {
      const supplierName =
        suppliers.find((supplier: any) => supplier.id === expense.entityId)?.razaoSocial ||
        expense.supplierName ||
        expense.description ||
        "-";

      entries.push({
        id: `exp-${expense.id}`,
        type: "Despesa",
        name: supplierName,
        description: expense.description || "-",
        dueDate: expense.dueDate || null,
        status: expense.status === "pago" ? "Pago" : "Pendente",
        value: expense.valorTotal || 0,
      });
    });

    entries.sort((a, b) => {
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      return dateA - dateB;
    });

    const chartData = [
      {
        name: "Período",
        receitas: totalRecebido + pendenteReceber,
        despesas: totalPago + pendentePagar,
      },
    ];

    return {
      totalRecebido,
      pendenteReceber,
      totalPago,
      pendentePagar,
      entries,
      chartData,
    };
  }, [generated, dateRange, revenues, expenses, clients, suppliers, tipoLancamento, statusFilter]);

  const exportCSV = () => {
    if (!data || data.entries.length === 0) return;

    let csv = "Tipo,Cliente/Fornecedor,Descrição,Vencimento,Status,Valor\n";

    data.entries.forEach((entry) => {
      csv += `${entry.type},"${String(entry.name).replace(/"/g, '""')}","${String(entry.description).replace(/"/g, '""')}",${
        entry.dueDate ? format(new Date(entry.dueDate), "dd/MM/yyyy") : "-"
      },${entry.status},${entry.value}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "relatorio.csv";
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Tabs
        value="relatorios"
        onValueChange={(val) => {
          const tab = tabItems.find((t) => t.value === val);
          if (tab && "path" in tab && tab.path) navigate(tab.path);
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
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Período</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? format(dateRange.from, "dd/MM/yyyy") : ""} -{" "}
                    {dateRange?.to ? format(dateRange.to, "dd/MM/yyyy") : ""}
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

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Tipo de Lançamento</span>
              <Select value={tipoLancamento} onValueChange={(value: TipoLancamento) => setTipoLancamento(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="receitas">Receitas</SelectItem>
                  <SelectItem value="despesas">Despesas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Status</span>
              <Select value={statusFilter} onValueChange={(value: StatusFiltro) => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pago">Pago/Recebido</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" className="w-full gap-2" onClick={() => setGenerated(true)}>
                <Search className="h-4 w-4" />
                Gerar Relatório
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {generated && data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Total Recebido</span>
                  <CheckCircle className="h-4 w-4 text-success" />
                </div>
                <p className="text-xl font-bold text-foreground">
                  {loading ? "..." : formatCurrency(data.totalRecebido)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Pendente Receber</span>
                  <TrendingUp className="h-4 w-4 text-success" />
                </div>
                <p className="text-xl font-bold text-foreground">
                  {loading ? "..." : formatCurrency(data.pendenteReceber)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Total Pago</span>
                  <CheckCircle className="h-4 w-4 text-destructive" />
                </div>
                <p className="text-xl font-bold text-foreground">{loading ? "..." : formatCurrency(data.totalPago)}</p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Pendente Pagar</span>
                  <TrendingDown className="h-4 w-4 text-destructive" />
                </div>
                <p className="text-xl font-bold text-foreground">
                  {loading ? "..." : formatCurrency(data.pendentePagar)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Balanço Mensal</CardTitle>
              <p className="text-xs text-muted-foreground">Receitas vs. Despesas no período selecionado.</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={[
                    {
                      name: "Período",
                      receitas: data.totalRecebido + data.pendenteReceber,
                      despesas: data.totalPago + data.pendentePagar,
                    },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => formatCurrency(value)}
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
                  <Legend />
                  <Bar dataKey="receitas" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Receitas" />
                  <Bar dataKey="despesas" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} name="Despesas" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Lançamentos Detalhados</CardTitle>
                  <p className="text-xs text-muted-foreground">{data.entries.length} registros encontrados.</p>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2" onClick={exportCSV}>
                    <Download className="h-4 w-4" />
                    Exportar CSV
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
                    <Printer className="h-4 w-4" />
                    Imprimir
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cliente/Fornecedor</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {data.entries.length > 0 ? (
                    data.entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Badge
                            className={
                              entry.type === "Receita"
                                ? "bg-success/20 text-success border-0"
                                : "bg-destructive/20 text-destructive border-0"
                            }
                          >
                            {entry.type}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-sm">{entry.name}</TableCell>
                        <TableCell className="text-sm">{entry.description}</TableCell>
                        <TableCell className="text-sm">
                          {entry.dueDate ? format(new Date(entry.dueDate), "dd/MM/yyyy") : "-"}
                        </TableCell>

                        <TableCell>
                          <Badge
                            className={
                              entry.status === "Recebido" || entry.status === "Pago"
                                ? "bg-success/20 text-success border-0"
                                : "bg-warning/20 text-warning border-0"
                            }
                          >
                            {entry.status}
                          </Badge>
                        </TableCell>

                        <TableCell
                          className={`text-sm text-right ${
                            entry.type === "Receita" ? "text-success" : "text-destructive"
                          }`}
                        >
                          {formatCurrency(entry.value)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">
                        Nenhum registro encontrado para os filtros selecionados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {!generated && (
        <Card className="border-border">
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            Selecione os filtros e clique em "Gerar Relatório" para visualizar os dados.
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Relatorios;
