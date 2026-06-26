//src/components/ordens-compra/AddPurchaseOrderDialog.tsx

import { useState, useEffect } from "react";
import { useStore } from "@/store";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, parseCurrencyBR } from "@/lib/utils";

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
import { AddEquipmentDialog } from "@/components/equipamentos/AddEquipmentDialog";

interface OrderItem {
  id: number;
  equipmentId: string;
  quantity: number;
  unitPrice: number;
}

interface AddPurchaseOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: any;
}

export function AddPurchaseOrderDialog({ open, onOpenChange, order }: AddPurchaseOrderDialogProps) {
  const { suppliers, equipments, addPurchaseOrder, updatePurchaseOrder, getNextId } = useStore();

  const { toast } = useToast();

  const [supplierId, setSupplierId] = useState("");
  const [items, setItems] = useState<OrderItem[]>([{ id: Date.now(), equipmentId: "", quantity: 1, unitPrice: 0 }]);
  const [observations, setObservations] = useState("");
  const [totalValue, setTotalValue] = useState(0);

  const [loading, setLoading] = useState(false);
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [isEquipmentDialogOpen, setIsEquipmentDialogOpen] = useState(false);

  const isEditing = !!order;

  const resetForm = () => {
    setSupplierId("");
    setItems([{ id: Date.now(), equipmentId: "", quantity: 1, unitPrice: 0 }]);
    setObservations("");
    setTotalValue(0);
  };

  useEffect(() => {
    if (!open) return;

    if (order) {
      setSupplierId(order.supplierId || "");
      setItems(
        order.items?.length
          ? order.items.map((item: any) => ({
              id: item.id || Date.now() + Math.random(),
              equipmentId: item.equipmentId || "",
              quantity: item.quantity || 1,
              unitPrice: item.unitPrice || item.unitCost || 0,
            }))
          : [{ id: Date.now(), equipmentId: "", quantity: 1, unitPrice: 0 }],
      );
      setObservations(order.observations || "");
      setTotalValue(order.totalValue || 0);
    } else {
      resetForm();
    }
  }, [order, open]);

  useEffect(() => {
    const total = items.reduce((acc, item) => {
      return acc + item.quantity * item.unitPrice;
    }, 0);

    setTotalValue(total);
  }, [items]);

  const handleAddItem = () => {
    setItems((prev) => [...prev, { id: Date.now(), equipmentId: "", quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleItemChange = (id: number, field: keyof OrderItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updatedItem = { ...item, [field]: value };

        if (field === "equipmentId") {
          const equipment = equipments.find((eq: any) => eq.id === value);
          if (equipment) {
            updatedItem.unitPrice = equipment.costPrice || 0;
          }
        }

        return updatedItem;
      }),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierId || items.length === 0 || items.some((item) => !item.equipmentId)) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um fornecedor e adicione pelo menos um item.",
        variant: "destructive",
      });
      return;
    }

    const supplier = suppliers.find((s: any) => s.id === supplierId);

    const orderData = {
      supplierId,
      supplierName: supplier?.razaoSocial || supplier?.name || "N/A",
      items,
      observations,
      totalValue,
      status: order?.status || "Pendente",
      date: order?.date || new Date().toISOString(),
    };

    try {
      setLoading(true);

      if (order) {
        await updatePurchaseOrder({ id: order.id, ...orderData });
        toast({ title: "Ordem de Compra atualizada com sucesso!" });
      } else {
        const newId = await getNextId("purchaseOrders");
        await addPurchaseOrder({ id: newId, ...orderData });
        toast({ title: "Ordem de Compra criada com sucesso!" });
      }

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error?.message || "Não foi possível salvar a ordem de compra.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl bg-card">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {order ? "Editar Ordem de Compra" : "Criar Nova Ordem de Compra"}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados abaixo para gerar um novo pedido de compra para um fornecedor.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-8 py-4 max-h-[75vh] overflow-y-auto pr-4">
              <div className="space-y-2">
                <Label htmlFor="fornecedor">Fornecedor</Label>
                <div className="flex items-center gap-2">
                  <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger id="fornecedor">
                      <SelectValue placeholder="Selecione um fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier: any) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.razaoSocial || supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    size="icon"
                    variant="outline"
                    type="button"
                    className="flex-shrink-0"
                    onClick={() => setIsSupplierDialogOpen(true)}
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span className="sr-only">Adicionar novo fornecedor</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Itens do Pedido</h3>

                {items.map((item) => (
                  <div key={item.id} className="p-4 border rounded-lg space-y-4">
                    <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-[2fr_1fr_1fr_auto]">
                      <div className="space-y-2">
                        <Label htmlFor={`equipment-${item.id}`}>Equipamento</Label>

                        <div className="flex items-center gap-2">
                          <Select
                            value={item.equipmentId}
                            onValueChange={(value) => handleItemChange(item.id, "equipmentId", value)}
                          >
                            <SelectTrigger id={`equipment-${item.id}`}>
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

                          <Button
                            size="icon"
                            variant="outline"
                            type="button"
                            className="flex-shrink-0"
                            onClick={() => setIsEquipmentDialogOpen(true)}
                          >
                            <PlusCircle className="h-4 w-4" />
                            <span className="sr-only">Adicionar novo equipamento</span>
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`qty-${item.id}`}>Qtd.</Label>
                        <Input
                          id={`qty-${item.id}`}
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => handleItemChange(item.id, "quantity", Number(e.target.value))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`cost-${item.id}`}>Custo Unit. (R$)</Label>
                        <Input
                          id={`cost-${item.id}`}
                          type="text"
                          inputMode="numeric"
                          value={formatCurrency(item.unitPrice)}
                          onChange={(e) => handleItemChange(item.id, "unitPrice", parseCurrencyBR(e.target.value))}
                        />
                      </div>

                      <Button variant="destructive" size="icon" type="button" onClick={() => handleRemoveItem(item.id)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Excluir item</span>
                      </Button>
                    </div>
                  </div>
                ))}

                <Button variant="outline" type="button" onClick={handleAddItem}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adicionar Item
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Adicione notas sobre o pedido, condições de pagamento, etc."
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                />
              </div>

              <div className="bg-muted p-4 rounded-lg flex items-center justify-between">
                <span className="font-semibold text-lg">Valor Total do Pedido</span>
                <span className="font-bold text-2xl text-primary">{formatCurrency(totalValue)}</span>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                {loading ? "Salvando..." : order ? "Salvar Alterações" : "Gerar Pedido"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AddSupplierDialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen} supplier={null} />

      <AddEquipmentDialog open={isEquipmentDialogOpen} onOpenChange={setIsEquipmentDialogOpen} equipment={null} />
    </>
  );
}
