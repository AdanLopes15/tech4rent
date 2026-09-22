//src/components/contratos/AddContractDialog.tsx

import { useState, useEffect } from "react";
import { useStore } from "@/store";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, maskCurrencyBR4, parseCurrencyBR4 } from "@/lib/utils";

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
import { CalendarIcon, Copy, PlusCircle, Trash2 } from "lucide-react";
import { format, addMonths, addYears } from "date-fns";
import { cn } from "@/lib/utils";
import { AddClientDialog } from "@/components/clientes/AddClientDialog";
import { ContractNumberField, useContractNumber } from "@/components/contratos/ContractNumberField";
import { BILLING_TYPES, normalizeBillingType, normalizeItemsBillingType } from "@/lib/contract-billing";
import {
  duplicableContractValues,
  duplicatingContractMessage,
  sourceContractId,
  type ContractDateValue,
  type ContractLike,
  type DuplicableContractItem as ContractItem,
} from "@/lib/contract-duplicate";

interface AddContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract?: ContractLike;
  /**
   * Contrato que está sendo duplicado. O formulário abre preenchido com os
   * dados comerciais dele, mas o número vem da sugestão sequencial normal e
   * nada é gravado até o usuário salvar.
   */
  duplicateFrom?: ContractLike;
}

export function AddContractDialog({ open, onOpenChange, contract, duplicateFrom }: AddContractDialogProps) {
  const { clients, equipments, costCenters, chartOfAccounts, bankAccounts, addContract, updateContract } = useStore();
  const { toast } = useToast();

  const [clientId, setClientId] = useState("");
  const [unitOperation, setUnitOperation] = useState("");
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
  // Duplicar é uma CRIAÇÃO: o número continua sendo escolhido/sugerido normalmente.
  const duplicatedFromContractId = !isEditing && duplicateFrom ? sourceContractId(duplicateFrom) : null;
  const isDuplicating = !isEditing && !!duplicateFrom;
  // O número só é escolhido na criação; o ID de um contrato existente nunca muda.
  const contractNumber = useContractNumber(open && !isEditing);

  // Só a DUPLICAÇÃO usa o mapeamento reduzido (lib/contract-duplicate.ts), que
  // copia campo a campo apenas o que o formulário edita. A edição continua
  // lendo o contrato direto, exatamente como antes.
  const applyDuplicatedValues = (source: unknown) => {
    const values = duplicableContractValues(source);
    setClientId(values.clientId);
    setUnitOperation(values.unitOperation);
    setStartDate(values.startDate);
    setEndDate(values.endDate);
    setFirstInstallmentDate(values.firstInstallmentDate);
    setItems(values.items);
    setCostCenterId(values.costCenterId);
    setChartOfAccountId(values.chartOfAccountId);
    setBankAccountId(values.bankAccountId);
  };

  useEffect(() => {
    if (contract) {
      setClientId(contract.clientId || "");
      setUnitOperation(contract.unitOperation || "");
      // Mesma conversão de antes (o cast não muda o comportamento em execução).
      const asDateInput = (v: ContractDateValue) => new Date(v as string | number | Date);
      setStartDate(contract.startDate ? asDateInput(contract.startDate) : undefined);
      setEndDate(contract.endDate ? asDateInput(contract.endDate) : undefined);
      setFirstInstallmentDate(contract.firstInstallmentDate ? asDateInput(contract.firstInstallmentDate) : undefined);
      setItems(
        contract.items?.length
          ? contract.items.map((i) => ({
              equipmentId: i.equipmentId || "",
              quantity: i.quantity || 1,
              // Contratos antigos gravaram "mensal": o select só exibe a canônica.
              billingType: normalizeBillingType(i.billingType) || i.billingType || "Mensal",
              unitPrice: i.unitPrice || 0,
            }))
          : [{ equipmentId: "", quantity: 1, billingType: "Mensal", unitPrice: 0 }],
      );
      setCostCenterId(contract.costCenterId || "");
      setChartOfAccountId(contract.chartOfAccountId || "");
      setBankAccountId(contract.bankAccountId || "");
    } else if (duplicateFrom) {
      applyDuplicatedValues(duplicateFrom);
    } else {
      resetForm();
    }
  }, [contract, duplicateFrom, open]);

  const resetForm = () => {
    setClientId("");
    setUnitOperation("");
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

    if (!isEditing && !contractNumber.isValid) {
      toast({
        title: "Número do contrato inválido",
        description: contractNumber.error || "Aguarde a sugestão do número ou informe um número válido.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const client = clients.find((c: any) => c.id === clientId);
      // O que for gravado daqui em diante sai no padrão canônico do select.
      // Só o tipo de cobrança muda; quantidade, preço e equipamento seguem iguais.
      const itemsToSave = normalizeItemsBillingType(items);

      if (isEditing) {
        await updateContract({
          id: contract.id,
          clientId,
          unitOperation: unitOperation.trim(),
          client,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          items: itemsToSave,
          totalValue,
          costCenterId,
          chartOfAccountId,
          bankAccountId,
        });
        toast({ title: "Contrato atualizado!" });
      } else {
        const created = await addContract({
          clientId,
          unitOperation: unitOperation.trim(),
          client,
          startDate,
          endDate,
          firstInstallmentDate: firstInstallmentDate || addMonths(startDate, 1),
          items: itemsToSave,
          totalValue,
          status: "Em Andamento",
          costCenterId,
          chartOfAccountId,
          bankAccountId,
        }, {
          contractNumber: contractNumber.value,
          suggestedId: contractNumber.suggestedId,
          duplicatedFromContractId,
        });
        toast({ title: `Contrato ${created.id} gerado com sucesso!` });
      }
      onOpenChange(false);
    } catch (err: any) {
      if (err?.name === "ContractNumberTakenError") {
        // Nada foi gravado. Se era o número sugerido, outro usuário o usou antes:
        // sugere o próximo livre, mas mantém a mensagem até o usuário agir.
        const wasSuggested = contractNumber.parsed.id === contractNumber.suggestedId;
        const next = wasSuggested ? await contractNumber.reloadSuggestion() : null;
        contractNumber.setServerError(next ? `${err.message} O próximo número disponível, ${next}, foi sugerido.` : err.message);
      }
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
              {isEditing ? "Editar Contrato" : isDuplicating ? "Duplicar Contrato" : "Criar Novo Contrato de Locação"}{" "}
              {isEditing && <span className="text-muted-foreground font-normal">- {contract.id}</span>}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Edite os dados do contrato."
                : isDuplicating
                  ? "Os dados comerciais foram copiados do contrato original. Nada é gravado até você salvar."
                  : "Preencha os dados abaixo para gerar um novo contrato. O valor será calculado automaticamente e lançado no financeiro."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {isDuplicating && (
              <div
                role="status"
                data-testid="duplicating-contract-banner"
                className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/10 p-3 text-sm"
              >
                <Copy className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="font-medium">
                  {duplicatingContractMessage(duplicatedFromContractId || duplicateFrom?.id || "")}
                </span>
              </div>
            )}

            {!isEditing && <ContractNumberField state={contractNumber} disabled={loading} />}

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

            {/* Unit / Operation */}
            <div className="space-y-2">
              <Label className="font-semibold">Unidade / Operação</Label>
              <Input
                placeholder="Ex: Unidade Sumaré, CD Campinas, Operação Mercado Livre"
                value={unitOperation}
                onChange={(e) => setUnitOperation(e.target.value)}
              />
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
                        {/* Mesma lista que a normalização usa (lib/contract-billing.ts). */}
                        {BILLING_TYPES.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>
                            {tipo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="R$ 0,00"
                      value={maskCurrencyBR4(Math.round((item.unitPrice || 0) * 10000).toString())}
                      onChange={(e) => updateItem(idx, "unitPrice", parseCurrencyBR4(e.target.value))}
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
            <Button onClick={handleSubmit} disabled={loading || (!isEditing && contractNumber.loadingSuggestion)}>
              {loading ? "Salvando..." : isEditing ? "Salvar Alterações" : "Gerar Contrato"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddClientDialog open={isClientDialogOpen} onOpenChange={() => setIsClientDialogOpen(false)} client={null} />
    </>
  );
}
