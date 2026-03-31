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
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface AddSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: any;
}

export function AddSupplierDialog({ open, onOpenChange, supplier }: AddSupplierDialogProps) {
  const { addSupplier, updateSupplier } = useStore();
  const { toast } = useToast();

  const [personType, setPersonType] = useState("juridica");
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [cpf, setCpf] = useState("");
  const [ie, setIe] = useState("");
  const [rg, setRg] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (supplier && open) {
      setPersonType(supplier.personType || "juridica");
      setName(supplier.name || "");
      setContactPerson(supplier.contactPerson || "");
      setCnpj(supplier.cnpj || "");
      setCpf(supplier.cpf || "");
      setIe(supplier.ie || "");
      setRg(supplier.rg || "");
      setEmail(supplier.email || "");
      setPhone(supplier.phone || "");
      setCep(supplier.cep || "");
      setStreet(supplier.street || "");
      setNumber(supplier.number || "");
      setComplement(supplier.complement || "");
      setNeighborhood(supplier.neighborhood || "");
      setCity(supplier.city || "");
      setState(supplier.state || "");
      setNotes(supplier.notes || "");
    } else if (!supplier && open) {
      resetForm();
    }
  }, [supplier, open]);

  const resetForm = () => {
    setPersonType("juridica");
    setName("");
    setContactPerson("");
    setCnpj("");
    setCpf("");
    setIe("");
    setRg("");
    setEmail("");
    setPhone("");
    setCep("");
    setStreet("");
    setNumber("");
    setComplement("");
    setNeighborhood("");
    setCity("");
    setState("");
    setNotes("");
  };

  const handleSubmit = async () => {
    if (!name) {
      toast({
        title: "Campo obrigatório",
        description: personType === "juridica" ? "Razão Social é obrigatória." : "Nome é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    const data = {
      personType, name, contactPerson,
      cnpj: personType === "juridica" ? cnpj : "",
      cpf: personType === "fisica" ? cpf : "",
      ie: personType === "juridica" ? ie : "",
      rg: personType === "fisica" ? rg : "",
      email, phone, cep, street, number, complement, neighborhood, city, state, notes,
    };

    try {
      if (supplier) {
        await updateSupplier({ id: supplier.id, ...data });
        toast({ title: "Fornecedor atualizado com sucesso!" });
      } else {
        await addSupplier(data);
        toast({ title: "Fornecedor cadastrado com sucesso!" });
      }
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Erro ao salvar", description: error.message || "Não foi possível salvar.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{supplier ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
          <DialogDescription>Preencha os dados do fornecedor.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1 -mx-1 space-y-6 pb-2">
          <div className="space-y-2">
            <Label className="text-xs font-medium">Tipo de Pessoa</Label>
            <RadioGroup value={personType} onValueChange={setPersonType} className="flex gap-6">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="juridica" id="spj" />
                <Label htmlFor="spj" className="cursor-pointer">Pessoa Jurídica</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="fisica" id="spf" />
                <Label htmlFor="spf" className="cursor-pointer">Pessoa Física</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Dados Principais</h3>
            <div className="h-px bg-border" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{personType === "juridica" ? "Razão Social *" : "Nome Completo *"}</Label>
              <Input placeholder={personType === "juridica" ? "Razão Social" : "Nome completo"} value={name} onChange={(e) => setName(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Pessoa de Contato</Label>
              <Input placeholder="Nome do contato" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className="h-9" />
            </div>
            {personType === "juridica" ? (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">CNPJ</Label>
                  <Input placeholder="00.000.000/0001-00" value={cnpj} onChange={(e) => setCnpj(e.target.value)} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Inscrição Estadual</Label>
                  <Input placeholder="Isento ou número da I.E." value={ie} onChange={(e) => setIe(e.target.value)} className="h-9" />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">CPF</Label>
                  <Input placeholder="000.000.000-00" value={cpf} onChange={(e) => setCpf(e.target.value)} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">RG</Label>
                  <Input placeholder="Número do RG" value={rg} onChange={(e) => setRg(e.target.value)} className="h-9" />
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Email</Label>
              <Input placeholder="contato@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Telefone / WhatsApp</Label>
              <Input placeholder="DDD + Número" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-9" />
            </div>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Endereço</h3>
            <div className="h-px bg-border" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">CEP</Label>
              <Input placeholder="00000-000" value={cep} onChange={(e) => setCep(e.target.value)} className="h-9 md:max-w-[240px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Rua / Logradouro</Label>
              <Input placeholder="Rua das Flores" value={street} onChange={(e) => setStreet(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Número</Label>
              <Input placeholder="123" value={number} onChange={(e) => setNumber(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Complemento</Label>
              <Input placeholder="Apto, Bloco, Sala" value={complement} onChange={(e) => setComplement(e.target.value)} className="h-9" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Bairro</Label>
              <Input placeholder="Centro" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Cidade</Label>
              <Input placeholder="São Paulo" value={city} onChange={(e) => setCity(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Estado</Label>
              <Input placeholder="SP" value={state} onChange={(e) => setState(e.target.value)} className="h-9 md:max-w-[100px]" />
            </div>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Outros</h3>
            <div className="h-px bg-border" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Observações</Label>
            <Textarea placeholder="Informações adicionais" value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[80px] resize-y" />
          </div>
        </div>

        <DialogFooter className="pt-4 border-t border-border">
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="button" onClick={handleSubmit} className="bg-primary hover:bg-primary/90">Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
