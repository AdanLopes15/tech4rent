//src/components/contratos/FinalizeContractDialog.tsx

import { useState } from "react";
import { CheckCircle, X } from "lucide-react";

import { useStore } from "@/store";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface FinalizeContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: any;
}

export function FinalizeContractDialog({ open, onOpenChange, contract }: FinalizeContractDialogProps) {
  const { updateContract } = useStore();
  const { toast } = useToast();

  const [observation, setObservation] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFinalize = async () => {
    if (!contract) return;

    try {
      setLoading(true);

      const now = new Date();
      await updateContract({
        id: contract.id,
        status: "Finalizado",
        finalizedAt: now.toISOString(),
        observation: observation.trim(),
        // Precisamos garantir que startDate e endDate sejam preservados/enviados corretamente
        // se o updateContract no store exigir que eles sejam datas válidas.
        startDate: contract.startDate,
        endDate: contract.endDate,
      });

      toast({
        title: "Contrato finalizado com sucesso!",
      });

      onOpenChange(false);
      setObservation("");
    } catch (error: any) {
      console.error("Erro ao finalizar contrato:", error);
      toast({
        title: "Erro ao finalizar contrato",
        description: error.message || "Erro interno ao processar datas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!contract) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Finalizar Contrato</DialogTitle>
          <DialogDescription>
            Você está finalizando o contrato <b>{contract.id}</b>.
            <br />
            Essa ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <label className="text-sm font-medium">Observações (opcional)</label>
          <Textarea
            placeholder="Ex: contrato encerrado normalmente..."
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>

          <Button onClick={handleFinalize} disabled={loading} className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="mr-2 h-4 w-4" />
            Finalizar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
