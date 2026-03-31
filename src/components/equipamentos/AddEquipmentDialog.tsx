import { useEffect, useState } from "react";
import { useStore } from "@/store";
import { useToast } from "@/hooks/use-toast";

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

interface AddEquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment?: any;
}

export function AddEquipmentDialog({ open, onOpenChange, equipment }: AddEquipmentDialogProps) {
  const { addEquipment, updateEquipment } = useStore();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [status, setStatus] = useState("disponivel");
  const [purpose, setPurpose] = useState("aluguel");
  const [stock, setStock] = useState<number | string>(1);
  const [unit, setUnit] = useState("");
  const [dailyRate, setDailyRate] = useState<number | string>(0);
  const [weeklyRate, setWeeklyRate] = useState<number | string>(0);
  const [monthlyRate, setMonthlyRate] = useState<number | string>(0);
  const [salePrice, setSalePrice] = useState<number | string>(0);
  const [costPrice, setCostPrice] = useState<number | string>(0);
  const [description, setDescription] = useState("");
  const [imageUrls, setImageUrls] = useState<(string | null)[]>([null, null, null]);
  const [imageFiles, setImageFiles] = useState<(File | null)[]>([null, null, null]);

  useEffect(() => {
    if (equipment && open) {
      setName(equipment.name || "");
      setCategory(equipment.category || "");
      setSerialNumber(equipment.serialNumber || "");
      setStatus(equipment.status || "disponivel");
      setPurpose(equipment.purpose || "aluguel");
      setStock(equipment.stock || 1);
      setUnit(equipment.unit || "");
      setDailyRate(equipment.dailyRate || 0);
      setWeeklyRate(equipment.weeklyRate || 0);
      setMonthlyRate(equipment.monthlyRate || 0);
      setSalePrice(equipment.salePrice || 0);
      setCostPrice(equipment.costPrice || 0);
      setDescription(equipment.description || "");

      const existingImageUrls = Array.isArray(equipment.imageUrls) ? equipment.imageUrls : [equipment.imageUrl];

      const paddedImageUrls = [...existingImageUrls, null, null, null].slice(0, 3);

      setImageUrls(paddedImageUrls);
      setImageFiles([null, null, null]);
    } else {
      resetForm();
    }
  }, [equipment, open]);

  const resetForm = () => {
    setName("");
    setCategory("");
    setSerialNumber("");
    setStatus("disponivel");
    setPurpose("aluguel");
    setStock(1);
    setUnit("");
    setDailyRate(0);
    setWeeklyRate(0);
    setMonthlyRate(0);
    setSalePrice(0);
    setCostPrice(0);
    setDescription("");
    setImageUrls([null, null, null]);
    setImageFiles([null, null, null]);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const newImageFiles = [...imageFiles];
    newImageFiles[index] = file;
    setImageFiles(newImageFiles);

    const reader = new FileReader();
    reader.onloadend = () => {
      const newImageUrls = [...imageUrls];
      newImageUrls[index] = reader.result as string;
      setImageUrls(newImageUrls);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!name || !category) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e categoria são campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const equipmentData = {
      name,
      category,
      serialNumber,
      status,
      purpose,
      stock: Number(stock),
      unit,
      dailyRate: Number(dailyRate),
      weeklyRate: Number(weeklyRate),
      monthlyRate: Number(monthlyRate),
      salePrice: Number(salePrice),
      costPrice: Number(costPrice),
      description,
      imageUrls,
      imageFiles,
    };

    try {
      if (equipment) {
        await updateEquipment({
          id: equipment.id,
          ...equipmentData,
        });

        toast({
          title: "Equipamento atualizado com sucesso!",
        });
      } else {
        await addEquipment(equipmentData);

        toast({
          title: "Equipamento cadastrado com sucesso!",
        });
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar equipamento:", error);

      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o equipamento.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl bg-card">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {equipment ? "Editar Equipamento" : "Novo Equipamento"}
          </DialogTitle>

          <DialogDescription>Preencha os dados para cadastrar um novo equipamento no sistema.</DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto pr-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Equipamento</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Leitor de Código de Barras"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Input
                  id="categoria"
                  placeholder="Ex: Leitor"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="n-serie">Nº de Série</Label>
                <Input
                  id="n-serie"
                  placeholder="Identificador único do equipamento"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disponivel">Disponível</SelectItem>
                    <SelectItem value="alugado">Alugado</SelectItem>
                    <SelectItem value="manutencao">Em Manutenção</SelectItem>
                    <SelectItem value="descartado">Descartado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="finalidade">Finalidade</Label>
                <Select value={purpose} onValueChange={setPurpose}>
                  <SelectTrigger id="finalidade">
                    <SelectValue placeholder="Selecione a finalidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aluguel">Aluguel</SelectItem>
                    <SelectItem value="venda">Venda</SelectItem>
                    <SelectItem value="ambos">Ambos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estoque">Quantidade em Estoque</Label>
                <Input id="estoque" type="number" value={stock} onChange={(e) => setStock(e.target.value)} min="0" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unidade">Unidade</Label>
                <Input
                  id="unidade"
                  placeholder="Ex: UN, KG, Peça"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vl-diaria">Valor Diária (R$)</Label>
                <Input
                  id="vl-diaria"
                  type="number"
                  placeholder="0,00"
                  value={dailyRate}
                  onChange={(e) => setDailyRate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vl-semanal">Valor Semanal (R$)</Label>
                <Input
                  id="vl-semanal"
                  type="number"
                  placeholder="0,00"
                  value={weeklyRate}
                  onChange={(e) => setWeeklyRate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vl-mensal">Valor Mensal (R$)</Label>
                <Input
                  id="vl-mensal"
                  type="number"
                  placeholder="0,00"
                  value={monthlyRate}
                  onChange={(e) => setMonthlyRate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vl-venda">Preço de Venda (R$)</Label>
                <Input
                  id="vl-venda"
                  type="number"
                  placeholder="0,00"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vl-custo">Preço de Custo (R$)</Label>
                <Input
                  id="vl-custo"
                  type="number"
                  placeholder="0,00"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição do Equipamento</Label>
              <Textarea
                id="descricao"
                placeholder="Detalhes técnicos, características, etc."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Imagens do Equipamento</Label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="flex flex-col items-center gap-2 border p-2 rounded-md">
                    {imageUrls[index] && (
                      <img
                        src={imageUrls[index] as string}
                        alt={`Preview ${index + 1}`}
                        className="rounded-md object-cover border w-20 h-20"
                      />
                    )}

                    <Input
                      id={`imagem-${index}`}
                      type="file"
                      onChange={(e) => handleImageChange(e, index)}
                      accept="image/*"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-6">
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>

          <Button type="button" onClick={handleSubmit}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
