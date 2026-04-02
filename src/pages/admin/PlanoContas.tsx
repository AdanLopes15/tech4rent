//src/pages/admin/PlanoContas.tsx

import React, { useEffect, useState } from "react";
import { PlusCircle, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import { useStore } from "@/store";
import { AddAccountDialog } from "@/components/plano-de-contas/AddAccountDialog";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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

const PlanoContas = () => {
  const { chartOfAccounts, deleteChartOfAccount, fetchAllData } = useStore();

  const [isAddAccountDialogOpen, setIsAddAccountDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);

  useEffect(() => {
    fetchAllData?.();
  }, [fetchAllData]);

  const handleEdit = (account: any) => {
    setEditingAccount(account);
    setIsAddAccountDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingAccount(null);
    setIsAddAccountDialogOpen(true);
  };

  const handleCloseDialog = (open: boolean) => {
    if (!open) {
      setEditingAccount(null);
    }
    setIsAddAccountDialogOpen(open);
  };

  const handleDelete = async (accountId: string) => {
    try {
      await deleteChartOfAccount(accountId);
      toast.success("Conta excluída com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir conta:", error);
      toast.error("Não foi possível excluir a conta.");
    }
  };

  const AccountActions = ({ account }: { account: any }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir menu</span>
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
            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Essa ação não pode ser desfeita. Isso excluirá permanentemente a conta.
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
  );

  const renderRows = (type: "receita" | "despesa") => {
    const parentAccounts = chartOfAccounts.filter((account: any) => account.type === type && !account.parentAccountId);

    if (parentAccounts.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={4} className="h-24 text-center">
            Nenhuma conta de {type === "receita" ? "receita" : "despesa"} para exibir.
          </TableCell>
        </TableRow>
      );
    }

    return parentAccounts.map((account: any) => (
      <React.Fragment key={account.id}>
        <TableRow className="bg-muted/50 font-semibold">
          <TableCell>{account.code}</TableCell>
          <TableCell>{account.name}</TableCell>
          <TableCell>{account.description}</TableCell>
          <TableCell className="text-right">
            <AccountActions account={account} />
          </TableCell>
        </TableRow>

        {chartOfAccounts
          .filter((subAccount: any) => subAccount.parentAccountId === account.id)
          .map((subAccount: any) => (
            <TableRow key={subAccount.id}>
              <TableCell className="pl-8">{subAccount.code}</TableCell>
              <TableCell>{subAccount.name}</TableCell>
              <TableCell>{subAccount.description}</TableCell>
              <TableCell className="text-right">
                <AccountActions account={subAccount} />
              </TableCell>
            </TableRow>
          ))}
      </React.Fragment>
    ));
  };

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Plano de Contas</CardTitle>
              <CardDescription>Gerencie as contas contábeis da sua empresa.</CardDescription>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddNew}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nova Conta
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Accordion type="multiple" defaultValue={["receitas", "despesas"]} className="w-full space-y-4">
        <AccordionItem value="receitas" className="border-none">
          <Card className="overflow-hidden">
            <AccordionTrigger className="p-0 hover:no-underline">
              <div className="flex items-center justify-between w-full p-4 bg-green-100 dark:bg-green-900/50">
                <h3 className="font-semibold text-green-800 dark:text-green-200">Contas de Receita</h3>
                <p className="text-sm text-muted-foreground">Clique para expandir/recolher</p>
              </div>
            </AccordionTrigger>

            <AccordionContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Código</TableHead>
                    <TableHead>Nome da Conta</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>{renderRows("receita")}</TableBody>
              </Table>
            </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="despesas" className="border-none">
          <Card className="overflow-hidden">
            <AccordionTrigger className="p-0 hover:no-underline">
              <div className="flex items-center justify-between w-full p-4 bg-red-100 dark:bg-red-900/50">
                <h3 className="font-semibold text-red-800 dark:text-red-200">Contas de Despesa</h3>
                <p className="text-sm text-muted-foreground">Clique para expandir/recolher</p>
              </div>
            </AccordionTrigger>

            <AccordionContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Código</TableHead>
                    <TableHead>Nome da Conta</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>{renderRows("despesa")}</TableBody>
              </Table>
            </AccordionContent>
          </Card>
        </AccordionItem>
      </Accordion>

      <AddAccountDialog open={isAddAccountDialogOpen} onOpenChange={handleCloseDialog} account={editingAccount} />
    </div>
  );
};

export default PlanoContas;
