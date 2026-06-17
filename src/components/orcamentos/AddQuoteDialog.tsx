//src/components/orcamentos/AddQuoteDialog.tsx

import { useEffect, useMemo, useState } from "react";
import { Timestamp } from "firebase/firestore";
import { format, addMonths, differenceInMonths, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, PlusCircle, Trash2, Copy } from "lucide-react";

import { useStore } from "@/store";
import { useToast } from "@/hooks/use-toast";
import { cn, formatCurrency } from "@/lib/utils";
import { generateQuotePDF } from "@/lib/pdf-utils";

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
import { AddClientDialog } from "@/components/clientes/AddClientDialog";
import { buildObservationsWithPaymentCondition } from "@/store/utils";

type BudgetType = "locacao" | "venda";
type BillingType = "diaria" | "semanal" | "mensal" | "venda";
type DownPaymentType = "fixed" | "percentage";

interface QuoteItem {
  id: number;
  equipmentId: string;
  quantity: number;
  billingType: BillingType;
  unitPrice: number;
}

interface PaymentMethod {
  id: number;
  paymentMethod: string;
  installments: number;
  downPaymentType: DownPaymentType;
  downPaymentValue: number | string;
  downPaymentDate?: Date;
}

interface AddQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote?: any;
}

const safeToDate = (value: any): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();

  if (typeof value === "object" && typeof value?.seconds === "number") {
    return new Timestamp(value.seconds, value.nanoseconds || 0).toDate();
  }

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    if (!isNaN(date.getTime())) return date;
  }

  return undefined;
};

export function AddQuoteDialog({ open, onOpenChange, quote }: AddQuoteDialogProps) {
  const { clients, equipments, addQuote, updateQuote } = useStore();
  const { toast } = useToast();

  const [selectedClientId, setSelectedClientId] = useState("");
  const [budgetType, setBudgetType] = useState<BudgetType>("locacao");

  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const [items, setItems] = useState<QuoteItem[]>([
    {
      id: Date.now(),
      equipmentId: "",
      quantity: 1,
      billingType: "mensal",
      unitPrice: 0,
    },
  ]);

  const [informacoesFiscais, setInformacoesFiscais] = useState("");
  const [observations, setObservations] = useState("");

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: 1,
      paymentMethod: "boleto",
      installments: 1,
      downPaymentType: "fixed",
      downPaymentValue: 0,
    },
  ]);
  const [prazoEntrega, setPrazoEntrega] = useState("");

  const [loading, setLoading] = useState(false);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);

  const isEditing = !!quote?.id;

  const resetForm = () => {
    setSelectedClientId("");
    setBudgetType("locacao");
    setStartDate(undefined);
    setEndDate(undefined);
    setItems([
      {
        id: Date.now(),
        equipmentId: "",
        quantity: 1,
        billingType: "mensal",
        unitPrice: 0,
      },
    ]);
    setInformacoesFiscais("");
    setObservations("");
    setPaymentMethods([
      {
        id: 1,
        paymentMethod: "boleto",
        installments: 1,
        downPaymentType: "fixed",
        downPaymentValue: 0,
      },
    ]);
    setPrazoEntrega("");
  };

  useEffect(() => {
    if (!open) return;

    if (quote) {
      setSelectedClientId(quote.clientId || "");
      setBudgetType((quote.budgetType || "locacao") as BudgetType);

      setStartDate(safeToDate(quote.startDate));
      setEndDate(safeToDate(quote.endDate));

      setItems(
        quote.items?.length
          ? quote.items.map((item: any) => ({
              id: item.id || Date.now() + Math.random(),
              equipmentId: item.equipmentId || "",
              quantity: Number(item.quantity || 1),
              billingType: (item.billingType as BillingType) || (quote.budgetType === "venda" ? "venda" : "mensal"),
              unitPrice: Number(item.unitPrice || 0),
            }))
          : [
              {
                id: Date.now(),
                equipmentId: "",
                quantity: 1,
                billingType: quote.budgetType === "venda" ? "venda" : "mensal",
                unitPrice: 0,
              },
            ],
      );

      setInformacoesFiscais(quote.informacoesFiscais || quote.fiscalInfo || "");
      setObservations(quote.observations || "");

      if (quote.paymentMethods?.length) {
        setPaymentMethods(
          quote.paymentMethods.map((pm: any) => ({
            id: pm.id || Date.now() + Math.random(),
            paymentMethod: pm.paymentMethod || "boleto",
            installments: Number(pm.installments || 1),
            downPaymentType: pm.downPaymentType || "fixed",
            downPaymentValue: pm.downPaymentValue || 0,
            downPaymentDate: safeToDate(pm.downPaymentDate),
          })),
        );
      } else {
        setPaymentMethods([
          {
            id: 1,
            paymentMethod: "boleto",
            installments: 1,
            downPaymentType: "fixed",
            downPaymentValue: 0,
          },
        ]);
      }

      setPrazoEntrega(quote.prazoEntrega || "");
    } else {
      resetForm();
    }
  }, [open, quote]);

  useEffect(() => {
    if (!open || isEditing) return;

    setItems([
      {
        id: Date.now(),
        equipmentId: "",
        quantity: 1,
        billingType: budgetType === "venda" ? "venda" : "mensal",
        unitPrice: 0,
      },
    ]);
  }, [budgetType, open, isEditing]);

  const totalValue = useMemo(() => {
    return items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  }, [items]);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        equipmentId: "",
        quantity: 1,
        billingType: budgetType === "venda" ? "venda" : "mensal",
        unitPrice: 0,
      },
    ]);
  };

  const removeItem = (id: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItem = (id: number, field: keyof QuoteItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updatedItem = {
          ...item,
          [field]: value,
        } as QuoteItem;

        const equipment = equipments.find((eq: any) => eq.id === updatedItem.equipmentId);

        if (equipment && (field === "equipmentId" || field === "billingType")) {
          switch (updatedItem.billingType) {
            case "diaria":
              updatedItem.unitPrice = Number(equipment.dailyRate || 0);
              break;
            case "semanal":
              updatedItem.unitPrice = Number(equipment.weeklyRate || 0);
              break;
            case "mensal":
              updatedItem.unitPrice = Number(equipment.monthlyRate || 0);
              break;
            case "venda":
              updatedItem.unitPrice = Number(equipment.salePrice || 0);
              break;
          }
        }

        return updatedItem;
      }),
    );
  };

  const setQuickPeriod = (months: number) => {
    if (!startDate) {
      toast({
        title: "Data de início não selecionada",
        description: "Selecione a data de início primeiro.",
        variant: "destructive",
      });
      return;
    }

    setEndDate(addMonths(startDate, months));
  };

  const handleAddPaymentMethod = () => {
    if (paymentMethods.length >= 3) return;

    setPaymentMethods((prev) => [
      ...prev,
      {
        id: Date.now(),
        paymentMethod: "boleto",
        installments: 1,
        downPaymentType: "fixed",
        downPaymentValue: 0,
      },
    ]);
  };

  const handleRemovePaymentMethod = (id: number) => {
    if (paymentMethods.length <= 1) return;
    setPaymentMethods((prev) => prev.filter((pm) => pm.id !== id));
  };

  const handlePaymentChange = (id: number, field: keyof Omit<PaymentMethod, "id">, value: any) => {
    setPaymentMethods((prev) => prev.map((pm) => (pm.id === id ? { ...pm, [field]: value } : pm)));
  };

  const handleSubmit = async () => {
    if (!selectedClientId) {
      toast({
        title: "Selecione um cliente",
        variant: "destructive",
      });
      return;
    }

    if (items.some((item) => !item.equipmentId)) {
      toast({
        title: "Preencha todos os itens",
        description: "Selecione todos os equipamentos.",
        variant: "destructive",
      });
      return;
    }

    if (budgetType === "locacao" && (!startDate || !endDate)) {
      toast({
        title: "Período obrigatório",
        description: "Preencha a data de início e a data final da locação.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const client = clients.find((c: any) => c.id === selectedClientId);

      const data: any = {
        clientId: selectedClientId,
        clientName: client?.razaoSocial || client?.name || "N/A",
        budgetType,
        items,
        totalValue,
        status: quote?.status || "Pendente",
        informacoesFiscais,
        observations,
      };

      if (budgetType === "locacao") {
        data.startDate = startDate?.toISOString();
        data.endDate = endDate?.toISOString();
      }

      if (budgetType === "venda") {
        data.saleDate = quote?.saleDate || new Date().toISOString();
        const cleanedPaymentMethods = paymentMethods.map(({ id, ...rest }) => ({
          ...rest,
          value: totalValue,
        }));
        data.paymentMethods = cleanedPaymentMethods;
        data.prazoEntrega = prazoEntrega;
        // Preenche/atualiza automaticamente a condição de pagamento nas observações
        data.observations = buildObservationsWithPaymentCondition(observations, cleanedPaymentMethods, totalValue);
      }

      let quoteId = quote?.id;
      if (isEditing) {
        await updateQuote({
          id: quote.id,
          ...data,
        });
        toast({ title: "Orçamento atualizado com sucesso!" });
      } else {
        const result = await addQuote(data);
        quoteId = result.id;
        toast({ title: "Orçamento criado com sucesso!" });
      }

      // O PDF pode ser baixado manualmente na lista de orçamentos após a criação/edição.

      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: err?.message || "Erro ao salvar orçamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Orçamento" : quote ? "Duplicar Orçamento" : "Novo Orçamento Interno"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Edite os dados do orçamento." : quote ? "Confira os dados para o novo orçamento duplicado." : "Crie um novo orçamento para um cliente."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <div className="flex gap-2">
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
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

            <div className="border rounded-lg p-4 space-y-5">
              <h3 className="font-semibold">Detalhes do Orçamento</h3>

              <div className="space-y-2">
                <Label>Tipo de Orçamento</Label>
                <RadioGroup
                  value={budgetType}
                  onValueChange={(v) => setBudgetType(v as BudgetType)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="locacao" id="quote-locacao" />
                    <Label htmlFor="quote-locacao" className="cursor-pointer">
                      Locação
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="venda" id="quote-venda" />
                    <Label htmlFor="quote-venda" className="cursor-pointer">
                      Venda
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {budgetType === "locacao" ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data de Início</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !startDate && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Escolha uma data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={startDate} onSelect={setStartDate} locale={ptBR} />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>Data Final</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !endDate && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Escolha uma data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={endDate} onSelect={setEndDate} locale={ptBR} />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Atalhos de Período:</Label>
                    <div className="flex gap-2 flex-wrap">
                      {[3, 6, 12].map((m) => (
                        <Button key={m} type="button" variant="outline" size="sm" onClick={() => setQuickPeriod(m)}>
                          {m} Meses
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Prazo de Entrega</Label>
                    <Input
                      value={prazoEntrega}
                      onChange={(e) => setPrazoEntrega(e.target.value)}
                      placeholder="Ex: 15 dias úteis"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="font-semibold">Opções de Pagamento</Label>

                    {paymentMethods.map((pm, index) => (
                      <div key={pm.id} className="border rounded-lg p-4 space-y-4 relative">
                        <div className="font-medium">Opção {index + 1}</div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Forma de Pagamento</Label>
                            <Select
                              value={pm.paymentMethod}
                              onValueChange={(value) => handlePaymentChange(pm.id, "paymentMethod", value)}
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
                            <Label>Nº de Parcelas</Label>
                            <Input
                              type="number"
                              min={1}
                              value={pm.installments}
                              onChange={(e) => handlePaymentChange(pm.id, "installments", Number(e.target.value))}
                            />
                          </div>
                        </div>

                        {pm.paymentMethod === "entrada_boleto" && (
                          <div className="border rounded-lg p-4 bg-muted/40 space-y-4">
                            <div className="space-y-2">
                              <Label>Tipo da Entrada</Label>
                              <RadioGroup
                                value={pm.downPaymentType}
                                onValueChange={(value: DownPaymentType) =>
                                  handlePaymentChange(pm.id, "downPaymentType", value)
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
                                  type="text"
                                  value={String(pm.downPaymentValue)}
                                  onChange={(e) => handlePaymentChange(pm.id, "downPaymentValue", e.target.value)}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Data da Entrada</Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !pm.downPaymentDate && "text-muted-foreground",
                                      )}
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {pm.downPaymentDate
                                        ? format(pm.downPaymentDate, "dd/MM/yyyy")
                                        : "Escolha uma data"}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={pm.downPaymentDate}
                                      onSelect={(date) => handlePaymentChange(pm.id, "downPaymentDate", date)}
                                      locale={ptBR}
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
                            onClick={() => handleRemovePaymentMethod(pm.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))}

                    {paymentMethods.length < 3 && (
                      <Button type="button" variant="outline" onClick={handleAddPaymentMethod}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Adicionar outra opção de pagamento
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="font-semibold">Itens</Label>

                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-2 items-end">
                      <div className="space-y-1">
                        <Label className="text-xs">Equipamento</Label>
                        <Select value={item.equipmentId} onValueChange={(v) => updateItem(item.id, "equipmentId", v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {equipments.map((eq: any) => {
                              const isDisabled =
                                budgetType === "locacao" ? eq.purpose === "venda" : eq.purpose === "aluguel";

                              return (
                                <SelectItem key={eq.id} value={eq.id} disabled={isDisabled}>
                                  {eq.name}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Qtd.</Label>
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))}
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">{budgetType === "locacao" ? "Vl. Unitário" : "Vl. Unitário"}</Label>
                        <Input
                          type="number"
                          min={0}
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, "unitPrice", Number(e.target.value))}
                        />
                      </div>

                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="h-10 w-10"
                        onClick={() => removeItem(item.id)}
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

              <div className="space-y-2">
                <Label className="font-semibold">Informações Fiscais</Label>
                <Textarea
                  placeholder="Detalhes sobre impostos, CFOP, etc."
                  value={informacoesFiscais}
                  onChange={(e) => setInformacoesFiscais(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="font-semibold">Observações Gerais</Label>
                <Textarea
                  placeholder="Condições de pagamento, detalhes do projeto, etc."
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg p-4">
                <span className="font-bold">
                  {budgetType === "locacao" ? "Valor Total Mensal do Orçamento" : "Valor Total do Orçamento"}
                </span>
                <span className="text-lg font-bold">{formatCurrency(totalValue)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Salvando..." : isEditing ? "Salvar Alterações" : "Criar Orçamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddClientDialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen} client={null} />
    </>
  );
}
