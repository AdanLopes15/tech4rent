//src/components/landing/Navbar.tsx

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Menu, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { companySettings } = useStore();

  const fantasyName = companySettings?.fantasyName || companySettings?.name || "TECH4RENT";
  const siteLogoUrl = companySettings?.siteLogoUrl;

  const goToHomeSection = (id: string) => {
    setIsOpen(false);
    if (location.pathname !== "/") {
      navigate(`/#${id}`);
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 80);
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const goToAboutSection = (id?: string) => {
    setIsOpen(false);
    navigate(id ? `/sobre#${id}` : "/sobre");
    if (id) setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 80);
  };

  const goToProducts = () => {
    setIsOpen(false);
    navigate("/produtos");
  };

  const goToContact = () => {
    setIsOpen(false);
    navigate("/contato");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-foreground text-background">
      <div className="container flex h-16 max-w-6xl items-center justify-between gap-6">
        <button onClick={() => goToHomeSection("hero")} className="flex min-w-0 items-center gap-3" aria-label="Voltar ao início">
          {siteLogoUrl ? (
            <img src={siteLogoUrl} alt="Logo da Tech4Rent" className="h-8 w-auto max-w-36 object-contain brightness-0 invert" />
          ) : (
            <span className="text-2xl font-black tracking-tight">{fantasyName}</span>
          )}
        </button>

        <div className="hidden items-center gap-7 lg:flex">
          <button
            onClick={goToProducts}
            className={`rounded-md px-3 py-2 text-sm font-bold transition-colors ${location.pathname === "/produtos" ? "bg-primary/15 text-primary" : "text-background/75 hover:text-background"}`}
          >
            Produtos
          </button>
          <button onClick={() => goToAboutSection("duvidas")} className="text-sm font-bold text-background/75 transition-colors hover:text-background">
            Dúvidas
          </button>
          <button
            onClick={() => goToAboutSection()}
            className={`rounded-md px-3 py-2 text-sm font-bold transition-colors ${location.pathname === "/sobre" ? "bg-primary/15 text-primary" : "text-background/75 hover:text-background"}`}
          >
            Sobre
          </button>
          <button onClick={goToContact} className={`rounded-md px-3 py-2 text-sm font-bold transition-colors ${location.pathname === "/contato" ? "bg-primary/15 text-primary" : "text-background/75 hover:text-background"}`}>
            Contato
          </button>
        </div>

        <div className="hidden items-center gap-4 lg:flex">
          <span className="text-xs font-bold text-background/65">BR&nbsp; Português</span>
          <Button onClick={goToContact} className="h-11 gap-2 px-5 font-bold">
            <MessageCircle className="h-4 w-4" /> Fale Conosco
          </Button>
        </div>

        <button className="lg:hidden" onClick={() => setIsOpen(!isOpen)} aria-label="Abrir menu">
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-background/10 bg-foreground px-6 py-5 lg:hidden">
          <div className="space-y-4">
            <button onClick={goToProducts} className={`block w-full text-left text-sm font-bold ${location.pathname === "/produtos" ? "text-primary" : "text-background/75"}`}>Produtos</button>
            <button onClick={() => goToAboutSection("duvidas")} className="block w-full text-left text-sm font-bold text-background/75">Dúvidas</button>
            <button onClick={() => goToAboutSection()} className="block w-full text-left text-sm font-bold text-primary">Sobre</button>
            <button onClick={goToContact} className={`block w-full text-left text-sm font-bold ${location.pathname === "/contato" ? "text-primary" : "text-background/75"}`}>Contato</button>
            <Link to="/login" onClick={() => setIsOpen(false)} className="block text-sm font-bold text-background/75">Área Restrita</Link>
            <Button onClick={goToContact} className="w-full gap-2">
              Fale Conosco <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
