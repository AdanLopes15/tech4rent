//src/pages/admin/Fornecedores.tsx

import { useMemo, useState } from "react";
import { useStore } from "@/store";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { PlusCircle, Phone, Pencil, Trash2, Eye } from "lucide-react";
import { AddSupplierDialog } from "@/components/fornecedores/AddSupplierDialog";
import { getContactPhone, getWhatsappLink, openWhatsappLink } from "@/lib/contact";

export default function Fornecedores() {
  const { suppliers, deleteSupplier } = useStore();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [viewingSupplier, setViewingSupplier] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return suppliers.filter((supplier: any) => {
      const displayName = supplier.razaoSocial || supplier.name || "";
      const contactName = supplier.contato || supplier.contactPerson || "";
      const phone = getContactPhone(supplier);
      const email = supplier.email || "";
      const document = supplier.personType === "juridica" ? supplier.cnpj || "" : supplier.cpf || "";
      const term = search.trim().toLowerCase();

      if (!term) return true;

      return (
        displayName.toLowerCase().includes(term) ||
        contactName.toLowerCase().includes(term) ||
        email.toLowerCase().includes(term) ||
        document.toLowerCase().includes(term) ||
        phone.toLowerCase().includes(term) ||
        (supplier.id || "").toLowerCase().includes(term)
      );
    });
  }, [suppliers, search]);

  const handleEdit = (supplier: any) => {
    setEditingSupplier(supplier);
    setIsDialogOpen(true);
  };

  const handleView = (supplier: any) => {
    setViewingSupplier(supplier);
    setIsViewDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingSupplier(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingSupplier(null);
    setIsDialogOpen(false);
  };

  const handleCloseViewDialog = () => {
    setViewingSupplier(null);
    setIsViewDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteSupplier(deleteId);
      toast({ title: "Fornecedor excluído com sucesso!" });
    } catch {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o fornecedor.",
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Fornecedores</CardTitle>
          <CardDescription>Refine sua busca por fornecedores.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Buscar por nome, contato, email, documento ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Fornecedores</CardTitle>
            <CardDescription>Gerencie seus fornecedores e contatos.</CardDescription>
          </div>

          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Fornecedor
          </Button>
        </CardHeader>

        <CardContent>
          {filtered.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead className="w-[180px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filtered.map((supplier: any) => {
                    const displayName = supplier.razaoSocial || supplier.name || "—";
                    const phone = getContactPhone(supplier);
                    const whatsappLink = getWhatsappLink(supplier);

                    return (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{supplier.id}</TableCell>

                        <TableCell className="font-medium">{displayName}</TableCell>

                        <TableCell className="text-muted-foreground">{supplier.email || "—"}</TableCell>

                        <TableCell className="text-muted-foreground">{phone || "—"}</TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <TooltipProvider delayDuration={300}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className={`h-8 w-8 ${
                                        whatsappLink
                                          ? "text-green-500 hover:text-green-400"
                                          : "text-muted-foreground/40 cursor-not-allowed"
                                      }`}
                                      disabled={!whatsappLink}
                                      onClick={() => whatsappLink && openWhatsappLink(supplier)}
                                    >
                                      <Phone className="h-4 w-4" />
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {whatsappLink ? "Abrir WhatsApp" : "Sem telefone cadastrado"}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider delayDuration={300}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                    onClick={() => handleView(supplier)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Visualizar</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider delayDuration={300}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                    onClick={() => handleEdit(supplier)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Editar</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider delayDuration={300}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive/80"
                                    onClick={() => setDeleteId(supplier.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Excluir</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              Nenhum fornecedor encontrado.
            </div>
          )}
        </CardContent>
      </Card>

      <AddSupplierDialog open={isDialogOpen} onOpenChange={handleCloseDialog} supplier={editingSupplier} />

      <AddSupplierDialog
        open={isViewDialogOpen}
        onOpenChange={handleCloseViewDialog}
        supplier={viewingSupplier}
        viewOnly
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso excluirá permanentemente o fornecedor.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
