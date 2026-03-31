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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: any;
}

export function AddClientDialog({ open, onOpenChange, client }: AddClientDialogProps) {
  const { addClient, updateClient } = useStore();
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
  const [status, setStatus] = useState("ativo");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (client && open) {
      setPersonType(client.personType || "juridica");
      setName(client.name || "");
      setContactPerson(client.contactPerson || "");
      setCnpj(client.cnpj || "");
      setCpf(client.cpf || "");
      setIe(client.ie || "");
      setRg(client.rg || "");
      setEmail(client.email || "");
      setPhone(client.phone || "");
      setCep(client.cep || "");
      setStreet(client.street || "");
      setNumber(client.number || "");
      setComplement(client.complement || "");
      setNeighborhood(client.neighborhood || "");
      setCity(client.city || "");
      setState(client.state || "");
      setStatus(client.status || "ativo");
      setNotes(client.notes || "");
    } else if (!client && open) {
      resetForm();
    }
  }, [client, open]);

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
    setStatus("ativo");
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

    const clientData = {
      personType,
      name,
      contactPerson,
      cnpj: personType === "juridica" ? cnpj : "",
      cpf: personType === "fisica" ? cpf : "",
      ie: personType === "juridica" ? ie : "",
      rg: personType === "fisica" ? rg : "",
      email,
      phone,
      cep,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      status,
      notes,
    };

    try {
      if (client) {
        await updateClient({ id: client.id, ...clientData });
        toast({ title: "Cliente atualizado com sucesso!" });
      } else {
        await addClient(clientData);
        toast({ title: "Cliente cadastrado com sucesso!" });
      }
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar o cliente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {client ? "Editar Cliente" : "Novo Cliente"}
          </DialogTitle>
          <DialogDescription>Preencha os dados do cliente.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1 -mx-1 space-y-6 pb-2">
          {/* Tipo de Pessoa */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Tipo de Pessoa</Label>
            <RadioGroup value={personType} onValueChange={setPersonType} className="flex gap-6">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="juridica" id="pj" />
                <Label htmlFor="pj" className="cursor-pointer">Pessoa Jurídica</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="fisica" id="pf" />
                <Label htmlFor="pf" className="cursor-pointer">Pessoa Física</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Dados Principais */}
          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Dados Principais</h3>
            <div className="h-px bg-border" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                {personType === "juridica" ? "Razão Social *" : "Nome Completo *"}
              </Label>
              <Input
                placeholder={personType === "juridica" ? "Razão Social da Empresa" : "Nome completo"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Pessoa de Contato</Label>
              <Input
                placeholder="Nome do contato principal"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="h-9"
              />
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

          {/* Endereço */}
          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Endereço</h3>
            <div className="h-px bg-border" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-1.5 md:col-span-1">
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

          {/* Status e Observações */}
          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Outros</h3>
            <div className="h-px bg-border" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Observações</Label>
            <Textarea
              placeholder="Informações adicionais sobre o cliente"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px] resize-y"
            />
          </div>
        </div>

        <DialogFooter className="pt-4 border-t border-border">
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} className="bg-primary hover:bg-primary/90">
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
