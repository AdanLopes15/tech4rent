//src/pages/admin/Bancos.tsx

import { useMemo, useState } from "react";
import { useStore } from "@/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import AddBankAccountDialog from "@/components/bancos/AddBankAccountDialog";

const Bancos = () => {
  const { bankAccounts, deleteBankAccount } = useStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [editingAccount, setEditingAccount] = useState<any>(null);

  const filtered = useMemo(() => {
    return bankAccounts.filter((account: any) => {
      const bank = String(account.bank || "").toLowerCase();
      const agency = String(account.agency || "").toLowerCase();
      const acc = String(account.account || "").toLowerCase();
      const query = search.toLowerCase();

      return bank.includes(query) || agency.includes(query) || acc.includes(query);
    });
  }, [bankAccounts, search]);

  const handleAddNew = () => {
    setEditingAccount(null);
    setDialogOpen(true);
  };

  const handleEdit = (account: any) => {
    setEditingAccount(account);
    setDialogOpen(true);
  };

  const handleCloseDialog = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingAccount(null);
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
          <Button onClick={handleAddNew}>
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
                        <DropdownMenuItem onClick={() => handleEdit(account)}>
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

      <AddBankAccountDialog open={dialogOpen} onOpenChange={handleCloseDialog} bankAccount={editingAccount} />
    </div>
  );
};

export default Bancos;
