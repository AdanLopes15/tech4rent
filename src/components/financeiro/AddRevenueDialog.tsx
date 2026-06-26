//src/components/financeiro/AddRevenueDialog.tsx

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
import { AddClientDialog } from "@/components/clientes/AddClientDialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revenue?: any;
  viewOnly?: boolean;
}

export const AddRevenueDialog = ({ open, onOpenChange, revenue, viewOnly = false }: Props) => {
  const { clients, suppliers, collaborators, bankAccounts, costCenters, chartOfAccounts, addRevenue, updateRevenue } =
    useStore();

  const [entityType, setEntityType] = useState<"cliente" | "fornecedor" | "colaborador" | "">("cliente");
  const [entityId, setEntityId] = useState("");
  const [description, setDescription] = useState("");

  const [valorBruto, setValorBruto] = useState<number>(0);
  const [desconto, setDesconto] = useState<number>(0);
  const [juros, setJuros] = useState<number>(0);

  const [competenceDate, setCompetenceDate] = useState<Date>();
  const [dueDate, setDueDate] = useState<Date>();
  const [paymentDate, setPaymentDate] = useState<Date | undefined>();

  const [costCenterId, setCostCenterId] = useState("");
  const [chartOfAccountId, setChartOfAccountId] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [status, setStatus] = useState("pendente");
  const [barcode, setBarcode] = useState("");

  const [isRecurring, setIsRecurring] = useState(false);
  const [repetitionQuantity, setRepetitionQuantity] = useState(1);
  const [repetitionType, setRepetitionType] = useState<"diario" | "semanal" | "mensal" | "anual">("mensal");

  const [saving, setSaving] = useState(false);
  const [competenceOpen, setCompetenceOpen] = useState(false);
  const [dueOpen, setDueOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);

  const valorTotal = useMemo(() => valorBruto - desconto + juros, [valorBruto, desconto, juros]);

  const entityList = useMemo(() => {
    let list: any[] = [];

    switch (entityType) {
      case "cliente":
        list = [...clients];
        break;
      case "fornecedor":
        list = [...suppliers];
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
  }, [entityType, clients, suppliers, collaborators]);

  const sortedCostCenters = useMemo(
    () => [...costCenters].sort((a: any, b: any) => String(a.name).localeCompare(String(b.name))),
    [costCenters],
  );

  const sortedChartOfAccounts = useMemo(
    () =>
      [...chartOfAccounts]
        .filter((account: any) => account.type === "receita")
        .sort((a: any, b: any) => String(a.name).localeCompare(String(b.name))),
    [chartOfAccounts],
  );

  const sortedBankAccounts = useMemo(
    () => [...bankAccounts].sort((a: any, b: any) => String(a.name).localeCompare(String(b.name))),
    [bankAccounts],
  );

  const resetForm = () => {
    setEntityType("cliente");
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
    setRepetitionQuantity(1);
    setRepetitionType("mensal");
  };

  useEffect(() => {
    if (!open) return;

    if (revenue) {
      setEntityType(revenue.entityType || "cliente");
      setEntityId(revenue.entityId || revenue.clientId || "");
      setDescription(revenue.description || "");
      setValorBruto(revenue.valorBruto || revenue.valorTotal || 0);
      setDesconto(revenue.desconto || 0);
      setJuros(revenue.juros || 0);
      setCompetenceDate(
        revenue.competenceDate
          ? new Date(revenue.competenceDate)
          : revenue.competence
            ? new Date(revenue.competence)
            : undefined,
      );
      setDueDate(revenue.dueDate ? new Date(revenue.dueDate) : undefined);
      setPaymentDate(revenue.paymentDate ? new Date(revenue.paymentDate) : undefined);
      setCostCenterId(revenue.costCenterId || "");
      setChartOfAccountId(revenue.chartOfAccountId || "");
      setBankAccountId(revenue.bankAccountId || "");
      setPaymentMethod(revenue.paymentMethod || "");
      setStatus(String(revenue.status || "pendente").toLowerCase());
      setBarcode(revenue.barcode || "");
      setIsRecurring(!!revenue.isRecurring);
    } else {
      resetForm();
    }
  }, [revenue, open]);

  useEffect(() => {
    if (status !== "recebido" && !viewOnly) {
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

  const handleSave = async () => {
    if (!dueDate || !competenceDate || valorTotal <= 0) {
      toast.error("Preencha os campos obrigatórios.");
      return;
    }

    setSaving(true);

    try {
      const selectedClient =
        entityType === "cliente" ? clients.find((client: any) => client.id === entityId) : undefined;

      const data: any = {
        entityType,
        entityId: entityId || null,
        clientId: entityType === "cliente" ? entityId || null : null,
        clientName: entityType === "cliente" ? selectedClient?.razaoSocial || selectedClient?.name || "" : "",
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

      if (revenue) {
        await updateRevenue({ id: revenue.id, ...data });
        toast.success("Receita atualizada!");
      } else {
        await addRevenue(data);
        toast.success("Receita adicionada!");
      }

      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar receita.");
    } finally {
      setSaving(false);
    }
  };

  const dialogTitle = viewOnly ? "Visualizar Receita" : revenue ? "Editar Receita" : "Adicionar Nova Receita";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>
              {viewOnly ? "Detalhes da conta a receber." : "Preencha os dados da conta a receber."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3">
              <div className="space-y-1">
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

              <div className="space-y-1">
                <Label className="capitalize">{entityType || "Entidade"}</Label>
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
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowAddClient(true)}
                  disabled={viewOnly || entityType !== "cliente"}
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Informações complementares</Label>
              <Textarea
                placeholder="Ex: Fatura de Locação..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                disabled={viewOnly}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Centro de Custo</Label>
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
              </div>

              <div className="space-y-1">
                <Label>Plano de Contas</Label>
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
              </div>

              <div className="space-y-1">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Conta Bancária</Label>
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
              </div>

              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus} disabled={viewOnly}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="atrasado">Atrasado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="recebido">Recebido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label>Valor Bruto (R$)</Label>
                <Input
                  type="number"
                  value={valorBruto}
                  onChange={(e) => setValorBruto(Number(e.target.value))}
                  disabled={viewOnly}
                />
              </div>

              <div className="space-y-1">
                <Label>Desconto (R$)</Label>
                <Input
                  type="number"
                  value={desconto}
                  onChange={(e) => setDesconto(Number(e.target.value))}
                  disabled={viewOnly}
                />
              </div>

              <div className="space-y-1">
                <Label>Juros (R$)</Label>
                <Input
                  type="number"
                  value={juros}
                  onChange={(e) => setJuros(Number(e.target.value))}
                  disabled={viewOnly}
                />
              </div>

              <div className="space-y-1">
                <Label>Valor Total (R$)</Label>
                <Input value={formatCurrency(valorTotal)} disabled />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
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
                  <Popover>
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
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={competenceDate}
                        onSelect={setCompetenceDate}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-1">
                <Label>Data de Vencimento</Label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="dd/mm/aaaa"
                    value={dueDate ? format(dueDate, "dd/MM/yyyy") : ""}
                    onChange={(e) => handleDateInputChange(setDueDate, e.target.value)}
                    disabled={viewOnly || (isRecurring && !!revenue)}
                    className="pr-8"
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        disabled={viewOnly || (isRecurring && !!revenue)}
                      >
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus locale={ptBR} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-1">
                <Label>Data de Pagamento</Label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="dd/mm/aaaa"
                    value={paymentDate ? format(paymentDate, "dd/MM/yyyy") : ""}
                    onChange={(e) => handleDateInputChange(setPaymentDate, e.target.value)}
                    disabled={viewOnly || status !== "recebido"}
                    className="pr-8"
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        disabled={viewOnly || status !== "recebido"}
                      >
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={paymentDate}
                        onSelect={setPaymentDate}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Código de Barras (Opcional)</Label>
              <Input
                placeholder="Insira o código de barras do boleto"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                disabled={viewOnly}
              />
            </div>

            <div className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Lançamento Recorrente/Parcelado</Label>
                <Switch checked={isRecurring} onCheckedChange={setIsRecurring} disabled={viewOnly || !!revenue} />
              </div>

              {isRecurring && !revenue && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t">
                  <div className="space-y-1">
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

                  <div className="space-y-1">
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      min={1}
                      value={repetitionQuantity}
                      onChange={(e) => setRepetitionQuantity(Number(e.target.value))}
                      disabled={viewOnly}
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              {viewOnly ? (
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Fechar
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? "Salvando..." : "Salvar"}
                  </Button>
                </>
              )}
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <AddClientDialog open={showAddClient} onOpenChange={setShowAddClient} />
    </>
  );
};
