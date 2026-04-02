//src/components/ordens-compra/PurchaseOrderReceiptDialog.tsx

"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Printer, X } from "lucide-react";
import { useStore } from "@/store";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
}

export function PurchaseOrderReceiptDialog({ open, onOpenChange, order }: Props) {
  const { companySettings, equipments } = useStore();

  const handlePrint = () => {
    window.print();
  };

  if (!order) return null;

  const getEquipment = (id: string) => equipments.find((e: any) => e.id === id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Recibo - {order.id}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-grow">
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-2">{companySettings?.fantasyName || companySettings?.name}</h1>

            <p className="text-sm text-muted-foreground mb-6">CNPJ: {companySettings?.cnpj}</p>

            <h2 className="text-xl font-bold mb-4">Ordem de Compra - {order.id}</h2>

            <p className="mb-6">
              Data:{" "}
              {format(new Date(order.date || order.createdAt), "dd/MM/yyyy", {
                locale: ptBR,
              })}
            </p>

            <Separator className="my-4" />

            <h3 className="font-semibold mb-2">Fornecedor</h3>
            <p className="mb-6">{order.supplierName}</p>

            <h3 className="font-semibold mb-2">Itens</h3>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Equipamento</th>
                  <th className="text-center p-2">Qtd</th>
                  <th className="text-right p-2">Unit</th>
                  <th className="text-right p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item: any, i: number) => {
                  const eq = getEquipment(item.equipmentId);
                  const total = item.quantity * (item.unitCost || item.unitPrice);

                  return (
                    <tr key={i} className="border-b">
                      <td className="p-2">{eq?.name}</td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-right">{formatCurrency(item.unitCost || item.unitPrice)}</td>
                      <td className="text-right font-bold">{formatCurrency(total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="text-right mt-4 text-lg font-bold">Total: {formatCurrency(order.totalValue)}</div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 border-t">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
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
