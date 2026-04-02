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
import { toast } from "sonner";

interface AttachBoletoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revenue?: any;
}

export const AttachBoletoDialog = ({ open, onOpenChange, revenue }: AttachBoletoDialogProps) => {
  const { attachBoletoToRevenue } = useStore();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const selectedFile = e.target.files[0];
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

    if (allowedTypes.includes(selectedFile.type)) {
      setFile(selectedFile);
    } else {
      toast.error("Selecione um PDF ou imagem (JPG, PNG, WebP).");
      e.target.value = "";
    }
  };

  const handleUpload = async () => {
    if (!revenue || !file) {
      toast.error("Selecione o arquivo para anexar.");
      return;
    }

    setLoading(true);

    try {
      await attachBoletoToRevenue(revenue.id, file);
      toast.success("O boleto foi anexado à parcela.");
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
          <DialogTitle>Anexar Boleto</DialogTitle>
          <DialogDescription>
            Anexe o boleto para a parcela: <span className="font-semibold">{revenue?.description || "Parcela"}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="boleto-file">Arquivo (PDF, JPG, PNG, WebP)</Label>
            <Input
              id="boleto-file"
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
