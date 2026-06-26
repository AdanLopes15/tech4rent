//src/components/contratos/AddContractDialog.tsx

import { useState, useEffect } from "react";
import { useStore } from "@/store";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, maskCurrencyBR, parseCurrencyBR } from "@/lib/utils";

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, PlusCircle, Trash2 } from "lucide-react";
import { format, addMonths, addYears } from "date-fns";
import { cn } from "@/lib/utils";
import { AddClientDialog } from "@/components/clientes/AddClientDialog";

interface ContractItem {
  equipmentId: string;
  quantity: number;
  billingType: string;
  unitPrice: number;
}

interface AddContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract?: any;
}

export function AddContractDialog({ open, onOpenChange, contract }: AddContractDialogProps) {
  const { clients, equipments, costCenters, chartOfAccounts, bankAccounts, addContract, updateContract } = useStore();
  const { toast } = useToast();

  const [clientId, setClientId] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [firstInstallmentDate, setFirstInstallmentDate] = useState<Date | undefined>();
  const [items, setItems] = useState<ContractItem[]>([
    { equipmentId: "", quantity: 1, billingType: "Mensal", unitPrice: 0 },
  ]);
  const [costCenterId, setCostCenterId] = useState("");
  const [chartOfAccountId, setChartOfAccountId] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [loading, setLoading] = useState(false);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [firstInstallmentOpen, setFirstInstallmentOpen] = useState(false);

  const isEditing = !!contract;

  useEffect(() => {
    if (contract) {
      setClientId(contract.clientId || "");
      setStartDate(contract.startDate ? new Date(contract.startDate) : undefined);
      setEndDate(contract.endDate ? new Date(contract.endDate) : undefined);
      setFirstInstallmentDate(contract.firstInstallmentDate ? new Date(contract.firstInstallmentDate) : undefined);
      setItems(
        contract.items?.length
          ? contract.items.map((i: any) => ({
              equipmentId: i.equipmentId || "",
              quantity: i.quantity || 1,
              billingType: i.billingType || "Mensal",
              unitPrice: i.unitPrice || 0,
            }))
          : [{ equipmentId: "", quantity: 1, billingType: "Mensal", unitPrice: 0 }],
      );
      setCostCenterId(contract.costCenterId || "");
      setChartOfAccountId(contract.chartOfAccountId || "");
      setBankAccountId(contract.bankAccountId || "");
    } else {
      resetForm();
    }
  }, [contract, open]);

  const resetForm = () => {
    setClientId("");
    setStartDate(undefined);
    setEndDate(undefined);
    setFirstInstallmentDate(undefined);
    setItems([{ equipmentId: "", quantity: 1, billingType: "Mensal", unitPrice: 0 }]);
    setCostCenterId("");
    setChartOfAccountId("");
    setBankAccountId("");
  };

  const totalValue = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const addItem = () => setItems([...items, { equipmentId: "", quantity: 1, billingType: "Mensal", unitPrice: 0 }]);

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof ContractItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-preencher valor sugerido ao selecionar equipamento (somente se ainda não foi alterado)
    if (field === "equipmentId") {
      const eq: any = equipments.find((e: any) => e.id === value);
      if (eq && (!updated[index].unitPrice || updated[index].unitPrice === 0)) {
        const suggested =
          eq.rentalPrice ?? eq.monthlyPrice ?? eq.price ?? eq.salePrice ?? eq.value ?? 0;
        updated[index].unitPrice = Number(suggested) || 0;
      }
    }

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
    if (!startDate || !endDate) {
      toast({ title: "Selecione as datas", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const client = clients.find((c: any) => c.id === clientId);

      if (isEditing) {
        await updateContract({
          id: contract.id,
          clientId,
          client,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          items,
          totalValue,
          costCenterId,
          chartOfAccountId,
          bankAccountId,
        });
        toast({ title: "Contrato atualizado!" });
      } else {
        await addContract({
          clientId,
          client,
          startDate,
          endDate,
          firstInstallmentDate: firstInstallmentDate || addMonths(startDate, 1),
          items,
          totalValue,
          status: "Em Andamento",
          costCenterId,
          chartOfAccountId,
          bankAccountId,
        });
        toast({ title: "Contrato gerado com sucesso!" });
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
            <DialogTitle>
              {isEditing ? "Editar Contrato" : "Criar Novo Contrato de Locação"}{" "}
              {!isEditing && <span className="text-muted-foreground font-normal">- A ser gerado</span>}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Edite os dados do contrato."
                : "Preencha os dados abaixo para gerar um novo contrato. O valor será calculado automaticamente e lançado no financeiro."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Client */}
            <div className="space-y-2">
              <Label className="font-semibold">Nome do Cliente</Label>
              <div className="flex gap-2">
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione um cliente cadastrado" />
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

            {/* Dates */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Data de Retirada</Label>
                <Popover open={startOpen} onOpenChange={setStartOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "dd/MM/yyyy") : "Escolha uma data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={startDate} onSelect={(d) => { setStartDate(d); setStartOpen(false); }} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Data de Devolução</Label>
                <Popover open={endOpen} onOpenChange={setEndOpen}>
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
                    <Calendar mode="single" selected={endDate} onSelect={(d) => { setEndDate(d); setEndOpen(false); }} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Data da 1ª Parcela</Label>
                <Popover open={firstInstallmentOpen} onOpenChange={setFirstInstallmentOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !firstInstallmentDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {firstInstallmentDate ? format(firstInstallmentDate, "dd/MM/yyyy") : "Escolha uma data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={firstInstallmentDate} onSelect={(d) => { setFirstInstallmentDate(d); setFirstInstallmentOpen(false); }} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Period shortcuts */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Atalhos de Período:</Label>
              <div className="flex gap-2">
                {[
                  { label: "1 Mês", months: 1 },
                  { label: "6 Meses", months: 6 },
                  { label: "1 Ano", months: 12 },
                ].map((p) => (
                  <Button
                    key={p.months}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQuickPeriod(p.months)}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Items */}
            <div className="space-y-3">
              <Label className="font-semibold text-base">Itens do Contrato</Label>
              <div className="border rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-[1fr_70px_100px_120px_40px] gap-2 text-xs font-medium text-muted-foreground">
                  <span>Equipamento</span>
                  <span>Qtd.</span>
                  <span>Cobrança</span>
                  <span>Valor Negociado</span>
                  <span />
                </div>
                {items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_70px_100px_120px_40px] gap-2">
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
                    <Select value={item.billingType} onValueChange={(v) => updateItem(idx, "billingType", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mensal">Mensal</SelectItem>
                        <SelectItem value="Semanal">Semanal</SelectItem>
                        <SelectItem value="Diário">Diário</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="R$ 0,00"
                      value={maskCurrencyBR(Math.round((item.unitPrice || 0) * 100).toString())}
                      onChange={(e) => updateItem(idx, "unitPrice", parseCurrencyBR(e.target.value))}
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
                Adicionar Equipamento
              </Button>
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
                          <SelectItem key={cc.id} value={cc.id}>
                            {cc.name}
                          </SelectItem>
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
                          <SelectItem key={ca.id} value={ca.id}>
                            {ca.name}
                          </SelectItem>
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
                          <SelectItem key={ba.id} value={ba.id}>
                            {ba.name || ba.bankName}
                          </SelectItem>
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
              <span className="font-bold">Valor Total Calculado</span>
              <span className="text-lg font-bold">{formatCurrency(totalValue)}</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Salvando..." : isEditing ? "Salvar Alterações" : "Gerar Contrato"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddClientDialog open={isClientDialogOpen} onOpenChange={() => setIsClientDialogOpen(false)} client={null} />
    </>
  );
}
