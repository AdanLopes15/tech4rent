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
import { CompanyLogo } from "../admin/CompanyLogo";

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

  const formatOrderDate = (date: any) => {
    try {
      const d = date?.toDate ? date.toDate() : new Date(date);
      return format(d, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return "—";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Recibo de Ordem de Compra - {order.id}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-grow">
          <div className="p-6 space-y-6">
            {/* Header com logo e empresa */}
            <div className="flex items-center gap-4">
              <CompanyLogo 
                isDark={false} 
                className="h-16 w-16" 
              />
              <div>
                <h1 className="text-2xl font-bold">{companySettings?.fantasyName || companySettings?.name}</h1>
                <p className="text-sm text-muted-foreground">CNPJ: {companySettings?.cnpj}</p>
              </div>
            </div>

            {/* Título e data */}
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold">Ordem de Compra - {order.id}</h2>
              <p className="text-sm text-muted-foreground">
                Data do pedido: {formatOrderDate(order.date || order.createdAt)}
              </p>
            </div>

            <Separator />

            {/* Comprador e Fornecedor */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-sm uppercase mb-1">Comprador</h3>
                <p className="font-semibold">{companySettings?.fantasyName || companySettings?.name}</p>
                <p className="text-sm text-muted-foreground">CNPJ: {companySettings?.cnpj}</p>
              </div>
              <div>
                <h3 className="font-bold text-sm uppercase mb-1">Fornecedor</h3>
                <p className="font-semibold">{order.supplierName}</p>
              </div>
            </div>

            <Separator />

            {/* Itens do pedido */}
            <div>
              <h3 className="font-bold text-sm uppercase mb-3">Itens do Pedido</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 font-semibold">Equipamento</th>
                    <th className="text-center py-2 px-2 font-semibold">Qtd.</th>
                    <th className="text-right py-2 px-2 font-semibold">Custo Unit.</th>
                    <th className="text-right py-2 px-2 font-semibold">Custo Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item: any, i: number) => {
                    const eq = getEquipment(item.equipmentId);
                    const unitCost = item.unitCost || item.unitPrice || 0;
                    const total = item.quantity * unitCost;

                    return (
                      <tr key={i} className="border-b">
                        <td className="py-2 px-2">
                          <div>{eq?.name || "—"}</div>
                          {eq?.category && (
                            <div className="text-xs text-muted-foreground">{eq.category}</div>
                          )}
                        </td>
                        <td className="text-center py-2 px-2">{item.quantity}</td>
                        <td className="text-right py-2 px-2">{formatCurrency(unitCost)}</td>
                        <td className="text-right py-2 px-2 font-bold">{formatCurrency(total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="flex justify-end mt-3 border-t pt-3">
                <div className="flex gap-8 items-center">
                  <span className="font-bold">Total Geral</span>
                  <span className="font-bold text-lg">{formatCurrency(order.totalValue)}</span>
                </div>
              </div>
            </div>

            {/* Observações */}
            {order.notes && (
              <>
                <Separator />
                <div>
                  <h3 className="font-bold text-sm uppercase mb-2">Observações</h3>
                  <p className="text-sm text-muted-foreground">{order.notes}</p>
                </div>
              </>
            )}
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
