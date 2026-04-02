//src/pages/admin/Clientes.tsx

import { useMemo, useState } from "react";
import { useStore } from "@/store";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/alert-dialog";

import { PlusCircle, Phone, Mail, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { AddClientDialog } from "@/components/clientes/AddClientDialog";
import { getContactPhone, getWhatsappLink, openWhatsappLink } from "@/lib/contact";

export default function Clientes() {
  const { clients, deleteClient } = useStore();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  const filtered = useMemo(() => {
    return clients.filter((client: any) => {
      const displayName = client.razaoSocial || client.name || "";
      const contactName = client.contato || client.contactPerson || "";
      const phone = getContactPhone(client);
      const email = client.email || "";
      const document = client.personType === "juridica" ? client.cnpj || "" : client.cpf || "";

      const term = search.trim().toLowerCase();

      const matchesSearch =
        !term ||
        displayName.toLowerCase().includes(term) ||
        contactName.toLowerCase().includes(term) ||
        email.toLowerCase().includes(term) ||
        document.toLowerCase().includes(term) ||
        phone.toLowerCase().includes(term) ||
        (client.id || "").toLowerCase().includes(term);

      const clientStatus = client.status || "ativo";
      const matchesStatus = statusFilter === "todos" || clientStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [clients, search, statusFilter]);

  const handleEdit = (client: any) => {
    setEditingClient(client);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingClient(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingClient(null);
    setIsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteClient(deleteId);
      toast({ title: "Cliente excluído com sucesso!" });
    } catch {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o cliente.",
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
          <CardTitle>Filtros de Clientes</CardTitle>
          <CardDescription>Refine sua busca por clientes.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-4">
            <Input
              placeholder="Buscar por nome, contato, email, documento ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Clientes</CardTitle>
            <CardDescription>Gerencie seus clientes e contatos.</CardDescription>
          </div>

          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Cliente
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
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[120px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filtered.map((client: any) => {
                    const displayName = client.razaoSocial || client.name || "—";
                    const phone = getContactPhone(client);
                    const whatsappLink = getWhatsappLink(client);
                    const status = client.status || "ativo";

                    return (
                      <TableRow key={client.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{client.id}</TableCell>

                        <TableCell className="font-medium">{displayName}</TableCell>

                        <TableCell className="text-muted-foreground">{client.email || "—"}</TableCell>

                        <TableCell className="text-muted-foreground">{phone || "—"}</TableCell>

                        <TableCell>
                          <Badge
                            variant={status === "ativo" ? "default" : "secondary"}
                            className={status === "ativo" ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                          >
                            {status}
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
                                      onClick={() => whatsappLink && openWhatsappLink(client)}
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
                                  <span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className={`h-8 w-8 ${
                                        client.email
                                          ? "text-blue-400 hover:text-blue-300"
                                          : "text-muted-foreground/40 cursor-not-allowed"
                                      }`}
                                      disabled={!client.email}
                                      onClick={() => client.email && window.open(`mailto:${client.email}`)}
                                    >
                                      <Mail className="h-4 w-4" />
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {client.email ? "Enviar email" : "Sem email cadastrado"}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>

                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(client)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>

                                <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(client.id)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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
              Nenhum cliente encontrado.
            </div>
          )}
        </CardContent>
      </Card>

      <AddClientDialog open={isDialogOpen} onOpenChange={handleCloseDialog} client={editingClient} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso excluirá permanentemente o cliente.
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
