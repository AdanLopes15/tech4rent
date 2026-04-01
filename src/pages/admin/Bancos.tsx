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
import { Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

interface BankAccount {
  id: string;
  banco: string;
  agencia: string;
  conta: string;
  saldoInicial: number;
  cor: string;
  status: "ativa" | "inativa";
  observacoes: string;
}

const initialAccounts: BankAccount[] = [
  { id: "1", banco: "Banco Sicred Capital", agencia: "0718", conta: "65563-0", saldoInicial: 0, cor: "#22c55e", status: "ativa", observacoes: "" },
  { id: "2", banco: "Banco Sicred", agencia: "0718", conta: "65563-0", saldoInicial: 0, cor: "#22c55e", status: "ativa", observacoes: "" },
];

const Bancos = () => {
  const [accounts, setAccounts] = useState<BankAccount[]>(initialAccounts);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [newAccount, setNewAccount] = useState({
    banco: "", agencia: "", conta: "", saldoInicial: "0,00", cor: "#6b9eff", status: "ativa" as "ativa" | "inativa", observacoes: "",
  });

  const filtered = accounts.filter(
    (a) =>
      a.banco.toLowerCase().includes(search.toLowerCase()) ||
      a.agencia.includes(search) ||
      a.conta.includes(search)
  );

  const handleSave = () => {
    if (!newAccount.banco) {
      toast.error("Preencha o nome do banco.");
      return;
    }
    const saldo = parseFloat(newAccount.saldoInicial.replace(",", ".")) || 0;
    setAccounts((prev) => [
      ...prev,
      { id: crypto.randomUUID(), banco: newAccount.banco, agencia: newAccount.agencia, conta: newAccount.conta, saldoInicial: saldo, cor: newAccount.cor, status: newAccount.status, observacoes: newAccount.observacoes },
    ]);
    setDialogOpen(false);
    setNewAccount({ banco: "", agencia: "", conta: "", saldoInicial: "0,00", cor: "#6b9eff", status: "ativa", observacoes: "" });
    toast.success("Conta bancária cadastrada com sucesso!");
  };

  const handleDelete = (id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    toast.success("Conta bancária removida com sucesso!");
  };

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Refine sua busca por contas bancárias.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input placeholder="Buscar por banco, agência ou conta..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Contas Bancárias</CardTitle>
            <CardDescription>Gerencie as contas bancárias da sua empresa.</CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nova Conta
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
              {filtered.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>
                    <div className="h-5 w-5 rounded-full" style={{ backgroundColor: account.cor }} />
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">{account.banco}</TableCell>
                  <TableCell className="text-muted-foreground">{account.agencia}</TableCell>
                  <TableCell className="text-muted-foreground">{account.conta}</TableCell>
                  <TableCell className="text-muted-foreground">{formatCurrency(account.saldoInicial)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(account.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma conta bancária encontrada.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cadastrar Nova Conta</DialogTitle>
            <DialogDescription>Preencha os dados da nova conta bancária.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Banco</Label>
              <Input placeholder="Ex: Banco do Brasil" value={newAccount.banco} onChange={(e) => setNewAccount((p) => ({ ...p, banco: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Agência (sem dígito)</Label>
                <Input placeholder="Ex: 1234" value={newAccount.agencia} onChange={(e) => setNewAccount((p) => ({ ...p, agencia: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Conta (com dígito)</Label>
                <Input placeholder="Ex: 56789-0" value={newAccount.conta} onChange={(e) => setNewAccount((p) => ({ ...p, conta: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Saldo Inicial (R$)</Label>
                <Input placeholder="0,00" value={newAccount.saldoInicial} onChange={(e) => setNewAccount((p) => ({ ...p, saldoInicial: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Cor para Identificação</Label>
                <Input type="color" value={newAccount.cor} onChange={(e) => setNewAccount((p) => ({ ...p, cor: e.target.value }))} className="h-10 w-full" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={newAccount.status} onValueChange={(v) => setNewAccount((p) => ({ ...p, status: v as "ativa" | "inativa" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativa">Ativa</SelectItem>
                  <SelectItem value="inativa">Inativa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea placeholder="Informações adicionais sobre a conta" value={newAccount.observacoes} onChange={(e) => setNewAccount((p) => ({ ...p, observacoes: e.target.value }))} rows={3} />
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

export default Bancos;
