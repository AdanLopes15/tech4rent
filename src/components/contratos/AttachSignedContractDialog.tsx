//src/components/contratos/AttachSignedContractDialog.tsx

import { useState } from "react";
import { Upload, X } from "lucide-react";

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

interface AttachSignedContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: any;
}

export function AttachSignedContractDialog({ open, onOpenChange, contract }: AttachSignedContractDialogProps) {
  const { attachSignedContract } = useStore();
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file || !contract) {
      toast({
        title: "Selecione um arquivo",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Envia para o Firebase Storage em contracts/{contractId}/{arquivo}
      // e grava a referência no contrato.
      await attachSignedContract(contract.id, file);

      toast({
        title: "Contrato anexado com sucesso!",
      });

      onOpenChange(false);
      setFile(null);
    } catch (error: any) {
      toast({
        title: "Erro ao anexar contrato",
        description: error.message,
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
          <DialogTitle>Anexar Contrato Assinado</DialogTitle>
          <DialogDescription>Envie o PDF ou imagem do contrato assinado.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <input type="file" accept=".pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />

          {file && <p className="text-sm text-muted-foreground">Arquivo: {file.name}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>

          <Button onClick={handleUpload} disabled={loading}>
            <Upload className="mr-2 h-4 w-4" />
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
