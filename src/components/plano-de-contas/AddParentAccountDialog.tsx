//src/components/plano-de-contas/AddParentAccountDialog.tsx

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useStore } from "@/store";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface AddParentAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddParentAccountDialog({ open, onOpenChange }: AddParentAccountDialogProps) {
  const { addChartOfAccount } = useStore();

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<"receita" | "despesa">("receita");
  const [description, setDescription] = useState("");

  const resetForm = () => {
    setCode("");
    setName("");
    setType("receita");
    setDescription("");
  };

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim() || !name.trim()) {
      toast.error("Código e nome da conta são obrigatórios.");
      return;
    }

    try {
      await addChartOfAccount({
        code: code.trim(),
        name: name.trim(),
        type,
        description: description.trim(),
        parentAccountId: "",
      });

      toast.success("Conta mãe cadastrada com sucesso!");
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar conta mãe:", error);
      toast.error("Não foi possível salvar a conta mãe.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Cadastrar Nova Conta Mãe</DialogTitle>
            <DialogDescription>Contas-mãe são contas principais que não dependem de outras.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="codigo-rapido">Código</Label>
                <Input
                  id="codigo-rapido"
                  placeholder="Ex: 1.01"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome-conta-rapido">Nome da Conta</Label>
                <Input
                  id="nome-conta-rapido"
                  placeholder="Ex: Ativos"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo-conta-rapido">Tipo da Conta</Label>
              <Select value={type} onValueChange={(value) => setType(value as "receita" | "despesa")}>
                <SelectTrigger id="tipo-conta-rapido">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="receita">Receita</SelectItem>
                  <SelectItem value="despesa">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao-rapida">Descrição</Label>
              <Textarea
                id="descricao-rapida"
                placeholder="Uma breve descrição sobre esta conta contábil"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar Conta</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
