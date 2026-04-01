import { useState, useMemo, useEffect } from "react";
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
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const Relatorios = () => {
  const navigate = useNavigate();
  const { revenues, expenses, loading, fetchAllData } = useStore();
  const now = new Date();

  const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: startOfMonth(now), to: endOfMonth(now) });
  const [tipoLancamento, setTipoLancamento] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [generated, setGenerated] = useState(false);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

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
    const interval = { start: dateRange.from, end: dateRange.to };

    let filteredRev = revenues.filter((r: any) => r.dueDate && isWithinInterval(new Date(r.dueDate), interval));
    let filteredExp = expenses.filter((e: any) => e.dueDate && isWithinInterval(new Date(e.dueDate), interval));

    if (statusFilter !== "todos") {
      filteredRev = filteredRev.filter((r: any) => r.status === statusFilter);
      filteredExp = filteredExp.filter((e: any) => e.status === statusFilter);
    }

    if (tipoLancamento === "receitas") filteredExp = [];
    if (tipoLancamento === "despesas") filteredRev = [];

    const totalRecebido = filteredRev.filter((r: any) => r.status === "recebido").reduce((s: number, r: any) => s + (r.valorTotal || 0), 0);
    const pendenteReceber = filteredRev.filter((r: any) => r.status !== "recebido").reduce((s: number, r: any) => s + (r.valorTotal || 0), 0);
    const totalPago = filteredExp.filter((e: any) => e.status === "pago").reduce((s: number, e: any) => s + (e.valorTotal || 0), 0);
    const pendentePagar = filteredExp.filter((e: any) => e.status !== "pago").reduce((s: number, e: any) => s + (e.valorTotal || 0), 0);

    const entries: any[] = [];
    filteredRev.forEach((r: any) => entries.push({ type: "Receita", name: r.clientName || r.description || "-", description: r.description || "-", dueDate: r.dueDate, status: r.status === "recebido" ? "Recebido" : "Pendente", value: r.valorTotal || 0 }));
    filteredExp.forEach((e: any) => entries.push({ type: "Despesa", name: e.supplierName || e.description || "-", description: e.description || "-", dueDate: e.dueDate, status: e.status === "pago" ? "Pago" : "Pendente", value: e.valorTotal || 0 }));
    entries.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    // Chart: receitas vs despesas totals
    const chartData = [
      { name: "Receitas", recebido: totalRecebido, pendente: pendenteReceber },
      { name: "Despesas", pago: totalPago, pendente: pendentePagar },
    ];

    return { totalRecebido, pendenteReceber, totalPago, pendentePagar, entries, chartData };
  }, [generated, dateRange, revenues, expenses, tipoLancamento, statusFilter]);

  const exportCSV = () => {
    if (!data) return;
    let csv = "Tipo,Cliente/Fornecedor,Descrição,Vencimento,Status,Valor\n";
    data.entries.forEach((e: any) => {
      csv += `${e.type},"${e.name}","${e.description}",${e.dueDate ? format(new Date(e.dueDate), "dd/MM/yyyy") : "-"},${e.status},${e.value}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "relatorio.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Tabs value="relatorios" onValueChange={(val) => {
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
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Período</span>
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
              <span className="text-xs text-muted-foreground font-medium">Tipo de Lançamento</span>
              <Select value={tipoLancamento} onValueChange={setTipoLancamento}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="receitas">Receitas</SelectItem>
                  <SelectItem value="despesas">Despesas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Status</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="recebido">Recebido</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full gap-2" onClick={() => setGenerated(true)}>
                <Search className="h-4 w-4" /> Gerar Relatório
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {generated && data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border"><CardContent className="p-5">
              <div className="flex items-center justify-between mb-1"><span className="text-sm text-muted-foreground">Total Recebido</span><CheckCircle className="h-4 w-4 text-success" /></div>
              <p className="text-xl font-bold text-foreground">{formatCurrency(data.totalRecebido)}</p>
            </CardContent></Card>
            <Card className="border-border"><CardContent className="p-5">
              <div className="flex items-center justify-between mb-1"><span className="text-sm text-muted-foreground">Pendente Receber</span><TrendingUp className="h-4 w-4 text-success" /></div>
              <p className="text-xl font-bold text-foreground">{formatCurrency(data.pendenteReceber)}</p>
            </CardContent></Card>
            <Card className="border-border"><CardContent className="p-5">
              <div className="flex items-center justify-between mb-1"><span className="text-sm text-muted-foreground">Total Pago</span><CheckCircle className="h-4 w-4 text-destructive" /></div>
              <p className="text-xl font-bold text-foreground">{formatCurrency(data.totalPago)}</p>
            </CardContent></Card>
            <Card className="border-border"><CardContent className="p-5">
              <div className="flex items-center justify-between mb-1"><span className="text-sm text-muted-foreground">Pendente Pagar</span><TrendingDown className="h-4 w-4 text-destructive" /></div>
              <p className="text-xl font-bold text-foreground">{formatCurrency(data.pendentePagar)}</p>
            </CardContent></Card>
          </div>

          {/* Chart */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Balanço Mensal</CardTitle>
              <p className="text-xs text-muted-foreground">Receitas vs. Despesas no período selecionado.</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[{
                  name: "Período",
                  receitas: data.totalRecebido + data.pendenteReceber,
                  despesas: data.totalPago + data.pendentePagar,
                }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => formatCurrency(v)} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} formatter={(value: number) => [formatCurrency(value), undefined]} />
                  <Legend />
                  <Bar dataKey="receitas" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Receitas" />
                  <Bar dataKey="despesas" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} name="Despesas" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Table */}
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Lançamentos Detalhados</CardTitle>
                  <p className="text-xs text-muted-foreground">{data.entries.length} registros encontrados.</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2" onClick={exportCSV}><Download className="h-4 w-4" /> Exportar CSV</Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}><Printer className="h-4 w-4" /> Imprimir</Button>
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
                  {data.entries.length > 0 ? data.entries.map((e: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell><Badge className={e.type === "Receita" ? "bg-success/20 text-success border-0" : "bg-destructive/20 text-destructive border-0"}>{e.type}</Badge></TableCell>
                      <TableCell className="text-sm">{e.name}</TableCell>
                      <TableCell className="text-sm">{e.description}</TableCell>
                      <TableCell className="text-sm">{e.dueDate ? format(new Date(e.dueDate), "dd/MM/yyyy") : "-"}</TableCell>
                      <TableCell><Badge className={e.status === "Recebido" || e.status === "Pago" ? "bg-success/20 text-success border-0" : "bg-warning/20 text-warning border-0"}>{e.status}</Badge></TableCell>
                      <TableCell className={`text-sm text-right ${e.type === "Receita" ? "text-success" : "text-destructive"}`}>{formatCurrency(e.value)}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">Nenhum registro encontrado para os filtros selecionados.</TableCell></TableRow>
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
