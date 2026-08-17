//src/components/financeiro/AttachReceiptDialog.tsx

import { useState } from "react";
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
import { Loader2, Paperclip } from "lucide-react";
import { resolveDocumentContentType } from "@/lib/upload-metadata";
import { toast } from "sonner";

interface AttachReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: any;
}

export const AttachReceiptDialog = ({ open, onOpenChange, expense }: AttachReceiptDialogProps) => {
  const { attachReceiptToExpense } = useStore();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const selectedFile = e.target.files[0];
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

    // Resolve por tipo declarado E por extensão: file.type vem vazio em
    // alguns sistemas, o que rejeitava arquivos válidos aqui.
    const resolvedType = resolveDocumentContentType(selectedFile);

    if (resolvedType && allowedTypes.includes(resolvedType)) {
      setFile(selectedFile);
    } else {
      toast.error("Selecione um PDF ou imagem (JPG, PNG, WebP).");
      e.target.value = "";
    }
  };

  const handleUpload = async () => {
    if (!expense || !file) {
      toast.error("Selecione o arquivo para anexar.");
      return;
    }

    setLoading(true);

    try {
      await attachReceiptToExpense(expense.id, file);
      toast.success("O comprovante foi anexado à despesa.");
      onOpenChange(false);
      setFile(null);
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
          <DialogTitle>Anexar Comprovante</DialogTitle>
          <DialogDescription>
            Anexe o comprovante para a despesa: <span className="font-semibold">{expense?.description}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="receipt-file">Arquivo (PDF, JPG, PNG, WebP)</Label>
            <Input
              id="receipt-file"
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
            />
            {file && <p className="text-sm text-muted-foreground">Arquivo selecionado: {file.name}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleUpload} disabled={!file || loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Paperclip className="mr-2 h-4 w-4" />}
            Salvar Anexo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
