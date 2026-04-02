//src/pages/admin/CentroCusto.tsx

import { useMemo, useState } from "react";
import { useStore } from "@/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface CostCenterForm {
  name: string;
  description: string;
}

const emptyForm: CostCenterForm = {
  name: "",
  description: "",
};

const CentroCusto = () => {
  const { costCenters, addCostCenter, updateCostCenter, deleteCostCenter } = useStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<CostCenterForm>(emptyForm);
  const [editingCenter, setEditingCenter] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const filtered = useMemo(() => {
    return costCenters.filter((c: any) => {
      const name = String(c.name || "").toLowerCase();
      const description = String(c.description || "").toLowerCase();
      const query = search.toLowerCase();

      return name.includes(query) || description.includes(query);
    });
  }, [costCenters, search]);

  const openNewDialog = () => {
    setEditingCenter(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (center: any) => {
    setEditingCenter(center);
    setForm({
      name: center.name || "",
      description: center.description || "",
    });
    setDialogOpen(true);
  };

  const closeDialog = (open: boolean) => {
    setDialogOpen(open);

    if (!open) {
      setEditingCenter(null);
      setForm(emptyForm);
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Preencha o nome do centro de custo.");
      return;
    }

    try {
      setIsSaving(true);

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
      };

      if (editingCenter) {
        await updateCostCenter({
          id: editingCenter.id,
          ...payload,
        });
        toast.success("Centro de custo atualizado com sucesso!");
      } else {
        await addCostCenter(payload);
        toast.success("Centro de custo cadastrado com sucesso!");
      }

      closeDialog(false);
    } catch (error) {
      console.error("Erro ao salvar centro de custo:", error);
      toast.error("Não foi possível salvar o centro de custo.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCostCenter(id);
      toast.success("Centro de custo removido com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir centro de custo:", error);
      toast.error("Não foi possível excluir o centro de custo.");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Refine sua busca por centros de custo.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Buscar por nome ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Centros de Custo</CardTitle>
            <CardDescription>Gerencie os centros de custo para organizar suas finanças.</CardDescription>
          </div>

          <Button onClick={openNewDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Centro de Custo
          </Button>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right w-[80px]">Ações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.map((center: any) => (
                <TableRow key={center.id}>
                  <TableCell className="font-semibold text-foreground">{center.name}</TableCell>

                  <TableCell className="text-muted-foreground">{center.description || "—"}</TableCell>

                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(center)}>
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
                                Essa ação não pode ser desfeita. Isso excluirá permanentemente o centro de custo.
                              </AlertDialogDescription>
                            </AlertDialogHeader>

                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(center.id)}>Continuar</AlertDialogAction>
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
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    Nenhum centro de custo encontrado.
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
            <DialogTitle>{editingCenter ? "Editar Centro de Custo" : "Novo Centro de Custo"}</DialogTitle>
            <DialogDescription>
              {editingCenter
                ? "Atualize os dados do centro de custo."
                : "Preencha os dados para cadastrar um novo centro de custo."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                placeholder="Ex: Despesas Administrativas"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Detalhes sobre o centro de custo..."
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={4}
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

export default CentroCusto;
