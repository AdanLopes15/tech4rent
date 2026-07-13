//src/components/admin/AddUserDialog.tsx

import { useEffect, useState } from "react";
import { useStore } from "@/store";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { MODULES, PROFILE_LABELS, type ProfileKey } from "@/lib/permissions";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: any;
}

const AddUserDialog = ({ open, onOpenChange, user }: Props) => {
  const { addSystemUser, updateSystemUser, sendUserPasswordReset } = useStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profile, setProfile] = useState<ProfileKey>("comercial_orcamentos");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [status, setStatus] = useState("ativo");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && open) {
      setName(user.name || "");
      setEmail(user.email || "");
      setProfile((user.profile as ProfileKey) || "custom");
      setPermissions(Array.isArray(user.permissions) ? user.permissions : []);
      setStatus(user.status || "ativo");
      setPassword("");
    } else if (open) {
      reset();
    }
  }, [user, open]);

  const reset = () => {
    setName("");
    setEmail("");
    setPassword("");
    setProfile("comercial_orcamentos");
    setPermissions([]);
    setStatus("ativo");
    setShowPassword(false);
  };

  const togglePermission = (key: string) => {
    setPermissions((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));
  };

  const handleReset = async () => {
    if (!email) return;
    try {
      await sendUserPasswordReset(email);
      toast.success("E-mail de redefinição de senha enviado!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar redefinição");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || (!user && !password)) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("Informe um e-mail em formato válido.");
      return;
    }

    if (!user && password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    try {
      setSaving(true);

      const payload: any = {
        name,
        email,
        profile,
        permissions: profile === "custom" ? permissions : [],
        status,
        ...(password && { password }),
      };

      if (user) {
        await updateSystemUser({ uid: user.uid, ...payload });
        toast.success("Usuário atualizado!");
      } else {
        await addSystemUser(payload);
        toast.success("Usuário criado!");
      }

      onOpenChange(false);
    } catch (err: any) {
      const raw = String(err?.message || err?.code || "").toLowerCase();
      if (raw.includes("already") || raw.includes("exists") || raw.includes("duplicate") || raw.includes("in use")) {
        toast.error("Este e-mail já está cadastrado.");
      } else {
        toast.error(err.message || "Erro ao salvar usuário");
      }
    } finally {
      setSaving(false);
    }
  };

  const formatLastAccess = (value: any) => {
    if (!value) return "Nunca acessou";
    try {
      const date = value.toDate ? value.toDate() : new Date(value);
      return date.toLocaleString("pt-BR");
    } catch {
      return "—";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{user ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
            <DialogDescription>Defina os dados, o perfil e as permissões do usuário.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!!user} />
            </div>

            {!user && (
              <div className="space-y-2">
                <Label>Senha</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Perfil</Label>
                <Select value={profile} onValueChange={(v) => setProfile(v as ProfileKey)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">{PROFILE_LABELS.admin}</SelectItem>
                    <SelectItem value="comercial_orcamentos">{PROFILE_LABELS.comercial_orcamentos}</SelectItem>
                    <SelectItem value="custom">{PROFILE_LABELS.custom}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
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

            {profile === "custom" && (
              <div className="space-y-3 rounded-lg border p-4">
                <Label className="text-sm font-semibold">Permissões personalizadas</Label>
                <div className="space-y-4">
                  {MODULES.map((module) => (
                    <div key={module.key} className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">{module.label}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {module.actions.map((action) => {
                          const key = `${module.key}.${action.key}`;
                          return (
                            <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                              <Checkbox
                                checked={permissions.includes(key)}
                                onCheckedChange={() => togglePermission(key)}
                              />
                              <span>{action.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {user && (
              <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <div>
                  <p className="font-medium">Último acesso</p>
                  <p className="text-muted-foreground">{formatLastAccess(user.lastAccess)}</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleReset}>
                  <KeyRound className="mr-2 h-4 w-4" />
                  Redefinir senha
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserDialog;
