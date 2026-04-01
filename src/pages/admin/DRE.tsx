import { useState, useMemo, useEffect } from "react";
import { useStore } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

const DRE = () => {
  const navigate = useNavigate();
  const { revenues, expenses, chartOfAccounts, loading, fetchAllData } = useStore();

  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [generated, setGenerated] = useState(false);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  const tabItems = [
    { value: "visao-geral", label: "Visão Geral", path: "/admin/financeiro" },
    { value: "receber", label: "Contas a Receber", path: "/admin/financeiro/receber" },
    { value: "pagar", label: "Contas a Pagar", path: "/admin/financeiro/pagar" },
    { value: "fluxo-caixa", label: "Fluxo de Caixa", path: "/admin/financeiro/fluxo-caixa" },
    { value: "extrato", label: "Extrato", path: "/admin/financeiro/extrato" },
    { value: "dre", label: "DRE" },
    { value: "relatorios", label: "Relatórios" },
  ];

  const dreData = useMemo(() => {
    if (!generated) return null;

    const [year, month] = selectedMonth.split("-").map(Number);
    const periodStart = startOfMonth(new Date(year, month - 1));
    const periodEnd = endOfMonth(new Date(year, month - 1));
    const interval = { start: periodStart, end: periodEnd };

    // Receitas by chart of accounts
    const periodRevenues = revenues.filter((r: any) =>
      r.dueDate && r.status === "recebido" && isWithinInterval(new Date(r.dueDate), interval)
    );
    const periodExpenses = expenses.filter((e: any) =>
      e.dueDate && e.status === "pago" && isWithinInterval(new Date(e.dueDate), interval)
    );

    // Group revenues
    const revenueGroups: Record<string, { name: string; total: number }> = {};
    periodRevenues.forEach((r: any) => {
      const key = r.chartOfAccountId || "sem-conta";
      const account = chartOfAccounts.find((ca: any) => ca.id === key);
      if (!revenueGroups[key]) revenueGroups[key] = { name: account?.name || "Sem classificação", total: 0 };
      revenueGroups[key].total += r.valorTotal || 0;
    });

    // Group expenses
    const expenseGroups: Record<string, { name: string; total: number }> = {};
    periodExpenses.forEach((e: any) => {
      const key = e.chartOfAccountId || "sem-conta";
      const account = chartOfAccounts.find((ca: any) => ca.id === key);
      if (!expenseGroups[key]) expenseGroups[key] = { name: account?.name || "Sem classificação", total: 0 };
      expenseGroups[key].total += e.valorTotal || 0;
    });

    const totalReceitas = Object.values(revenueGroups).reduce((s, g) => s + g.total, 0);
    const totalDespesas = Object.values(expenseGroups).reduce((s, g) => s + g.total, 0);
    const resultado = totalReceitas - totalDespesas;

    return {
      revenueGroups: Object.values(revenueGroups),
      expenseGroups: Object.values(expenseGroups),
      totalReceitas,
      totalDespesas,
      resultado,
      period: format(periodStart, "MMMM 'de' yyyy", { locale: ptBR }),
    };
  }, [generated, selectedMonth, revenues, expenses, chartOfAccounts]);

  const exportCSV = () => {
    if (!dreData) return;
    let csv = "Categoria,Valor\n";
    csv += "RECEITAS,\n";
    dreData.revenueGroups.forEach((g) => { csv += `"${g.name}",${g.total}\n`; });
    csv += `Total Receitas,${dreData.totalReceitas}\n`;
    csv += "DESPESAS,\n";
    dreData.expenseGroups.forEach((g) => { csv += `"${g.name}",${g.total}\n`; });
    csv += `Total Despesas,${dreData.totalDespesas}\n`;
    csv += `RESULTADO,${dreData.resultado}\n`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "dre.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Tabs value="dre" onValueChange={(val) => {
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

      {/* Filter */}
      <Card className="border-border">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Mês de Competência</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input type="month" value={selectedMonth} onChange={(e) => { setSelectedMonth(e.target.value); setGenerated(false); }} />
            <Button variant="outline" className="gap-2" onClick={() => setGenerated(true)}>
              <Search className="h-4 w-4" /> Gerar DRE
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* DRE Report */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Demonstrativo de Resultado do Exercício (DRE)</CardTitle>
              <p className="text-xs text-muted-foreground">Análise de receitas e despesas para o período de competência selecionado.</p>
            </div>
            {dreData && (
              <Button variant="outline" size="sm" className="gap-2" onClick={exportCSV}>
                <Download className="h-4 w-4" /> Exportar CSV
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {dreData ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Conta</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Receitas */}
                <TableRow className="bg-muted/30">
                  <TableCell className="text-sm font-bold text-success" colSpan={2}>RECEITAS</TableCell>
                </TableRow>
                {dreData.revenueGroups.length > 0 ? dreData.revenueGroups.map((g, i) => (
                  <TableRow key={`r-${i}`}>
                    <TableCell className="text-sm pl-6">{g.name}</TableCell>
                    <TableCell className="text-sm text-right text-success">{formatCurrency(g.total)}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={2} className="text-sm text-muted-foreground pl-6">Nenhuma receita no período.</TableCell></TableRow>
                )}
                <TableRow className="border-t-2 border-border">
                  <TableCell className="text-sm font-bold">Total Receitas</TableCell>
                  <TableCell className="text-sm text-right font-bold text-success">{formatCurrency(dreData.totalReceitas)}</TableCell>
                </TableRow>

                {/* Despesas */}
                <TableRow className="bg-muted/30">
                  <TableCell className="text-sm font-bold text-destructive" colSpan={2}>DESPESAS</TableCell>
                </TableRow>
                {dreData.expenseGroups.length > 0 ? dreData.expenseGroups.map((g, i) => (
                  <TableRow key={`e-${i}`}>
                    <TableCell className="text-sm pl-6">{g.name}</TableCell>
                    <TableCell className="text-sm text-right text-destructive">{formatCurrency(g.total)}</TableCell>
                  </TableRow>
                )) : (
                  <TableRow><TableCell colSpan={2} className="text-sm text-muted-foreground pl-6">Nenhuma despesa no período.</TableCell></TableRow>
                )}
                <TableRow className="border-t-2 border-border">
                  <TableCell className="text-sm font-bold">Total Despesas</TableCell>
                  <TableCell className="text-sm text-right font-bold text-destructive">{formatCurrency(dreData.totalDespesas)}</TableCell>
                </TableRow>

                {/* Resultado */}
                <TableRow className="bg-muted/50 border-t-4 border-border">
                  <TableCell className="text-base font-bold">RESULTADO DO EXERCÍCIO</TableCell>
                  <TableCell className={`text-base text-right font-bold ${dreData.resultado >= 0 ? "text-success" : "text-destructive"}`}>
                    {formatCurrency(dreData.resultado)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-10">
              Selecione um período e clique em "Gerar DRE" para visualizar o relatório.
            </p>
          )}

          <p className="text-xs text-muted-foreground mt-4">
            * Este é um relatório gerencial simplificado, utilizando o regime de caixa. As receitas e despesas são consideradas com base na data de liquidação (pagamento/recebimento) dentro do período selecionado.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DRE;
