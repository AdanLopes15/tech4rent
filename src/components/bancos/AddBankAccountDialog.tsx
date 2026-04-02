//src/components/bancos/AddBankAccountDialog.tsx

import { useEffect, useState } from "react";
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
import { useStore } from "@/store";
import { toast } from "sonner";

type BankStatus = "ativo" | "inativo";

interface AddBankAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bankAccount?: any;
}

interface BankAccountForm {
  bank: string;
  agency: string;
  account: string;
  initialBalance: string;
  color: string;
  status: BankStatus;
  observations: string;
}

const emptyForm: BankAccountForm = {
  bank: "",
  agency: "",
  account: "",
  initialBalance: "0",
  color: "#4A90E2",
  status: "ativo",
  observations: "",
};

const AddBankAccountDialog = ({ open, onOpenChange, bankAccount }: AddBankAccountDialogProps) => {
  const { addBankAccount, updateBankAccount } = useStore();
  const [form, setForm] = useState<BankAccountForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (bankAccount && open) {
      setForm({
        bank: bankAccount.bank || "",
        agency: bankAccount.agency || "",
        account: bankAccount.account || "",
        initialBalance: String(bankAccount.initialBalance ?? 0),
        color: bankAccount.color || "#4A90E2",
        status: (bankAccount.status || "ativo") as BankStatus,
        observations: bankAccount.observations || "",
      });
    } else if (open) {
      setForm(emptyForm);
    }
  }, [bankAccount, open]);

  const handleClose = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setForm(emptyForm);
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.bank.trim() || !form.agency.trim() || !form.account.trim()) {
      toast.error("Preencha banco, agência e conta.");
      return;
    }

    const payload = {
      name: form.bank.trim(),
      bank: form.bank.trim(),
      agency: form.agency.trim(),
      account: form.account.trim(),
      initialBalance: Number(String(form.initialBalance).replace(",", ".")) || 0,
      color: form.color,
      status: form.status,
      observations: form.observations.trim(),
    };

    try {
      setIsSaving(true);

      if (bankAccount) {
        await updateBankAccount({
          id: bankAccount.id,
          ...payload,
        });
        toast.success("Conta bancária atualizada com sucesso!");
      } else {
        await addBankAccount(payload);
        toast.success("Conta bancária cadastrada com sucesso!");
      }

      handleClose(false);
    } catch (error) {
      console.error("Erro ao salvar conta bancária:", error);
      toast.error("Não foi possível salvar a conta bancária.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {bankAccount ? "Editar Conta" : "Cadastrar Nova Conta"}
            </DialogTitle>
            <DialogDescription>
              {bankAccount ? "Atualize os dados da conta bancária." : "Preencha os dados da nova conta bancária."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="bank">Banco</Label>
              <Input
                id="bank"
                placeholder="Ex: Banco do Brasil"
                value={form.bank}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    bank: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="agency">Agência (sem dígito)</Label>
                <Input
                  id="agency"
                  placeholder="Ex: 1234"
                  value={form.agency}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      agency: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account">Conta (com dígito)</Label>
                <Input
                  id="account"
                  placeholder="Ex: 56789-0"
                  value={form.account}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      account: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="initialBalance">Saldo Inicial (R$)</Label>
                <Input
                  id="initialBalance"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={form.initialBalance}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      initialBalance: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Cor para Identificação</Label>
                <Input
                  id="color"
                  type="color"
                  value={form.color}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      color: e.target.value,
                    }))
                  }
                  className="h-10 p-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    status: value as BankStatus,
                  }))
                }
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativa</SelectItem>
                  <SelectItem value="inativo">Inativa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observations">Observações</Label>
              <Textarea
                id="observations"
                placeholder="Informações adicionais sobre a conta"
                value={form.observations}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    observations: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => handleClose(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddBankAccountDialog;
