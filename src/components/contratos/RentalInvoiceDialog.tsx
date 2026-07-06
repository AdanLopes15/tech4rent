//src/components/contratos/RentalInvoiceDialog.tsx

import { useState } from "react";
import { createPortal } from "react-dom";
import { format, compareAsc } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Timestamp } from "firebase/firestore";
import { Printer, X, Pencil, CalendarIcon } from "lucide-react";


import { useStore } from "@/store";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { CompanyLogo } from "../admin/CompanyLogo";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { AddRevenueDialog } from "@/components/add-revenue-dialog";

interface RentalInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: any;
}

const safeToDate = (dateInput: any): Date | null => {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return dateInput;
  if (dateInput instanceof Timestamp) return dateInput.toDate();

  if (typeof dateInput?.toDate === "function") {
    const date = dateInput.toDate();
    if (!isNaN(date.getTime())) return date;
  }

  if (typeof dateInput === "string" || typeof dateInput === "number") {
    const date = new Date(dateInput);
    if (!isNaN(date.getTime())) return date;
  }

  if (typeof dateInput === "object" && "seconds" in dateInput) {
    const date = new Timestamp(dateInput.seconds, dateInput.nanoseconds || 0).toDate();
    if (!isNaN(date.getTime())) return date;
  }

  return null;
};

const findCurrentInstallment = (allInstallments: any[]) => {
  if (!allInstallments || allInstallments.length === 0) return null;

  const sortedInstallments = allInstallments
    .map((inst) => ({ ...inst, dueDateObj: safeToDate(inst.dueDate) }))
    .filter((inst) => inst.dueDateObj)
    .sort((a, b) => compareAsc(a.dueDateObj!, b.dueDateObj!));

  const firstPending = sortedInstallments.find((inst) => inst.status !== "recebido");
  if (firstPending) return firstPending;

  return sortedInstallments[sortedInstallments.length - 1] || null;
};

const shortText = (value: any, maxLength: number = 150) => {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "Descrição resumida do equipamento locado.";

  const firstSentence = normalized.split(/(?<=[.!?])\s+/)[0];
  const base = firstSentence.length >= 35 && firstSentence.length <= maxLength ? firstSentence : normalized;

  return base.length > maxLength ? `${base.slice(0, maxLength).trim()}...` : base;
};

export function RentalInvoiceDialog({ open, onOpenChange, contract }: RentalInvoiceDialogProps) {
  const { companySettings, equipments, revenues, updateRevenue } = useStore();
  const { toast } = useToast();
  const [isEditRevenueDialogOpen, setIsEditRevenueDialogOpen] = useState(false);
  const [selectedInstallmentIndex, setSelectedInstallmentIndex] = useState<number | null>(null);

  const formatDate = (dateInput: any, dateFormat: string = "dd/MM/yyyy") => {
    const date = safeToDate(dateInput);
    if (!date) return "Data inválida";

    try {
      return format(date, dateFormat, { locale: ptBR });
    } catch {
      return "Data inválida";
    }
  };

  const handlePrint = () => {
    const printableContent = document.getElementById("invoice-print-area");
    if (!printableContent) {
      toast({
        title: "Erro",
        description: "Não foi possível encontrar o conteúdo para impressão.",
        variant: "destructive",
      });
      return;
    }

    const previousTitle = document.title;
    const restoreTitle = () => {
      document.title = previousTitle;
      window.removeEventListener("afterprint", restoreTitle);
    };

    document.title = `Fatura de Locação - Contrato ${contract.id}`;
    window.addEventListener("afterprint", restoreTitle);
    requestAnimationFrame(() => window.print());
  };


  const allInstallments = contract ? revenues.filter((r: any) => r.contractId === contract.id) : [];
  
  const sortedInstallments = allInstallments
    .map((inst) => ({ ...inst, dueDateObj: safeToDate(inst.dueDate) }))
    .filter((inst) => inst.dueDateObj)
    .sort((a, b) => compareAsc(a.dueDateObj!, b.dueDateObj!));

  const defaultInstallment = findCurrentInstallment(allInstallments);
  const defaultIndex = defaultInstallment
    ? sortedInstallments.findIndex((r) => r.id === defaultInstallment.id)
    : 0;

  const activeIndex = selectedInstallmentIndex !== null ? selectedInstallmentIndex : defaultIndex;
  const currentInstallment = sortedInstallments[activeIndex] || null;
  const totalInstallments = sortedInstallments.length;
  const currentInstallmentNumber = activeIndex + 1;

  if (!contract) return null;

  if (!currentInstallment) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogTitle>Fatura não encontrada</DialogTitle>
          <p>Nenhuma fatura foi encontrada para este contrato.</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const getEquipmentDetails = (equipmentId: string) => {
    return equipments.find((eq: any) => eq.id === equipmentId);
  };

  const handleEditInvoice = () => setIsEditRevenueDialogOpen(true);

  const InvoiceContent = ({ printMode = false }: { printMode?: boolean }) => {
    const companyAddress: any = companySettings?.address || {};
    const clientAddress: any = contract.client?.address || {};
    const companyName = companySettings?.fantasyName || companySettings?.name || "TECH4RENT";
    const companyLegalName = companySettings?.name || companyName;
    const companyCity = companyAddress.localidade || companyAddress.city || companyAddress.cidade || "";
    const items = contract.items || [];

    return (
      <article className={`invoice-page bg-white text-slate-950 ${printMode ? "invoice-print-page" : "invoice-screen-page p-6"}`}>
        <header className="invoice-header flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <CompanyLogo isDark={false} className="invoice-logo h-16 w-16 shrink-0" />

            <div className="min-w-0">
              <h1 className="invoice-company text-xl font-bold leading-tight">{companyName}</h1>
              <p className="invoice-company-doc text-xs text-slate-500">CNPJ: {companySettings?.cnpj || "Não informado"}</p>
              <p className="invoice-company-doc text-xs text-slate-500">{companySettings?.email || companySettings?.phone || ""}</p>
            </div>
          </div>

          <div className="invoice-meta shrink-0 text-right">
            <h2 className="invoice-title text-xl font-bold leading-tight">FATURA DE LOCAÇÃO</h2>
            <p className="invoice-meta-line text-sm text-slate-500">Contrato: {contract.id}</p>

            {printMode ? (
              <>
                <p className="invoice-meta-line text-sm text-slate-500">Fatura: {currentInstallmentNumber} / {totalInstallments}</p>
                <p className="invoice-meta-line text-sm text-slate-500">Vencimento: {formatDate(currentInstallment.dueDate)}</p>
              </>
            ) : (
              <>
                <div className="flex items-center justify-end gap-2 text-sm text-slate-500">
                  <span>Fatura:</span>
                  <Select value={String(activeIndex)} onValueChange={(val) => setSelectedInstallmentIndex(Number(val))}>
                    <SelectTrigger className="invoice-no-print h-7 w-auto border-slate-300 bg-white px-2 py-0 text-sm font-normal text-slate-950">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedInstallments.map((_, idx) => (
                        <SelectItem key={idx} value={String(idx)}>
                          {idx + 1} / {totalInstallments}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-end gap-2 text-sm text-slate-500">
                  <span>Vencimento:</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="invoice-no-print h-7 border-slate-300 bg-white px-2 py-0 text-sm font-normal text-slate-950">
                        <CalendarIcon className="mr-1 h-3 w-3" />
                        {formatDate(currentInstallment.dueDate)}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={safeToDate(currentInstallment.dueDate) || undefined}
                        onSelect={(date) => {
                          if (date && currentInstallment) {
                            updateRevenue({ ...currentInstallment, dueDate: date });
                            toast({ title: "Vencimento atualizado" });
                          }
                        }}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            )}
          </div>
        </header>

        <section className="invoice-section invoice-parties grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="invoice-party rounded-md border border-slate-200 p-4">
            <h3 className="invoice-section-title font-semibold uppercase">LOCADOR</h3>
            <p className="font-bold">{companyLegalName}</p>
            <p>CNPJ: {companySettings?.cnpj || "Não informado"}</p>
            <p>{[companyAddress.logradouro, companyAddress.numero].filter(Boolean).join(", ")}</p>
            <p>{[companyAddress.bairro, companyAddress.localidade || companyAddress.city, companyAddress.uf || companyAddress.state].filter(Boolean).join(", ")}</p>
          </div>

          <div className="invoice-party rounded-md border border-slate-200 p-4">
            <h3 className="invoice-section-title font-semibold uppercase">LOCATÁRIO</h3>
            <p className="font-bold">{contract.client?.razaoSocial || contract.client?.name || "Cliente não informado"}</p>
            <p>Documento: {contract.client?.cnpj || contract.client?.cpf || "Não informado"}</p>
            <p>{[clientAddress.street || clientAddress.logradouro, clientAddress.number || clientAddress.numero].filter(Boolean).join(", ")}</p>
            <p>{[clientAddress.neighborhood || clientAddress.bairro, clientAddress.city || clientAddress.localidade, clientAddress.state || clientAddress.uf].filter(Boolean).join(", ")}</p>
          </div>
        </section>

        <section className="invoice-section invoice-items">
          <h3 className="invoice-section-title font-bold uppercase">Itens da Locação</h3>
          <div className="invoice-table-wrap overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left font-semibold">Equipamento</th>
                  <th className="text-center font-semibold">Qtd.</th>
                  <th className="text-right font-semibold">Vl. Unit.</th>
                  <th className="text-right font-semibold">Total</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item: any, index: number) => {
                  const equipment = getEquipmentDetails(item.equipmentId);
                  const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
                  const equipmentName = equipment?.name || item.description || "Equipamento";
                  const description = shortText(equipment?.description || item.description, printMode ? 120 : 160);

                  return (
                    <tr key={index}>
                      <td className="align-top">
                        <div className="invoice-item flex items-start gap-3">
                          {equipment?.imageUrl ? (
                            <img
                              src={equipment.imageUrl}
                              alt={equipmentName}
                              width={48}
                              height={48}
                              className="invoice-item-image h-12 w-12 rounded-md border border-slate-200 object-contain"
                            />
                          ) : (
                            <div className="invoice-item-image flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-xs font-bold text-slate-500">
                              {equipmentName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="invoice-item-name font-semibold">{equipmentName}</p>
                            <p className="invoice-description text-sm text-slate-500">{description}</p>
                          </div>
                        </div>
                      </td>

                      <td className="text-center align-top">{item.quantity}</td>
                      <td className="text-right align-top">{formatCurrency(item.unitPrice || 0)}</td>
                      <td className="text-right align-top font-bold">{formatCurrency(itemTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>

              <tfoot>
                <tr className="invoice-total-row font-bold">
                  <td colSpan={3} className="text-right">Valor da Fatura</td>
                  <td className="text-right">{formatCurrency(currentInstallment.valorTotal || 0)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <section className="invoice-section invoice-terms">
          <h3 className="invoice-section-title font-bold uppercase">Termos e Condições</h3>
          <p className="text-sm text-slate-500">
            Período de referência da locação: {formatDate(contract.startDate, "dd/MM/yyyy")} a {formatDate(contract.endDate, "dd/MM/yyyy")}.
          </p>
          <div className="invoice-terms-list mt-2 space-y-1 text-sm text-slate-500">
            <p>Não é fato gerador do ISSQN a locação de bens móveis.</p>
            <p>Dispensado da emissão de notas fiscais. Conforme Lei Complementar 116 de 31/07/2003.</p>
            <p>Natureza da operação: Locação de bens móveis sem fornecimento de mão de obra.</p>
          </div>
          <p className="invoice-receipt-note mt-3 text-center text-xs font-bold text-slate-500">
            Válido como recibo a partir da quitação do boleto correspondente.
          </p>
        </section>

        <footer className="invoice-footer text-center">
          <p className="text-sm">
            {companyCity ? `${companyCity}, ` : ""}{format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </footer>
      </article>
    );
  };

  return (
    <>
      <style>{`
        #invoice-print-area {
          display: none;
        }

        @page {
          size: A4;
          margin: 8mm;
        }

        @media print {
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
            min-height: auto !important;
            height: auto !important;
            overflow: visible !important;
            background: white !important;
          }

          body > *:not(#invoice-print-area) {
            display: none !important;
          }

          body * { visibility: hidden !important; }

          #invoice-print-area,
          #invoice-print-area * {
            visibility: visible !important;
          }

          #invoice-print-area {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 190mm !important;
            min-height: auto !important;
            height: auto !important;
            overflow: visible !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 auto !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .modal,
          .dialog,
          .overlay,
          .modal-content,
          .dialog-content,
          .print-actions,
          .no-print,
          .invoice-no-print,
          button,
          [data-radix-dialog-overlay],
          [data-radix-dialog-content] {
            display: none !important;
          }

          #invoice-print-area .invoice-page {
            width: 190mm !important;
            max-width: 190mm !important;
            min-height: auto !important;
            height: auto !important;
            overflow: visible !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 auto !important;
            color: #111827 !important;
            font-size: 10.5px !important;
            line-height: 1.22 !important;
            page-break-before: avoid !important;
            break-before: avoid !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
          }

          #invoice-print-area .invoice-header,
          #invoice-print-area .invoice-section,
          #invoice-print-area .invoice-parties,
          #invoice-print-area .invoice-items,
          #invoice-print-area .invoice-total-row,
          #invoice-print-area .invoice-terms,
          #invoice-print-area .invoice-footer,
          #invoice-print-area table,
          #invoice-print-area thead,
          #invoice-print-area tfoot,
          #invoice-print-area tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          #invoice-print-area .invoice-header {
            display: flex !important;
            align-items: flex-start !important;
            justify-content: space-between !important;
            gap: 5mm !important;
            margin: 0 0 3mm !important;
            padding: 0 0 2.5mm !important;
            border-bottom: 0.35mm solid #1f4f8f !important;
          }

          #invoice-print-area .invoice-logo {
            width: 15mm !important;
            height: 15mm !important;
          }

          #invoice-print-area .invoice-company {
            font-size: 15px !important;
            line-height: 1.1 !important;
          }

          #invoice-print-area .invoice-company-doc,
          #invoice-print-area .invoice-meta-line {
            font-size: 9.5px !important;
            line-height: 1.2 !important;
          }

          #invoice-print-area .invoice-title {
            font-size: 15px !important;
            line-height: 1.1 !important;
          }

          #invoice-print-area .invoice-section {
            margin: 0 0 3mm !important;
          }

          #invoice-print-area .invoice-parties {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 3mm !important;
          }

          #invoice-print-area .invoice-party {
            min-height: auto !important;
            border: 1px solid #d8dee9 !important;
            border-radius: 3px !important;
            padding: 2.3mm !important;
          }

          #invoice-print-area .invoice-section-title {
            margin: 0 0 1.5mm !important;
            padding: 0 0 1mm !important;
            border-bottom: 1px solid #e5e7eb !important;
            font-size: 10.5px !important;
            line-height: 1.1 !important;
            color: #0f2742 !important;
          }

          #invoice-print-area p,
          #invoice-print-area h1,
          #invoice-print-area h2,
          #invoice-print-area h3 {
            margin-top: 0 !important;
          }

          #invoice-print-area .invoice-table-wrap {
            overflow: visible !important;
          }

          #invoice-print-area table {
            width: 100% !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
          }

          #invoice-print-area th,
          #invoice-print-area td {
            padding: 1.2mm 1.5mm !important;
            border-bottom: 1px solid #e5e7eb !important;
            font-size: 10px !important;
            line-height: 1.2 !important;
          }

          #invoice-print-area th:nth-child(1),
          #invoice-print-area td:nth-child(1) {
            width: 56% !important;
          }

          #invoice-print-area th:nth-child(2),
          #invoice-print-area td:nth-child(2) {
            width: 10% !important;
          }

          #invoice-print-area th:nth-child(3),
          #invoice-print-area td:nth-child(3),
          #invoice-print-area th:nth-child(4),
          #invoice-print-area td:nth-child(4) {
            width: 17% !important;
          }

          #invoice-print-area thead th {
            background: #eef4fb !important;
            color: #0f2742 !important;
          }

          #invoice-print-area .invoice-item {
            gap: 2mm !important;
          }

          #invoice-print-area .invoice-item-image {
            width: 10mm !important;
            height: 10mm !important;
            min-width: 10mm !important;
          }

          #invoice-print-area .invoice-item-name {
            font-size: 10px !important;
            line-height: 1.15 !important;
            margin-bottom: 0.7mm !important;
          }

          #invoice-print-area .invoice-description {
            display: -webkit-box !important;
            -webkit-line-clamp: 3 !important;
            -webkit-box-orient: vertical !important;
            max-height: 3.7em !important;
            overflow: hidden !important;
            font-size: 9px !important;
            line-height: 1.22 !important;
          }

          #invoice-print-area .invoice-total-row td {
            border-top: 1.5px solid #0f2742 !important;
            border-bottom: 0 !important;
            font-size: 11px !important;
            padding-top: 1.8mm !important;
          }

          #invoice-print-area .invoice-terms-list {
            margin-top: 1.2mm !important;
            gap: 0 !important;
          }

          #invoice-print-area .invoice-terms p {
            font-size: 9.5px !important;
            line-height: 1.22 !important;
            margin-bottom: 0.7mm !important;
          }

          #invoice-print-area .invoice-receipt-note {
            margin-top: 1.6mm !important;
            font-size: 9.5px !important;
          }

          #invoice-print-area .invoice-footer {
            margin-top: 3mm !important;
            padding-top: 2mm !important;
            border-top: 1px solid #e5e7eb !important;
          }

          #invoice-print-area img {
            max-width: 100% !important;
          }
        }
      `}</style>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 bg-background">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Fatura de Locação - Contrato {contract.id}</DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-grow bg-background">
            <InvoiceContent />
          </ScrollArea>

          <DialogFooter className="p-6 border-t bg-card">
            <Button variant="outline" onClick={handleEditInvoice}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>

            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir / Salvar PDF
            </Button>

            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              <X className="mr-2 h-4 w-4" />
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {typeof document !== "undefined" &&
        createPortal(
          <div id="invoice-print-area" aria-hidden="true">
            <InvoiceContent printMode />
          </div>,
          document.body,
        )}

      {currentInstallment && (
        <AddRevenueDialog
          open={isEditRevenueDialogOpen}
          onOpenChange={setIsEditRevenueDialogOpen}
          revenue={currentInstallment}
        />
      )}
    </>
  );
}
