import { useState, useEffect } from "react";
import { CompanyLogo } from "@/components/admin/CompanyLogo";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const { user, loading: authLoading, signIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/admin", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Preencha todos os campos.");
      return;
    }

    try {
      setLoading(true);
      await signIn(email, password);
      toast.success("Login realizado com sucesso!");
      navigate("/admin");
    } catch (err: any) {
      toast.error(err.message === "Invalid login credentials"
        ? "Email ou senha inválidos."
        : err.message || "Erro ao fazer login.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error("Informe seu email.");
      return;
    }
    try {
      setResetLoading(true);
      await sendPasswordResetEmail(auth, resetEmail);
      toast.success("Email de recuperação enviado! Verifique sua caixa de entrada e a pasta de spam.");
      setResetOpen(false);
      setResetEmail("");
    } catch (err: any) {
      console.error("Reset password error:", err.code, err.message);
      if (err.code === "auth/user-not-found") {
        toast.error("Email não encontrado no sistema.");
      } else if (err.code === "auth/too-many-requests") {
        toast.error("Muitas tentativas. Aguarde alguns minutos.");
      } else if (err.code === "auth/invalid-email") {
        toast.error("Email inválido.");
      } else if (err.code === "auth/unauthorized-continue-uri") {
        toast.error("O domínio de retorno não está autorizado no Firebase. Ajustei o envio para usar o link padrão de recuperação.");
      } else {
        toast.error("Erro ao enviar email de recuperação: " + (err.message || "tente novamente."));
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="flex justify-center">
            <img src={logoTech4Rent} alt="Tech4Rent" className="h-10 object-contain dark:hidden" />
            <img src="/lovable-uploads/48e895df-32f2-443b-9e4a-977ca36b043d.png" alt="Tech4Rent" className="h-10 object-contain hidden dark:block" />
          </CardTitle>
          <CardDescription>Acesse a área restrita do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => {
                  setResetEmail(email);
                  setResetOpen(true);
                }}
                className="text-sm text-primary hover:underline"
              >
                Esqueci minha senha
              </button>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recuperar senha</DialogTitle>
            <DialogDescription>
              Informe seu email para receber o link de recuperação de senha.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={resetLoading}>
              {resetLoading ? "Enviando..." : "Enviar link de recuperação"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
