import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser?: {
    id: number;
    nome: string;
    email: string;
    perfil: string;
    status: string;
  } | null;
}

const AddUserDialog = ({ open, onOpenChange, editingUser }: AddUserDialogProps) => {
  const [nome, setNome] = useState(editingUser?.nome || "");
  const [email, setEmail] = useState(editingUser?.email || "");
  const [perfil, setPerfil] = useState(editingUser?.perfil || "");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const isEditing = !!editingUser;

  const handleSubmit = () => {
    if (!nome || !email || !perfil) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    if (!isEditing && (!senha || senha !== confirmarSenha)) {
      toast.error("As senhas não coincidem ou estão vazias.");
      return;
    }
    toast.success(isEditing ? "Usuário atualizado com sucesso!" : "Usuário criado com sucesso!");
    onOpenChange(false);
    setNome("");
    setEmail("");
    setPerfil("");
    setSenha("");
    setConfirmarSenha("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" />
          </div>
          <div className="space-y-2">
            <Label>Email *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@empresa.com" />
          </div>
          <div className="space-y-2">
            <Label>Perfil *</Label>
            <Select value={perfil} onValueChange={setPerfil}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Administrador">Administrador</SelectItem>
                <SelectItem value="Operador">Operador</SelectItem>
                <SelectItem value="Financeiro">Financeiro</SelectItem>
                <SelectItem value="Visualizador">Visualizador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {!isEditing && (
            <>
              <div className="space-y-2">
                <Label>Senha *</Label>
                <Input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Mínimo 6 caracteres" />
              </div>
              <div className="space-y-2">
                <Label>Confirmar Senha *</Label>
                <Input type="password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} placeholder="Repita a senha" />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit}>{isEditing ? "Salvar" : "Criar Usuário"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserDialog;
