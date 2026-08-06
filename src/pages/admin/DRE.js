//src/pages/admin/DRE.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Timestamp } from "firebase/firestore";
import { Search, TrendingUp, TrendingDown, Equal, FileSpreadsheet, Upload, FileDown } from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import { ImportPreviewModal } from "@/components/admin/financeiro/ImportPreviewModal";
import { useStore } from "@/store";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
const DRE = () => {
    const navigate = useNavigate();
    const { revenues, expenses, chartOfAccounts, bankAccounts, costCenters, clients, suppliers, collaborators, fetchAllData, addRevenue, addExpense, } = useStore();
    const [competence, setCompetence] = useState(format(new Date(), "yyyy-MM"));
    const [dreData, setDreData] = useState(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importData, setImportData] = useState([]);
    const [importFileName, setImportFileName] = useState("");
    const [isImporting, setIsImporting] = useState(false);
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
        const periodRevenues = revenues.filter((revenue) => {
            if (String(revenue.status || "").toLowerCase() !== "recebido" || !revenue.paymentDate) {
                return false;
            }
            const paymentDate = new Date(revenue.paymentDate);
            return paymentDate.getFullYear() === year && paymentDate.getMonth() + 1 === month;
        });
        const periodExpenses = expenses.filter((expense) => {
            if (String(expense.status || "").toLowerCase() !== "pago" || !expense.paymentDate) {
                return false;
            }
            const paymentDate = new Date(expense.paymentDate);
            return paymentDate.getFullYear() === year && paymentDate.getMonth() + 1 === month;
        });
        const buildDreLines = (type) => {
            const accounts = (chartOfAccounts || []).filter((account) => account.type === type);
            const transactions = type === "receita" ? periodRevenues : periodExpenses;
            const groupedTransactions = {};
            transactions.forEach((transaction) => {
                if (transaction.chartOfAccountId) {
                    groupedTransactions[transaction.chartOfAccountId] =
                        (groupedTransactions[transaction.chartOfAccountId] || 0) + (transaction.valorTotal || 0);
                }
            });
            const accountMap = new Map(accounts.map((account) => [
                account.id,
                {
                    ...account,
                    children: [],
                    value: groupedTransactions[account.id] || 0,
                },
            ]));
            const rootAccounts = [];
            accountMap.forEach((account) => {
                if (account.parentAccountId && accountMap.has(account.parentAccountId)) {
                    const parent = accountMap.get(account.parentAccountId);
                    parent.children.push(account);
                }
                else {
                    rootAccounts.push(account);
                }
            });
            const formatLines = (accountsToFormat) => {
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
                    };
                })
                    .filter((item) => item !== null);
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
        // Check if there are any real codes
        const hasCodes = [...dreData.receitas, ...dreData.despesas].some((line) => line.code && line.code.trim() !== "");
        // Title
        const titleRange = hasCodes ? "A1:C1" : "A1:B1";
        worksheet.mergeCells(titleRange);
        const titleCell = worksheet.getCell("A1");
        titleCell.value = "Demonstrativo de Resultado do Exercício (DRE)";
        titleCell.font = { size: 16, bold: true };
        titleCell.alignment = { horizontal: "center", vertical: "middle" };
        // Competence
        const competenceRange = hasCodes ? "A2:C2" : "A2:B2";
        const dateObj = parseISO(`${competence}-01`);
        const formattedDate = format(dateObj, "MMMM 'de' yyyy", { locale: ptBR });
        worksheet.mergeCells(competenceRange);
        const competenceCell = worksheet.getCell("A2");
        competenceCell.value = `Mês de competência: ${formattedDate}`;
        competenceCell.font = { size: 12 };
        competenceCell.alignment = { horizontal: "center", vertical: "middle" };
        worksheet.addRow([]); // Blank row
        worksheet.addRow([]); // Blank row
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
        const addDreRow = (line, depth = 0) => {
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
            : ["TOTAL DE RECEITAS", dreData.totalReceitas]);
        totalRevenueRow.font = { bold: true };
        totalRevenueRow.getCell(hasCodes ? 3 : 2).font = { bold: true, color: { argb: "FF008000" } };
        worksheet.addRow([]); // Blank row
        // Expenses Section
        const expenseHeader = worksheet.addRow(hasCodes ? ["", "DESPESAS OPERACIONAIS", ""] : ["DESPESAS OPERACIONAIS", ""]);
        expenseHeader.font = { bold: true, color: { argb: "FFFF0000" } };
        dreData.despesas.forEach((line) => addDreRow(line));
        const totalExpenseRow = worksheet.addRow(hasCodes
            ? ["", "TOTAL DE DESPESAS", dreData.totalDespesas]
            : ["TOTAL DE DESPESAS", dreData.totalDespesas]);
        totalExpenseRow.font = { bold: true };
        totalExpenseRow.getCell(hasCodes ? 3 : 2).font = { bold: true, color: { argb: "FFFF0000" } };
        worksheet.addRow([]); // Blank row
        // Result
        const resultRow = worksheet.addRow(hasCodes
            ? ["", "RESULTADO LÍQUIDO", dreData.resultadoLiquido]
            : ["RESULTADO LÍQUIDO", dreData.resultadoLiquido]);
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
        // Observation row
        worksheet.addRow([]);
        const obsRow = worksheet.addRow(["* Este é um relatório gerencial simplificado, utilizando o regime de caixa. As receitas e despesas são consideradas com base na data de liquidação (pagamento/recebimento) dentro do período selecionado."]);
        obsRow.font = { size: 9, italic: true, color: { argb: "FF666666" } };
        worksheet.mergeCells(`A${obsRow.number}:${hasCodes ? 'C' : 'B'}${obsRow.number}`);
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
            { state: "frozen", xSplit: 0, ySplit: 4 }
        ];
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        saveAs(blob, `DRE-${competence}.xlsx`);
    };
    const handleDownloadTemplate = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Importação Financeira");
        // Columns
        worksheet.columns = [
            { header: "Tipo", key: "tipo", width: 12 },
            { header: "Descrição", key: "descricao", width: 30 },
            { header: "Valor Bruto", key: "valorBruto", width: 15 },
            { header: "Desconto", key: "desconto", width: 12 },
            { header: "Juros", key: "juros", width: 12 },
            { header: "Valor Total", key: "valorTotal", width: 15 },
            { header: "Vencimento", key: "vencimento", width: 15 },
            { header: "Competência", key: "competencia", width: 15 },
            { header: "Pagamento", key: "pagamento", width: 15 },
            { header: "Entidade", key: "entidade", width: 25 },
            { header: "Tipo da Entidade", key: "tipoEntidade", width: 15 },
            { header: "Plano de Contas", key: "planoContas", width: 25 },
            { header: "Conta Bancária", key: "contaBancaria", width: 20 },
            { header: "Centro de Custo", key: "centroCusto", width: 20 },
            { header: "Status", key: "status", width: 12 },
            { header: "Observação", key: "observacao", width: 30 },
            { header: "Identificador Externo", key: "idExterno", width: 20 },
        ];
        // Examples
        worksheet.addRow({
            tipo: "Receita",
            descricao: "Locação de equipamento",
            valorBruto: 1500,
            desconto: 0,
            juros: 0,
            valorTotal: 1500,
            vencimento: "10/08/2026",
            competencia: "01/08/2026",
            pagamento: "10/08/2026",
            entidade: "Cliente ABC",
            tipoEntidade: "Cliente",
            planoContas: "Receita de locação",
            contaBancaria: "Itaú",
            centroCusto: "Comercial",
            status: "Recebido",
            observacao: "Exemplo de receita",
            idExterno: "REC-001",
        });
        worksheet.addRow({
            tipo: "Despesa",
            descricao: "Aluguel do escritório",
            valorBruto: 2000,
            desconto: 0,
            juros: 0,
            valorTotal: 2000,
            vencimento: "05/08/2026",
            competencia: "01/08/2026",
            pagamento: "05/08/2026",
            entidade: "Imobiliária X",
            tipoEntidade: "Fornecedor",
            planoContas: "Aluguel",
            contaBancaria: "Santander",
            centroCusto: "Administrativo",
            status: "Pago",
            observacao: "Exemplo de despesa",
            idExterno: "DESP-001",
        });
        // Formatting
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0E0E0" } };
        // Instructions sheet
        const instructionsSheet = workbook.addWorksheet("Instruções");
        instructionsSheet.columns = [{ header: "Campo", width: 20 }, { header: "Regra / Formato", width: 80 }];
        instructionsSheet.addRows([
            ["Tipo", "Obrigatório. Valores: Receita ou Despesa."],
            ["Descrição", "Obrigatório. Nome do lançamento."],
            ["Valor Bruto", "Obrigatório (ou Valor Total). Valor principal."],
            ["Vencimento", "Obrigatório. Formatos: DD/MM/AAAA ou AAAA-MM-DD."],
            ["Competência", "Obrigatório. Mês de referência (DD/MM/AAAA)."],
            ["Status", "Obrigatório. Receitas: pendente, recebido, atrasado, cancelado. Despesas: pendente, pago, vencido, cancelado."],
            ["Pagamento", "Obrigatório se status for 'Recebido' ou 'Pago'."],
            ["Entidade", "Nome do Cliente, Fornecedor ou Colaborador (deve existir)."],
            ["Tipo da Entidade", "Valores: Cliente, Fornecedor ou Colaborador."],
            ["Plano de Contas", "Nome do plano de contas (deve existir)."],
            ["Conta Bancária", "Nome da conta bancária (deve existir)."],
            ["Centro de Custo", "Nome do centro de custo (deve existir)."],
            ["Identificador Externo", "Chave para evitar duplicidades."],
        ]);
        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), "Modelo-Importacao-Financeira.xlsx");
    };
    const normalizeDate = (val) => {
        if (!val)
            return null;
        if (val instanceof Date)
            return val;
        if (typeof val === 'number') {
            // Excel serial date
            return new Date(Math.round((val - 25569) * 864e5));
        }
        const s = String(val).trim();
        if (!s)
            return null;
        // Try DD/MM/YYYY
        const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (dmy)
            return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
        // Try YYYY-MM-DD
        const ymd = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (ymd)
            return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
        const d = new Date(s);
        return isNaN(d.getTime()) ? null : d;
    };
    const handleImportExcel = async (event) => {
        const file = event.target.files?.[0];
        if (!file)
            return;
        setIsImporting(true);
        setImportFileName(file.name);
        try {
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(await file.arrayBuffer());
            const worksheet = workbook.worksheets[0];
            const data = [];
            const rows = [];
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1)
                    return; // Header
                rows.push({ row, rowNumber });
            });
            const processedRows = await Promise.all(rows.map(async ({ row, rowNumber }) => {
                const rowData = {};
                worksheet.getRow(1).eachCell((cell, colNumber) => {
                    const header = String(cell.value);
                    rowData[header] = row.getCell(colNumber).value;
                });
                const type = String(rowData["Tipo"] || "").trim().toLowerCase();
                const description = String(rowData["Descrição"] || "").trim();
                const valorBruto = Number(String(rowData["Valor Bruto"] || "0").replace(/[^\d.,]/g, "").replace(",", "."));
                const desconto = Number(String(rowData["Desconto"] || "0").replace(/[^\d.,]/g, "").replace(",", "."));
                const juros = Number(String(rowData["Juros"] || "0").replace(/[^\d.,]/g, "").replace(",", "."));
                let valorTotal = Number(String(rowData["Valor Total"] || "0").replace(/[^\d.,]/g, "").replace(",", "."));
                if (!valorTotal && valorBruto) {
                    valorTotal = valorBruto - (desconto || 0) + (juros || 0);
                }
                const dueDate = normalizeDate(rowData["Vencimento"]);
                const competenceDate = normalizeDate(rowData["Competência"]);
                const paymentDate = normalizeDate(rowData["Pagamento"]);
                const financialStatus = String(rowData["Status"] || "").trim().toLowerCase();
                const entityName = String(rowData["Entidade"] || "").trim();
                const entityType = String(rowData["Tipo da Entidade"] || "").trim().toLowerCase();
                const planoContasName = String(rowData["Plano de Contas"] || "").trim();
                const contaBancariaName = String(rowData["Conta Bancária"] || "").trim();
                const centroCustoName = String(rowData["Centro de Custo"] || "").trim();
                const externalId = String(rowData["Identificador Externo"] || "").trim();
                let validationMessage = "";
                let validationStatus = "valid";
                // Required fields
                if (!type || (type !== "receita" && type !== "despesa")) {
                    validationMessage = "Tipo inválido (deve ser Receita ou Despesa). ";
                    validationStatus = "error";
                }
                if (!description) {
                    validationMessage += "Descrição obrigatória. ";
                    validationStatus = "error";
                }
                if (valorTotal <= 0) {
                    validationMessage += "Valor total deve ser maior que zero. ";
                    validationStatus = "error";
                }
                if (!dueDate) {
                    validationMessage += "Vencimento obrigatório ou formato inválido. ";
                    validationStatus = "error";
                }
                if (!competenceDate) {
                    validationMessage += "Competência obrigatória ou formato inválido. ";
                    validationStatus = "error";
                }
                if (!financialStatus) {
                    validationMessage += "Status obrigatório. ";
                    validationStatus = "error";
                }
                // Status validation
                if (type === "receita") {
                    const validStatuses = ["pendente", "recebido", "atrasado", "cancelado"];
                    if (!validStatuses.includes(financialStatus)) {
                        validationMessage += `Status '${financialStatus}' inválido para Receita. `;
                        validationStatus = "error";
                    }
                    if (financialStatus === "recebido" && !paymentDate) {
                        validationMessage += "Receita 'recebido' exige data de pagamento. ";
                        validationStatus = "error";
                    }
                }
                else if (type === "despesa") {
                    const validStatuses = ["pendente", "pago", "vencido", "cancelado"];
                    if (!validStatuses.includes(financialStatus)) {
                        validationMessage += `Status '${financialStatus}' inválido para Despesa. `;
                        validationStatus = "error";
                    }
                    if (financialStatus === "pago" && !paymentDate) {
                        validationMessage += "Despesa 'pago' exige data de pagamento. ";
                        validationStatus = "error";
                    }
                }
                // Entity resolution
                let entityId = "";
                if (entityName) {
                    const normalizeString = (s) => s.toLowerCase().trim();
                    let foundEntities = [];
                    if (entityType === "cliente") {
                        foundEntities = clients.filter(c => normalizeString(c.razaoSocial || c.name || "") === normalizeString(entityName));
                    }
                    else if (entityType === "fornecedor") {
                        foundEntities = suppliers.filter(s => normalizeString(s.razaoSocial || s.name || "") === normalizeString(entityName));
                    }
                    else if (entityType === "colaborador") {
                        foundEntities = collaborators.filter(c => normalizeString(c.name || "") === normalizeString(entityName));
                    }
                    else {
                        // Try all
                        const c = clients.filter(c => normalizeString(c.razaoSocial || c.name || "") === normalizeString(entityName));
                        const s = suppliers.filter(s => normalizeString(s.razaoSocial || s.name || "") === normalizeString(entityName));
                        const col = collaborators.filter(col => normalizeString(col.name || "") === normalizeString(entityName));
                        foundEntities = [...c, ...s, ...col];
                    }
                    if (foundEntities.length === 0) {
                        validationMessage += `Entidade '${entityName}' não encontrada. `;
                        validationStatus = "error";
                    }
                    else if (foundEntities.length > 1) {
                        validationMessage += `Ambiguidade: Mais de uma entidade encontrada com o nome '${entityName}'. `;
                        validationStatus = "error";
                    }
                    else {
                        entityId = foundEntities[0].id;
                    }
                }
                // Relationships resolution
                let chartOfAccountId = "";
                if (planoContasName) {
                    const found = chartOfAccounts.filter(a => a.name.toLowerCase().trim() === planoContasName.toLowerCase().trim());
                    if (found.length === 1)
                        chartOfAccountId = found[0].id;
                    else if (found.length > 1) {
                        validationMessage += `Ambiguidade no Plano de Contas: '${planoContasName}'. `;
                        validationStatus = "error";
                    }
                    else {
                        validationMessage += `Plano de Contas '${planoContasName}' não encontrado. `;
                        validationStatus = "error";
                    }
                }
                let bankAccountId = "";
                if (contaBancariaName) {
                    const found = bankAccounts.filter(a => a.name.toLowerCase().trim() === contaBancariaName.toLowerCase().trim());
                    if (found.length === 1)
                        bankAccountId = found[0].id;
                    else if (found.length > 1) {
                        validationMessage += `Ambiguidade na Conta Bancária: '${contaBancariaName}'. `;
                        validationStatus = "error";
                    }
                    else {
                        validationMessage += `Conta Bancária '${contaBancariaName}' não encontrada. `;
                        validationStatus = "error";
                    }
                }
                let costCenterId = "";
                if (centroCustoName) {
                    const found = costCenters.filter(c => c.name.toLowerCase().trim() === centroCustoName.toLowerCase().trim());
                    if (found.length === 1)
                        costCenterId = found[0].id;
                    else if (found.length > 1) {
                        validationMessage += `Ambiguidade no Centro de Custo: '${centroCustoName}'. `;
                        validationStatus = "error";
                    }
                    else {
                        validationMessage += `Centro de Custo '${centroCustoName}' não encontrado. `;
                        validationStatus = "error";
                    }
                }
                // Duplicate check
                if (validationStatus === "valid") {
                    let isDuplicate = false;
                    if (externalId) {
                        const existing = (type === "receita" ? revenues : expenses).find(r => r.importExternalId === externalId || r.externalId === externalId);
                        if (existing)
                            isDuplicate = true;
                    }
                    else {
                        const existing = (type === "receita" ? revenues : expenses).find(r => (r.clientId === entityId || r.entityId === entityId) &&
                            r.description.toLowerCase().trim() === description.toLowerCase().trim() &&
                            Math.abs((r.valorTotal || 0) - valorTotal) < 0.01 &&
                            format(new Date(r.dueDate), "yyyy-MM-dd") === format(dueDate, "yyyy-MM-dd"));
                        if (existing)
                            isDuplicate = true;
                    }
                    if (isDuplicate) {
                        validationStatus = "duplicate";
                        validationMessage = "Possível duplicidade detectada.";
                    }
                }
                return {
                    rowNumber,
                    type,
                    description,
                    entityName,
                    entityId,
                    valorTotal,
                    valorBruto,
                    desconto,
                    juros,
                    dueDate,
                    dueDateStr: dueDate ? format(dueDate, "dd/MM/yyyy") : String(rowData["Vencimento"] || ""),
                    competenceDate,
                    competenceStr: competenceDate ? format(competenceDate, "MM/yyyy") : String(rowData["Competência"] || ""),
                    paymentDate,
                    financialStatus,
                    chartOfAccountId,
                    bankAccountId,
                    costCenterId,
                    externalId,
                    message: validationMessage || "Linha válida",
                    status: validationStatus,
                    originalData: rowData,
                    confirmed: false
                };
            }));
            setImportData(processedRows);
            setIsImportModalOpen(true);
        }
        catch (error) {
            console.error(error);
            toast.error("Erro ao ler o arquivo Excel.");
        }
        finally {
            setIsImporting(false);
            event.target.value = "";
        }
    };
    const handleConfirmImport = async (validItems) => {
        const importBatchId = `batch-${Date.now()}`;
        const importedAt = new Date().toISOString();
        let successCount = 0;
        let failCount = 0;
        for (const item of validItems) {
            try {
                const payload = {
                    description: item.description,
                    valorBruto: item.valorBruto || item.valorTotal,
                    valorTotal: item.valorTotal,
                    desconto: item.desconto || 0,
                    juros: item.juros || 0,
                    dueDate: Timestamp.fromDate(item.dueDate),
                    competenceDate: Timestamp.fromDate(item.competenceDate),
                    status: item.financialStatus,
                    clientId: item.type === 'receita' ? item.entityId : undefined,
                    entityId: item.type === 'despesa' ? item.entityId : undefined,
                    chartOfAccountId: item.chartOfAccountId,
                    bankAccountId: item.bankAccountId,
                    costCenterId: item.costCenterId,
                    importExternalId: item.externalId,
                    importedFromExcel: true,
                    importedAt,
                    importBatchId,
                    importFileName
                };
                if (item.paymentDate) {
                    payload.paymentDate = Timestamp.fromDate(item.paymentDate);
                }
                if (item.type === "receita") {
                    await addRevenue(payload);
                }
                else {
                    await addExpense(payload);
                }
                successCount++;
            }
            catch (error) {
                console.error(`Erro ao importar linha ${item.rowNumber}:`, error);
                failCount++;
            }
        }
        if (successCount > 0) {
            toast.success(`${successCount} lançamentos importados com sucesso.`);
            await fetchAllData();
            handleGenerateDRE();
        }
        if (failCount > 0) {
            toast.error(`${failCount} lançamentos falharam na gravação.`);
        }
    };
    const renderAccordionSection = (title, lines, total, icon, type) => (<AccordionItem value={type} className="border-none">
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
        {lines.length > 0 ? (lines.map((line) => (<div key={line.id}>
              <div className="flex justify-between py-1">
                <span className="font-medium">
                  {line.code} {line.name}
                </span>
                <span className="font-medium">{formatCurrency(line.value)}</span>
              </div>

              {line.subItems?.map((subItem) => (<div key={subItem.id} className="flex justify-between pl-6 text-sm text-muted-foreground">
                  <span>
                    {subItem.code} {subItem.name}
                  </span>
                  <span>{formatCurrency(subItem.value)}</span>
                </div>))}
            </div>))) : (<p className="text-sm text-muted-foreground">Nenhum detalhe de {type} para exibir no período.</p>)}
      </AccordionContent>
    </AccordionItem>);
    return (<div className="space-y-6">
      <Tabs value="dre" onValueChange={(value) => {
            const tab = tabItems.find((item) => item.value === value);
            if (tab && "path" in tab && tab.path) {
                navigate(tab.path);
            }
        }}>
        <TabsList className="h-auto w-full justify-start gap-0 rounded-none border-b border-border bg-transparent p-0">
          {tabItems.map((tab) => (<TabsTrigger key={tab.value} value={tab.value} className="rounded-none border-b-2 border-transparent px-4 py-2 text-sm data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
              {tab.label}
            </TabsTrigger>))}
        </TabsList>
      </Tabs>

      <Card className="border-border">
        <CardContent className="grid grid-cols-1 items-end gap-4 p-5 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Mês de Competência</label>
            <Input type="month" value={competence} onChange={(e) => setCompetence(e.target.value)}/>
          </div>

          <Button variant="outline" className="gap-2" onClick={handleGenerateDRE}>
            <Search className="h-4 w-4"/>
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

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleDownloadTemplate}>
                <FileDown className="h-4 w-4"/>
                Baixar Modelo
              </Button>

              <label htmlFor="import-excel">
                <Button variant="outline" size="sm" className="gap-2" asChild>
                  <span>
                    <Upload className="h-4 w-4"/>
                    Importar Excel
                    <input id="import-excel" type="file" className="hidden" accept=".xlsx, .xls" onChange={handleImportExcel} disabled={isImporting}/>
                  </span>
                </Button>
              </label>

              <Button variant="outline" size="sm" className="gap-2" onClick={handleExportExcel} disabled={!dreData}>
                <FileSpreadsheet className="h-4 w-4"/>
                Exportar Excel
              </Button>
            </div>

          </div>
        </CardHeader>

        <CardContent>
          {dreData ? (<>
              <Accordion type="multiple" defaultValue={["receita", "despesa"]} className="w-full space-y-2">
                {renderAccordionSection("(+) Receita Operacional Bruta", dreData.receitas, dreData.totalReceitas, <TrendingUp className="h-5 w-5 text-success"/>, "receita")}

                {renderAccordionSection("(-) Despesas Operacionais", dreData.despesas, dreData.totalDespesas, <TrendingDown className="h-5 w-5 text-destructive"/>, "despesa")}
              </Accordion>

              <Separator className="my-4"/>

              <div className="flex items-center justify-between rounded-md p-3">
                <div className="flex items-center gap-2">
                  <Equal className="h-5 w-5"/>
                  <span className="text-lg font-bold">= Resultado Líquido do Período</span>
                </div>

                <span className={`text-lg font-bold ${dreData.resultadoLiquido >= 0 ? "text-success" : "text-destructive"}`}>
                  {formatCurrency(dreData.resultadoLiquido)}
                </span>
              </div>

              <p className="mt-4 text-xs text-muted-foreground">
                * Este é um relatório gerencial simplificado, utilizando o regime de caixa. As receitas e despesas são
                consideradas com base na data de liquidação (pagamento/recebimento) dentro do período selecionado.
              </p>
            </>) : (<p className="py-10 text-center text-sm text-muted-foreground">
              Selecione um período e clique em "Gerar DRE" para visualizar o relatório.
            </p>)}
        </CardContent>
      </Card>

      <ImportPreviewModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} fileName={importFileName} data={importData} onConfirm={handleConfirmImport}/>
    </div>);
};
export default DRE;
