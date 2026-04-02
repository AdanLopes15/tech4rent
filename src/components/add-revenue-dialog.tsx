//src/components/add-revenue-dialog.tsx

import { useEffect, useMemo, useState } from "react";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, PlusCircle } from "lucide-react";

import { useStore } from "@/store";
import { useToast } from "@/hooks/use-toast";
import { cn, formatCurrency } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { AddClientDialog } from "@/components/clientes/AddClientDialog";

interface AddRevenueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revenue?: any;
  viewOnly?: boolean;
}

export function AddRevenueDialog({ open, onOpenChange, revenue, viewOnly = false }: AddRevenueDialogProps) {
  const { clients, suppliers, collaborators, costCenters, chartOfAccounts, bankAccounts, addRevenue, updateRevenue } =
    useStore();

  const { toast } = useToast();

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
  const [repetitionType, setRepetitionType] = useState<"diario" | "semanal" | "mensal" | "anual">("mensal");
  const [repetitionQuantity, setRepetitionQuantity] = useState(1);

  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);

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
    setRepetitionType("mensal");
    setRepetitionQuantity(1);
  };

  const valorTotal = useMemo(() => {
    return Number(valorBruto || 0) - Number(desconto || 0) + Number(juros || 0);
  }, [valorBruto, desconto, juros]);

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
    () => [...chartOfAccounts].sort((a: any, b: any) => String(a.name).localeCompare(String(b.name))),
    [chartOfAccounts],
  );

  const sortedBankAccounts = useMemo(
    () =>
      [...bankAccounts].sort((a: any, b: any) =>
        String(a.name || a.bankName).localeCompare(String(b.name || b.bankName)),
      ),
    [bankAccounts],
  );

  useEffect(() => {
    if (!open) return;

    if (revenue) {
      setEntityType(revenue.entityType || "cliente");
      setEntityId(revenue.entityId || revenue.clientId || "");
      setDescription(revenue.description || "");
      setValorBruto(Number(revenue.valorBruto || revenue.valorTotal || 0));
      setDesconto(Number(revenue.desconto || 0));
      setJuros(Number(revenue.juros || 0));
      setCompetenceDate(revenue.competenceDate ? new Date(revenue.competenceDate) : undefined);
      setDueDate(revenue.dueDate ? new Date(revenue.dueDate) : undefined);
      setPaymentDate(revenue.paymentDate ? new Date(revenue.paymentDate) : undefined);
      setCostCenterId(revenue.costCenterId || "");
      setChartOfAccountId(revenue.chartOfAccountId || "");
      setBankAccountId(revenue.bankAccountId || "");
      setPaymentMethod(revenue.paymentMethod || "");
      setStatus(revenue.status || "pendente");
      setBarcode(revenue.barcode || "");
      setIsRecurring(!!revenue.isRecurring);
      setRepetitionType(revenue.repetitionType || "mensal");
      setRepetitionQuantity(Number(revenue.repetitionQuantity || 1));
    } else {
      resetForm();
    }
  }, [open, revenue]);

  useEffect(() => {
    if (status !== "recebido" && !viewOnly) {
      setPaymentDate(undefined);
    }
  }, [status, viewOnly]);

  const handleDateInputChange = (setter: (date: Date | undefined) => void, value: string) => {
    const parsedDate = parse(value, "dd/MM/yyyy", new Date());

    if (!isNaN(parsedDate.getTime())) {
      setter(parsedDate);
    } else if (value === "") {
      setter(undefined);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!dueDate || !competenceDate || valorTotal <= 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha os campos obrigatórios da receita.",
        variant: "destructive",
      });
      return;
    }

    const revenueData = {
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

    try {
      if (revenue) {
        await updateRevenue({ id: revenue.id, ...revenueData });
        toast({ title: "Receita atualizada com sucesso!" });
      } else {
        await addRevenue(revenueData);
        toast({ title: "Receita adicionada com sucesso!" });
      }

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao salvar receita",
        description: error.message || "Não foi possível salvar a receita.",
        variant: "destructive",
      });
    }
  };

  const dialogTitle = viewOnly ? "Visualizar Receita" : revenue ? "Editar Receita" : "Adicionar Nova Receita";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl bg-card">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">{dialogTitle}</DialogTitle>
              <DialogDescription>
                {viewOnly ? "Detalhes da conta a receber." : "Preencha os dados da conta a receber."}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-4 max-h-[75vh] overflow-y-auto pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Entidade</Label>
                  <Select
                    value={entityType}
                    onValueChange={(val) => {
                      setEntityType(val as any);
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
                      type="button"
                      className="flex-shrink-0"
                      onClick={() => setIsAddClientDialogOpen(true)}
                      disabled={viewOnly || entityType !== "cliente"}
                    >
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Informações complementares</Label>
                <Textarea
                  id="descricao"
                  placeholder="Ex: Fatura de locação..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={viewOnly}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Centro de Custo</Label>
                  <Select value={costCenterId} onValueChange={setCostCenterId} disabled={viewOnly}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedCostCenters.map((cc: any) => (
                        <SelectItem key={cc.id} value={cc.id}>
                          {cc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Plano de Contas</Label>
                  <Select value={chartOfAccountId} onValueChange={setChartOfAccountId} disabled={viewOnly}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedChartOfAccounts
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
                  <Select value={bankAccountId} onValueChange={setBankAccountId} disabled={viewOnly}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedBankAccounts.map((acc: any) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name || acc.bankName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
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

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Valor Bruto (R$)</Label>
                  <Input
                    type="number"
                    value={valorBruto}
                    onChange={(e) => setValorBruto(Number(e.target.value))}
                    disabled={viewOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Desconto (R$)</Label>
                  <Input
                    type="number"
                    value={desconto}
                    onChange={(e) => setDesconto(Number(e.target.value))}
                    disabled={viewOnly}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Juros (R$)</Label>
                  <Input
                    type="number"
                    value={juros}
                    onChange={(e) => setJuros(Number(e.target.value))}
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
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
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
                          onSelect={setCompetenceDate}
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
                      disabled={viewOnly || (isRecurring && !!revenue)}
                      className="pr-8"
                    />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                          disabled={viewOnly || (isRecurring && !!revenue)}
                        >
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus locale={ptBR} />
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
                      disabled={viewOnly || status !== "recebido"}
                      className="pr-8"
                    />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                          disabled={viewOnly || status !== "recebido"}
                        >
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
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
                  <Label htmlFor="recorrente-receita" className="text-base font-semibold">
                    Lançamento Recorrente/Parcelado
                  </Label>
                  <Switch
                    id="recorrente-receita"
                    checked={isRecurring}
                    onCheckedChange={setIsRecurring}
                    disabled={viewOnly || !!revenue}
                  />
                </div>

                {isRecurring && !revenue && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label>Repetição</Label>
                      <Select
                        value={repetitionType}
                        onValueChange={(val) => setRepetitionType(val as any)}
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
                        disabled={viewOnly}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Data da 1ª Parcela</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            type="button"
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
                  <Button type="submit">Salvar</Button>
                </>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AddClientDialog
        open={isAddClientDialogOpen}
        onOpenChange={() => setIsAddClientDialogOpen(false)}
        client={null}
      />
    </>
  );
}
