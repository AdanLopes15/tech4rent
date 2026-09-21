//src/components/contratos/DeleteContractDialog.tsx

import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";

import { useStore } from "@/store";
import { useToast } from "@/hooks/use-toast";
import {
  MIN_DELETION_REASON_LENGTH,
  aggregateItems,
  confirmationMatches,
  shouldReturnStock,
} from "@/lib/contract-trash";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: any;
  clientName: string;
  onDeleted?: (contractId: string) => void;
};

export function DeleteContractDialog({ open, onOpenChange, contract, clientName, onDeleted }: Props) {
  const { deleteContract, equipments } = useStore();
  const { toast } = useToast();

  const [reason, setReason] = useState("");
  const [typedId, setTypedId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setReason("");
      setTypedId("");
      setSubmitting(false);
    }
  }, [open, contract?.id]);

  if (!contract) return null;

  const returnsStock = shouldReturnStock(contract);
  const stockEntries = returnsStock ? aggregateItems(contract.items) : [];
  const reasonOk = reason.trim().length >= MIN_DELETION_REASON_LENGTH;
  const idOk = confirmationMatches(typedId, contract.id);

  const handleConfirm = async () => {
    if (!reasonOk || !idOk) return;
    setSubmitting(true);
    try {
      await deleteContract(contract.id, reason);
      toast({
        title: "Contrato movido para a Lixeira",
        description: `${contract.id} pode ser restaurado em Contratos › Lixeira.`,
      });
      onDeleted?.(contract.id);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error?.message || "Não foi possível mover o contrato para a Lixeira.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !submitting && onOpenChange(value)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Mover contrato {contract.id} para a Lixeira?</DialogTitle>
          <DialogDescription>
            Cliente: <strong>{clientName}</strong>
            {contract.status ? ` · Status: ${contract.status}` : ""}
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertDescription className="space-y-1 text-sm">
            <p>O contrato deixará de aparecer nas listagens, no financeiro e nos relatórios.</p>
            <p>
              Nenhum dado será apagado: parcelas, pagamentos, anexos e histórico ficam preservados e voltam junto
              com o contrato se ele for restaurado.
            </p>
            {returnsStock && stockEntries.length > 0 ? (
              <p>
                Os equipamentos voltarão ao estoque:{" "}
                {stockEntries
                  .map((e) => `${equipments.find((eq: any) => eq.id === e.equipmentId)?.name || e.equipmentId} (${e.quantity})`)
                  .join(", ")}
                . A restauração só será possível se essas quantidades ainda estiverem disponíveis.
              </p>
            ) : (
              <p>Nenhum equipamento volta ao estoque (o contrato não está em andamento).</p>
            )}
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="deletion-reason">Motivo da exclusão (obrigatório)</Label>
            <Textarea
              id="deletion-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex.: contrato lançado em duplicidade para o mesmo cliente"
              disabled={submitting}
            />
            {!reasonOk && (
              <p className="text-xs text-muted-foreground">Mínimo de {MIN_DELETION_REASON_LENGTH} caracteres.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deletion-confirm">
              Para confirmar, digite <span className="font-mono font-semibold">{contract.id}</span>
            </Label>
            <Input
              id="deletion-confirm"
              value={typedId}
              onChange={(e) => setTypedId(e.target.value)}
              autoComplete="off"
              disabled={submitting}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!reasonOk || !idOk || submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            Mover para a Lixeira
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
