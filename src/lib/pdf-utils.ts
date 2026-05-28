import jsPDF from "jspdf";
import "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "./utils";

export const generateQuotePDF = (quote: any, client: any, companySettings: any, equipments: any[]) => {
  const doc = new jsPDF() as any;
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(249, 115, 22); // #F97316 (Laranja Tech4Rent)
  doc.text(companySettings.fantasyName || "TECH4RENT", 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(companySettings.name || "TECH4RENT LTDA.", 14, 28);
  doc.text(`CNPJ: ${companySettings.cnpj || ""}`, 14, 33);
  doc.text(`${companySettings.address.logradouro}, ${companySettings.address.numero} - ${companySettings.address.bairro}`, 14, 38);
  doc.text(`${companySettings.address.localidade}/${companySettings.address.uf} - CEP: ${companySettings.address.cep}`, 14, 43);
  doc.text(`E-mail: ${companySettings.email} | Tel: ${companySettings.phone}`, 14, 48);

  // Horizontal line
  doc.setDrawColor(249, 115, 22);
  doc.setLineWidth(0.5);
  doc.line(14, 53, pageWidth - 14, 53);

  // Quote Info
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text(`ORÇAMENTO: ${quote.id}`, 14, 63);
  doc.setFontSize(10);
  doc.text(`Data de Emissão: ${format(new Date(), "dd/MM/yyyy")}`, pageWidth - 14, 63, { align: "right" });

  // Client Info
  doc.setFillColor(245, 245, 245);
  doc.rect(14, 68, pageWidth - 28, 35, "F");
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("DADOS DO CLIENTE", 18, 75);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Razão Social: ${client?.razaoSocial || client?.name || "N/A"}`, 18, 81);
  doc.text(`CNPJ/CPF: ${client?.cnpj || client?.cpf || "N/A"}`, 18, 86);
  doc.text(`Endereço: ${client?.address || "N/A"}`, 18, 91);
  doc.text(`E-mail: ${client?.email || "N/A"}`, 18, 96);
  doc.text(`Telefone: ${client?.phone || "N/A"}`, pageWidth / 2 + 10, 81);
  doc.text(`Cidade/UF: ${client?.city || ""}${client?.uf ? "/" + client?.uf : ""}`, pageWidth / 2 + 10, 86);

  // Rental Period (If locação)
  let currentY = 110;
  if (quote.budgetType === "locacao" && quote.startDate && quote.endDate) {
    const start = new Date(quote.startDate);
    const end = new Date(quote.endDate);
    const periodStr = `${format(start, "dd/MM/yyyy")} até ${format(end, "dd/MM/yyyy")}`;
    
    doc.setFont("helvetica", "bold");
    doc.text("PERÍODO DO CONTRATO:", 14, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(periodStr, 65, currentY);
    currentY += 10;
  }

  // Items Table
  const tableColumn = ["Item", "Equipamento", "Qtd", "Tipo Cobrança", "Vl. Unitário", "Vl. Total"];
  const tableRows = quote.items.map((item: any, index: number) => {
    const equipment = equipments.find(e => e.id === item.equipmentId);
    return [
      index + 1,
      equipment?.name || "N/A",
      item.quantity,
      item.billingType || "Mensal",
      formatCurrency(item.unitPrice),
      formatCurrency(item.quantity * item.unitPrice)
    ];
  });

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: currentY,
    theme: 'striped',
    headStyles: { fillColor: [249, 115, 22] },
    alternateRowStyles: { fillColor: [250, 240, 230] },
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Summary
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  
  doc.setFontSize(12);
  const totalLabel = quote.budgetType === "locacao" ? "VALOR TOTAL MENSAL DO ORÇAMENTO:" : "VALOR TOTAL DO ORÇAMENTO:";
  doc.text(totalLabel, pageWidth - 80, currentY, { align: "right" });
  doc.text(formatCurrency(quote.totalValue), pageWidth - 14, currentY, { align: "right" });
  currentY += 15;

  // Observations
  if (quote.observations) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("OBSERVAÇÕES:", 14, currentY);
    currentY += 5;
    doc.setFont("helvetica", "normal");
    const splitObs = doc.splitTextToSize(quote.observations, pageWidth - 28);
    doc.text(splitObs, 14, currentY);
    currentY += splitObs.length * 5 + 10;
  }

  // Terms and conditions (brief)
  doc.setFontSize(9);
  doc.setTextColor(100);
  const footerText = "Orçamento sujeito a análise de crédito. Validade da proposta: 7 dias corridos.";
  doc.text(footerText, pageWidth / 2, doc.internal.pageSize.getHeight() - 15, { align: "center" });

  // Save the PDF
  try {
    doc.save(`Orcamento_${quote.id}_${client?.razaoSocial?.replace(/\s+/g, '_') || client?.name?.replace(/\s+/g, '_') || 'Cliente'}.pdf`);
  } catch (error) {
    console.error("Error saving PDF:", error);
    // Fallback if save fails
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Orcamento_${quote.id}.pdf`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }
};
