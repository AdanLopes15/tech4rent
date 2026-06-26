//src/components/vendas/AddSaleDialog.tsx

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/store";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, maskCurrencyBR, parseCurrencyBR } from "@/lib/utils";
import { format } from "date-fns";

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, PlusCircle, Trash2, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddClientDialog } from "@/components/clientes/AddClientDialog";

interface SaleItem {
  id: number;
  equipmentId: string;
  quantity: number;
  unitPrice: number;
}

interface PaymentMethod {
  id: number;
  paymentMethod: string;
  value: number;
  installments: number;
  downPaymentType: "fixed" | "percentage";
  downPaymentValue: number;
  downPaymentDate?: Date;
}

interface AddSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale?: any;
}

export function AddSaleDialog({ open, onOpenChange, sale }: AddSaleDialogProps) {
  const { clients, equipments, costCenters, chartOfAccounts, bankAccounts, addSale, updateSale, updateQuote } =
    useStore();

  const { toast } = useToast();

  const [clientId, setClientId] = useState("");
  const [items, setItems] = useState<SaleItem[]>([{ id: 1, equipmentId: "", quantity: 1, unitPrice: 0 }]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: 1,
      paymentMethod: "boleto",
      value: 0,
      installments: 1,
      downPaymentType: "fixed",
      downPaymentValue: 0,
    },
  ]);
  const [informacoesFiscais, setInformacoesFiscais] = useState("");
  const [costCenterId, setCostCenterId] = useState("");
  const [chartOfAccountId, setChartOfAccountId] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [loading, setLoading] = useState(false);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);

  const isEditing = !!sale;
  const isFromQuote = sale?.budgetType === "venda";

  const resetForm = () => {
    setClientId("");
    setItems([{ id: 1, equipmentId: "", quantity: 1, unitPrice: 0 }]);
    setPaymentMethods([
      {
        id: 1,
        paymentMethod: "boleto",
        value: 0,
        installments: 1,
        downPaymentType: "fixed",
        downPaymentValue: 0,
      },
    ]);
    setInformacoesFiscais("");
    setCostCenterId("");
    setChartOfAccountId("");
    setBankAccountId("");
  };

  useEffect(() => {
    if (!open) return;

    if (sale) {
      setClientId(sale.clientId || "");
      setItems(
        sale.items?.length
          ? sale.items.map((item: any, index: number) => ({
              id: item.id || index + 1,
              equipmentId: item.equipmentId || "",
              quantity: item.quantity || 1,
              unitPrice: item.unitPrice || 0,
            }))
          : [{ id: 1, equipmentId: "", quantity: 1, unitPrice: 0 }],
      );

      if (sale.paymentMethods?.length) {
        setPaymentMethods(
          sale.paymentMethods.map((pm: any, index: number) => ({
            id: pm.id || index + 1,
            paymentMethod: pm.paymentMethod || "boleto",
            value: Number(pm.value || 0),
            installments: Number(pm.installments || 1),
            downPaymentType: pm.downPaymentType || "fixed",
            downPaymentValue: Number(pm.downPaymentValue || 0),
            downPaymentDate: pm.downPaymentDate ? new Date(pm.downPaymentDate) : undefined,
          })),
        );
      } else {
        setPaymentMethods([
          {
            id: 1,
            paymentMethod: "boleto",
            value: Number(sale.totalValue || 0),
            installments: 1,
            downPaymentType: "fixed",
            downPaymentValue: 0,
          },
        ]);
      }

      setInformacoesFiscais(sale.informacoesFiscais || "");
      setCostCenterId(sale.costCenterId || "");
      setChartOfAccountId(sale.chartOfAccountId || "");
      setBankAccountId(sale.bankAccountId || "");
    } else {
      resetForm();
    }
  }, [sale, open]);

  const totalValue = useMemo(() => {
    return items.reduce((acc, item) => acc + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0);
  }, [items]);

  useEffect(() => {
    if (paymentMethods.length === 1) {
      setPaymentMethods((prev) =>
        prev.map((pm, index) =>
          index === 0
            ? {
                ...pm,
                value: totalValue,
              }
            : pm,
        ),
      );
    }
  }, [totalValue, paymentMethods.length]);

  const remainingBalance = useMemo(() => {
    const totalPaid = paymentMethods.reduce((acc, pm) => acc + Number(pm.value || 0), 0);
    return totalValue - totalPaid;
  }, [paymentMethods, totalValue]);

  const addItem = () => {
    setItems((prev) => [...prev, { id: Date.now(), equipmentId: "", quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (id: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItem = (id: number, field: keyof SaleItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        if (field === "equipmentId") {
          const equipment = equipments.find((eq: any) => eq.id === value);
          if (equipment) {
            updated.unitPrice = Number(equipment.salePrice || 0);
          }
        }

        return updated;
      }),
    );
  };

  const addPaymentMethod = () => {
    if (paymentMethods.length >= 3) return;
    setPaymentMethods((prev) => [
      ...prev,
      {
        id: Date.now(),
        paymentMethod: "boleto",
        value: 0,
        installments: 1,
        downPaymentType: "fixed",
        downPaymentValue: 0,
      },
    ]);
  };

  const removePaymentMethod = (id: number) => {
    if (paymentMethods.length <= 1) return;
    setPaymentMethods((prev) => prev.filter((pm) => pm.id !== id));
  };

  const updatePaymentMethod = (id: number, field: keyof PaymentMethod, value: any) => {
    setPaymentMethods((prev) => prev.map((pm) => (pm.id === id ? { ...pm, [field]: value } : pm)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId) {
      toast({ title: "Selecione um cliente", variant: "destructive" });
      return;
    }

    if (items.some((item) => !item.equipmentId)) {
      toast({ title: "Selecione todos os equipamentos", variant: "destructive" });
      return;
    }

    if (Math.abs(remainingBalance) > 0.01) {
      toast({
        title: "Valor a pagar divergente",
        description: `A soma das formas de pagamento não corresponde ao valor total da venda.`,
        variant: "destructive",
      });
      return;
    }

    const payload = {
      clientId,
      items: items.map(({ id, ...rest }) => rest),
      totalValue,
      paymentMethods: paymentMethods.map(({ id, ...rest }) => ({
        ...rest,
        value: Number(rest.value || 0),
        installments: Number(rest.installments || 1),
        downPaymentValue: Number(rest.downPaymentValue || 0),
        downPaymentDate: rest.downPaymentDate ? rest.downPaymentDate.toISOString() : undefined,
      })),
      informacoesFiscais,
      costCenterId,
      chartOfAccountId,
      bankAccountId,
    };

    setLoading(true);

    try {
      if (sale && !isFromQuote) {
        await updateSale({ id: sale.id, ...payload });
        toast({ title: "Venda atualizada com sucesso!" });
      } else {
        const newSale = await addSale(payload);

        if (isFromQuote) {
          await updateQuote({
            id: sale.id,
            status: "Aprovado",
            saleId: newSale.id,
          });
          toast({ title: "Venda registrada com sucesso a partir do orçamento!" });
        } else {
          toast({ title: "Venda registrada com sucesso!" });
        }
      }

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao registrar venda",
        description: error.message || "Erro inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const dialogTitle = isFromQuote
    ? `Criar Venda a partir do Orçamento ${sale.id}`
    : isEditing
      ? "Editar Venda"
      : "Registrar Nova Venda";

  const dialogDescription = isFromQuote
    ? "Confirme os dados e informe as condições de pagamento para gerar a venda."
    : isEditing
      ? "Atualize os dados da venda."
      : "Registre a venda de um equipamento do seu inventário. Uma fatura será gerada automaticamente.";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
              <DialogDescription>{dialogDescription}</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label>Cliente Comprador</Label>
                <div className="flex gap-2">
                  <Select value={clientId} onValueChange={setClientId} disabled={isFromQuote}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client: any) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.razaoSocial || client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsClientDialogOpen(true)}
                    disabled={isFromQuote}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="font-semibold text-base">Itens da Venda</Label>

                {items.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-4 items-end">
                      <div className="space-y-2">
                        <Label>Equipamento</Label>
                        <Select
                          value={item.equipmentId}
                          onValueChange={(value) => updateItem(item.id, "equipmentId", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {equipments.map((eq: any) => (
                              <SelectItem key={eq.id} value={eq.id} disabled={eq.purpose === "aluguel"}>
                                {eq.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Qtd.</Label>
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Vl. Unit.</Label>
                        <Input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, "unitPrice", Number(e.target.value))}
                        />
                      </div>

                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        disabled={items.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <Button type="button" variant="outline" onClick={addItem}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adicionar Item
                </Button>
              </div>

              <div className="space-y-3">
                <Label className="font-semibold text-base">Formas de Pagamento</Label>

                {paymentMethods.map((pm) => (
                  <div key={pm.id} className="border rounded-lg p-4 space-y-4 relative">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Forma de Pagamento</Label>
                        <Select
                          value={pm.paymentMethod}
                          onValueChange={(value) => updatePaymentMethod(pm.id, "paymentMethod", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="boleto">Boleto</SelectItem>
                            <SelectItem value="entrada_boleto">Entrada + Boleto</SelectItem>
                            <SelectItem value="pix">PIX</SelectItem>
                            <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                            <SelectItem value="transferencia">Transferência</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Valor (R$)</Label>
                        <Input
                          type="number"
                          value={pm.value}
                          onChange={(e) => updatePaymentMethod(pm.id, "value", Number(e.target.value))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Nº de Parcelas</Label>
                        <Input
                          type="number"
                          min={1}
                          value={pm.installments}
                          onChange={(e) => updatePaymentMethod(pm.id, "installments", Number(e.target.value))}
                        />
                      </div>
                    </div>

                    {pm.paymentMethod === "entrada_boleto" && (
                      <div className="border rounded-lg bg-muted/40 p-4 space-y-4">
                        <div className="space-y-2">
                          <Label>Tipo da Entrada</Label>
                          <RadioGroup
                            value={pm.downPaymentType}
                            onValueChange={(value: "fixed" | "percentage") =>
                              updatePaymentMethod(pm.id, "downPaymentType", value)
                            }
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="fixed" id={`fixed-${pm.id}`} />
                              <Label htmlFor={`fixed-${pm.id}`}>Valor Fixo (R$)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="percentage" id={`percentage-${pm.id}`} />
                              <Label htmlFor={`percentage-${pm.id}`}>Porcentagem (%)</Label>
                            </div>
                          </RadioGroup>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Valor da Entrada</Label>
                            <Input
                              type="number"
                              min={0}
                              value={pm.downPaymentValue}
                              onChange={(e) => updatePaymentMethod(pm.id, "downPaymentValue", Number(e.target.value))}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Data da Entrada</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !pm.downPaymentDate && "text-muted-foreground",
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {pm.downPaymentDate ? format(pm.downPaymentDate, "dd/MM/yyyy") : "Escolha uma data"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={pm.downPaymentDate}
                                  onSelect={(date) => updatePaymentMethod(pm.id, "downPaymentDate", date)}
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentMethods.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => removePaymentMethod(pm.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}

                {paymentMethods.length < 3 && (
                  <Button type="button" variant="outline" onClick={addPaymentMethod}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar outra forma de pagamento
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label>Informações Fiscais</Label>
                <Textarea
                  placeholder="Detalhes sobre impostos, CFOP, etc."
                  value={informacoesFiscais}
                  onChange={(e) => setInformacoesFiscais(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label className="font-semibold text-base">Detalhes Financeiros</Label>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Centro de Custo</Label>
                    <Select value={costCenterId} onValueChange={setCostCenterId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {costCenters.map((cc: any) => (
                          <SelectItem key={cc.id} value={cc.id}>
                            {cc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Plano de Contas</Label>
                    <Select value={chartOfAccountId} onValueChange={setChartOfAccountId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {chartOfAccounts
                          .filter((acc: any) => acc.type === "receita")
                          .map((acc: any) => (
                            <SelectItem key={acc.id} value={acc.id}>
                              {acc.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Conta Bancária</Label>
                    <Select value={bankAccountId} onValueChange={setBankAccountId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {bankAccounts.map((ba: any) => (
                          <SelectItem key={ba.id} value={ba.id}>
                            {ba.name || ba.bankName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg p-4">
                <div>
                  <span className="font-bold">Valor Total da Venda</span>
                  <p className={cn("text-sm", remainingBalance === 0 ? "text-green-600" : "text-red-500")}>
                    {remainingBalance > 0
                      ? `Falta alocar ${formatCurrency(remainingBalance)}`
                      : remainingBalance < 0
                        ? `Excedeu ${formatCurrency(Math.abs(remainingBalance))}`
                        : "Valor alocado corretamente"}
                  </p>
                </div>

                <span className="text-lg font-bold">{formatCurrency(totalValue)}</span>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                <Wallet className="mr-2 h-4 w-4" />
                {loading ? "Salvando..." : isEditing && !isFromQuote ? "Salvar Alterações" : "Vender Equipamento"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AddClientDialog open={isClientDialogOpen} onOpenChange={() => setIsClientDialogOpen(false)} client={null} />
    </>
  );
}
