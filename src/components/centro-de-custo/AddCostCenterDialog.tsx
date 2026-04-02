//src/components/centro-de-custo/AddCostCenterDialog.tsx

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/store";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  costCenter?: any;
}

const AddCostCenterDialog = ({ open, onOpenChange, costCenter }: Props) => {
  const { addCostCenter, updateCostCenter } = useStore();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (costCenter && open) {
      setName(costCenter.name || "");
      setDescription(costCenter.description || "");
    } else {
      resetForm();
    }
  }, [costCenter, open]);

  const resetForm = () => {
    setName("");
    setDescription("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name) return;

    try {
      if (costCenter) {
        await updateCostCenter({
          id: costCenter.id,
          name,
          description,
        });
      } else {
        await addCostCenter({
          name,
          description,
        });
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar centro de custo:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{costCenter ? "Editar Centro de Custo" : "Novo Centro de Custo"}</DialogTitle>
            <DialogDescription>Preencha os dados do centro de custo.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCostCenterDialog;
