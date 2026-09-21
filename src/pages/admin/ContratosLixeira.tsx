//src/pages/admin/ContratosLixeira.tsx
// Lixeira de contratos: lista contratos excluídos logicamente e permite
// restaurá-los. Acesso restrito à permissão contratos.restore.

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, ArrowLeft, Loader2, RotateCcw } from "lucide-react";

import { useStore } from "@/store";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { describeConflict, type StockConflict } from "@/lib/contract-trash";
import { ContractRestoreConflictError } from "@/store/methods/contractTrash";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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

const formatDateTime = (value: any) => {
  if (!value) return "—";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "—" : format(d, "dd/MM/yyyy HH:mm", { locale: ptBR });
};

export default function ContratosLixeira() {
  const { deletedContracts, trashedRevenues, clients, equipments, restoreContract } = useStore();
  const { toast } = useToast();

  const [toRestore, setToRestore] = useState<any>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<{ contractId: string; items: StockConflict[] } | null>(null);

  const rows = useMemo(
    () =>
      [...deletedContracts].sort(
        (a: any, b: any) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime(),
      ),
    [deletedContracts],
  );

  const clientName = (contract: any) => {
    const client = clients.find((c: any) => c.id === contract.clientId);
    return client?.razaoSocial || client?.name || contract.client?.razaoSocial || contract.clientId || "N/A";
  };

  const equipmentName = (id: string) => equipments.find((e: any) => e.id === id)?.name || id;

  const installments = (contractId: string) => {
    const list = trashedRevenues.filter((r: any) => r.contractId === contractId);
    return { total: list.length, paid: list.filter((r: any) => r.status === "recebido").length };
  };

  const handleRestore = async () => {
    const contract = toRestore;
    setToRestore(null);
    if (!contract) return;

    setRestoringId(contract.id);
    try {
      await restoreContract(contract.id);
      setConflicts(null);
      toast({ title: `Contrato ${contract.id} restaurado`, description: "Ele voltou para a lista de contratos." });
    } catch (error: any) {
      if (error instanceof ContractRestoreConflictError) {
        setConflicts({ contractId: contract.id, items: error.conflicts });
        toast({
          title: "Restauração bloqueada por falta de estoque",
          description: "Nenhum dado foi alterado. Veja os detalhes acima da tabela.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao restaurar",
          description: error?.message || "Não foi possível restaurar o contrato.",
          variant: "destructive",
        });
      }
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/contratos">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Contratos
          </Link>
        </Button>
      </div>

      {conflicts && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Não foi possível restaurar {conflicts.contractId}</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              Os equipamentos abaixo não têm estoque suficiente. O contrato continua na Lixeira e nenhum item foi
              descontado.
            </p>
            <ul className="list-disc pl-5">
              {conflicts.items.map((c) => (
                <li key={c.equipmentId}>
                  <span className="font-mono">{c.equipmentId}</span> — {describeConflict(c)}
                </li>
              ))}
            </ul>
            <p>
              Ajuste o estoque em <Link className="underline" to="/admin/equipamentos">Equipamentos</Link> ou finalize
              o contrato que está usando esses itens e tente novamente.
            </p>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lixeira de Contratos</CardTitle>
          <CardDescription>
            Contratos excluídos não aparecem nas listagens, no financeiro nem nos relatórios. Parcelas, anexos e
            histórico foram preservados e voltam junto com o contrato na restauração.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contrato</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Excluído em</TableHead>
                <TableHead>Excluído por</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Parcelas</TableHead>
                <TableHead>Estoque devolvido</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.length > 0 ? (
                rows.map((contract: any) => {
                  const inst = installments(contract.id);
                  const stock: any[] = Array.isArray(contract.stockReturned) ? contract.stockReturned : [];
                  return (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium text-primary">
                        {contract.id}
                        <div className="text-xs text-muted-foreground">{formatCurrency(contract.totalValue || 0)}</div>
                      </TableCell>
                      <TableCell>{clientName(contract)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{contract.status || "Em Andamento"}</Badge>
                      </TableCell>
                      <TableCell>{formatDateTime(contract.deletedAt)}</TableCell>
                      <TableCell>{contract.deletedBy?.name || contract.deletedBy?.email || "—"}</TableCell>
                      <TableCell className="max-w-[240px] whitespace-pre-wrap text-sm">
                        {contract.deletionReason || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {inst.paid}/{inst.total}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {stock.length
                          ? stock.map((s) => `${equipmentName(s.equipmentId)} (${s.quantity})`).join(", ")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={restoringId !== null}
                          onClick={() => setToRestore(contract)}
                        >
                          {restoringId === contract.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <RotateCcw className="mr-2 h-4 w-4" />
                          )}
                          Restaurar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-20 text-center text-muted-foreground">
                    A Lixeira está vazia.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!toRestore} onOpenChange={(open) => !open && setToRestore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar o contrato {toRestore?.id}?</AlertDialogTitle>
            <AlertDialogDescription>
              O contrato e suas parcelas voltarão a aparecer normalmente.
              {Array.isArray(toRestore?.stockReturned) && toRestore.stockReturned.length > 0
                ? " Os equipamentos devolvidos na exclusão serão descontados do estoque novamente; se algum não estiver disponível, nada será alterado."
                : " Nenhum estoque será alterado."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore}>Restaurar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
