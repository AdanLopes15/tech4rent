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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, PlusCircle, Trash2 } from "lucide-react";
import { format, addMonths } from "date-fns";
import { cn } from "@/lib/utils";
import { AddClientDialog } from "@/components/clientes/AddClientDialog";

interface QuoteItem {
  equipmentId: string;
  quantity: number;
  unitPrice: number;
}

interface AddQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote?: any;
}

export function AddQuoteDialog({ open, onOpenChange, quote }: AddQuoteDialogProps) {
  const { clients, equipments, addQuote, updateQuote } = useStore();
  const { toast } = useToast();

  const [clientId, setClientId] = useState("");
  const [budgetType, setBudgetType] = useState<"locacao" | "venda">("locacao");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [items, setItems] = useState<QuoteItem[]>([{ equipmentId: "", quantity: 1, unitPrice: 0 }]);
  const [fiscalInfo, setFiscalInfo] = useState("");
  const [observations, setObservations] = useState("");
  const [loading, setLoading] = useState(false);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);

  const isEditing = !!quote;

  useEffect(() => {
    if (quote) {
      setClientId(quote.clientId || "");
      setBudgetType(quote.budgetType || "locacao");
      setStartDate(quote.startDate ? new Date(quote.startDate) : undefined);
      setEndDate(quote.endDate ? new Date(quote.endDate) : undefined);
      setItems(
        quote.items?.length
          ? quote.items.map((i: any) => ({
              equipmentId: i.equipmentId || "",
              quantity: i.quantity || 1,
              unitPrice: i.unitPrice || 0,
            }))
          : [{ equipmentId: "", quantity: 1, unitPrice: 0 }]
      );
      setFiscalInfo(quote.fiscalInfo || "");
      setObservations(quote.observations || "");
    } else {
      resetForm();
    }
  }, [quote, open]);

  const resetForm = () => {
    setClientId("");
    setBudgetType("locacao");
    setStartDate(undefined);
    setEndDate(undefined);
    setItems([{ equipmentId: "", quantity: 1, unitPrice: 0 }]);
    setFiscalInfo("");
    setObservations("");
  };

  const totalValue = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const addItem = () => setItems([...items, { equipmentId: "", quantity: 1, unitPrice: 0 }]);

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof QuoteItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const setQuickPeriod = (months: number) => {
    const start = startDate || new Date();
    setStartDate(start);
    setEndDate(addMonths(start, months));
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
      const client = clients.find((c: any) => c.id === clientId);
      const data: any = {
        clientId,
        clientName: client?.razaoSocial || client?.name || "N/A",
        budgetType,
        items,
        totalValue,
        status: "Pendente",
        fiscalInfo,
        observations,
      };

      if (budgetType === "locacao") {
        data.startDate = startDate?.toISOString();
        data.endDate = endDate?.toISOString();
      }

      if (isEditing) {
        await updateQuote({ id: quote.id, ...data });
        toast({ title: "Orçamento atualizado!" });
      } else {
        await addQuote(data);
        toast({ title: "Orçamento criado!" });
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
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Orçamento" : "Novo Orçamento Interno"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Edite os dados do orçamento." : "Crie um novo orçamento para um cliente."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Client */}
            <div className="space-y-2">
              <Label>Cliente</Label>
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

            {/* Quote Details Card */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold">Detalhes do Orçamento</h3>

              {/* Type */}
              <div className="space-y-2">
                <Label>Tipo de Orçamento</Label>
                <RadioGroup
                  value={budgetType}
                  onValueChange={(v) => setBudgetType(v as "locacao" | "venda")}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="locacao" id="locacao" />
                    <Label htmlFor="locacao" className="cursor-pointer">Locação</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="venda" id="venda" />
                    <Label htmlFor="venda" className="cursor-pointer">Venda</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Dates (only for locacao) */}
              {budgetType === "locacao" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data de Início</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "dd/MM/yyyy") : "Escolha uma data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>Data Final</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "dd/MM/yyyy") : "Escolha uma data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Atalhos de Período:</Label>
                    <div className="flex gap-2">
                      {[3, 6, 12].map((m) => (
                        <Button key={m} type="button" variant="outline" size="sm" onClick={() => setQuickPeriod(m)}>
                          {m} Meses
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Items */}
              <div className="space-y-2">
                <Label className="font-semibold">Itens</Label>
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_80px_120px_40px] gap-2 text-xs font-medium text-muted-foreground">
                    <span>Equipamento</span>
                    <span>Qtd.</span>
                    <span>Vl. Unitário</span>
                    <span />
                  </div>
                  {items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_80px_120px_40px] gap-2">
                      <Select
                        value={item.equipmentId}
                        onValueChange={(v) => updateItem(idx, "equipmentId", v)}
                      >
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

              {/* Fiscal Info */}
              <div className="space-y-2">
                <Label className="font-semibold">Informações Fiscais</Label>
                <Textarea
                  placeholder="Detalhes sobre impostos, CFOP, etc."
                  value={fiscalInfo}
                  onChange={(e) => setFiscalInfo(e.target.value)}
                />
              </div>

              {/* Observations */}
              <div className="space-y-2">
                <Label className="font-semibold">Observações Gerais</Label>
                <Textarea
                  placeholder="Condições de pagamento, detalhes do projeto, etc."
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                />
              </div>

              {/* Total */}
              <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg p-4">
                <span className="font-bold">Valor Total do Orçamento</span>
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

      <AddClientDialog open={isClientDialogOpen} onOpenChange={() => setIsClientDialogOpen(false)} client={null} />
    </>
  );
}
