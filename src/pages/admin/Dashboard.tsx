//src/pages/admin/Dashboard.tsx

import { DollarSign, TrendingUp, TrendingDown, FileText, Package, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const chartData = [
  { name: "Jan", receitas: 45000, despesas: 28000 },
  { name: "Fev", receitas: 52000, despesas: 31000 },
  { name: "Mar", receitas: 48000, despesas: 29000 },
  { name: "Abr", receitas: 61000, despesas: 35000 },
  { name: "Mai", receitas: 55000, despesas: 32000 },
  { name: "Jun", receitas: 67000, despesas: 38000 },
];

const summaryCards = [
  {
    title: "Receita do Mês",
    value: "R$ 67.000",
    change: "+12%",
    trend: "up" as const,
    icon: TrendingUp,
    color: "text-success",
  },
  {
    title: "Despesas do Mês",
    value: "R$ 38.000",
    change: "+5%",
    trend: "down" as const,
    icon: TrendingDown,
    color: "text-destructive",
  },
  {
    title: "Contratos Ativos",
    value: "24",
    change: "+3",
    trend: "up" as const,
    icon: FileText,
    color: "text-info",
  },
  {
    title: "Equipamentos Disponíveis",
    value: "156",
    change: "-8",
    trend: "down" as const,
    icon: Package,
    color: "text-warning",
  },
];

const recentContracts = [
  { id: "CT-2024-001", client: "Empresa Alpha LTDA", value: "R$ 4.500/mês", status: "Ativo", date: "15/06/2024" },
  { id: "CT-2024-002", client: "Tech Solutions SA", value: "R$ 8.200/mês", status: "Ativo", date: "12/06/2024" },
  { id: "CT-2024-003", client: "Grupo Beta", value: "R$ 3.100/mês", status: "Pendente", date: "10/06/2024" },
  { id: "CT-2024-004", client: "Inovação Corp", value: "R$ 6.750/mês", status: "Ativo", date: "08/06/2024" },
  { id: "CT-2024-005", client: "Digital Services", value: "R$ 2.300/mês", status: "Finalizado", date: "05/06/2024" },
];

const recentSales = [
  { id: "VD-2024-012", client: "Empresa Zeta", value: "R$ 12.500", items: 5, date: "14/06/2024" },
  { id: "VD-2024-011", client: "Smart Office", value: "R$ 8.900", items: 3, date: "11/06/2024" },
  { id: "VD-2024-010", client: "Corp Solutions", value: "R$ 15.200", items: 8, date: "09/06/2024" },
];

const statusColors: Record<string, string> = {
  Ativo: "bg-success/20 text-success border-0",
  Pendente: "bg-warning/20 text-warning border-0",
  Finalizado: "bg-muted text-muted-foreground border-0",
};

const Dashboard = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      <p className="text-muted-foreground">Visão geral do seu negócio</p>
    </div>

    {/* Summary Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {summaryCards.map(({ title, value, change, trend, icon: Icon, color }) => (
        <Card key={title} className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{title}</span>
              <div className={`rounded-lg bg-muted p-2 ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground">{value}</div>
            <div className="flex items-center gap-1 mt-1">
              {trend === "up" ? (
                <ArrowUpRight className="h-3 w-3 text-success" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-destructive" />
              )}
              <span className={`text-xs font-medium ${trend === "up" ? "text-success" : "text-destructive"}`}>
                {change}
              </span>
              <span className="text-xs text-muted-foreground">vs mês anterior</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Chart */}
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-lg">Receitas vs Despesas</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                color: "hsl(var(--foreground))",
              }}
              formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, undefined]}
            />
            <Legend />
            <Bar dataKey="receitas" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Receitas" />
            <Bar dataKey="despesas" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} name="Despesas" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>

    {/* Tables */}
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Últimos Contratos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentContracts.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{c.id}</span>
                    <Badge className={statusColors[c.status]}>{c.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.client}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{c.value}</p>
                  <p className="text-xs text-muted-foreground">{c.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Últimas Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentSales.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="space-y-1">
                  <span className="text-sm font-medium text-foreground">{s.id}</span>
                  <p className="text-xs text-muted-foreground">{s.client}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.items} itens · {s.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

export default Dashboard;
