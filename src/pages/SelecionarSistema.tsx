import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanyLogo } from "@/components/admin/CompanyLogo";
import { LogOut, LayoutDashboard, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const SelecionarSistema = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Sessão encerrada com sucesso!");
      navigate("/login");
    } catch (error) {
      toast.error("Erro ao sair do sistema.");
    }
  };

  const systems = [
    {
      id: "tech4rent",
      title: "Tech4Rent",
      description: "Sistema principal de gestão Tech4Rent.",
      icon: <LayoutDashboard className="w-12 h-12 text-primary" />,
      buttonText: "Acessar Tech4Rent",
      action: () => navigate("/admin"),
      delay: "animate-delay-100",
    },
    {
      id: "tech4guard",
      title: "Tech4Guard MDM",
      description: "Gestão, monitoramento e segurança dos PDAs.",
      icon: <ShieldCheck className="w-12 h-12 text-[#10b981]" />,
      buttonText: "Acessar Tech4Guard",
      action: () => window.location.href = "https://app.tech4guard.com.br",
      delay: "animate-delay-300",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      {/* Header com Logo */}
      <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
        <CompanyLogo className="h-12" />
      </div>

      <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Qual sistema deseja acessar?</h1>
        <p className="text-slate-600">Escolha abaixo o ambiente que deseja abrir.</p>
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        {systems.map((system) => (
          <Card 
            key={system.id}
            className={`group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/20 animate-in fade-in zoom-in-95 duration-700 ${system.delay}`}
            onClick={system.action}
          >
            <CardHeader className="items-center pt-8">
              <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform duration-300 mb-4 border border-slate-100">
                {system.icon}
              </div>
              <CardTitle className="text-2xl font-bold">{system.title}</CardTitle>
              <CardDescription className="text-center text-slate-500 max-w-[200px]">
                {system.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-8">
              <Button 
                className={`w-full font-semibold ${system.id === 'tech4guard' ? 'bg-[#10b981] hover:bg-[#059669]' : ''}`}
                size="lg"
              >
                {system.buttonText}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Botão Sair */}
      <button
        onClick={handleLogout}
        className="mt-12 flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors duration-200 group animate-in fade-in duration-1000 delay-500"
      >
        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
        <span className="font-medium">Sair do sistema</span>
      </button>
    </div>
  );
};

export default SelecionarSistema;