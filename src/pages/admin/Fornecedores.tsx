import { useState, useMemo } from "react";
import { useStore } from "@/store";
import { useToast } from "@/hooks/use-toast";

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

import { PlusCircle, Phone, Eye, Pencil, Trash2 } from "lucide-react";
import { AddSupplierDialog } from "@/components/fornecedores/AddSupplierDialog";
import { getContactPhone, getWhatsappLink, openWhatsappLink } from "@/lib/contact";

export default function Fornecedores() {
  const { suppliers, deleteSupplier } = useStore();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [, setViewingSupplier] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return suppliers.filter((s: any) => {
      const phone = getContactPhone(s);
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        s.name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.cnpj?.includes(search) ||
        s.cpf?.includes(search) ||
        phone.includes(search) ||
        s.id?.toLowerCase().includes(q)
      );
    });
  }, [suppliers, search]);

  const handleEdit = (supplier: any) => {
    setEditingSupplier(supplier);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingSupplier(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingSupplier(null);
    setIsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteSupplier(deleteId);
      toast({ title: "Fornecedor excluído com sucesso!" });
    } catch {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
    setDeleteId(null);
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
            placeholder="Buscar por nome, email, documento ou telefone..."
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
                    <TableHead className="w-[160px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((supplier: any) => {
                    const phone = getContactPhone(supplier);
                    const whatsappLink = getWhatsappLink(supplier);

                    return (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{supplier.id}</TableCell>
                        <TableCell className="font-medium">{supplier.name}</TableCell>
                        <TableCell className="text-muted-foreground">{supplier.email || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{phone || "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {whatsappLink && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500 hover:text-green-400" asChild>
                                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                                  <Phone className="h-4 w-4" />
                                </a>
                              </Button>
                            )}

                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setViewingSupplier(supplier)}>
                              <Eye className="h-4 w-4" />
                            </Button>

                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleEdit(supplier)}>
                              <Pencil className="h-4 w-4" />
                            </Button>

                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/80" onClick={() => setDeleteId(supplier.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
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

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
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
