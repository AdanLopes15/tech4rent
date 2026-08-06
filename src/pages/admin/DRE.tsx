//src/pages/admin/DRE.tsx

import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, Download, TrendingUp, TrendingDown, Equal, FileSpreadsheet } from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

import { useStore } from "@/store";
import { formatCurrency } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

interface DreLine {
  id: string;
  code: string;
  name: string;
  value: number;
  subItems?: DreLine[];
}

interface DreData {
  receitas: DreLine[];
  despesas: DreLine[];
  totalReceitas: number;
  totalDespesas: number;
  resultadoLiquido: number;
}

const DRE = () => {
  const navigate = useNavigate();
  const { revenues, expenses, chartOfAccounts, fetchAllData } = useStore();

  const [competence, setCompetence] = useState<string>(format(new Date(), "yyyy-MM"));
  const [dreData, setDreData] = useState<DreData | null>(null);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const tabItems = [
    { value: "visao-geral", label: "Visão Geral", path: "/admin/financeiro" },
    { value: "receber", label: "Contas a Receber", path: "/admin/financeiro/receber" },
    { value: "pagar", label: "Contas a Pagar", path: "/admin/financeiro/pagar" },
    { value: "fluxo-caixa", label: "Fluxo de Caixa", path: "/admin/financeiro/fluxo-caixa" },
    { value: "extrato", label: "Extrato", path: "/admin/financeiro/extrato" },
    { value: "dre", label: "DRE" },
    { value: "relatorios", label: "Relatórios", path: "/admin/financeiro/relatorios" },
  ];

  const handleGenerateDRE = () => {
    if (!competence) {
      return;
    }

    const [year, month] = competence.split("-").map(Number);

    const periodRevenues = revenues.filter((revenue: any) => {
      if (String(revenue.status || "").toLowerCase() !== "recebido" || !revenue.paymentDate) {
        return false;
      }

      const paymentDate = new Date(revenue.paymentDate);
      return paymentDate.getFullYear() === year && paymentDate.getMonth() + 1 === month;
    });

    const periodExpenses = expenses.filter((expense: any) => {
      if (String(expense.status || "").toLowerCase() !== "pago" || !expense.paymentDate) {
        return false;
      }

      const paymentDate = new Date(expense.paymentDate);
      return paymentDate.getFullYear() === year && paymentDate.getMonth() + 1 === month;
    });

    const buildDreLines = (type: "receita" | "despesa"): DreLine[] => {
      const accounts = (chartOfAccounts || []).filter((account: any) => account.type === type);
      const transactions = type === "receita" ? periodRevenues : periodExpenses;

      const groupedTransactions: Record<string, number> = {};

      transactions.forEach((transaction: any) => {
        if (transaction.chartOfAccountId) {
          groupedTransactions[transaction.chartOfAccountId] =
            (groupedTransactions[transaction.chartOfAccountId] || 0) + (transaction.valorTotal || 0);
        }
      });

      const accountMap = new Map<string, any>(
        accounts.map((account: any) => [
          account.id,
          {
            ...account,
            children: [] as any[],
            value: groupedTransactions[account.id] || 0,
          },
        ]),
      );

      const rootAccounts: any[] = [];

      accountMap.forEach((account) => {
        if (account.parentAccountId && accountMap.has(account.parentAccountId)) {
          const parent = accountMap.get(account.parentAccountId);
          parent.children.push(account);
        } else {
          rootAccounts.push(account);
        }
      });

      const formatLines = (accountsToFormat: any[]): DreLine[] => {
        return accountsToFormat
          .map((account) => {
            const subItems = formatLines(account.children || []);
            const subItemsValue = subItems.reduce((sum, child) => sum + child.value, 0);
            const totalValue = (account.value || 0) + subItemsValue;

            if (totalValue === 0) {
              return null;
            }

            return {
              id: account.id,
              code: account.code || "",
              name: account.name || "Sem nome",
              value: totalValue,
              subItems: subItems.filter((item) => item.value > 0),
            } as DreLine;
          })
          .filter((item): item is DreLine => item !== null);
      };

      return formatLines(rootAccounts);
    };

    const receitas = buildDreLines("receita");
    const despesas = buildDreLines("despesa");

    const totalReceitas = receitas.reduce((sum, item) => sum + item.value, 0);
    const totalDespesas = despesas.reduce((sum, item) => sum + item.value, 0);
    const resultadoLiquido = totalReceitas - totalDespesas;

    setDreData({
      receitas,
      despesas,
      totalReceitas,
      totalDespesas,
      resultadoLiquido,
    });
  };

  const handleExportExcel = async () => {
    if (!dreData) {
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("DRE");

    // Title
    worksheet.mergeCells("A1:B1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = "Demonstrativo de Resultado do Exercício (DRE)";
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: "center" };

    // Competence
    const dateObj = parseISO(`${competence}-01`);
    const formattedDate = format(dateObj, "MMMM 'de' yyyy", { locale: ptBR });
    worksheet.mergeCells("A2:B2");
    const competenceCell = worksheet.getCell("A2");
    competenceCell.value = `Mês de competência: ${formattedDate}`;
    competenceCell.font = { size: 12 };
    competenceCell.alignment = { horizontal: "center" };

    worksheet.addRow([]); // Blank row

    // Check if there are any real codes
    const hasCodes = [...dreData.receitas, ...dreData.despesas].some(
      (line) => line.code && line.code.trim() !== ""
    );

    // Headers
    const headerRow = hasCodes 
      ? worksheet.addRow(["Código", "Descrição", "Valor (R$)"])
      : worksheet.addRow(["Descrição", "Valor (R$)"]);
    
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.border = {
        bottom: { style: "thin" },
        top: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE0E0E0" },
      };
    });

    // Columns config
    worksheet.columns = hasCodes 
      ? [
          { key: "code", width: 15 },
          { key: "name", width: 45 },
          { key: "value", width: 20, style: { numFmt: '"R$ " #,##0.00' } },
        ]
      : [
          { key: "name", width: 60 },
          { key: "value", width: 20, style: { numFmt: '"R$ " #,##0.00' } },
        ];

    const addDreRow = (line: DreLine, depth = 0) => {
      const indentation = "  ".repeat(depth);
      const rowData = hasCodes 
        ? [line.code, indentation + line.name, line.value]
        : [indentation + line.name, line.value];
      
      const row = worksheet.addRow(rowData);
      
      if (line.subItems && line.subItems.length > 0) {
        line.subItems.forEach((sub) => addDreRow(sub, depth + 1));
      }
      return row;
    };

    // Revenues Section
    const revenueHeader = worksheet.addRow(hasCodes ? ["", "RECEITA OPERACIONAL BRUTA", ""] : ["RECEITA OPERACIONAL BRUTA", ""]);
    revenueHeader.font = { bold: true, color: { argb: "FF008000" } };
    
    dreData.receitas.forEach((line) => addDreRow(line));

    const totalRevenueRow = worksheet.addRow(hasCodes 
      ? ["", "TOTAL DE RECEITAS", dreData.totalReceitas]
      : ["TOTAL DE RECEITAS", dreData.totalReceitas]
    );
    totalRevenueRow.font = { bold: true };
    totalRevenueRow.getCell(hasCodes ? 3 : 2).font = { bold: true, color: { argb: "FF008000" } };

    worksheet.addRow([]); // Blank row

    // Expenses Section
    const expenseHeader = worksheet.addRow(hasCodes ? ["", "DESPESAS OPERACIONAIS", ""] : ["DESPESAS OPERACIONAIS", ""]);
    expenseHeader.font = { bold: true, color: { argb: "FFFF0000" } };

    dreData.despesas.forEach((line) => addDreRow(line));

    const totalExpenseRow = worksheet.addRow(hasCodes 
      ? ["", "TOTAL DE DESPESAS", dreData.totalDespesas]
      : ["TOTAL DE DESPESAS", dreData.totalDespesas]
    );
    totalExpenseRow.font = { bold: true };
    totalExpenseRow.getCell(hasCodes ? 3 : 2).font = { bold: true, color: { argb: "FFFF0000" } };

    worksheet.addRow([]); // Blank row

    // Result
    const resultRow = worksheet.addRow(hasCodes 
      ? ["", "RESULTADO LÍQUIDO", dreData.resultadoLiquido]
      : ["RESULTADO LÍQUIDO", dreData.resultadoLiquido]
    );
    resultRow.font = { bold: true, size: 12 };
    const resultValueCell = resultRow.getCell(hasCodes ? 3 : 2);
    resultValueCell.font = { 
      bold: true, 
      color: { argb: dreData.resultadoLiquido >= 0 ? "FF008000" : "FFFF0000" } 
    };
    resultRow.eachCell((cell) => {
      cell.border = {
        top: { style: "medium" },
        bottom: { style: "medium" },
      };
    });

    // Formatting all cells with light borders
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 4) { // Skip title and headers for general borders if needed, but requirements say light borders
        row.eachCell((cell) => {
          if (!cell.border) {
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
          }
        });
      }
    });

    // Freeze header
    worksheet.views = [
      { state: "frozen", xSplit: 0, ySplit: 4, activePane: "bottomRight" }
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `DRE-${competence}.xlsx`);
  };

  const renderAccordionSection = (
    title: string,
    lines: DreLine[],
    total: number,
    icon: ReactNode,
    type: "receita" | "despesa",
  ) => (
    <AccordionItem value={type} className="border-none">
      <AccordionTrigger className="rounded-md bg-muted/50 p-3 hover:no-underline">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-base font-semibold">{title}</span>
        </div>
        <span className={`text-base font-bold ${type === "receita" ? "text-success" : "text-destructive"}`}>
          {type === "despesa" && total > 0 ? "- " : ""}
          {formatCurrency(total)}
        </span>
      </AccordionTrigger>

      <AccordionContent className="space-y-2 p-4">
        {lines.length > 0 ? (
          lines.map((line) => (
            <div key={line.id}>
              <div className="flex justify-between py-1">
                <span className="font-medium">
                  {line.code} {line.name}
                </span>
                <span className="font-medium">{formatCurrency(line.value)}</span>
              </div>

              {line.subItems?.map((subItem) => (
                <div key={subItem.id} className="flex justify-between pl-6 text-sm text-muted-foreground">
                  <span>
                    {subItem.code} {subItem.name}
                  </span>
                  <span>{formatCurrency(subItem.value)}</span>
                </div>
              ))}
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum detalhe de {type} para exibir no período.</p>
        )}
      </AccordionContent>
    </AccordionItem>
  );

  return (
    <div className="space-y-6">
      <Tabs
        value="dre"
        onValueChange={(value) => {
          const tab = tabItems.find((item) => item.value === value);
          if (tab && "path" in tab && tab.path) {
            navigate(tab.path);
          }
        }}
      >
        <TabsList className="h-auto w-full justify-start gap-0 rounded-none border-b border-border bg-transparent p-0">
          {tabItems.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="rounded-none border-b-2 border-transparent px-4 py-2 text-sm data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card className="border-border">
        <CardContent className="grid grid-cols-1 items-end gap-4 p-5 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Mês de Competência</label>
            <Input type="month" value={competence} onChange={(e) => setCompetence(e.target.value)} />
          </div>

          <Button variant="outline" className="gap-2" onClick={handleGenerateDRE}>
            <Search className="h-4 w-4" />
            Gerar DRE
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Demonstrativo de Resultado do Exercício (DRE)</CardTitle>
              <p className="text-xs text-muted-foreground">
                Análise de receitas e despesas para o período de competência selecionado.
              </p>
            </div>

            <Button variant="outline" size="sm" className="gap-2" onClick={handleExport} disabled={!dreData}>
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {dreData ? (
            <>
              <Accordion type="multiple" defaultValue={["receita", "despesa"]} className="w-full space-y-2">
                {renderAccordionSection(
                  "(+) Receita Operacional Bruta",
                  dreData.receitas,
                  dreData.totalReceitas,
                  <TrendingUp className="h-5 w-5 text-success" />,
                  "receita",
                )}

                {renderAccordionSection(
                  "(-) Despesas Operacionais",
                  dreData.despesas,
                  dreData.totalDespesas,
                  <TrendingDown className="h-5 w-5 text-destructive" />,
                  "despesa",
                )}
              </Accordion>

              <Separator className="my-4" />

              <div className="flex items-center justify-between rounded-md p-3">
                <div className="flex items-center gap-2">
                  <Equal className="h-5 w-5" />
                  <span className="text-lg font-bold">= Resultado Líquido do Período</span>
                </div>

                <span
                  className={`text-lg font-bold ${dreData.resultadoLiquido >= 0 ? "text-success" : "text-destructive"}`}
                >
                  {formatCurrency(dreData.resultadoLiquido)}
                </span>
              </div>

              <p className="mt-4 text-xs text-muted-foreground">
                * Este é um relatório gerencial simplificado, utilizando o regime de caixa. As receitas e despesas são
                consideradas com base na data de liquidação (pagamento/recebimento) dentro do período selecionado.
              </p>
            </>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Selecione um período e clique em "Gerar DRE" para visualizar o relatório.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DRE;
