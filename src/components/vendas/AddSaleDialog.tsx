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
import { AddClientDialog } from "@/components/clientes/AddClientDialog";

interface SaleItem {
  equipmentId: string;
  quantity: number;
  unitPrice: number;
}

interface PaymentMethod {
  paymentMethod: string;
  value: number;
  installments: number;
}

interface AddSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale?: any;
}

export function AddSaleDialog({ open, onOpenChange, sale }: AddSaleDialogProps) {
  const { clients, equipments, costCenters, chartOfAccounts, bankAccounts, addSale, updateSale } = useStore();
  const { toast } = useToast();

  const [clientId, setClientId] = useState("");
  const [items, setItems] = useState<SaleItem[]>([{ equipmentId: "", quantity: 1, unitPrice: 0 }]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { paymentMethod: "boleto", value: 0, installments: 1 },
  ]);
  const [fiscalInfo, setFiscalInfo] = useState("");
  const [costCenterId, setCostCenterId] = useState("");
  const [chartOfAccountId, setChartOfAccountId] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [loading, setLoading] = useState(false);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);

  const isEditing = !!sale;

  useEffect(() => {
    if (sale) {
      setClientId(sale.clientId || "");
      setItems(
        sale.items?.length
          ? sale.items.map((i: any) => ({
              equipmentId: i.equipmentId || "",
              quantity: i.quantity || 1,
              unitPrice: i.unitPrice || 0,
            }))
          : [{ equipmentId: "", quantity: 1, unitPrice: 0 }]
      );
      setPaymentMethods(
        sale.paymentMethods?.length
          ? sale.paymentMethods
          : [{ paymentMethod: "boleto", value: 0, installments: 1 }]
      );
      setFiscalInfo(sale.fiscalInfo || "");
      setCostCenterId(sale.costCenterId || "");
      setChartOfAccountId(sale.chartOfAccountId || "");
      setBankAccountId(sale.bankAccountId || "");
    } else {
      resetForm();
    }
  }, [sale, open]);

  const resetForm = () => {
    setClientId("");
    setItems([{ equipmentId: "", quantity: 1, unitPrice: 0 }]);
    setPaymentMethods([{ paymentMethod: "boleto", value: 0, installments: 1 }]);
    setFiscalInfo("");
    setCostCenterId("");
    setChartOfAccountId("");
    setBankAccountId("");
  };

  const totalValue = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const addItem = () => setItems([...items, { equipmentId: "", quantity: 1, unitPrice: 0 }]);
  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };
  const updateItem = (index: number, field: keyof SaleItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const addPaymentMethod = () =>
    setPaymentMethods([...paymentMethods, { paymentMethod: "boleto", value: 0, installments: 1 }]);
  const removePaymentMethod = (index: number) => {
    if (paymentMethods.length <= 1) return;
    setPaymentMethods(paymentMethods.filter((_, i) => i !== index));
  };
  const updatePaymentMethod = (index: number, field: keyof PaymentMethod, value: any) => {
    const updated = [...paymentMethods];
    updated[index] = { ...updated[index], [field]: value };
    setPaymentMethods(updated);
  };

  const handleSubmit = async () => {
    if (!clientId) {
      toast({ title: "Selecione um cliente", variant: "destructive" });
      return;
    }
    if (items.some((i) => !i.equipmentId)) {
      toast({ title: "Selecione todos os equipamentos", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const data = {
        clientId,
        items,
        paymentMethods,
        fiscalInfo,
        costCenterId,
        chartOfAccountId,
        bankAccountId,
      };

      if (isEditing) {
        await updateSale({ id: sale.id, ...data });
        toast({ title: "Venda atualizada!" });
      } else {
        await addSale(data);
        toast({ title: "Venda registrada com sucesso!" });
      }
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: err.message || "Erro ao salvar", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const paymentTotalAllocated = paymentMethods.reduce((sum, pm) => sum + Number(pm.value || 0), 0);
  const isValueAllocated = Math.abs(paymentTotalAllocated - totalValue) < 0.01;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Venda" : "Registrar Nova Venda"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Edite os dados da venda."
                : "Registre a venda de um equipamento do seu inventário. Uma fatura será gerada automaticamente."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Client */}
            <div className="space-y-2">
              <Label className="font-semibold">Cliente Comprador</Label>
              <div className="flex gap-2">
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.razaoSocial || c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" size="icon" onClick={() => setIsClientDialogOpen(true)}>
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-3">
              <Label className="font-semibold text-base">Itens da Venda</Label>
              <div className="border rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-[1fr_70px_100px_40px] gap-2 text-xs font-medium text-muted-foreground">
                  <span>Equipamento</span>
                  <span>Qtd.</span>
                  <span>Vl. Unit.</span>
                  <span />
                </div>
                {items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_70px_100px_40px] gap-2">
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
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                    />
                    <Input
                      type="number"
                      min={0}
                      value={item.unitPrice}
                      onChange={(e) => updateItem(idx, "unitPrice", Number(e.target.value))}
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

            {/* Payment Methods */}
            <div className="space-y-3">
              <Label className="font-semibold text-base">Formas de Pagamento</Label>
              <div className="border rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-[1fr_100px_100px] gap-2 text-xs font-medium text-muted-foreground">
                  <span>Forma de Pagamento</span>
                  <span>Valor (R$)</span>
                  <span>Nº de Parcelas</span>
                </div>
                {paymentMethods.map((pm, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_100px_100px] gap-2">
                    <Select
                      value={pm.paymentMethod}
                      onValueChange={(v) => updatePaymentMethod(idx, "paymentMethod", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="boleto">Boleto</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="cartao">Cartão</SelectItem>
                        <SelectItem value="transferencia">Transferência</SelectItem>
                        <SelectItem value="entrada_boleto">Entrada + Boleto</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min={0}
                      value={pm.value}
                      onChange={(e) => updatePaymentMethod(idx, "value", Number(e.target.value))}
                    />
                    <Input
                      type="number"
                      min={1}
                      value={pm.installments}
                      onChange={(e) => updatePaymentMethod(idx, "installments", Number(e.target.value))}
                    />
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addPaymentMethod}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar outra forma de pagamento
              </Button>
            </div>

            {/* Fiscal Info */}
            <div className="space-y-2">
              <Label className="font-semibold">Informações Fiscais</Label>
              <Textarea
                placeholder="Detalhes sobre impostos, CFOP, etc."
                value={fiscalInfo}
                onChange={(e) => setFiscalInfo(e.target.value)}
              />
            </div>

            {/* Financial Details */}
            <div className="space-y-3">
              <Label className="font-semibold text-base">Detalhes Financeiros</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Centro de Custo</Label>
                  <div className="flex gap-1">
                    <Select value={costCenterId} onValueChange={setCostCenterId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {costCenters.map((cc: any) => (
                          <SelectItem key={cc.id} value={cc.id}>{cc.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" size="icon" className="shrink-0">
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Plano de Contas</Label>
                  <div className="flex gap-1">
                    <Select value={chartOfAccountId} onValueChange={setChartOfAccountId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {chartOfAccounts.map((ca: any) => (
                          <SelectItem key={ca.id} value={ca.id}>{ca.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" size="icon" className="shrink-0">
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Conta Bancária</Label>
                  <div className="flex gap-1">
                    <Select value={bankAccountId} onValueChange={setBankAccountId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {bankAccounts.map((ba: any) => (
                          <SelectItem key={ba.id} value={ba.id}>{ba.name || ba.bankName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" size="icon" className="shrink-0">
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg p-4">
              <div>
                <span className="font-bold">Valor Total da Venda</span>
                {isValueAllocated && totalValue > 0 && (
                  <p className="text-xs text-green-500">Valor alocado corretamente</p>
                )}
                {!isValueAllocated && totalValue > 0 && (
                  <p className="text-xs text-destructive">
                    Alocado: {formatCurrency(paymentTotalAllocated)} / Total: {formatCurrency(totalValue)}
                  </p>
                )}
              </div>
              <span className="text-lg font-bold">{formatCurrency(totalValue)}</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              {loading ? "Salvando..." : isEditing ? "Salvar Alterações" : "Vender Equipamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddClientDialog open={isClientDialogOpen} onOpenChange={() => setIsClientDialogOpen(false)} client={null} />
    </>
  );
}
