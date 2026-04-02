//src/components/plano-de-contas/AddParentAccountDialog.tsx

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
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
import { AddParentAccountDialog } from "@/components/plano-de-contas/AddParentAccountDialog";

interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: any;
}

export function AddAccountDialog({ open, onOpenChange, account }: AddAccountDialogProps) {
  const { addChartOfAccount, updateChartOfAccount, chartOfAccounts } = useStore();

  const [isParentAccountDialogOpen, setIsParentAccountDialogOpen] = useState(false);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<"receita" | "despesa">("receita");
  const [parentAccountId, setParentAccountId] = useState("");
  const [description, setDescription] = useState("");

  const resetForm = () => {
    setCode("");
    setName("");
    setType("receita");
    setParentAccountId("");
    setDescription("");
  };

  useEffect(() => {
    if (account && open) {
      setCode(account.code || "");
      setName(account.name || "");
      setType(account.type || "receita");
      setParentAccountId(account.parentAccountId || "");
      setDescription(account.description || "");
    } else if (open) {
      resetForm();
    }
  }, [account, open]);

  const parentAccounts = useMemo(() => {
    return chartOfAccounts.filter((acc: any) => !acc.parentAccountId && acc.type === type);
  }, [chartOfAccounts, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim() || !name.trim()) {
      toast.error("Código e nome da conta são obrigatórios.");
      return;
    }

    const accountData = {
      code: code.trim(),
      name: name.trim(),
      type,
      parentAccountId,
      description: description.trim(),
    };

    try {
      if (account) {
        await updateChartOfAccount({
          id: account.id,
          ...accountData,
        });
        toast.success("Conta atualizada com sucesso!");
      } else {
        await addChartOfAccount(accountData);
        toast.success("Conta cadastrada com sucesso!");
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar conta:", error);
      toast.error("Não foi possível salvar a conta.");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {account ? "Editar Conta" : "Cadastrar Nova Conta"}
              </DialogTitle>
              <DialogDescription>Preencha os dados da nova conta.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código</Label>
                  <Input
                    id="codigo"
                    placeholder="Ex: 1.01.01"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nome-conta">Nome da Conta</Label>
                  <Input
                    id="nome-conta"
                    placeholder="Ex: Receita de Locação"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tipo-conta">Tipo da Conta</Label>
                  <Select
                    value={type}
                    onValueChange={(newType) => {
                      setType(newType as "receita" | "despesa");
                      setParentAccountId("");
                    }}
                  >
                    <SelectTrigger id="tipo-conta">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receita">Receita</SelectItem>
                      <SelectItem value="despesa">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="conta-mae">Conta Mãe (Opcional)</Label>
                  <div className="flex items-center gap-2">
                    <Select value={parentAccountId} onValueChange={setParentAccountId}>
                      <SelectTrigger id="conta-mae">
                        <SelectValue placeholder="Nenhuma (Conta Principal)" />
                      </SelectTrigger>
                      <SelectContent>
                        {parentAccounts.map((parent: any) => (
                          <SelectItem key={parent.id} value={parent.id}>
                            {parent.code} - {parent.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      size="icon"
                      variant="outline"
                      className="flex-shrink-0"
                      type="button"
                      onClick={() => setIsParentAccountDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                      <span className="sr-only">Adicionar nova conta mãe</span>
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
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
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AddParentAccountDialog open={isParentAccountDialogOpen} onOpenChange={setIsParentAccountDialogOpen} />
    </>
  );
}
