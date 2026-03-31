import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Camera, Lock, Mail, Phone } from "lucide-react";

const MeuPerfil = () => {
  const [profile, setProfile] = useState({
    nome: "Administrador",
    email: "admin@tech4rent.com.br",
    telefone: "",
    cargo: "Administrador",
  });

  const [passwords, setPasswords] = useState({
    atual: "",
    nova: "",
    confirmar: "",
  });

  const handleProfileChange = (field: string, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = () => {
    toast.success("Perfil atualizado com sucesso!");
  };

  const handleChangePassword = () => {
    if (!passwords.atual || !passwords.nova || !passwords.confirmar) {
      toast.error("Preencha todos os campos de senha.");
      return;
    }
    if (passwords.nova !== passwords.confirmar) {
      toast.error("As senhas não coincidem.");
      return;
    }
    if (passwords.nova.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    toast.success("Senha alterada com sucesso!");
    setPasswords({ atual: "", nova: "", confirmar: "" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Meu Perfil</h1>
        <p className="text-muted-foreground">Gerencie suas informações pessoais e segurança.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Foto de Perfil */}
        <Card className="border-border lg:col-span-1">
          <CardContent className="p-6 flex flex-col items-center gap-4">
            <div className="relative">
              <div className="h-28 w-28 rounded-full bg-primary/20 flex items-center justify-center border-4 border-border">
                <User className="h-14 w-14 text-primary" />
              </div>
              <button className="absolute bottom-0 right-0 h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground">{profile.nome}</h3>
              <p className="text-sm text-muted-foreground">{profile.cargo}</p>
            </div>
            <Button variant="outline" size="sm" className="w-full">
              Alterar Foto
            </Button>
          </CardContent>
        </Card>

        {/* Informações Pessoais */}
        <Card className="border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Informações Pessoais
            </CardTitle>
            <CardDescription>Atualize seus dados de contato e identificação.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input
                  value={profile.nome}
                  onChange={(e) => handleProfileChange("nome", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Cargo</Label>
                <Input
                  value={profile.cargo}
                  onChange={(e) => handleProfileChange("cargo", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleProfileChange("email", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  placeholder="(00) 00000-0000"
                  value={profile.telefone}
                  onChange={(e) => handleProfileChange("telefone", e.target.value)}
                />
              </div>
            </div>
            <Button onClick={handleSaveProfile}>Salvar Informações</Button>
          </CardContent>
        </Card>
      </div>

      {/* Alterar Senha */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Alterar Senha
          </CardTitle>
          <CardDescription>Para sua segurança, escolha uma senha forte com pelo menos 6 caracteres.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Senha Atual</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={passwords.atual}
                onChange={(e) => setPasswords((p) => ({ ...p, atual: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Nova Senha</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={passwords.nova}
                onChange={(e) => setPasswords((p) => ({ ...p, nova: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Confirmar Nova Senha</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={passwords.confirmar}
                onChange={(e) => setPasswords((p) => ({ ...p, confirmar: e.target.value }))}
              />
            </div>
          </div>
          <Button onClick={handleChangePassword}>Alterar Senha</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default MeuPerfil;
