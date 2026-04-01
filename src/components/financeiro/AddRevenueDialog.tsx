import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Plus } from "lucide-react";
import { useStore } from "@/store";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";
import { AddClientDialog } from "@/components/clientes/AddClientDialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRevenue?: any;
}

const paymentMethods = ["Boleto", "Pix", "Cartão de Crédito", "Cartão de Débito", "Transferência", "Dinheiro"];

export const AddRevenueDialog = ({ open, onOpenChange, editingRevenue }: Props) => {
  const { clients, bankAccounts, costCenters, chartOfAccounts, addRevenue, updateRevenue } = useStore();

  const [entityType, setEntityType] = useState("Cliente");
  const [clientId, setClientId] = useState("");
  const [description, setDescription] = useState("");
  const [costCenterId, setCostCenterId] = useState("");
  const [chartOfAccountId, setChartOfAccountId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [status, setStatus] = useState("pendente");
  const [valorBruto, setValorBruto] = useState(0);
  const [desconto, setDesconto] = useState(0);
  const [juros, setJuros] = useState(0);
  const [competenceDate, setCompetenceDate] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date>(new Date());
  const [paymentDate, setPaymentDate] = useState<Date | undefined>();
  const [barcode, setBarcode] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [repetitionQuantity, setRepetitionQuantity] = useState(2);
  const [repetitionType, setRepetitionType] = useState("mensal");
  const [saving, setSaving] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);

  const valorTotal = valorBruto - desconto + juros;

  useEffect(() => {
    if (editingRevenue) {
      setEntityType("Cliente");
      setClientId(editingRevenue.clientId || "");
      setDescription(editingRevenue.description || "");
      setCostCenterId(editingRevenue.costCenterId || "");
      setChartOfAccountId(editingRevenue.chartOfAccountId || "");
      setPaymentMethod(editingRevenue.paymentMethod || "");
      setBankAccountId(editingRevenue.bankAccountId || "");
      setStatus(editingRevenue.status || "pendente");
      setValorBruto(editingRevenue.valorBruto || 0);
      setDesconto(editingRevenue.desconto || 0);
      setJuros(editingRevenue.juros || 0);
      setCompetenceDate(editingRevenue.competence ? new Date(editingRevenue.competence) : new Date());
      setDueDate(editingRevenue.dueDate ? new Date(editingRevenue.dueDate) : new Date());
      setPaymentDate(editingRevenue.paymentDate ? new Date(editingRevenue.paymentDate) : undefined);
      setBarcode(editingRevenue.barcode || "");
    } else {
      resetForm();
    }
  }, [editingRevenue, open]);

  const resetForm = () => {
    setEntityType("Cliente");
    setClientId("");
    setDescription("");
    setCostCenterId("");
    setChartOfAccountId("");
    setPaymentMethod("");
    setBankAccountId("");
    setStatus("pendente");
    setValorBruto(0);
    setDesconto(0);
    setJuros(0);
    setCompetenceDate(new Date());
    setDueDate(new Date());
    setPaymentDate(undefined);
    setBarcode("");
    setIsRecurring(false);
    setRepetitionQuantity(2);
    setRepetitionType("mensal");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const client = clients.find((c: any) => c.id === clientId);
      const data: any = {
        clientId,
        clientName: client?.razaoSocial || client?.nomeFantasia || "",
        description,
        costCenterId,
        chartOfAccountId,
        paymentMethod,
        bankAccountId,
        status,
        valorBruto,
        desconto,
        juros,
        valorTotal,
        competence: Timestamp.fromDate(competenceDate),
        dueDate: Timestamp.fromDate(dueDate),
        barcode,
      };
      if (paymentDate) data.paymentDate = Timestamp.fromDate(paymentDate);

      if (editingRevenue) {
        await updateRevenue({ ...data, id: editingRevenue.id });
        toast.success("Receita atualizada!");
      } else {
        await addRevenue({ ...data, isRecurring, repetitionQuantity, repetitionType });
        toast.success("Receita adicionada!");
      }
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar receita.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRevenue ? "Editar Receita" : "Adicionar Nova Receita"}</DialogTitle>
            <DialogDescription>Preencha os dados da conta a receber.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Entity + Client */}
            <div className="grid grid-cols-[1fr_1fr_auto] gap-3">
              <div className="space-y-1">
                <Label>Entidade</Label>
                <Select value={entityType} onValueChange={setEntityType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cliente">Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Cliente</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.razaoSocial || c.nomeFantasia}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" size="icon" onClick={() => setShowAddClient(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label>Informações complementares</Label>
              <Textarea placeholder="Ex: Fatura de Locação..." value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>

            {/* Cost Center, Chart of Accounts, Payment Method */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Centro de Custo</Label>
                <Select value={costCenterId} onValueChange={setCostCenterId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {costCenters.map((cc: any) => (
                      <SelectItem key={cc.id} value={cc.id}>{cc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Plano de Contas</Label>
                <Select value={chartOfAccountId} onValueChange={setChartOfAccountId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {chartOfAccounts.map((ca: any) => (
                      <SelectItem key={ca.id} value={ca.id}>{ca.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Forma de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Bank Account + Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Conta Bancária</Label>
                <Select value={bankAccountId} onValueChange={setBankAccountId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((ba: any) => (
                      <SelectItem key={ba.id} value={ba.id}>{ba.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="recebido">Recebido</SelectItem>
                    <SelectItem value="vencido">Vencido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Values */}
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label>Valor Bruto (R$)</Label>
                <Input type="number" value={valorBruto} onChange={(e) => setValorBruto(Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label>Desconto (R$)</Label>
                <Input type="number" value={desconto} onChange={(e) => setDesconto(Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label>Juros (R$)</Label>
                <Input type="number" value={juros} onChange={(e) => setJuros(Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label>Valor Total (R$)</Label>
                <div className="h-10 flex items-center px-3 rounded-md bg-muted text-sm font-medium">
                  {formatCurrency(valorTotal)}
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Data de Competência", value: competenceDate, onChange: setCompetenceDate },
                { label: "Data de Vencimento", value: dueDate, onChange: setDueDate },
              ].map(({ label, value, onChange }) => (
                <div key={label} className="space-y-1">
                  <Label>{label}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(value, "dd/MM/yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={value} onSelect={(d) => d && onChange(d)} locale={ptBR} />
                    </PopoverContent>
                  </Popover>
                </div>
              ))}
              <div className="space-y-1">
                <Label>Data de Pagamento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {paymentDate ? format(paymentDate, "dd/MM/yyyy") : "dd/mm/aaaa"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={paymentDate} onSelect={setPaymentDate} locale={ptBR} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Barcode */}
            <div className="space-y-1">
              <Label>Código de Barras (Opcional)</Label>
              <Input placeholder="Insira o código de barras do boleto" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
            </div>

            {/* Recurring toggle */}
            {!editingRevenue && (
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <Label>Lançamento Recorrente/Parcelado</Label>
                <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
              </div>
            )}

            {isRecurring && !editingRevenue && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Quantidade</Label>
                  <Input type="number" min={2} value={repetitionQuantity} onChange={(e) => setRepetitionQuantity(Number(e.target.value))} />
                </div>
                <div className="space-y-1">
                  <Label>Frequência</Label>
                  <Select value={repetitionType} onValueChange={setRepetitionType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diario">Diário</SelectItem>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AddClientDialog open={showAddClient} onOpenChange={setShowAddClient} />
    </>
  );
};
