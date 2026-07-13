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
import { CompanyLogo } from "@/components/admin/CompanyLogo";

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

const formatPhoneBR = (raw?: string) => {
  if (!raw) return "";
  const d = String(raw).replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return raw;
};

export function DeliveryReceiptDialog({ open, onOpenChange, contract }: DeliveryReceiptDialogProps) {
  const { companySettings, equipments } = useStore();
  const { toast } = useToast();

  const formatDate = (dateInput: any) => {
    const date = safeToDate(dateInput);
    if (!date) return "—";
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

  const handlePrint = () => {
    window.print();
  };

  if (!contract) return null;

  const getEquipment = (id: string) => equipments.find((e: any) => e.id === id);

  const client = contract.client || {};
  const clientName = client.razaoSocial || client.name || "—";
  const clientDoc = client.cnpj || client.cpf || "";
  const clientCity = client.city || client.cidade || "";
  const clientUf = client.uf || "";
  const clientPhone = client.telefone || client.phone || client.whatsapp || "";

  const address = companySettings?.address;
  const companyAddress =
    address && typeof address === "object"
      ? `${address.logradouro || ""}${address.numero ? ", " + address.numero : ""} - ${address.bairro || ""} - ${address.localidade || ""}/${address.uf || ""}`
      : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col print:hidden">
        <DialogHeader>
          <DialogTitle>Recibo de Entrega - {contract.id}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-grow bg-slate-100 rounded-md">
          <div className="py-6 flex justify-center">
            <ReceiptSheet
              contract={contract}
              clientName={clientName}
              clientDoc={clientDoc}
              clientCity={clientCity}
              clientUf={clientUf}
              clientPhone={clientPhone}
              companySettings={companySettings}
              companyAddress={companyAddress}
              formatDate={formatDate}
              getEquipment={getEquipment}
            />
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

      {/* Versão exclusiva para impressão (fora do modal) */}
      {open && (
        <div className="hidden print:block print-receipt-root">
          <ReceiptSheet
            contract={contract}
            clientName={clientName}
            clientDoc={clientDoc}
            clientCity={clientCity}
            clientUf={clientUf}
            clientPhone={clientPhone}
            companySettings={companySettings}
            companyAddress={companyAddress}
            formatDate={formatDate}
            getEquipment={getEquipment}
          />
        </div>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .print-receipt-root, .print-receipt-root * { visibility: visible !important; }
          .print-receipt-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page { size: A4; margin: 12mm; }
        }
      `}</style>
    </Dialog>
  );
}

interface ReceiptSheetProps {
  contract: any;
  clientName: string;
  clientDoc: string;
  clientCity: string;
  clientUf: string;
  clientPhone: string;
  companySettings: any;
  companyAddress: string;
  formatDate: (d: any) => string;
  getEquipment: (id: string) => any;
}

function ReceiptSheet({
  contract,
  clientName,
  clientDoc,
  clientCity,
  clientUf,
  clientPhone,
  companySettings,
  companyAddress,
  formatDate,
  getEquipment,
}: ReceiptSheetProps) {
  const companyName = companySettings?.name || "TECH4RENT";
  const cnpj = companySettings?.cnpj || "44.740.821/0001-30";
  const phone = companySettings?.phone || "(19) 97107-6928";
  const whatsapp = companySettings?.whatsapp || "";
  const email = companySettings?.email || "";

  const clientLocation = [clientCity, clientUf].filter(Boolean).join("/");

  return (
    <div
      className="bg-white text-[#0D1B2A] shadow-md w-full max-w-[210mm] min-h-[280mm] p-10 flex flex-col gap-6 print:shadow-none print:p-0"
      style={{ boxSizing: "border-box" }}
    >
      {/* Cabeçalho: logo + dados da empresa | número/data */}
      <div className="flex justify-between items-start border-b-2 border-[#1E88E5] pb-4">
        <div className="flex items-start gap-4">
          <CompanyLogo isDark={false} className="h-14 w-auto" />
          <div className="flex flex-col gap-0.5">
            <span className="text-lg font-bold text-[#0D1B2A] uppercase tracking-tight">{companyName}</span>
            <span className="text-[10px] font-semibold text-[#1E88E5] uppercase">
              Equipando o Brasil com qualidade!
            </span>
            <span className="text-[10px] text-[#555]">CNPJ: {cnpj}</span>
            {phone && <span className="text-[10px] text-[#555]">Tel: {phone}</span>}
            {whatsapp && <span className="text-[10px] text-[#555]">WhatsApp: {whatsapp}</span>}
            {email && <span className="text-[10px] text-[#555]">E-mail: {email}</span>}
            {companyAddress && <span className="text-[10px] text-[#555]">{companyAddress}</span>}
          </div>
        </div>

        <div className="text-right flex flex-col gap-0.5">
          <span className="text-xs font-bold text-[#0D1B2A]">Recibo: {contract.id}</span>
          <span className="text-xs text-[#555]">Data: {formatDate(new Date())}</span>
        </div>
      </div>

      {/* Título */}
      <div className="text-center">
        <h1 className="text-2xl font-extrabold text-[#0D1B2A] uppercase tracking-wide">Recibo de Entrega</h1>
      </div>

      {/* Dados do Cliente */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white bg-[#0D1B2A] px-3 py-1.5 rounded-t">
          Dados do Cliente
        </h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 border border-[#e5e5e5] border-t-0 rounded-b px-4 py-3 text-sm">
          <div>
            <span className="text-[11px] text-[#888] uppercase font-semibold">Cliente / Razão Social</span>
            <div className="font-medium text-[#0D1B2A]">{clientName}</div>
          </div>
          {clientDoc && (
            <div>
              <span className="text-[11px] text-[#888] uppercase font-semibold">CNPJ / CPF</span>
              <div className="font-medium text-[#0D1B2A]">{clientDoc}</div>
            </div>
          )}
          {clientLocation && (
            <div>
              <span className="text-[11px] text-[#888] uppercase font-semibold">Cidade / UF</span>
              <div className="font-medium text-[#0D1B2A]">{clientLocation}</div>
            </div>
          )}
          {clientPhone && (
            <div>
              <span className="text-[11px] text-[#888] uppercase font-semibold">Telefone</span>
              <div className="font-medium text-[#0D1B2A]">{clientPhone}</div>
            </div>
          )}
          {contract.unitOperation && (
            <div>
              <span className="text-[11px] text-[#888] uppercase font-semibold">Unidade / Operação</span>
              <div className="font-medium text-[#0D1B2A]">{contract.unitOperation}</div>
            </div>
          )}
        </div>
      </section>

      {/* Itens Entregues */}
      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white bg-[#0D1B2A] px-3 py-1.5 rounded-t">
          Itens Entregues
        </h2>
        <table className="w-full border-collapse text-sm border border-[#e5e5e5] border-t-0">
          <thead>
            <tr className="bg-[#f4f7fb] text-[#0D1B2A]">
              <th className="text-left font-bold uppercase text-[11px] px-3 py-2 border-b border-[#e5e5e5] w-12">Item</th>
              <th className="text-left font-bold uppercase text-[11px] px-3 py-2 border-b border-[#e5e5e5]">Descrição</th>
              <th className="text-center font-bold uppercase text-[11px] px-3 py-2 border-b border-[#e5e5e5] w-32">Quantidade</th>
            </tr>
          </thead>
          <tbody>
            {(contract.items || []).map((item: any, i: number) => {
              const eq = getEquipment(item.equipmentId);
              const name = eq?.name || item.equipmentName || item.name || "Equipamento";
              return (
                <tr key={i} className="border-b border-[#eee] last:border-b-0">
                  <td className="px-3 py-2 text-[#0D1B2A]">{i + 1}</td>
                  <td className="px-3 py-2 font-medium text-[#0D1B2A]">{name}</td>
                  <td className="px-3 py-2 text-center text-[#0D1B2A]">{item.quantity} unidade(s)</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Declaração */}
      <section className="border-l-4 border-[#1E88E5] bg-[#f4f7fb] px-4 py-3 rounded-r text-[13px] leading-relaxed text-[#333]">
        Declaro, para os devidos fins, que recebi da <b>{companyName}</b> os equipamentos descritos acima, em perfeitas
        condições de uso e funcionamento, estando ciente da responsabilidade pela guarda e conservação dos mesmos durante o
        período contratado.
      </section>

      {/* Assinaturas */}
      <div className="grid grid-cols-2 gap-16 mt-auto pt-16">
        <div className="flex flex-col items-center gap-1">
          <div className="w-full border-b-2 border-[#0D1B2A]"></div>
          <span className="text-[11px] font-bold uppercase text-[#0D1B2A] mt-1">{companyName}</span>
          <span className="text-[10px] text-[#888]">Assinatura TECH4RENT</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="w-full border-b-2 border-[#0D1B2A]"></div>
          <span className="text-[11px] font-bold uppercase text-[#0D1B2A] mt-1 text-center">{clientName}</span>
          {clientDoc && <span className="text-[10px] text-[#555]">Doc: {clientDoc}</span>}
          <span className="text-[10px] text-[#888]">Assinatura Cliente</span>
        </div>
      </div>
    </div>
  );
}
