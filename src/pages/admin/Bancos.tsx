//src/pages/admin/Bancos.tsx

import { useMemo, useState } from "react";
import { useStore } from "@/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

type BankStatus = "ativo" | "inativo";

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
  color: "#6b9eff",
  status: "ativo",
  observations: "",
};

const Bancos = () => {
  const { bankAccounts, addBankAccount, updateBankAccount, deleteBankAccount } = useStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<BankAccountForm>(emptyForm);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const filtered = useMemo(() => {
    return bankAccounts.filter((account: any) => {
      const bank = String(account.bank || "").toLowerCase();
      const agency = String(account.agency || "").toLowerCase();
      const acc = String(account.account || "").toLowerCase();
      const query = search.toLowerCase();

      return bank.includes(query) || agency.includes(query) || acc.includes(query);
    });
  }, [bankAccounts, search]);

  const openNewDialog = () => {
    setEditingAccount(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (account: any) => {
    setEditingAccount(account);
    setForm({
      bank: account.bank || "",
      agency: account.agency || "",
      account: account.account || "",
      initialBalance: String(account.initialBalance ?? 0),
      color: account.color || "#6b9eff",
      status: (account.status || "ativo") as BankStatus,
      observations: account.observations || "",
    });
    setDialogOpen(true);
  };

  const closeDialog = (open: boolean) => {
    setDialogOpen(open);

    if (!open) {
      setEditingAccount(null);
      setForm(emptyForm);
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!form.bank.trim() || !form.agency.trim() || !form.account.trim()) {
      toast.error("Preencha banco, agência e conta.");
      return;
    }

    const parsedBalance = Number(String(form.initialBalance).replace(",", ".")) || 0;

    const payload = {
      name: form.bank.trim(),
      bank: form.bank.trim(),
      agency: form.agency.trim(),
      account: form.account.trim(),
      initialBalance: parsedBalance,
      color: form.color,
      status: form.status,
      observations: form.observations.trim(),
    };

    try {
      setIsSaving(true);

      if (editingAccount) {
        await updateBankAccount({
          id: editingAccount.id,
          ...payload,
        });
        toast.success("Conta bancária atualizada com sucesso!");
      } else {
        await addBankAccount(payload);
        toast.success("Conta bancária cadastrada com sucesso!");
      }

      closeDialog(false);
    } catch (error) {
      console.error("Erro ao salvar conta bancária:", error);
      toast.error("Não foi possível salvar a conta bancária.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBankAccount(id);
      toast.success("Conta bancária removida com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir conta bancária:", error);
      toast.error("Não foi possível excluir a conta bancária.");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Refine sua busca por contas bancárias.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Buscar por banco, agência ou conta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Contas Bancárias</CardTitle>
            <CardDescription>Gerencie as contas bancárias da sua empresa.</CardDescription>
          </div>

          <Button onClick={openNewDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Conta
          </Button>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Cor</TableHead>
                <TableHead>Banco</TableHead>
                <TableHead>Agência</TableHead>
                <TableHead>Conta</TableHead>
                <TableHead>Saldo Inicial</TableHead>
                <TableHead className="text-right w-[80px]">Ações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.map((account: any) => (
                <TableRow key={account.id}>
                  <TableCell>
                    <div className="h-5 w-5 rounded-full" style={{ backgroundColor: account.color || "#6b9eff" }} />
                  </TableCell>

                  <TableCell className="font-semibold text-foreground">{account.bank}</TableCell>

                  <TableCell className="text-muted-foreground">{account.agency}</TableCell>

                  <TableCell className="text-muted-foreground">{account.account}</TableCell>

                  <TableCell className="text-muted-foreground">{formatCurrency(account.initialBalance)}</TableCell>

                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(account)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </AlertDialogTrigger>

                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Essa ação não pode ser desfeita. Isso excluirá permanentemente a conta bancária.
                              </AlertDialogDescription>
                            </AlertDialogHeader>

                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(account.id)}>Continuar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}

              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhuma conta bancária encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAccount ? "Editar Conta" : "Cadastrar Nova Conta"}</DialogTitle>
            <DialogDescription>
              {editingAccount ? "Atualize os dados da conta bancária." : "Preencha os dados da nova conta bancária."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Banco</Label>
              <Input
                placeholder="Ex: Banco do Brasil"
                value={form.bank}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    bank: e.target.value,
                  }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Agência (sem dígito)</Label>
                <Input
                  placeholder="Ex: 1234"
                  value={form.agency}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      agency: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Conta (com dígito)</Label>
                <Input
                  placeholder="Ex: 56789-0"
                  value={form.account}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      account: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Saldo Inicial (R$)</Label>
                <Input
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
                <Label>Cor para Identificação</Label>
                <Input
                  type="color"
                  value={form.color}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      color: e.target.value,
                    }))
                  }
                  className="h-10 w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    status: value as BankStatus,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativa</SelectItem>
                  <SelectItem value="inativo">Inativa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                placeholder="Informações adicionais sobre a conta"
                value={form.observations}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    observations: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => closeDialog(false)}>
              Cancelar
            </Button>

            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Bancos;
