//src/components/contratos/ViewContractDialog.tsx

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Printer, X } from "lucide-react";
import { useStore } from "@/store";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Timestamp } from "firebase/firestore";
import { formatCurrency } from "@/lib/utils";
import { CompanyLogo } from "../admin/CompanyLogo";
import { DocumentItemRow } from "@/components/admin/operacional/documents";
import { useToast } from "@/hooks/use-toast";

interface ViewContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: any;
}

const safeToDate = (dateInput: any): Date | null => {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return dateInput;
  if (dateInput instanceof Timestamp) return dateInput.toDate();

  if (typeof dateInput === "string" || typeof dateInput === "number") {
    const date = new Date(dateInput);
    if (!isNaN(date.getTime())) return date;
  }

  if (typeof dateInput === "object" && "seconds" in dateInput) {
    const date = new Timestamp(dateInput.seconds, dateInput.nanoseconds || 0).toDate();
    if (!isNaN(date.getTime())) return date;
  }

  if (typeof dateInput?.toDate === "function") {
    const date = dateInput.toDate();
    if (!isNaN(date.getTime())) return date;
  }

  return null;
};

const formatDate = (dateInput: any, dateFormat: string = "dd 'de' MMMM 'de' yyyy") => {
  const date = safeToDate(dateInput);
  if (!date) return "Data inválida";

  try {
    return format(date, dateFormat, { locale: ptBR });
  } catch {
    return "Data inválida";
  }
};

export function ViewContractDialog({ open, onOpenChange, contract }: ViewContractDialogProps) {
  const { companySettings, rentalClauses, equipments, revenues } = useStore();
  const { toast } = useToast();

  const handlePrint = async () => {
    const printableContent = document.getElementById("printable-contract");
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
        description: "Permita pop-ups para imprimir o contrato.",
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
          <title>Imprimir Contrato</title>
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
            body {
              margin: 0;
              padding: 0;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${printableContent.innerHTML}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();

    const images = Array.from(printWindow.document.images);
    await Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) return resolve();
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }),
      ),
    );

    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  if (!contract) return null;

  const getEquipmentDetails = (equipmentId: string) => {
    return equipments.find((eq: any) => eq.id === equipmentId);
  };

  const totalQuantity = contract.items?.reduce((acc: number, item: any) => acc + (item.quantity || 0), 0) || 0;

  const getFinancialDetails = () => {
    const contractRevenues = revenues
      .filter((r: any) => r.contractId === contract.id)
      .sort((a: any, b: any) => {
        const dateA = safeToDate(a.dueDate);
        const dateB = safeToDate(b.dueDate);
        if (!dateA || !dateB) return 0;
        return dateA.getTime() - dateB.getTime();
      });

    const firstInstallment = contractRevenues.length > 0 ? contractRevenues[0] : null;
    const lastInstallment = contractRevenues.length > 0 ? contractRevenues[contractRevenues.length - 1] : null;

    const monthlyValue =
      contract.items?.reduce((acc: number, item: any) => acc + (item.quantity || 0) * (item.unitPrice || 0), 0) || 0;

    return {
      numberOfInstallments: contractRevenues.length,
      monthlyValue,
      firstDueDate: firstInstallment?.dueDate,
      lastDueDate: lastInstallment?.dueDate,
    };
  };

  const financialDetails = getFinancialDetails();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 bg-background">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Visualizar Contrato de Locação - {contract.id}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-grow bg-background">
          <div id="printable-contract" className="p-6 bg-white text-black">
            <header className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-4">
                <CompanyLogo 
                  isDark={false} 
                  className="h-20 w-20" 
                />

                <div>
                  <h1 className="text-2xl font-bold">{companySettings.fantasyName || companySettings.name}</h1>
                  <p className="text-sm text-gray-500">CNPJ: {companySettings.cnpj}</p>
                </div>
              </div>
            </header>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold">Contrato de Locação - {contract.id}</h2>
              <p className="text-sm text-gray-500 mt-1">
                Gerado em {formatDate(contract.createdAt, "dd/MM/yyyy 'às' HH:mm")}. Válido mediante assinatura.
              </p>
            </div>

            <Separator className="my-6" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="font-semibold text-lg mb-2">LOCADOR/VENDEDOR</h3>
                <p className="font-bold">{companySettings.fantasyName || companySettings.name}</p>
                <p>CNPJ: {companySettings.cnpj}</p>
                <p>
                  {`${companySettings.address.logradouro}, ${companySettings.address.numero} - ${companySettings.address.bairro}, ${companySettings.address.localidade} - ${companySettings.address.uf}`}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">LOCATÁRIO/COMPRADOR (CLIENTE)</h3>
                <p className="font-bold">{contract.client?.razaoSocial}</p>
                <p>Documento: {contract.client?.cnpj || contract.client?.cpf}</p>
                <p>
                  {`${contract.client?.address?.street || ""}, ${contract.client?.address?.number || ""} - ${contract.client?.address?.neighborhood || ""}, ${contract.client?.address?.city || ""} - ${contract.client?.address?.state || ""}`}
                </p>
              </div>
            </div>

            <section className="mb-8">
              <h3 className="font-bold text-lg mb-2 uppercase">Objeto do Documento</h3>
              <p className="text-gray-500 mb-4">
                O presente documento tem como objeto a locação do(s) seguinte(s) equipamento(s), totalizando{" "}
                {totalQuantity} itens:
              </p>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-semibold">Equipamento</th>
                      <th className="text-center p-2 font-semibold">Qtd.</th>
                      <th className="text-right p-2 font-semibold">Vl. Unit. (Mês)</th>
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
                            <DocumentItemRow item={item} equipments={equipments} />
                          </td>

                          <td className="p-2 text-center align-top">{item.quantity}</td>
                          <td className="p-2 text-right align-top">{formatCurrency(item.unitPrice || 0)}</td>
                          <td className="p-2 text-right align-top font-bold">{formatCurrency(itemTotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <Separator className="my-6" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="font-bold text-lg mb-2 uppercase">Período</h3>
                <p>
                  <span className="font-semibold">Retirada:</span> {formatDate(contract.startDate)}
                </p>
                <p>
                  <span className="font-semibold">Devolução:</span> {formatDate(contract.endDate)}
                </p>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-2 uppercase">Valor e Condições</h3>
                <p className="text-sm">
                  O valor total mensal da locação é de{" "}
                  <span className="font-bold">{formatCurrency(contract.totalValue || 0)}</span>, a ser pago em{" "}
                  <span className="font-bold">{financialDetails.numberOfInstallments} parcela(s)</span> de{" "}
                  <span className="font-bold">{formatCurrency(financialDetails.monthlyValue)}</span>.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Primeiro vencimento em: {formatDate(financialDetails.firstDueDate, "dd/MM/yyyy")}
                </p>
                <p className="text-xs text-gray-500">
                  Último vencimento em: {formatDate(financialDetails.lastDueDate, "dd/MM/yyyy")}
                </p>
              </div>
            </div>

            <section>
              <h3 className="font-bold text-lg mb-4 uppercase">Cláusulas Contratuais de Locação</h3>

              <div className="space-y-4 text-sm text-gray-500">
                {rentalClauses.map((clause, index) => (
                  <div key={clause.id}>
                    <h4 className="font-bold text-black mb-1">{`${index + 1}. ${clause.text}`}</h4>

                    {clause.subClauses &&
                      clause.subClauses.map((subClause, subIndex) => (
                        <p key={subClause.id} className="ml-4 mt-2">
                          {`${index + 1}.${subIndex + 1}. ${subClause.text}`}
                        </p>
                      ))}
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-24 pt-8">
              <div className="grid grid-cols-2 gap-16 text-center">
                <div>
                  <div className="border-t border-black w-full"></div>
                  <p className="mt-2 text-sm font-semibold">{companySettings.fantasyName || companySettings.name}</p>
                  <p className="text-xs text-gray-500">(Assinatura do Locador/Entregador)</p>
                </div>

                <div>
                  <div className="border-t border-black w-full"></div>
                  <p className="mt-2 text-sm font-semibold">{contract.client?.razaoSocial}</p>
                  <p className="text-xs text-gray-500">(Assinatura do Locatário/Recebedor)</p>
                </div>
              </div>
            </section>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 border-t bg-card">
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
  );
}
