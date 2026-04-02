//src/pages/admin/Colaboradores.tsx

import { useMemo, useState } from "react";
import { useStore } from "@/store";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

import { PlusCircle, Phone, Pencil, Trash2 } from "lucide-react";
import { AddCollaboratorDialog } from "@/components/colaboradores/AddCollaboratorDialog";
import { getContactPhone, getWhatsappLink, openWhatsappLink } from "@/lib/contact";

export default function Colaboradores() {
  const { collaborators, clients, deleteCollaborator } = useStore();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCollab, setEditingCollab] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const getClientName = (collab: any) => {
    if (collab.clientName) return collab.clientName;

    const client = clients.find((c: any) => c.id === collab.clientId);
    return client?.razaoSocial || client?.name || "Não encontrado";
  };

  const filtered = useMemo(() => {
    return collaborators.filter((c: any) => {
      if (!search) return true;

      const q = search.toLowerCase();
      const phone = getContactPhone(c);
      const clientName = getClientName(c);

      return (
        c.name?.toLowerCase().includes(q) ||
        c.cpf?.includes(search) ||
        clientName?.toLowerCase().includes(q) ||
        phone?.toLowerCase().includes(q) ||
        c.id?.toLowerCase().includes(q)
      );
    });
  }, [collaborators, clients, search]);

  const handleEdit = (collab: any) => {
    setEditingCollab(collab);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingCollab(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingCollab(null);
    setIsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteCollaborator(deleteId);
      toast({ title: "Colaborador excluído com sucesso!" });
    } catch {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o colaborador.",
        variant: "destructive",
      });
    }

    setDeleteId(null);
  };

  const permissionLabel = (permission: string) => {
    switch (permission) {
      case "admin":
        return "Administrador";
      case "gestor":
        return "Gestor";
      default:
        return "Colaborador";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Colaboradores</CardTitle>
          <CardDescription>Refine sua busca por colaboradores dos clientes.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Buscar por nome, CPF, telefone ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Colaboradores</CardTitle>
            <CardDescription>Gerencie os colaboradores dos seus clientes que utilizam os equipamentos.</CardDescription>
          </div>

          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Colaborador
          </Button>
        </CardHeader>

        <CardContent>
          {filtered.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Cliente Vinculado</TableHead>
                    <TableHead>Permissão</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[120px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filtered.map((collab: any) => {
                    const phone = getContactPhone(collab);
                    const whatsappLink = getWhatsappLink(collab);
                    const clientName = getClientName(collab);

                    return (
                      <TableRow key={collab.id}>
                        <TableCell className="font-medium">{collab.name}</TableCell>
                        <TableCell className="text-muted-foreground">{collab.cpf || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{phone || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{clientName}</TableCell>
                        <TableCell className="text-muted-foreground">{permissionLabel(collab.permission)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={collab.status === "ativo" ? "default" : "secondary"}
                            className={collab.status === "ativo" ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                          >
                            {collab.status || "ativo"}
                          </Badge>
                        </TableCell>
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
                                      onClick={() => whatsappLink && openWhatsappLink(collab)}
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

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => handleEdit(collab)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive/80"
                              onClick={() => setDeleteId(collab.id)}
                            >
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
              Nenhum colaborador para exibir.
            </div>
          )}
        </CardContent>
      </Card>

      <AddCollaboratorDialog open={isDialogOpen} onOpenChange={handleCloseDialog} collaborator={editingCollab} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso excluirá permanentemente o colaborador.
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
