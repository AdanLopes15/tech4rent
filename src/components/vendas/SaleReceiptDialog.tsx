//src/components/vendas/SaleReceiptDialog.tsx

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Printer, X } from "lucide-react";
import { useStore } from "@/store";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";
import { CompanyLogo } from "../admin/CompanyLogo";

interface SaleReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: any;
}

export function SaleReceiptDialog({ open, onOpenChange, sale }: SaleReceiptDialogProps) {
  const { companySettings, equipments, saleClauses } = useStore();

  const formatDate = (dateInput: any, dateFormat: string = "dd 'de' MMMM 'de' yyyy") => {
    if (!dateInput) return "Data inválida";

    try {
      const date = dateInput?.toDate ? dateInput.toDate() : new Date(dateInput);
      if (isNaN(date.getTime())) return "Data inválida";
      return format(date, dateFormat, { locale: ptBR });
    } catch {
      return "Data inválida";
    }
  };

  const getEquipmentDetails = (equipmentId: string) => {
    return equipments.find((eq: any) => eq.id === equipmentId);
  };

  const handlePrint = () => {
    const printableContent = document.getElementById("printable-sale-receipt");
    if (!printableContent) return;

    const printWindow = window.open("", "", "height=800,width=900");
    if (!printWindow) return;

    const headLinksAndStyles = Array.from(document.querySelectorAll("link[rel='stylesheet'], style"))
      .map((node) => node.outerHTML)
      .join("\n");

    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>Recibo de Venda</title>
          ${headLinksAndStyles}
          <style>
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
          ${printableContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();

    const images = Array.from(printWindow.document.images);
    Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) return resolve();
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }),
      ),
    ).then(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    });
  };

  if (!sale) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 bg-background">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Recibo de Venda - {sale.id}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-grow bg-background">
          <div id="printable-sale-receipt" className="p-6 bg-white text-black">
            <header className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-4">
                <CompanyLogo 
                  isDark={false} 
                  className="h-20 w-20" 
                />

                <div>
                  <h1 className="text-2xl font-bold">{companySettings?.fantasyName || companySettings?.name}</h1>
                  <p className="text-sm text-gray-500">CNPJ: {companySettings?.cnpj}</p>
                </div>
              </div>
            </header>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold">Recibo de Venda</h2>
              <p className="text-sm text-gray-500 mt-1">Venda: {sale.id}</p>
              <p className="text-sm text-gray-500">Emitido em {formatDate(sale.saleDate, "dd/MM/yyyy")}</p>
            </div>

            <Separator className="my-6" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="font-semibold text-lg mb-2">VENDEDOR</h3>
                <p className="font-bold">{companySettings?.fantasyName || companySettings?.name}</p>
                <p>CNPJ: {companySettings?.cnpj}</p>
                <p>
                  {companySettings?.address?.logradouro}, {companySettings?.address?.numero}
                </p>
                <p>
                  {companySettings?.address?.bairro}, {companySettings?.address?.localidade} -{" "}
                  {companySettings?.address?.uf}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">COMPRADOR</h3>
                <p className="font-bold">{sale.clientName || "N/A"}</p>
              </div>
            </div>

            <section className="mb-8">
              <h3 className="font-bold text-lg mb-2 uppercase">Itens da Venda</h3>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-2 font-semibold">Equipamento</th>
                      <th className="text-center p-2 font-semibold">Qtd.</th>
                      <th className="text-right p-2 font-semibold">Vl. Unit.</th>
                      <th className="text-right p-2 font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sale.items?.map((item: any, index: number) => {
                      const equipment = getEquipmentDetails(item.equipmentId);
                      const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);

                      return (
                        <tr key={index} className="border-b border-gray-200">
                          <td className="p-2 align-top">
                            <div className="flex items-start gap-4">
                              <img
                                src={equipment?.imageUrl || "https://placehold.co/100x100.png"}
                                alt={equipment?.name || "Equipamento"}
                                width={80}
                                height={80}
                                style={{
                                  borderRadius: 6,
                                  objectFit: "contain",
                                }}
                              />
                              <div className="max-w-xs">
                                <p className="font-semibold">{equipment?.name || "Equipamento"}</p>
                                <p className="text-sm text-gray-500">{equipment?.description || ""}</p>
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
                        Valor Total
                      </td>
                      <td className="text-right p-2 border-t-2">{formatCurrency(sale.totalValue || 0)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>

            <Separator className="my-6" />

            {sale.paymentMethods?.length > 0 && (
              <section className="mb-8">
                <h3 className="font-bold text-lg mb-2 uppercase">Condições de Pagamento</h3>

                <div className="space-y-2 text-sm text-gray-700">
                  {sale.paymentMethods.map((pm: any, index: number) => (
                    <div key={index} className="border rounded p-3">
                      <p>
                        <span className="font-semibold">Forma:</span> {pm.paymentMethod || "-"}
                      </p>
                      <p>
                        <span className="font-semibold">Valor:</span> {formatCurrency(pm.value || 0)}
                      </p>
                      <p>
                        <span className="font-semibold">Parcelas:</span> {pm.installments || 1}
                      </p>

                      {pm.paymentMethod === "entrada_boleto" && (
                        <>
                          <p>
                            <span className="font-semibold">Tipo da entrada:</span>{" "}
                            {pm.downPaymentType === "percentage" ? "Porcentagem" : "Valor fixo"}
                          </p>
                          <p>
                            <span className="font-semibold">Valor da entrada:</span>{" "}
                            {pm.downPaymentType === "percentage"
                              ? `${pm.downPaymentValue || 0}%`
                              : formatCurrency(pm.downPaymentValue || 0)}
                          </p>
                          <p>
                            <span className="font-semibold">Data da entrada:</span>{" "}
                            {pm.downPaymentDate ? formatDate(pm.downPaymentDate, "dd/MM/yyyy") : "—"}
                          </p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {sale.informacoesFiscais && (
              <>
                <Separator className="my-6" />
                <section className="mb-8">
                  <h3 className="font-bold text-lg mb-2 uppercase">Informações Fiscais</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{sale.informacoesFiscais}</p>
                </section>
              </>
            )}

            {saleClauses?.length > 0 && (
              <>
                <Separator className="my-6" />
                <section>
                  <h3 className="font-bold text-lg mb-4 uppercase">Cláusulas da Venda</h3>

                  <div className="space-y-4 text-sm text-gray-600">
                    {saleClauses.map((clause, index) => (
                      <div key={clause.id}>
                        <h4 className="font-bold text-black mb-1">
                          {index + 1}. {clause.title}
                        </h4>

                        {clause.subClauses?.map((subClause, subIndex) => (
                          <p key={subClause.id} className="ml-4 mt-2">
                            {index + 1}.{subIndex + 1}. {subClause.text}
                          </p>
                        ))}
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
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
