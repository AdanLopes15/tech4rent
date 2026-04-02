//src/components/financeiro/AttachBoletoDialog.tsx

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Paperclip } from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface AttachBoletoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revenue?: any;
}

export const AttachBoletoDialog = ({ open, onOpenChange, revenue }: AttachBoletoDialogProps) => {
  const { attachBoletoToRevenue, contracts, revenues } = useStore();

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const [selectedContractId, setSelectedContractId] = useState("");
  const [selectedRevenueId, setSelectedRevenueId] = useState("");

  const activeContracts = useMemo(() => {
    return contracts.filter((contract: any) => contract.status === "Em Andamento");
  }, [contracts]);

  const availableRevenues = useMemo(() => {
    if (!selectedContractId) return [];

    return revenues.filter(
      (item: any) => item.contractId === selectedContractId && String(item.status || "").toLowerCase() === "pendente",
    );
  }, [revenues, selectedContractId]);

  useEffect(() => {
    if (!open) return;

    if (revenue) {
      setSelectedContractId(revenue.contractId || "");
      setSelectedRevenueId(revenue.id || "");
    } else {
      setSelectedContractId("");
      setSelectedRevenueId("");
    }

    setFile(null);
    setLoading(false);
  }, [open, revenue]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const selectedFile = e.target.files[0];

    if (selectedFile.type === "application/pdf") {
      setFile(selectedFile);
    } else {
      toast.error("Selecione um arquivo PDF.");
      e.target.value = "";
    }
  };

  const handleUpload = async () => {
    if (!selectedRevenueId || !file) {
      toast.error("Selecione a parcela e o arquivo PDF para anexar.");
      return;
    }

    setLoading(true);

    try {
      await attachBoletoToRevenue(selectedRevenueId, file);
      toast.success("O boleto foi anexado à parcela.");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.message || "Não foi possível anexar o arquivo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) setFile(null);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Anexar Boleto</DialogTitle>
          <DialogDescription>
            Selecione o contrato, a parcela e faça o upload do arquivo PDF do boleto.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contract-select">Contrato</Label>
            <Select
              value={selectedContractId}
              onValueChange={(value) => {
                setSelectedContractId(value);
                if (!revenue) setSelectedRevenueId("");
              }}
              disabled={!!revenue}
            >
              <SelectTrigger id="contract-select">
                <SelectValue placeholder="Selecione um contrato ativo" />
              </SelectTrigger>

              <SelectContent>
                {activeContracts.map((contract: any) => (
                  <SelectItem key={contract.id} value={contract.id}>
                    {contract.id} - {contract.client?.razaoSocial || "N/A"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="revenue-select">Parcela</Label>
            <Select
              value={selectedRevenueId}
              onValueChange={setSelectedRevenueId}
              disabled={!selectedContractId || !!revenue}
            >
              <SelectTrigger id="revenue-select">
                <SelectValue placeholder="Selecione a parcela pendente" />
              </SelectTrigger>

              <SelectContent>
                {availableRevenues.map((item: any) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.description} (Venc: {format(new Date(item.dueDate), "dd/MM/yy")}) -{" "}
                    {formatCurrency(item.valorTotal)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="boleto-file">Arquivo PDF</Label>
            <Input id="boleto-file" type="file" accept="application/pdf" onChange={handleFileChange} />
            {file && <p className="text-sm text-muted-foreground">Arquivo selecionado: {file.name}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>

          <Button onClick={handleUpload} disabled={!selectedRevenueId || !file || loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Paperclip className="mr-2 h-4 w-4" />}
            Salvar Anexo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
