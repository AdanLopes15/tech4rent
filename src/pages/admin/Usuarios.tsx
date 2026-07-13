//src/pages/admin/Usuarios.tsx

import { useMemo, useState } from "react";
import { useStore } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AddUserDialog from "@/components/admin/AddUserDialog";
import { PROFILE_LABELS, type ProfileKey } from "@/lib/permissions";
import { toast } from "sonner";
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

const Usuarios = () => {
  const { systemUsers, deleteSystemUser } = useStore();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const filtered = useMemo(() => {
    return systemUsers.filter((u: any) => {
      const name = String(u.name || "").toLowerCase();
      const email = String(u.email || "").toLowerCase();
      const query = search.toLowerCase();

      return name.includes(query) || email.includes(query);
    });
  }, [systemUsers, search]);

  const handleAdd = () => {
    setEditingUser(null);
    setDialogOpen(true);
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setDialogOpen(true);
  };

  const handleDelete = async (uid: string) => {
    try {
      await deleteSystemUser(uid);
      toast.success("Usuário removido!");
    } catch {
      toast.error("Erro ao remover usuário");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuários</h1>
          <p className="text-muted-foreground">Gerencie os usuários do sistema.</p>
        </div>

        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Permissão</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.map((user: any) => (
                <TableRow key={user.uid}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>

                  <TableCell>
                    <Badge variant="outline">{user.permission}</Badge>
                  </TableCell>

                  <TableCell>
                    <Badge variant={user.status === "ativo" ? "default" : "secondary"}>{user.status}</Badge>
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(user)}>
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
                              <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
                              <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
                            </AlertDialogHeader>

                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(user.uid)}>Confirmar</AlertDialogAction>
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
                  <TableCell colSpan={5} className="text-center py-6">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddUserDialog open={dialogOpen} onOpenChange={setDialogOpen} user={editingUser} />
    </div>
  );
};

export default Usuarios;
