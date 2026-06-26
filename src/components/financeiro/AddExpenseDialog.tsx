//src/components/financeiro/AddExpenseDialog.tsx

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, PlusCircle } from "lucide-react";
import { useStore } from "@/store";
import { cn, formatCurrency, parseCurrencyBR } from "@/lib/utils";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { AddSupplierDialog } from "@/components/fornecedores/AddSupplierDialog";
import { AddClientDialog } from "@/components/clientes/AddClientDialog";
import { AddCollaboratorDialog } from "@/components/colaboradores/AddCollaboratorDialog";
import AddCostCenterDialog from "@/components/centro-de-custo/AddCostCenterDialog";
import { AddAccountDialog } from "@/components/plano-de-contas/AddAccountDialog";
import AddBankAccountDialog from "@/components/bancos/AddBankAccountDialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: any;
  viewOnly?: boolean;
}

export const AddExpenseDialog = ({ open, onOpenChange, expense, viewOnly = false }: Props) => {
  const { suppliers, clients, collaborators, costCenters, chartOfAccounts, bankAccounts, addExpense, updateExpense } =
    useStore();

  const [entityType, setEntityType] = useState<"fornecedor" | "cliente" | "colaborador" | "">("fornecedor");
  const [entityId, setEntityId] = useState("");
  const [description, setDescription] = useState("");

  const [valorBruto, setValorBruto] = useState<number>(0);
  const [desconto, setDesconto] = useState<number>(0);
  const [juros, setJuros] = useState<number>(0);

  const [competenceDate, setCompetenceDate] = useState<Date | undefined>();
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [paymentDate, setPaymentDate] = useState<Date | undefined>();

  const [costCenterId, setCostCenterId] = useState("");
  const [chartOfAccountId, setChartOfAccountId] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [status, setStatus] = useState("pendente");
  const [barcode, setBarcode] = useState("");

  const [isRecurring, setIsRecurring] = useState(false);
  const [repetitionType, setRepetitionType] = useState<"diario" | "semanal" | "mensal" | "anual">("mensal");
  const [repetitionQuantity, setRepetitionQuantity] = useState(1);

  const [saving, setSaving] = useState(false);
  const [competenceOpen, setCompetenceOpen] = useState(false);
  const [dueOpen, setDueOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [firstInstallmentOpen, setFirstInstallmentOpen] = useState(false);

  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddCollaborator, setShowAddCollaborator] = useState(false);
  const [showAddCostCenter, setShowAddCostCenter] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddBankAccount, setShowAddBankAccount] = useState(false);

  const valorTotal = useMemo(() => valorBruto - desconto + juros, [valorBruto, desconto, juros]);

  const entityList = useMemo(() => {
    let list: any[] = [];

    switch (entityType) {
      case "fornecedor":
        list = [...suppliers];
        break;
      case "cliente":
        list = [...clients];
        break;
      case "colaborador":
        list = [...collaborators];
        break;
      default:
        list = [];
    }

    return list.sort((a, b) =>
      String(a.name || a.razaoSocial || "").localeCompare(String(b.name || b.razaoSocial || "")),
    );
  }, [entityType, suppliers, clients, collaborators]);

  const sortedCostCenters = useMemo(
    () => [...costCenters].sort((a: any, b: any) => String(a.name).localeCompare(String(b.name))),
    [costCenters],
  );

  const sortedChartOfAccounts = useMemo(
    () =>
      [...chartOfAccounts]
        .filter((account: any) => account.type === "despesa")
        .sort((a: any, b: any) => String(a.name).localeCompare(String(b.name))),
    [chartOfAccounts],
  );

  const sortedBankAccounts = useMemo(
    () => [...bankAccounts].sort((a: any, b: any) => String(a.name).localeCompare(String(b.name))),
    [bankAccounts],
  );

  const resetForm = () => {
    setEntityType("fornecedor");
    setEntityId("");
    setDescription("");
    setValorBruto(0);
    setDesconto(0);
    setJuros(0);
    setCompetenceDate(new Date());
    setDueDate(new Date());
    setPaymentDate(undefined);
    setCostCenterId("");
    setChartOfAccountId("");
    setBankAccountId("");
    setPaymentMethod("");
    setStatus("pendente");
    setBarcode("");
    setIsRecurring(false);
    setRepetitionType("mensal");
    setRepetitionQuantity(1);
  };

  useEffect(() => {
    if (!open) return;

    if (expense) {
      setEntityType(expense.entityType || "fornecedor");
      setEntityId(expense.entityId || "");
      setDescription(expense.description || "");
      setValorBruto(expense.valorBruto || expense.valorTotal || 0);
      setDesconto(expense.desconto || 0);
      setJuros(expense.juros || 0);
      setCompetenceDate(
        expense.competenceDate
          ? new Date(expense.competenceDate)
          : expense.competence
            ? new Date(expense.competence)
            : undefined,
      );
      setDueDate(expense.dueDate ? new Date(expense.dueDate) : undefined);
      setPaymentDate(expense.paymentDate ? new Date(expense.paymentDate) : undefined);
      setCostCenterId(expense.costCenterId || "");
      setChartOfAccountId(expense.chartOfAccountId || "");
      setBankAccountId(expense.bankAccountId || "");
      setPaymentMethod(expense.paymentMethod || "");
      setStatus(String(expense.status || "pendente").toLowerCase());
      setBarcode(expense.barcode || "");
      setIsRecurring(!!expense.isRecurring);
    } else {
      resetForm();
    }
  }, [expense, open]);

  useEffect(() => {
    if (status !== "pago" && !viewOnly) {
      setPaymentDate(undefined);
    }
  }, [status, viewOnly]);

  const handleDateInputChange = (setter: (date: Date | undefined) => void, value: string) => {
    const parsedDate = parse(value, "dd/MM/yyyy", new Date());
    if (!Number.isNaN(parsedDate.getTime())) {
      setter(parsedDate);
    } else if (value === "") {
      setter(undefined);
    }
  };

  const handleOpenAddEntityDialog = () => {
    switch (entityType) {
      case "fornecedor":
        setShowAddSupplier(true);
        break;
      case "cliente":
        setShowAddClient(true);
        break;
      case "colaborador":
        setShowAddCollaborator(true);
        break;
      default:
        break;
    }
  };

  const handleSave = async () => {
    if (!dueDate || !competenceDate || valorTotal <= 0) {
      toast.error("Preencha os campos obrigatórios.");
      return;
    }

    setSaving(true);

    try {
      const data: any = {
        entityType,
        entityId: entityId || null,
        description,
        valorBruto,
        desconto,
        juros,
        valorTotal,
        competenceDate,
        dueDate,
        paymentDate: paymentDate || null,
        costCenterId,
        chartOfAccountId,
        bankAccountId,
        paymentMethod,
        status,
        barcode,
        isRecurring,
        repetitionType,
        repetitionQuantity,
      };

      if (expense) {
        await updateExpense({ id: expense.id, ...data });
        toast.success("Despesa atualizada!");
      } else {
        await addExpense(data);
        toast.success("Despesa adicionada!");
      }

      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar despesa.");
    } finally {
      setSaving(false);
    }
  };

  const dialogTitle = viewOnly ? "Visualizar Despesa" : expense ? "Editar Despesa" : "Adicionar Nova Despesa";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>
              {viewOnly ? "Detalhes da conta a pagar." : "Preencha os dados da despesa para salvar."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Entidade</Label>
                <Select
                  value={entityType}
                  onValueChange={(value) => {
                    setEntityType(value as any);
                    setEntityId("");
                  }}
                  disabled={viewOnly}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cliente">Cliente</SelectItem>
                    <SelectItem value="colaborador">Colaborador</SelectItem>
                    <SelectItem value="fornecedor">Fornecedor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="capitalize">{entityType || "Entidade"}</Label>
                <div className="flex items-center gap-2">
                  <Select value={entityId} onValueChange={setEntityId} disabled={!entityType || viewOnly}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {entityList.map((entity: any) => (
                        <SelectItem key={entity.id} value={entity.id}>
                          {entity.name || entity.razaoSocial}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    size="icon"
                    variant="outline"
                    className="flex-shrink-0"
                    type="button"
                    onClick={handleOpenAddEntityDialog}
                    disabled={viewOnly || !entityType}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Informações complementares</Label>
              <Textarea
                placeholder="Ex: Compra de peças para o veículo XYZ..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={viewOnly}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Centro de Custo</Label>
                <div className="flex items-center gap-2">
                  <Select value={costCenterId} onValueChange={setCostCenterId} disabled={viewOnly}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedCostCenters.map((costCenter: any) => (
                        <SelectItem key={costCenter.id} value={costCenter.id}>
                          {costCenter.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    size="icon"
                    variant="outline"
                    type="button"
                    onClick={() => setShowAddCostCenter(true)}
                    disabled={viewOnly}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Plano de Contas</Label>
                <div className="flex items-center gap-2">
                  <Select value={chartOfAccountId} onValueChange={setChartOfAccountId} disabled={viewOnly}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedChartOfAccounts.map((account: any) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    size="icon"
                    variant="outline"
                    type="button"
                    onClick={() => setShowAddAccount(true)}
                    disabled={viewOnly}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Forma de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={viewOnly}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Conta Bancária</Label>
                <div className="flex items-center gap-2">
                  <Select value={bankAccountId} onValueChange={setBankAccountId} disabled={viewOnly}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedBankAccounts.map((account: any) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    size="icon"
                    variant="outline"
                    type="button"
                    onClick={() => setShowAddBankAccount(true)}
                    disabled={viewOnly}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus} disabled={viewOnly}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="vencido">Vencido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Valor Bruto (R$)</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={formatCurrency(valorBruto)}
                  onChange={(e) => setValorBruto(parseCurrencyBR(e.target.value))}
                  disabled={viewOnly}
                />
              </div>

              <div className="space-y-2">
                <Label>Desconto (R$)</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={formatCurrency(desconto)}
                  onChange={(e) => setDesconto(parseCurrencyBR(e.target.value))}
                  disabled={viewOnly}
                />
              </div>

              <div className="space-y-2">
                <Label>Juros (R$)</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={formatCurrency(juros)}
                  onChange={(e) => setJuros(parseCurrencyBR(e.target.value))}
                  disabled={viewOnly}
                />
              </div>

              <div className="space-y-2">
                <Label>Valor Total (R$)</Label>
                <Input value={formatCurrency(valorTotal)} disabled />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Data de Competência</Label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="dd/mm/aaaa"
                    value={competenceDate ? format(competenceDate, "dd/MM/yyyy") : ""}
                    onChange={(e) => handleDateInputChange(setCompetenceDate, e.target.value)}
                    disabled={viewOnly}
                    className="pr-8"
                  />
                  <Popover open={competenceOpen} onOpenChange={setCompetenceOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        disabled={viewOnly}
                      >
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={competenceDate}
                        onSelect={(d) => { setCompetenceDate(d); setCompetenceOpen(false); }}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Data de Vencimento</Label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="dd/mm/aaaa"
                    value={dueDate ? format(dueDate, "dd/MM/yyyy") : ""}
                    onChange={(e) => handleDateInputChange(setDueDate, e.target.value)}
                    disabled={viewOnly || isRecurring}
                    className="pr-8"
                  />
                  <Popover open={dueOpen} onOpenChange={setDueOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        disabled={viewOnly || isRecurring}
                      >
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={dueDate} onSelect={(d) => { setDueDate(d); setDueOpen(false); }} initialFocus locale={ptBR} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Data de Pagamento</Label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="dd/mm/aaaa"
                    value={paymentDate ? format(paymentDate, "dd/MM/yyyy") : ""}
                    onChange={(e) => handleDateInputChange(setPaymentDate, e.target.value)}
                    disabled={viewOnly || status !== "pago"}
                    className="pr-8"
                  />
                  <Popover open={paymentOpen} onOpenChange={setPaymentOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        disabled={viewOnly || status !== "pago"}
                      >
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={paymentDate}
                        onSelect={(d) => { setPaymentDate(d); setPaymentOpen(false); }}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Código de Barras (Opcional)</Label>
              <Input
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Insira o código de barras do boleto"
                disabled={viewOnly}
              />
            </div>

            <div className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Lançamento Recorrente/Parcelado</Label>
                <Switch checked={isRecurring} onCheckedChange={setIsRecurring} disabled={viewOnly || !!expense} />
              </div>

              {isRecurring && !expense && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label>Repetição</Label>
                    <Select
                      value={repetitionType}
                      onValueChange={(value) => setRepetitionType(value as any)}
                      disabled={viewOnly}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="diario">Diário</SelectItem>
                        <SelectItem value="semanal">Semanal</SelectItem>
                        <SelectItem value="mensal">Mensal</SelectItem>
                        <SelectItem value="anual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      value={repetitionQuantity}
                      onChange={(e) => setRepetitionQuantity(Number(e.target.value))}
                      min={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Data da 1ª Parcela</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dueDate && "text-muted-foreground",
                          )}
                          disabled={viewOnly}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dueDate ? format(dueDate, "dd/MM/yyyy") : <span>dd/mm/aaaa</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus locale={ptBR} />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              {viewOnly ? (
                <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                  Fechar
                </Button>
              ) : (
                <>
                  <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                    Cancelar
                  </Button>
                  <Button type="button" onClick={handleSave} disabled={saving}>
                    {saving ? "Salvando..." : "Salvar"}
                  </Button>
                </>
              )}
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <AddSupplierDialog open={showAddSupplier} onOpenChange={setShowAddSupplier} />
      <AddClientDialog open={showAddClient} onOpenChange={setShowAddClient} />
      <AddCollaboratorDialog open={showAddCollaborator} onOpenChange={setShowAddCollaborator} />
      <AddCostCenterDialog open={showAddCostCenter} onOpenChange={setShowAddCostCenter} />
      <AddAccountDialog open={showAddAccount} onOpenChange={setShowAddAccount} />
      <AddBankAccountDialog open={showAddBankAccount} onOpenChange={setShowAddBankAccount} />
    </>
  );
};
