import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface CostCenter {
  id: string;
  name: string;
  description: string;
}

const initialCenters: CostCenter[] = [
  { id: "1", name: "Banco", description: "" },
  { id: "2", name: "Faturamento com Vendas", description: "" },
  { id: "3", name: "Aporte Adan", description: "" },
  { id: "4", name: "Faturamento com Aluguel", description: "" },
  { id: "5", name: "Despesas com Equipamento", description: "" },
  { id: "6", name: "Aporte Gustavo", description: "" },
];

const CentroCusto = () => {
  const [centers, setCenters] = useState<CostCenter[]>(initialCenters);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [newCenter, setNewCenter] = useState({ name: "", description: "" });

  const filtered = centers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = () => {
    if (!newCenter.name) {
      toast.error("Preencha o nome do centro de custo.");
      return;
    }
    setCenters((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: newCenter.name, description: newCenter.description },
    ]);
    setDialogOpen(false);
    setNewCenter({ name: "", description: "" });
    toast.success("Centro de custo cadastrado com sucesso!");
  };

  const handleDelete = (id: string) => {
    setCenters((prev) => prev.filter((c) => c.id !== id));
    toast.success("Centro de custo removido com sucesso!");
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
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

      {/* Tabela */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Centros de Custo</CardTitle>
            <CardDescription>Gerencie os centros de custo para organizar suas finanças.</CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Novo Centro de Custo
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
              {filtered.map((center) => (
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
                        <DropdownMenuItem><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(center.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />Excluir
                        </DropdownMenuItem>
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

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Centro de Custo</DialogTitle>
            <DialogDescription>Preencha os dados para cadastrar um novo centro de custo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                placeholder="Ex: Despesas Administrativas"
                value={newCenter.name}
                onChange={(e) => setNewCenter((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Detalhes sobre o centro de custo..."
                value={newCenter.description}
                onChange={(e) => setNewCenter((p) => ({ ...p, description: e.target.value }))}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CentroCusto;
