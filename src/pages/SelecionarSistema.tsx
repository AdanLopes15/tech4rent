import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanyLogo } from "@/components/admin/CompanyLogo";
import { LogOut, LayoutDashboard, ShieldCheck, ArrowLeft } from "lucide-react";
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
      delay: "100ms",
    },
    {
      id: "tech4guard",
      title: "Tech4Guard MDM",
      description: "Gestão, monitoramento e segurança dos PDAs.",
      icon: <ShieldCheck className="w-12 h-12 text-[#10b981]" />,
      buttonText: "Acessar Tech4Guard",
      action: () => window.location.href = "https://app.tech4guard.com.br",
      delay: "300ms",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative">
      {/* Voltar ao site */}
      <a
        href="https://tech4rent.com.br"
        className="absolute top-4 left-4 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary transition-colors duration-300 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-300" />
        <span>Voltar ao site</span>
      </a>

      {/* Header com Logo */}
      <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-1000">
        <CompanyLogo className="h-12" />
      </div>

      <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-2 duration-1000">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 leading-tight">Qual sistema deseja acessar?</h1>
        <p className="text-slate-600 text-lg">Escolha abaixo o ambiente que deseja abrir.</p>
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {systems.map((system) => (
          <Card 
            key={system.id}
            className="group hover:shadow-2xl transition-all duration-500 cursor-pointer border-2 border-transparent hover:border-primary/20 animate-in fade-in zoom-in-95 duration-1000 relative overflow-hidden bg-white/80 backdrop-blur-sm"
            style={{ animationDelay: system.delay }}
            onClick={system.action}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <CardHeader className="items-center pt-10 pb-4 relative z-10">
              <div className="p-5 bg-white rounded-2xl shadow-md group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 mb-6 border border-slate-100 ring-4 ring-slate-50">
                {system.icon}
              </div>
              <CardTitle className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors duration-300">
                {system.title}
              </CardTitle>
              <CardDescription className="text-center text-slate-500 text-base leading-relaxed max-w-[240px]">
                {system.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-10 pt-4 relative z-10">
              <Button 
                className={`w-full font-bold text-base h-12 rounded-xl shadow-lg transition-all duration-300 group-hover:translate-y-[-2px] group-hover:shadow-primary/20 ${
                  system.id === 'tech4guard' 
                    ? 'bg-[#10b981] hover:bg-[#059669] shadow-emerald-200' 
                    : 'bg-primary hover:bg-primary/90 shadow-blue-200'
                }`}
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
        className="mt-16 flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-all duration-300 group animate-in fade-in duration-1000"
        style={{ animationDelay: '800ms' }}
      >
        <div className="p-2 rounded-full group-hover:bg-slate-100 transition-colors duration-300">
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
        </div>
        <span className="font-semibold text-sm uppercase tracking-wider">Sair do sistema</span>
      </button>
    </div>
  );
};

export default SelecionarSistema;