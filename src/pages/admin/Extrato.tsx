//src/pages/admin/Extrato.tsx

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
import {
  CalendarIcon,
  ArrowLeftRight,
  Download,
  Landmark,
  TrendingUp,
  TrendingDown,
  CircleDollarSign,
} from "lucide-react";
import {
  format,
  startOfDay,
  endOfDay,
  isWithinInterval,
  compareAsc,
  startOfMonth,
  endOfMonth,
  isBefore,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { useNavigate } from "react-router-dom";
import { TransferDialog } from "@/components/financeiro/TransferDialog";
import { toast } from "sonner";

type StatementTransaction = {
  id: string;
  date: Date;
  description: string;
  type: "entrada" | "saida";
  value: number;
  bankAccountId?: string;
};

const Extrato = () => {
  const navigate = useNavigate();
  const { revenues, expenses, bankAccounts, loading, fetchAllData } = useStore();

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");
  const [showTransfer, setShowTransfer] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const tabItems = [
    { value: "visao-geral", label: "Visão Geral", path: "/admin/financeiro" },
    { value: "receber", label: "Contas a Receber", path: "/admin/financeiro/receber" },
    { value: "pagar", label: "Contas a Pagar", path: "/admin/financeiro/pagar" },
    { value: "fluxo-caixa", label: "Fluxo de Caixa", path: "/admin/financeiro/fluxo-caixa" },
    { value: "extrato", label: "Extrato" },
    { value: "dre", label: "DRE", path: "/admin/financeiro/dre" },
    { value: "relatorios", label: "Relatórios", path: "/admin/financeiro/relatorios" },
  ];

  const allTransactions = useMemo<StatementTransaction[]>(() => {
    const paidExpenses: StatementTransaction[] = expenses
      .filter((expense: any) => String(expense.status || "").toLowerCase() === "pago" && expense.paymentDate)
      .map((expense: any) => ({
        id: `exp-${expense.id}`,
        date: new Date(expense.paymentDate),
        description: expense.description || "Despesa",
        type: "saida",
        value: expense.valorTotal || 0,
        bankAccountId: expense.bankAccountId,
      }));

    const receivedRevenues: StatementTransaction[] = revenues
      .filter((revenue: any) => String(revenue.status || "").toLowerCase() === "recebido" && revenue.paymentDate)
      .map((revenue: any) => ({
        id: `rev-${revenue.id}`,
        date: new Date(revenue.paymentDate),
        description: revenue.description || "Receita",
        type: "entrada",
        value: revenue.valorTotal || 0,
        bankAccountId: revenue.bankAccountId,
      }));

    return [...paidExpenses, ...receivedRevenues].sort((a, b) => compareAsc(a.date, b.date));
  }, [expenses, revenues]);

  const { filteredTransactions, previousBalance, totalIn, totalOut, finalBalance } = useMemo(() => {
    const from = dateRange?.from ? startOfDay(dateRange.from) : new Date(0);
    const to = dateRange?.to ? endOfDay(dateRange.to) : new Date();

    const accountFilter = (transaction: StatementTransaction) =>
      selectedAccountId === "all" || transaction.bankAccountId === selectedAccountId;

    const previousTransactions = allTransactions.filter(
      (transaction) => isBefore(transaction.date, from) && accountFilter(transaction),
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

    const previousBalance = previousTransactions.reduce((accumulator, transaction) => {
      return accumulator + (transaction.type === "entrada" ? transaction.value : -transaction.value);
    }, startingBalance);

    const filteredTransactions = allTransactions.filter(
      (transaction) => isWithinInterval(transaction.date, { start: from, end: to }) && accountFilter(transaction),
    );

    const totalIn = filteredTransactions
      .filter((transaction) => transaction.type === "entrada")
      .reduce((sum, transaction) => sum + transaction.value, 0);

    const totalOut = filteredTransactions
      .filter((transaction) => transaction.type === "saida")
      .reduce((sum, transaction) => sum + transaction.value, 0);

    const finalBalance = previousBalance + totalIn - totalOut;

    return {
      filteredTransactions,
      previousBalance,
      totalIn,
      totalOut,
      finalBalance,
    };
  }, [allTransactions, dateRange, selectedAccountId, bankAccounts]);

  const handleExport = () => {
    if (filteredTransactions.length === 0 && previousBalance === 0) {
      toast.error("Não há lançamentos no período selecionado.");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += ["Data", "Descrição", "Entradas", "Saídas", "Saldo"].join(",") + "\r\n";

    let runningBalance = previousBalance;

    csvContent += `"", "SALDO ANTERIOR", "", "", "${previousBalance.toFixed(2)}"\r\n`;

    filteredTransactions.forEach((transaction) => {
      runningBalance += transaction.type === "entrada" ? transaction.value : -transaction.value;

      const row = [
        `"${format(transaction.date, "dd/MM/yyyy")}"`,
        `"${String(transaction.description || "").replace(/"/g, '""')}"`,
        `"${transaction.type === "entrada" ? transaction.value.toFixed(2) : "0.00"}"`,
        `"${transaction.type === "saida" ? transaction.value.toFixed(2) : "0.00"}"`,
        `"${runningBalance.toFixed(2)}"`,
      ];

      csvContent += row.join(",") + "\r\n";
    });

    csvContent += `"", "SALDO FINAL", "", "", "${finalBalance.toFixed(2)}"\r\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    const fromDate = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : "inicio";
    const toDate = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : "fim";

    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Extrato_${fromDate}_a_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  let runningBalance = previousBalance;

  return (
    <div className="space-y-6">
      <Tabs
        value="extrato"
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
          <h3 className="text-sm font-semibold text-foreground mb-1">Relatório de Extrato Bancário</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Visualize o extrato consolidado de suas contas para conciliação.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

            <div className="flex items-end">
              <Button variant="outline" className="w-full gap-2" onClick={() => setShowTransfer(true)}>
                <ArrowLeftRight className="h-4 w-4" />
                Transferência
              </Button>
            </div>

            <div className="flex items-end">
              <Button variant="outline" className="w-full gap-2" onClick={handleExport}>
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Saldo Anterior</span>
              <Landmark className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xl font-bold text-foreground">{loading ? "..." : formatCurrency(previousBalance)}</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Total de Entradas</span>
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <p className="text-xl font-bold text-success">{loading ? "..." : formatCurrency(totalIn)}</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Total de Saídas</span>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </div>
            <p className="text-xl font-bold text-destructive">{loading ? "..." : formatCurrency(totalOut)}</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Saldo Final</span>
              <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xl font-bold text-foreground">{loading ? "..." : formatCurrency(finalBalance)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Lançamentos do Período</CardTitle>
          <CardDescription>Extrato consolidado com saldo anterior e saldo final.</CardDescription>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Entradas</TableHead>
                <TableHead className="text-right">Saídas</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableCell colSpan={4} className="text-sm font-bold">
                  SALDO ANTERIOR
                </TableCell>
                <TableCell className="text-sm text-right font-bold">{formatCurrency(previousBalance)}</TableCell>
              </TableRow>

              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => {
                  runningBalance += transaction.type === "entrada" ? transaction.value : -transaction.value;

                  return (
                    <TableRow key={transaction.id}>
                      <TableCell className="text-sm">{format(transaction.date, "dd/MM/yyyy")}</TableCell>
                      <TableCell className="text-sm">{transaction.description}</TableCell>
                      <TableCell className="text-sm text-right text-success">
                        {transaction.type === "entrada" ? formatCurrency(transaction.value) : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-right text-destructive">
                        {transaction.type === "saida" ? formatCurrency(transaction.value) : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-right font-medium">{formatCurrency(runningBalance)}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">
                    Nenhum lançamento para exibir.
                  </TableCell>
                </TableRow>
              )}

              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableCell colSpan={4} className="text-sm font-bold">
                  SALDO FINAL
                </TableCell>
                <TableCell className="text-sm text-right font-bold">{formatCurrency(finalBalance)}</TableCell>
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
