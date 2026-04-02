//src/components/contratos/DeliveryReceiptDialog.tsx

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Timestamp } from "firebase/firestore";
import { Printer, X } from "lucide-react";

import { useStore } from "@/store";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DeliveryReceiptDialogProps {
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

export function DeliveryReceiptDialog({ open, onOpenChange, contract }: DeliveryReceiptDialogProps) {
  const { companySettings, equipments } = useStore();
  const { toast } = useToast();

  const formatDate = (dateInput: any) => {
    const date = safeToDate(dateInput);
    if (!date) return "Data inválida";
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

  const handlePrint = async () => {
    const printableContent = document.getElementById("printable-receipt");
    if (!printableContent) {
      toast({
        title: "Erro",
        description: "Não foi possível imprimir.",
        variant: "destructive",
      });
      return;
    }

    const printWindow = window.open("", "", "height=800,width=800");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Recibo de Entrega</title>
        </head>
        <body>
          ${printableContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  if (!contract) return null;

  const getEquipment = (id: string) => equipments.find((e: any) => e.id === id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Recibo de Entrega - {contract.id}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-grow">
          <div id="printable-receipt" className="p-6 bg-white text-black">
            <h1 className="text-2xl font-bold mb-4">RECIBO DE ENTREGA</h1>

            <p>
              <b>Empresa:</b> {companySettings.name}
            </p>
            <p>
              <b>Cliente:</b> {contract.client?.razaoSocial}
            </p>
            <p>
              <b>Data:</b> {formatDate(new Date())}
            </p>

            <h3 className="mt-6 font-bold">Itens Entregues</h3>

            <ul className="mt-2 space-y-2">
              {contract.items?.map((item: any, i: number) => {
                const eq = getEquipment(item.equipmentId);
                return (
                  <li key={i}>
                    {eq?.name} - {item.quantity} unidade(s)
                  </li>
                );
              })}
            </ul>

            <div className="mt-16 grid grid-cols-2 gap-8 text-center">
              <div>
                <div className="border-t"></div>
                <p>Assinatura Empresa</p>
              </div>

              <div>
                <div className="border-t"></div>
                <p>Assinatura Cliente</p>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button onClick={handlePrint}>
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
