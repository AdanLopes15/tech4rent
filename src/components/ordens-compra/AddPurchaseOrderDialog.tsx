//src/components/ordens-compra/AddPurchaseOrderDialog.tsx

import { useState, useEffect } from "react";
import { useStore } from "@/store";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Trash2, ShoppingCart } from "lucide-react";
import { AddSupplierDialog } from "@/components/fornecedores/AddSupplierDialog";

interface OrderItem {
  equipmentId: string;
  quantity: number;
  unitCost: number;
}

interface AddPurchaseOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: any;
}

export function AddPurchaseOrderDialog({ open, onOpenChange, order }: AddPurchaseOrderDialogProps) {
  const { suppliers, equipments, addPurchaseOrder, updatePurchaseOrder } = useStore();
  const { toast } = useToast();

  const [supplierId, setSupplierId] = useState("");
  const [items, setItems] = useState<OrderItem[]>([{ equipmentId: "", quantity: 1, unitCost: 0 }]);
  const [observations, setObservations] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);

  const isEditing = !!order;

  useEffect(() => {
    if (order) {
      setSupplierId(order.supplierId || "");
      setItems(
        order.items?.length
          ? order.items.map((i: any) => ({
              equipmentId: i.equipmentId || "",
              quantity: i.quantity || 1,
              unitCost: i.unitCost || i.unitPrice || 0,
            }))
          : [{ equipmentId: "", quantity: 1, unitCost: 0 }],
      );
      setObservations(order.observations || "");
    } else {
      resetForm();
    }
  }, [order, open]);

  const resetForm = () => {
    setSupplierId("");
    setItems([{ equipmentId: "", quantity: 1, unitCost: 0 }]);
    setObservations("");
  };

  const totalValue = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

  const addItem = () => setItems([...items, { equipmentId: "", quantity: 1, unitCost: 0 }]);
  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };
  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleSubmit = async () => {
    if (!supplierId) {
      toast({ title: "Selecione um fornecedor", variant: "destructive" });
      return;
    }
    if (items.some((i) => !i.equipmentId)) {
      toast({ title: "Selecione todos os equipamentos", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const supplier = suppliers.find((s: any) => s.id === supplierId);
      const data = {
        supplierId,
        supplierName: supplier?.razaoSocial || supplier?.name || "N/A",
        items,
        totalValue,
        observations,
        status: "Pendente",
      };

      if (isEditing) {
        await updatePurchaseOrder({ id: order.id, ...data });
        toast({ title: "Ordem de compra atualizada!" });
      } else {
        await addPurchaseOrder(data);
        toast({ title: "Ordem de compra criada!" });
      }
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: err.message || "Erro ao salvar", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Ordem de Compra" : "Criar Nova Ordem de Compra"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Edite os dados do pedido."
                : "Preencha os dados abaixo para gerar um novo pedido de compra para um fornecedor."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Supplier */}
            <div className="space-y-2">
              <Label className="font-semibold">Fornecedor</Label>
              <div className="flex gap-2">
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione um fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.razaoSocial || s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" size="icon" onClick={() => setIsSupplierDialogOpen(true)}>
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-3">
              <Label className="font-semibold text-base">Itens do Pedido</Label>
              <div className="border rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-[1fr_40px_70px_100px_40px] gap-2 text-xs font-medium text-muted-foreground">
                  <span>Equipamento</span>
                  <span />
                  <span>Qtd.</span>
                  <span>Custo Unit. (R$)</span>
                  <span />
                </div>
                {items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_40px_70px_100px_40px] gap-2">
                    <Select value={item.equipmentId} onValueChange={(v) => updateItem(idx, "equipmentId", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {equipments.map((eq: any) => (
                          <SelectItem key={eq.id} value={eq.id}>
                            {eq.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0">
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                    />
                    <Input
                      type="number"
                      min={0}
                      value={item.unitCost}
                      onChange={(e) => updateItem(idx, "unitCost", Number(e.target.value))}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => removeItem(idx)}
                      disabled={items.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Item
              </Button>
            </div>

            {/* Observations */}
            <div className="space-y-2">
              <Label className="font-semibold">Observações</Label>
              <Textarea
                placeholder="Adicione notas sobre o pedido, condições de pagamento, etc."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
              />
            </div>

            {/* Total */}
            <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg p-4">
              <span className="font-bold">Valor Total do Pedido</span>
              <span className="text-lg font-bold">{formatCurrency(totalValue)}</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              {loading ? "Salvando..." : isEditing ? "Salvar Alterações" : "Gerar Pedido"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddSupplierDialog
        open={isSupplierDialogOpen}
        onOpenChange={() => setIsSupplierDialogOpen(false)}
        supplier={null}
      />
    </>
  );
}
