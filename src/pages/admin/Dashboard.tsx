import { useMemo } from "react";
import { TrendingUp, TrendingDown, FileText, Package, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useStore } from "@/store";
import { formatCurrency } from "@/lib/utils";
import { format, isSameMonth, subMonths } from "date-fns";

const Dashboard = () => {
  const { equipments, contracts, sales, revenues, expenses, loading } = useStore();

  const currentMonth = new Date();
  const previousMonth = subMonths(currentMonth, 1);

  const availableEquipments = useMemo(
    () => equipments.filter((e: any) => e.status === "disponivel").length,
    [equipments],
  );

  const totalEquipments = equipments.length;

  const activeContracts = useMemo(() => contracts.filter((c: any) => c.status === "Em Andamento").length, [contracts]);

  const previousActiveContracts = useMemo(
    () =>
      contracts.filter(
        (c: any) => c.status === "Em Andamento" && c.createdAt && isSameMonth(new Date(c.createdAt), previousMonth),
      ).length,
    [contracts, previousMonth],
  );

  const { monthlyRevenue, previousMonthlyRevenue } = useMemo(() => {
    const current = revenues
      .filter((r: any) => r.dueDate && isSameMonth(new Date(r.dueDate), currentMonth) && r.status === "recebido")
      .reduce((sum: number, r: any) => sum + (r.valorTotal || 0), 0);

    const previous = revenues
      .filter((r: any) => r.dueDate && isSameMonth(new Date(r.dueDate), previousMonth) && r.status === "recebido")
      .reduce((sum: number, r: any) => sum + (r.valorTotal || 0), 0);

    return {
      monthlyRevenue: current,
      previousMonthlyRevenue: previous,
    };
  }, [revenues, currentMonth, previousMonth]);

  const { monthlyExpense, previousMonthlyExpense } = useMemo(() => {
    const current = expenses
      .filter((e: any) => e.dueDate && isSameMonth(new Date(e.dueDate), currentMonth) && e.status === "pago")
      .reduce((sum: number, e: any) => sum + (e.valorTotal || 0), 0);

    const previous = expenses
      .filter((e: any) => e.dueDate && isSameMonth(new Date(e.dueDate), previousMonth) && e.status === "pago")
      .reduce((sum: number, e: any) => sum + (e.valorTotal || 0), 0);

    return {
      monthlyExpense: current,
      previousMonthlyExpense: previous,
    };
  }, [expenses, currentMonth, previousMonth]);

  const chartData = useMemo(() => {
    return Array.from({ length: 6 }).map((_, index) => {
      const monthDate = subMonths(currentMonth, 5 - index);

      const receitas = revenues
        .filter((r: any) => r.dueDate && isSameMonth(new Date(r.dueDate), monthDate) && r.status === "recebido")
        .reduce((sum: number, r: any) => sum + (r.valorTotal || 0), 0);

      const despesas = expenses
        .filter((e: any) => e.dueDate && isSameMonth(new Date(e.dueDate), monthDate) && e.status === "pago")
        .reduce((sum: number, e: any) => sum + (e.valorTotal || 0), 0);

      return {
        name: format(monthDate, "MMM"),
        receitas,
        despesas,
      };
    });
  }, [revenues, expenses, currentMonth]);

  const recentContracts = useMemo(() => {
    return [...contracts]
      .filter((contract: any) => contract.createdAt)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [contracts]);

  const recentSales = useMemo(() => {
    return [...sales]
      .filter((sale: any) => sale.saleDate)
      .sort((a: any, b: any) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime())
      .slice(0, 5);
  }, [sales]);

  const revenueTrendUp = monthlyRevenue >= previousMonthlyRevenue;
  const expenseTrendUp = monthlyExpense <= previousMonthlyExpense;
  const contractTrendUp = activeContracts >= previousActiveContracts;

  const equipmentChange = `${availableEquipments}/${totalEquipments}`;

  const getContractMonthlyValue = (contract: any) => {
    return (contract.items || []).reduce(
      (acc: number, item: any) => acc + (item.quantity || 0) * (item.unitPrice || 0),
      0,
    );
  };

  const getContractStatusClass = (status?: string) => {
    switch (status) {
      case "Em Andamento":
        return "bg-success/20 text-success border-0";
      case "Pendente":
        return "bg-warning/20 text-warning border-0";
      case "Finalizado":
        return "bg-muted text-muted-foreground border-0";
      default:
        return "bg-muted text-muted-foreground border-0";
    }
  };

  const getSaleStatusClass = (status?: string) => {
    switch (status) {
      case "Concluída":
        return "bg-success/20 text-success border-0";
      case "Cancelada":
        return "bg-destructive/20 text-destructive border-0";
      default:
        return "bg-muted text-muted-foreground border-0";
    }
  };

  const summaryCards = [
    {
      title: "Receita do Mês",
      value: formatCurrency(monthlyRevenue),
      change: formatCurrency(previousMonthlyRevenue),
      trend: revenueTrendUp ? "up" : "down",
      icon: TrendingUp,
      color: "text-success",
      helper: "comparado ao mês anterior",
    },
    {
      title: "Despesas do Mês",
      value: formatCurrency(monthlyExpense),
      change: formatCurrency(previousMonthlyExpense),
      trend: expenseTrendUp ? "up" : "down",
      icon: TrendingDown,
      color: "text-destructive",
      helper: "comparado ao mês anterior",
    },
    {
      title: "Contratos Ativos",
      value: String(activeContracts),
      change: String(previousActiveContracts),
      trend: contractTrendUp ? "up" : "down",
      icon: FileText,
      color: "text-info",
      helper: "ativos no mês anterior",
    },
    {
      title: "Equipamentos Disponíveis",
      value: equipmentChange,
      change: `${totalEquipments} no total`,
      trend: "up",
      icon: Package,
      color: "text-warning",
      helper: "estoque disponível / total",
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu negócio</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map(({ title, value, change, trend, icon: Icon, color, helper }) => (
          <Card key={title} className="border-border">
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{title}</span>
                <div className={`rounded-lg bg-muted p-2 ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div className="text-2xl font-bold text-foreground">{loading ? "..." : value}</div>

              <div className="mt-1 flex items-center gap-1">
                {trend === "up" ? (
                  <ArrowUpRight className="h-3 w-3 text-success" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-destructive" />
                )}
                <span className={`text-xs font-medium ${trend === "up" ? "text-success" : "text-destructive"}`}>
                  {loading ? "..." : change}
                </span>
                <span className="text-xs text-muted-foreground">{helper}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
                formatter={(value: number) => [formatCurrency(value), undefined]}
              />
              <Legend />
              <Bar dataKey="receitas" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Receitas" />
              <Bar dataKey="despesas" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} name="Despesas" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Últimos Contratos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentContracts.length > 0 ? (
                recentContracts.map((contract: any) => (
                  <div key={contract.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{contract.id}</span>
                        <Badge className={getContractStatusClass(contract.status)}>
                          {contract.status || "Sem status"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {contract.client?.razaoSocial || "Cliente não informado"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">
                        {formatCurrency(getContractMonthlyValue(contract))}/mês
                      </p>
                      <p className="text-xs text-muted-foreground">Total: {formatCurrency(contract.totalValue || 0)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg bg-muted/50 p-6 text-center text-sm text-muted-foreground">
                  Nenhum contrato recente.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Últimas Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSales.length > 0 ? (
                recentSales.map((sale: any) => (
                  <div key={sale.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{sale.id}</span>
                        <Badge className={getSaleStatusClass(sale.status)}>{sale.status || "Sem status"}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{sale.clientName || "Cliente não informado"}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">{formatCurrency(sale.totalValue || 0)}</p>
                      <p className="text-xs text-muted-foreground">
                        {(sale.items || []).length} itens ·{" "}
                        {sale.saleDate ? format(new Date(sale.saleDate), "dd/MM/yyyy") : "-"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg bg-muted/50 p-6 text-center text-sm text-muted-foreground">
                  Nenhuma venda recente.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
