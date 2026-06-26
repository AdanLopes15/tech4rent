//src/components/contratos/EditContractDialog.tsx

import { useEffect, useMemo, useState } from "react";
import { format, differenceInMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, PlusCircle, Trash2 } from "lucide-react";
import { Timestamp } from "firebase/firestore";

import { useStore } from "@/store";
import { useToast } from "@/hooks/use-toast";
import { cn, formatCurrency, maskCurrencyBR, parseCurrencyBR } from "@/lib/utils";

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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface EditContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: any;
}

interface ContractItem {
  id: number;
  equipmentId: string;
  quantity: number;
  billingType: "diaria" | "semanal" | "mensal";
  unitPrice: number;
}

const safeToDate = (dateInput: any): Date | undefined => {
  if (!dateInput) return undefined;
  if (dateInput instanceof Date) return dateInput;
  if (dateInput instanceof Timestamp) return dateInput.toDate();

  if (typeof dateInput?.toDate === "function") {
    return dateInput.toDate();
  }

  if (typeof dateInput === "string" || typeof dateInput === "number") {
    const date = new Date(dateInput);
    if (!isNaN(date.getTime())) return date;
  }

  if (typeof dateInput === "object" && "seconds" in dateInput) {
    const date = new Timestamp(dateInput.seconds, dateInput.nanoseconds || 0).toDate();
    if (!isNaN(date.getTime())) return date;
  }

  return undefined;
};

export function EditContractDialog({ open, onOpenChange, contract }: EditContractDialogProps) {
  const { clients, equipments, updateContract } = useStore();
  const { toast } = useToast();

  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [retiradaDate, setRetiradaDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [items, setItems] = useState<ContractItem[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [retiradaOpen, setRetiradaOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const resetForm = () => {
    setSelectedClientId("");
    setRetiradaDate(undefined);
    setEndDate(undefined);
    setItems([]);
    setTotalValue(0);
  };

  useEffect(() => {
    if (open && contract) {
      setSelectedClientId(contract.clientId || "");
      setRetiradaDate(safeToDate(contract.startDate));
      setEndDate(safeToDate(contract.endDate));
      setItems(
        contract.items?.length
          ? contract.items.map((item: any, index: number) => ({
              id: item.id ?? index + 1,
              equipmentId: item.equipmentId || "",
              quantity: item.quantity || 1,
              billingType: item.billingType || "mensal",
              unitPrice: item.unitPrice || 0,
            }))
          : [],
      );
      setTotalValue(contract.totalValue || 0);
    } else if (!open) {
      resetForm();
    }
  }, [open, contract]);

  useEffect(() => {
    const monthlyValue = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);

    if (retiradaDate && endDate && endDate > retiradaDate) {
      const months = differenceInMonths(endDate, retiradaDate) + 1;
      setTotalValue(monthlyValue * months);
    } else {
      setTotalValue(monthlyValue);
    }
  }, [items, retiradaDate, endDate]);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        equipmentId: "",
        quantity: 1,
        billingType: "mensal",
        unitPrice: 0,
      },
    ]);
  };

  const handleRemoveItem = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleItemChange = (id: number, field: keyof ContractItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updatedItem = { ...item, [field]: value } as ContractItem;

        if (field === "equipmentId" || field === "billingType") {
          const equipment = equipments.find((eq: any) => eq.id === updatedItem.equipmentId);

          if (equipment) {
            switch (updatedItem.billingType) {
              case "diaria":
                updatedItem.unitPrice = equipment.dailyRate || 0;
                break;
              case "semanal":
                updatedItem.unitPrice = equipment.weeklyRate || 0;
                break;
              case "mensal":
                updatedItem.unitPrice = equipment.monthlyRate || 0;
                break;
              default:
                updatedItem.unitPrice = 0;
            }
          }
        }

        return updatedItem;
      }),
    );
  };

  const selectedClient = useMemo(
    () => clients.find((client: any) => client.id === selectedClientId),
    [clients, selectedClientId],
  );

  const handleSubmit = async () => {
    if (!contract || !selectedClientId || !retiradaDate || !endDate || items.some((item) => !item.equipmentId)) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateContract({
        id: contract.id,
        clientId: selectedClientId,
        client: selectedClient || contract.client || null,
        startDate: retiradaDate,
        endDate: endDate,
        items,
        totalValue,
        costCenterId: contract.costCenterId || "",
        chartOfAccountId: contract.chartOfAccountId || "",
        bankAccountId: contract.bankAccountId || "",
        status: contract.status || "Em Andamento",
      });

      toast({ title: "Contrato atualizado com sucesso!" });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar contrato",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!contract) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl bg-card">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Editar Contrato de Locação - {contract.id}</DialogTitle>
          <DialogDescription>
            Ajuste os dados do contrato. A regeração de faturas deve ser feita manualmente.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-8 py-4 max-h-[75vh] overflow-y-auto pr-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="cliente">Nome do Cliente</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger id="cliente">
                  <SelectValue placeholder="Selecione um cliente cadastrado" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client: any) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.razaoSocial || client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="start-date">Data de Retirada</Label>
              <Popover open={retiradaOpen} onOpenChange={setRetiradaOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !retiradaDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {retiradaDate ? format(retiradaDate, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={retiradaDate}
                    onSelect={(d) => { setRetiradaDate(d); setRetiradaOpen(false); }}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">Data de Devolução</Label>
              <Popover open={endOpen} onOpenChange={setEndOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={endDate} onSelect={(d) => { setEndDate(d); setEndOpen(false); }} initialFocus locale={ptBR} />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Itens do Contrato</h3>

            {items.map((item) => (
              <div key={item.id} className="p-4 border rounded-lg space-y-4">
                <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-[2fr_1fr_1fr_auto]">
                  <div className="space-y-2">
                    <Label htmlFor={`equipment-${item.id}`}>Equipamento</Label>
                    <Select
                      value={item.equipmentId}
                      onValueChange={(value) => handleItemChange(item.id, "equipmentId", value)}
                    >
                      <SelectTrigger id={`equipment-${item.id}`}>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {equipments.map((eq: any) => (
                          <SelectItem key={eq.id} value={eq.id}>
                            {eq.name} (Estoque: {eq.stock})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`qty-${item.id}`}>Qtd.</Label>
                    <Input
                      id={`qty-${item.id}`}
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(item.id, "quantity", Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Vl. Unit.</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="R$ 0,00"
                      value={maskCurrencyBR(Math.round((item.unitPrice || 0) * 100).toString())}
                      onChange={(e) => handleItemChange(item.id, "unitPrice", parseCurrencyBR(e.target.value))}
                    />
                  </div>

                  <Button variant="destructive" size="icon" onClick={() => handleRemoveItem(item.id)}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Excluir item</span>
                  </Button>
                </div>
              </div>
            ))}

            <Button variant="outline" onClick={handleAddItem}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Equipamento
            </Button>
          </div>

          <div className="bg-muted p-4 rounded-lg flex items-center justify-between">
            <span className="font-semibold text-lg">Valor Total do Contrato</span>
            <span className="font-bold text-2xl">{formatCurrency(totalValue)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
