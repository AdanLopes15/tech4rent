import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, ChevronUp, ChevronDown, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Account {
  id: string;
  code: string;
  name: string;
  type: "receita" | "despesa";
  parentId: string | null;
  description: string;
}

const initialAccounts: Account[] = [
  { id: "1", code: "2.", name: "Aluguel de Equipamentos", type: "receita", parentId: null, description: "" },
  { id: "2", code: "2.1", name: "Aluguel Anual", type: "receita", parentId: "1", description: "" },
  { id: "3", code: "1", name: "Vendas de Equipamento", type: "receita", parentId: null, description: "" },
  { id: "4", code: "1.1", name: "Vendas Avista", type: "receita", parentId: "3", description: "" },
  { id: "5", code: "3.", name: "Aporte", type: "receita", parentId: null, description: "" },
  { id: "6", code: "3.1", name: "Aporte Sócio", type: "receita", parentId: "5", description: "" },
  { id: "7", code: "4.", name: "Despesas com Comercial", type: "despesa", parentId: null, description: "" },
  { id: "8", code: "4.1", name: "Comissões Clientes Atual", type: "despesa", parentId: "7", description: "" },
  { id: "9", code: "4.2", name: "Comissões Novos Clientes", type: "despesa", parentId: "7", description: "" },
  { id: "10", code: "3.", name: "Despesas com Viagens", type: "despesa", parentId: null, description: "" },
  { id: "11", code: "3.3", name: "Almoço/Jantar/Lanche", type: "despesa", parentId: "10", description: "" },
  { id: "12", code: "3.1", name: "Hotéis/Pousada", type: "despesa", parentId: "10", description: "" },
  { id: "13", code: "3.4", name: "Locação de Veículos/Estacionamento/Uber", type: "despesa", parentId: "10", description: "" },
  { id: "14", code: "3.2", name: "Combustíveis/Pedágio", type: "despesa", parentId: "10", description: "" },
  { id: "15", code: "1.", name: "Despesas com Pessoal", type: "despesa", parentId: null, description: "" },
  { id: "16", code: "1.7", name: "Encargos", type: "despesa", parentId: "15", description: "" },
  { id: "17", code: "1.2", name: "Férias", type: "despesa", parentId: "15", description: "" },
  { id: "18", code: "1.3", name: "Décimo", type: "despesa", parentId: "15", description: "" },
  { id: "19", code: "1.10", name: "Contratos", type: "despesa", parentId: "15", description: "" },
  { id: "20", code: "1.4", name: "Adiantamento", type: "despesa", parentId: "15", description: "" },
  { id: "21", code: "1.5", name: "Rescisão/Acordo", type: "despesa", parentId: "15", description: "" },
  { id: "22", code: "1.12-", name: "Vestimento/utensílios", type: "despesa", parentId: "15", description: "" },
  { id: "23", code: "1.6", name: "Encargos", type: "despesa", parentId: "15", description: "" },
];

const PlanoContas = () => {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [receitaOpen, setReceitaOpen] = useState(true);
  const [despesaOpen, setDespesaOpen] = useState(true);

  const [newAccount, setNewAccount] = useState({
    code: "",
    name: "",
    type: "receita" as "receita" | "despesa",
    parentId: "" as string,
    description: "",
  });

  const receitaAccounts = accounts.filter((a) => a.type === "receita");
  const despesaAccounts = accounts.filter((a) => a.type === "despesa");

  const parentAccounts = accounts.filter((a) => a.parentId === null && a.type === newAccount.type);

  const handleSave = () => {
    if (!newAccount.code || !newAccount.name) {
      toast.error("Preencha o código e o nome da conta.");
      return;
    }
    const account: Account = {
      id: crypto.randomUUID(),
      code: newAccount.code,
      name: newAccount.name,
      type: newAccount.type,
      parentId: newAccount.parentId || null,
      description: newAccount.description,
    };
    setAccounts((prev) => [...prev, account]);
    setDialogOpen(false);
    setNewAccount({ code: "", name: "", type: "receita", parentId: "", description: "" });
    toast.success("Conta cadastrada com sucesso!");
  };

  const handleDelete = (id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id && a.parentId !== id));
    toast.success("Conta removida com sucesso!");
  };

  const renderAccountRows = (accs: Account[]) => {
    const parents = accs.filter((a) => a.parentId === null);
    const rows: React.ReactNode[] = [];

    parents.forEach((parent) => {
      const children = accs.filter((a) => a.parentId === parent.id);
      rows.push(
        <TableRow key={parent.id} className="bg-muted/30">
          <TableCell className="font-bold text-foreground">{parent.code}</TableCell>
          <TableCell className="font-bold text-foreground">{parent.name}</TableCell>
          <TableCell className="text-muted-foreground">{parent.description}</TableCell>
          <TableCell className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(parent.id)}>
                  <Trash2 className="mr-2 h-4 w-4" />Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      );
      children.forEach((child) => {
        rows.push(
          <TableRow key={child.id}>
            <TableCell className="pl-10 text-muted-foreground">{child.code}</TableCell>
            <TableCell className="font-semibold text-foreground">{child.name}</TableCell>
            <TableCell className="text-muted-foreground">{child.description}</TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(child.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        );
      });
    });

    return rows;
  };

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Plano de Contas</CardTitle>
            <CardDescription>Gerencie as contas contábeis da sua empresa.</CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nova Conta
          </Button>
        </CardHeader>
      </Card>

      {/* Contas de Receita */}
      <div className="rounded-lg border border-green-800 overflow-hidden">
        <button
          onClick={() => setReceitaOpen(!receitaOpen)}
          className="flex w-full items-center justify-between bg-green-900/60 px-4 py-3 text-sm font-semibold text-green-300"
        >
          <span>Contas de Receita</span>
          <span className="flex items-center gap-2 text-xs text-green-400">
            Clique para expandir/recolher
            {receitaOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </button>
        {receitaOpen && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Código</TableHead>
                <TableHead>Nome da Conta</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right w-[80px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{renderAccountRows(receitaAccounts)}</TableBody>
          </Table>
        )}
      </div>

      {/* Contas de Despesa */}
      <div className="rounded-lg border border-red-800 overflow-hidden">
        <button
          onClick={() => setDespesaOpen(!despesaOpen)}
          className="flex w-full items-center justify-between bg-red-900/60 px-4 py-3 text-sm font-semibold text-red-300"
        >
          <span>Contas de Despesa</span>
          <span className="flex items-center gap-2 text-xs text-red-400">
            Clique para expandir/recolher
            {despesaOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </button>
        {despesaOpen && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Código</TableHead>
                <TableHead>Nome da Conta</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right w-[80px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{renderAccountRows(despesaAccounts)}</TableBody>
          </Table>
        )}
      </div>

      {/* Dialog Nova Conta */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cadastrar Nova Conta</DialogTitle>
            <DialogDescription>Preencha os dados da nova conta.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código</Label>
                <Input
                  placeholder="Ex: 1.01.01"
                  value={newAccount.code}
                  onChange={(e) => setNewAccount((p) => ({ ...p, code: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Nome da Conta</Label>
                <Input
                  placeholder="Ex: Receita de Locação"
                  value={newAccount.name}
                  onChange={(e) => setNewAccount((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo da Conta</Label>
                <Select
                  value={newAccount.type}
                  onValueChange={(v) => setNewAccount((p) => ({ ...p, type: v as "receita" | "despesa", parentId: "" }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Conta Mãe (Opcional)</Label>
                <div className="flex gap-2">
                  <Select
                    value={newAccount.parentId}
                    onValueChange={(v) => setNewAccount((p) => ({ ...p, parentId: v }))}
                  >
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Nenhuma (Conta..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma (Conta Pai)</SelectItem>
                      {parentAccounts.map((pa) => (
                        <SelectItem key={pa.id} value={pa.id}>
                          {pa.code} - {pa.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" className="shrink-0">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Uma breve descrição sobre esta conta contábil"
                value={newAccount.description}
                onChange={(e) => setNewAccount((p) => ({ ...p, description: e.target.value }))}
                rows={3}
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

export default PlanoContas;
