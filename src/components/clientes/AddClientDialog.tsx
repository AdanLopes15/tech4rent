//src/components/clientes/AddClientDialog.tsx

import { useCallback, useEffect, useState } from "react";
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
import { getContactPhone } from "@/lib/contact";

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: any;
}

type AddressState = {
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

const EMPTY_ADDRESS: AddressState = {
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
};

export function AddClientDialog({ open, onOpenChange, client }: AddClientDialogProps) {
  const { addClient, updateClient } = useStore();
  const { toast } = useToast();

  const [personType, setPersonType] = useState("juridica");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [contato, setContato] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [cpf, setCpf] = useState("");
  const [ie, setIe] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cep, setCep] = useState("");
  const [address, setAddress] = useState<AddressState>(EMPTY_ADDRESS);
  const [status, setStatus] = useState("ativo");
  const [observacoes, setObservacoes] = useState("");

  const resetForm = useCallback(() => {
    setPersonType("juridica");
    setRazaoSocial("");
    setContato("");
    setCnpj("");
    setCpf("");
    setIe("");
    setEmail("");
    setTelefone("");
    setCep("");
    setAddress(EMPTY_ADDRESS);
    setStatus("ativo");
    setObservacoes("");
  }, []);

  useEffect(() => {
    if (client && open) {
      const mappedAddress: AddressState = {
        street: client.address?.street || client.street || "",
        number: client.address?.number || client.number || "",
        complement: client.address?.complement || client.complement || "",
        neighborhood: client.address?.neighborhood || client.neighborhood || "",
        city: client.address?.city || client.city || "",
        state: client.address?.state || client.state || "",
      };

      setPersonType(client.personType || "juridica");
      setRazaoSocial(client.razaoSocial || client.name || "");
      setContato(client.contato || client.contactPerson || "");
      setCnpj(client.cnpj || "");
      setCpf(client.cpf || "");
      setIe(client.ie || client.rg || "");
      setEmail(client.email || "");
      setTelefone(getContactPhone(client));
      setCep(client.cep || "");
      setAddress(mappedAddress);
      setStatus(client.status || "ativo");
      setObservacoes(client.observacoes || client.notes || "");
    } else if (open) {
      resetForm();
    }
  }, [client, open, resetForm]);

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    value = value.replace(/^(\d{2})(\d)/, "$1.$2");
    value = value.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    value = value.replace(/\.(\d{3})(\d)/, ".$1/$2");
    value = value.replace(/(\d{4})(\d)/, "$1-$2");
    setCnpj(value.substring(0, 18));
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    setCpf(value.substring(0, 14));
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 5) {
      value = value.replace(/^(\d{5})(\d)/, "$1-$2");
    }
    setCep(value.substring(0, 9));
  };

  const fetchAddress = useCallback(async (cepToFetch: string) => {
    const sanitizedCep = cepToFetch.replace(/\D/g, "");
    if (sanitizedCep.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${sanitizedCep}/json/`);
      if (!response.ok) throw new Error("CEP não encontrado");

      const data = await response.json();

      if (data.erro) {
        setAddress((prev) => ({
          ...prev,
          street: "",
          neighborhood: "",
          city: "",
          state: "",
        }));
        return;
      }

      setAddress((prev) => ({
        ...prev,
        street: data.logradouro || "",
        neighborhood: data.bairro || "",
        city: data.localidade || "",
        state: data.uf || "",
      }));
    } catch (error) {
      console.error("Falha ao buscar CEP:", error);
      setAddress((prev) => ({
        ...prev,
        street: "",
        neighborhood: "",
        city: "",
        state: "",
      }));
    }
  }, []);

  const fetchCnpjData = useCallback(
    async (cnpjToFetch: string) => {
      const sanitizedCnpj = cnpjToFetch.replace(/\D/g, "");
      if (sanitizedCnpj.length !== 14) return;

      try {
        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${sanitizedCnpj}`);
        if (!response.ok) throw new Error("CNPJ não encontrado ou inválido.");

        const data = await response.json();

        if (data) {
          setRazaoSocial((prev) => prev || data.razao_social || "");
          setEmail((prev) => prev || data.email || "");
          setCep((prev) => prev || data.cep || "");
          setAddress((prev) => ({
            ...prev,
            street: prev.street || data.logradouro || "",
            neighborhood: prev.neighborhood || data.bairro || "",
            city: prev.city || data.municipio || "",
            state: prev.state || data.uf || "",
            number: prev.number || data.numero || "",
            complement: prev.complement || data.complemento || "",
          }));

          if (data.cep) {
            fetchAddress(data.cep);
          }
        }
      } catch (error: any) {
        console.error("Falha ao buscar CNPJ:", error);
        toast({
          title: "Erro ao buscar CNPJ",
          description: error.message || "Não foi possível buscar os dados do CNPJ.",
          variant: "destructive",
        });
      }
    },
    [fetchAddress, toast],
  );

  useEffect(() => {
    const sanitizedCep = cep.replace(/\D/g, "");
    if (sanitizedCep.length === 8) {
      fetchAddress(sanitizedCep);
    }
  }, [cep, fetchAddress]);

  useEffect(() => {
    if (personType !== "juridica") return;

    const sanitizedCnpj = cnpj.replace(/\D/g, "");
    if (sanitizedCnpj.length === 14) {
      fetchCnpjData(sanitizedCnpj);
    }
  }, [cnpj, personType, fetchCnpjData]);

  const handleSubmit = async () => {
    if (!razaoSocial.trim()) {
      toast({
        title: "Campo obrigatório",
        description: personType === "juridica" ? "Razão Social é obrigatória." : "Nome completo é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    const clientData = {
      personType,

      // campos originais do Firebase
      razaoSocial: razaoSocial.trim(),
      contato: contato.trim(),
      ie: ie.trim(),
      telefone: telefone.trim(),
      observacoes: observacoes.trim(),
      address: {
        street: address.street.trim(),
        number: address.number.trim(),
        complement: address.complement.trim(),
        neighborhood: address.neighborhood.trim(),
        city: address.city.trim(),
        state: address.state.trim(),
      },

      // campos já usados no Lovable para compatibilidade
      name: razaoSocial.trim(),
      contactPerson: contato.trim(),
      phone: telefone.trim(),
      whatsapp: telefone.trim(),
      notes: observacoes.trim(),
      street: address.street.trim(),
      number: address.number.trim(),
      complement: address.complement.trim(),
      neighborhood: address.neighborhood.trim(),
      city: address.city.trim(),
      state: address.state.trim(),

      // documentos
      cnpj: personType === "juridica" ? cnpj.trim() : "",
      cpf: personType === "fisica" ? cpf.trim() : "",
      rg: personType === "fisica" ? ie.trim() : "",

      // comuns
      email: email.trim(),
      cep: cep.trim(),
      status,
    };

    try {
      if (client) {
        await updateClient({
          id: client.id,
          ...clientData,
        });

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
          <DialogTitle className="text-2xl font-bold">{client ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          <DialogDescription>Preencha os dados do cliente.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1 -mx-1 space-y-6 pb-2">
          <div className="space-y-2">
            <Label className="text-xs font-medium">Tipo de Pessoa</Label>
            <RadioGroup value={personType} onValueChange={setPersonType} className="flex gap-6">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="juridica" id="pj" />
                <Label htmlFor="pj" className="cursor-pointer">
                  Pessoa Jurídica
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="fisica" id="pf" />
                <Label htmlFor="pf" className="cursor-pointer">
                  Pessoa Física
                </Label>
              </div>
            </RadioGroup>
          </div>

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
                value={razaoSocial}
                onChange={(e) => setRazaoSocial(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Pessoa de Contato</Label>
              <Input
                placeholder="Nome do contato principal"
                value={contato}
                onChange={(e) => setContato(e.target.value)}
                className="h-9"
              />
            </div>

            {personType === "juridica" ? (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">CNPJ</Label>
                  <Input
                    placeholder="00.000.000/0001-00"
                    value={cnpj}
                    onChange={handleCnpjChange}
                    maxLength={18}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Inscrição Estadual</Label>
                  <Input
                    placeholder="Isento ou número da I.E."
                    value={ie}
                    onChange={(e) => setIe(e.target.value)}
                    className="h-9"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">CPF</Label>
                  <Input
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={handleCpfChange}
                    maxLength={14}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">RG</Label>
                  <Input
                    placeholder="Número do RG"
                    value={ie}
                    onChange={(e) => setIe(e.target.value)}
                    className="h-9"
                  />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Email</Label>
              <Input
                placeholder="contato@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Telefone / WhatsApp</Label>
              <Input
                placeholder="DDD + Número"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Endereço</h3>
            <div className="h-px bg-border" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-1.5 md:col-span-1">
              <Label className="text-xs font-medium">CEP</Label>
              <Input
                placeholder="00000-000"
                value={cep}
                onChange={handleCepChange}
                maxLength={9}
                className="h-9 md:max-w-[240px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Rua / Logradouro</Label>
              <Input
                placeholder="Rua das Flores"
                value={address.street}
                onChange={(e) => setAddress({ ...address, street: e.target.value })}
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Número</Label>
              <Input
                placeholder="123"
                value={address.number}
                onChange={(e) => setAddress({ ...address, number: e.target.value })}
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Complemento</Label>
              <Input
                placeholder="Apto, Bloco, Sala"
                value={address.complement}
                onChange={(e) => setAddress({ ...address, complement: e.target.value })}
                className="h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Bairro</Label>
              <Input
                placeholder="Centro"
                value={address.neighborhood}
                onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })}
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Cidade</Label>
              <Input
                placeholder="São Paulo"
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Estado</Label>
              <Input
                placeholder="SP"
                value={address.state}
                onChange={(e) => setAddress({ ...address, state: e.target.value })}
                className="h-9 md:max-w-[100px]"
              />
            </div>
          </div>

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
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
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
