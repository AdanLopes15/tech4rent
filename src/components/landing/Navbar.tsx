//src/components/landing/Navbar.tsx

import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store";

const navItems = [
  ["Produtos", "equipamentos"],
  ["Diferenciais", "diferenciais"],
  ["Sobre", "sobre"],
  ["Contato", "contato"],
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { companySettings } = useStore();

  const fantasyName = companySettings?.fantasyName || companySettings?.name || "TECH4RENT";
  const siteLogoUrl = companySettings?.siteLogoUrl;

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setIsOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-xl">
      <div className="container flex h-20 items-center justify-between gap-6">
        <button onClick={() => scrollTo("hero")} className="flex min-w-0 items-center gap-3" aria-label="Voltar ao início">
          {siteLogoUrl ? (
            <img src={siteLogoUrl} alt="Logo da Tech4Rent" className="h-12 w-auto max-w-44 object-contain" />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
              T4
            </div>
          )}
          {!siteLogoUrl && <span className="text-xl font-black tracking-tight text-foreground">{fantasyName}</span>}
        </button>

        <div className="hidden items-center gap-8 lg:flex">
          {navItems.map(([label, id]) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className="text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
            >
              {label}
            </button>
          ))}
          <Link to="/login" className="text-sm font-semibold text-muted-foreground transition-colors hover:text-primary">
            Área Restrita
          </Link>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Button variant="outline" onClick={() => scrollTo("equipamentos")}>
            Ver Catálogo
          </Button>
          <Button onClick={() => scrollTo("contato")} className="gap-2">
            Solicitar Orçamento <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <button className="lg:hidden" onClick={() => setIsOpen(!isOpen)} aria-label="Abrir menu">
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-border bg-background px-6 py-5 lg:hidden">
          <div className="space-y-4">
            {navItems.map(([label, id]) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="block w-full text-left text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
              >
                {label}
              </button>
            ))}
            <Link to="/login" onClick={() => setIsOpen(false)} className="block text-sm font-semibold text-muted-foreground">
              Área Restrita
            </Link>
            <Button onClick={() => scrollTo("contato")} className="w-full gap-2">
              Solicitar Orçamento <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
