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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddColaboradorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collaborator?: any;
}

export function AddColaboradorDialog({ open, onOpenChange, collaborator }: AddColaboradorDialogProps) {
  const { addCollaborator, updateCollaborator, clients } = useStore();
  const { toast } = useToast();

  const [clientId, setClientId] = useState("");
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  
  const [permission, setPermission] = useState("colaborador");
  const [status, setStatus] = useState("ativo");

  useEffect(() => {
    if (collaborator && open) {
      setClientId(collaborator.clientId || "");
      setName(collaborator.name || "");
      setCpf(collaborator.cpf || "");
      setPhone(collaborator.phone || "");
      setPermission(collaborator.permission || "colaborador");
      setStatus(collaborator.status || "ativo");
    } else if (!collaborator && open) {
      resetForm();
    }
  }, [collaborator, open]);

  const resetForm = () => {
    setClientId("");
    setName("");
    setCpf("");
    setPhone("");
    
    setPermission("colaborador");
    setStatus("ativo");
  };

  const handleSubmit = async () => {
    if (!clientId) {
      toast({ title: "Selecione um cliente.", variant: "destructive" });
      return;
    }
    if (!name) {
      toast({ title: "Nome é obrigatório.", variant: "destructive" });
      return;
    }
    if (!cpf) {
      toast({ title: "CPF é obrigatório.", variant: "destructive" });
      return;
    }

    const clientName = clients.find((c: any) => c.id === clientId)?.name || "";

    const data: any = {
      clientId,
      clientName,
      name,
      cpf,
      phone,
      permission,
      status,
    };

    if (password) {
      data.password = password;
    }

    try {
      if (collaborator) {
        await updateCollaborator({ id: collaborator.id, ...data });
        toast({ title: "Colaborador atualizado com sucesso!" });
      } else {
        await addCollaborator(data);
        toast({ title: "Colaborador cadastrado com sucesso!" });
      }
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {collaborator ? "Editar Colaborador" : "Cadastrar Novo Colaborador"}
          </DialogTitle>
          <DialogDescription>Preencha os dados do novo colaborador.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1 -mx-1 space-y-4 pb-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Cliente *</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Nome do Colaborador *</Label>
              <Input placeholder="Ex: José da Silva" value={name} onChange={(e) => setName(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">CPF *</Label>
              <Input placeholder="Ex: 123.456.789-00" value={cpf} onChange={(e) => setCpf(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Telefone / WhatsApp</Label>
              <Input placeholder="(00) 00000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Senha *</Label>
              <Input type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Permissão</Label>
              <Select value={permission} onValueChange={setPermission}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="colaborador">Colaborador (Apenas Consulta)</SelectItem>
                  <SelectItem value="gestor">Gestor</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-4 border-t border-border">
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="button" onClick={handleSubmit}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
