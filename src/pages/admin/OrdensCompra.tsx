//src/pages/admin/OrdensCompra.tsx

import { useState, useMemo } from "react";
import { useStore } from "@/store";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

import { PlusCircle, MoreHorizontal, Pencil, Trash2, FileText } from "lucide-react";
import { AddPurchaseOrderDialog } from "@/components/ordens-compra/AddPurchaseOrderDialog";

const statusColors: Record<string, string> = {
  Pendente: "bg-blue-600 hover:bg-blue-700 text-white",
  Concluída: "bg-green-600 hover:bg-green-700 text-white",
  Cancelada: "bg-red-600 hover:bg-red-700 text-white",
};

export default function OrdensCompra() {
  const { purchaseOrders, deletePurchaseOrder } = useStore();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleEdit = (order: any) => {
    setEditingOrder(order);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingOrder(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingOrder(null);
    setIsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deletePurchaseOrder(deleteId);
      toast({ title: "Ordem de compra excluída!" });
    } catch {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
    setDeleteId(null);
  };

  const formatDate = (date: any) => {
    if (!date) return "—";
    try {
      const d = date?.toDate ? date.toDate() : new Date(date);
      return format(d, "dd/MM/yyyy");
    } catch {
      return "—";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Ordens de Compra</CardTitle>
            <CardDescription>Gerencie seus pedidos de compra para fornecedores.</CardDescription>
          </div>
          <Button variant="outline" onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Ordem de Compra
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-primary">Pedido</TableHead>
                <TableHead className="text-primary">Fornecedor</TableHead>
                <TableHead className="text-primary">Data</TableHead>
                <TableHead className="text-primary">Valor Total</TableHead>
                <TableHead className="text-primary">Status</TableHead>
                <TableHead className="text-right text-primary">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseOrders.length > 0 ? (
                purchaseOrders.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.supplierName || "N/A"}</TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell>{formatCurrency(order.totalValue)}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[order.status] || "bg-muted"}>{order.status || "Pendente"}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <FileText className="mr-2 h-4 w-4" />
                            Visualizar Recibo
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(order)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(order.id)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground h-20">
                    Nenhuma ordem de compra encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddPurchaseOrderDialog open={isDialogOpen} onOpenChange={handleCloseDialog} order={editingOrder} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ordem de compra?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
