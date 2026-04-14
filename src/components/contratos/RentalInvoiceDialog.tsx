//src/components/contratos/RentalInvoiceDialog.tsx

import { useState } from "react";
import { format, compareAsc } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Timestamp } from "firebase/firestore";
import { Printer, X, Pencil } from "lucide-react";

import { useStore } from "@/store";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export function RentalInvoiceDialog({ open, onOpenChange, contract }: RentalInvoiceDialogProps) {
  const { companySettings, equipments, revenues } = useStore();
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

  const handlePrint = async () => {
    const printableContent = document.getElementById("printable-invoice");
    if (!printableContent) {
      toast({
        title: "Erro",
        description: "Não foi possível encontrar o conteúdo para impressão.",
        variant: "destructive",
      });
      return;
    }

    const printWindow = window.open("", "", "height=800,width=800");
    if (!printWindow) {
      toast({
        title: "Pop-up bloqueado",
        description: "Permita pop-ups para gerar o PDF.",
        variant: "destructive",
      });
      return;
    }

    const headLinksAndStyles = Array.from(document.querySelectorAll("link[rel='stylesheet'], style"))
      .map((node) => node.outerHTML)
      .join("\n");

    const cssRulesText = Array.from(document.styleSheets)
      .map((styleSheet) => {
        try {
          // @ts-ignore
          return Array.from(styleSheet.cssRules)
            .map((rule: CSSRule) => rule.cssText)
            .join("\n");
        } catch {
          return "";
        }
      })
      .filter(Boolean)
      .join("\n");

    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>Imprimir Fatura</title>
          <base href="${window.location.origin}/" />
          ${headLinksAndStyles}
          <style>
            ${cssRulesText}
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
            body { margin: 0; padding: 0; }
          </style>
        </head>
        <body>
          ${printableContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();

    const images = Array.from(printWindow.document.images);
    const imagePromises = images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) resolve();
          else {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }
        }),
    );

    await Promise.all(imagePromises);

    printWindow.focus();
    printWindow.print();
    printWindow.close();
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 bg-background">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Fatura de Locação - Contrato {contract.id}</DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-grow bg-background">
            <div id="printable-invoice" className="p-6 bg-white text-black">
              <header className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                  {companySettings.logoUrl ? (
                    <img src={companySettings.logoUrl} alt="Logo" width={80} height={80} className="object-contain" />
                  ) : (
                    <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-xs text-gray-500">Logo</span>
                    </div>
                  )}

                  <div>
                    <h1 className="text-2xl font-bold">{companySettings.fantasyName || companySettings.name}</h1>
                    <p className="text-sm text-gray-500">CNPJ: {companySettings.cnpj}</p>
                  </div>
                </div>

                <div className="text-right">
                  <h2 className="text-xl font-bold">FATURA DE LOCAÇÃO</h2>
                  <p className="text-sm text-gray-500">Contrato: {contract.id}</p>
                  <div className="flex items-center justify-end gap-2 text-sm text-gray-500">
                    <span>Fatura:</span>
                    <Select
                      value={String(activeIndex)}
                      onValueChange={(val) => setSelectedInstallmentIndex(Number(val))}
                    >
                      <SelectTrigger className="w-auto h-7 text-sm border-gray-300 bg-white text-black px-2 py-0">
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
                  <p className="text-sm text-gray-500">Vencimento: {formatDate(currentInstallment.dueDate)}</p>
                </div>
              </header>

              <Separator className="my-6" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="font-semibold text-lg mb-2">LOCADOR</h3>
                  <p className="font-bold">{companySettings.name}</p>
                  <p>CNPJ: {companySettings.cnpj}</p>
                  <p>{`${companySettings.address.logradouro}, ${companySettings.address.numero}`}</p>
                  <p>{`${companySettings.address.bairro}, ${companySettings.address.localidade} - ${companySettings.address.uf}`}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">LOCATÁRIO</h3>
                  <p className="font-bold">{contract.client?.razaoSocial}</p>
                  <p>Documento: {contract.client?.cnpj || contract.client?.cpf}</p>
                  <p>{`${contract.client?.address?.street || ""}, ${contract.client?.address?.number || ""}`}</p>
                  <p>{`${contract.client?.address?.neighborhood || ""}, ${contract.client?.address?.city || ""} - ${contract.client?.address?.state || ""}`}</p>
                </div>
              </div>

              <section className="mb-8">
                <h3 className="font-bold text-lg mb-2 uppercase">Itens da Locação</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-semibold">Equipamento</th>
                        <th className="text-center p-2 font-semibold">Qtd.</th>
                        <th className="text-right p-2 font-semibold">Vl. Unit.</th>
                        <th className="text-right p-2 font-semibold">Total</th>
                      </tr>
                    </thead>

                    <tbody>
                      {contract.items?.map((item: any, index: number) => {
                        const equipment = getEquipmentDetails(item.equipmentId);
                        const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);

                        return (
                          <tr key={index} className="border-b">
                            <td className="p-2 align-top">
                              <div className="flex items-start gap-4">
                                <img
                                  src={equipment?.imageUrl || "https://placehold.co/100x100.png"}
                                  alt={equipment?.name || "Equipamento"}
                                  width={80}
                                  height={80}
                                  className="rounded-md object-contain"
                                />
                                <div className="max-w-xs">
                                  <p className="font-semibold">{equipment?.name}</p>
                                  <p className="text-sm text-gray-500">{equipment?.description}</p>
                                </div>
                              </div>
                            </td>

                            <td className="p-2 text-center align-top">{item.quantity}</td>
                            <td className="p-2 text-right align-top">{formatCurrency(item.unitPrice || 0)}</td>
                            <td className="p-2 text-right align-top font-bold">{formatCurrency(itemTotal)}</td>
                          </tr>
                        );
                      })}
                    </tbody>

                    <tfoot>
                      <tr className="font-bold text-lg">
                        <td colSpan={3} className="text-right p-2 border-t-2">
                          Valor da Fatura
                        </td>
                        <td className="text-right p-2 border-t-2">
                          {formatCurrency(currentInstallment.valorTotal || 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>

              <Separator className="my-6" />

              <div className="mb-8">
                <h3 className="font-bold text-lg mb-2 uppercase">Termos e Condições</h3>
                <p className="text-sm text-gray-500">
                  Período de referência da locação: {formatDate(contract.startDate, "dd/MM/yyyy")} a{" "}
                  {formatDate(contract.endDate, "dd/MM/yyyy")}.
                </p>

                <h4 className="font-semibold mt-4">Informações Adicionais:</h4>
                <div className="space-y-1 text-sm text-gray-500">
                  <p>Não é fato gerador do ISSQN a locação de bens móveis.</p>
                  <p>Dispensado da emissão de notas fiscais. Conforme Lei Complementar 116 de 31/07/2003.</p>
                  <p>Natureza da operação: Locação de Bens Móveis sem fornecimento de mão de obra.</p>
                </div>

                <p className="text-xs text-center font-bold text-gray-500 mt-4">
                  Válido como recibo a partir da quitação do boleto correspondente.
                </p>
              </div>

              <div className="text-center mt-16">
                <p className="text-sm">
                  {companySettings.address.localidade}, {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
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
