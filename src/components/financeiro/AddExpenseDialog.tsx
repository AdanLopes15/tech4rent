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
import { AddSupplierDialog } from "@/components/fornecedores/AddSupplierDialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingExpense?: any;
}

const paymentMethods = ["Boleto", "Pix", "Cartão de Crédito", "Cartão de Débito", "Transferência", "Dinheiro"];

export const AddExpenseDialog = ({ open, onOpenChange, editingExpense }: Props) => {
  const { suppliers, bankAccounts, costCenters, chartOfAccounts, addExpense, updateExpense } = useStore();

  const [entityType, setEntityType] = useState("Fornecedor");
  const [supplierId, setSupplierId] = useState("");
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
  const [showAddSupplier, setShowAddSupplier] = useState(false);

  const valorTotal = valorBruto - desconto + juros;

  useEffect(() => {
    if (editingExpense) {
      setSupplierId(editingExpense.supplierId || "");
      setDescription(editingExpense.description || "");
      setCostCenterId(editingExpense.costCenterId || "");
      setChartOfAccountId(editingExpense.chartOfAccountId || "");
      setPaymentMethod(editingExpense.paymentMethod || "");
      setBankAccountId(editingExpense.bankAccountId || "");
      setStatus(editingExpense.status || "pendente");
      setValorBruto(editingExpense.valorBruto || 0);
      setDesconto(editingExpense.desconto || 0);
      setJuros(editingExpense.juros || 0);
      setCompetenceDate(editingExpense.competence ? new Date(editingExpense.competence) : new Date());
      setDueDate(editingExpense.dueDate ? new Date(editingExpense.dueDate) : new Date());
      setPaymentDate(editingExpense.paymentDate ? new Date(editingExpense.paymentDate) : undefined);
      setBarcode(editingExpense.barcode || "");
    } else {
      resetForm();
    }
  }, [editingExpense, open]);

  const resetForm = () => {
    setSupplierId(""); setDescription(""); setCostCenterId(""); setChartOfAccountId("");
    setPaymentMethod(""); setBankAccountId(""); setStatus("pendente");
    setValorBruto(0); setDesconto(0); setJuros(0);
    setCompetenceDate(new Date()); setDueDate(new Date()); setPaymentDate(undefined);
    setBarcode(""); setIsRecurring(false); setRepetitionQuantity(2); setRepetitionType("mensal");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const supplier = suppliers.find((s: any) => s.id === supplierId);
      const data: any = {
        supplierId,
        supplierName: supplier?.razaoSocial || supplier?.nomeFantasia || "",
        description, costCenterId, chartOfAccountId, paymentMethod, bankAccountId, status,
        valorBruto, desconto, juros, valorTotal,
        competence: Timestamp.fromDate(competenceDate),
        dueDate: Timestamp.fromDate(dueDate),
        barcode,
      };
      if (paymentDate) data.paymentDate = Timestamp.fromDate(paymentDate);

      if (editingExpense) {
        await updateExpense({ ...data, id: editingExpense.id });
        toast.success("Despesa atualizada!");
      } else {
        await addExpense({ ...data, isRecurring, repetitionQuantity, repetitionType });
        toast.success("Despesa adicionada!");
      }
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar despesa.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingExpense ? "Editar Despesa" : "Adicionar Nova Despesa"}</DialogTitle>
            <DialogDescription>Preencha os dados da despesa para salvar.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-[1fr_1fr_auto] gap-3">
              <div className="space-y-1">
                <Label>Entidade</Label>
                <Select value={entityType} onValueChange={setEntityType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Fornecedor">Fornecedor</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Fornecedor</Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>{s.razaoSocial || s.nomeFantasia}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" size="icon" onClick={() => setShowAddSupplier(true)}><Plus className="h-4 w-4" /></Button>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Informações complementares</Label>
              <Textarea placeholder="Ex: Compra de peças para o veículo XYZ..." value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Centro de Custo</Label>
                <Select value={costCenterId} onValueChange={setCostCenterId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{costCenters.map((cc: any) => <SelectItem key={cc.id} value={cc.id}>{cc.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Plano de Contas</Label>
                <Select value={chartOfAccountId} onValueChange={setChartOfAccountId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{chartOfAccounts.map((ca: any) => <SelectItem key={ca.id} value={ca.id}>{ca.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Forma de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{paymentMethods.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Conta Bancária</Label>
                <Select value={bankAccountId} onValueChange={setBankAccountId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{bankAccounts.map((ba: any) => <SelectItem key={ba.id} value={ba.id}>{ba.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="atrasado">Atrasado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1"><Label>Valor Bruto (R$)</Label><Input type="number" value={valorBruto} onChange={(e) => setValorBruto(Number(e.target.value))} /></div>
              <div className="space-y-1"><Label>Desconto (R$)</Label><Input type="number" value={desconto} onChange={(e) => setDesconto(Number(e.target.value))} /></div>
              <div className="space-y-1"><Label>Juros (R$)</Label><Input type="number" value={juros} onChange={(e) => setJuros(Number(e.target.value))} /></div>
              <div className="space-y-1"><Label>Valor Total (R$)</Label><div className="h-10 flex items-center px-3 rounded-md bg-muted text-sm font-medium">{formatCurrency(valorTotal)}</div></div>
            </div>

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
                        <CalendarIcon className="mr-2 h-4 w-4" />{format(value, "dd/MM/yyyy")}
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
                      <CalendarIcon className="mr-2 h-4 w-4" />{paymentDate ? format(paymentDate, "dd/MM/yyyy") : "dd/mm/aaaa"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={paymentDate} onSelect={setPaymentDate} locale={ptBR} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Código de Barras (Opcional)</Label>
              <Input placeholder="Insira o código de barras do boleto" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
            </div>

            {!editingExpense && (
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <Label>Lançamento Recorrente/Parcelado</Label>
                <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
              </div>
            )}
            {isRecurring && !editingExpense && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Quantidade</Label><Input type="number" min={2} value={repetitionQuantity} onChange={(e) => setRepetitionQuantity(Number(e.target.value))} /></div>
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
              <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <AddSupplierDialog open={showAddSupplier} onOpenChange={setShowAddSupplier} />
    </>
  );
};
