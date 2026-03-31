import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setIsOpen(false);
  };

  return (
    <>
      {/* Top contact bar */}
      <div className="bg-primary text-primary-foreground py-2 text-sm">
        <div className="container flex justify-between items-center">
          <div className="flex items-center gap-4">
            <a href="tel:+5511999999999" className="flex items-center gap-1 hover:opacity-80">
              <Phone className="h-3 w-3" /> (11) 99999-9999
            </a>
            <a href="mailto:contato@tech4rent.com.br" className="hidden sm:flex items-center gap-1 hover:opacity-80">
              <Mail className="h-3 w-3" /> contato@tech4rent.com.br
            </a>
          </div>
          <Link to="/admin" className="hover:opacity-80 font-medium">
            Área Restrita
          </Link>
        </div>
      </div>

      {/* Main nav */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container flex justify-between items-center h-16">
          <button onClick={() => scrollTo("hero")} className="text-2xl font-bold tracking-tight">
            <span className="text-primary">TECH4</span>RENT
          </button>

          <div className="hidden md:flex items-center gap-8">
            {[
              ["Início", "hero"],
              ["Equipamentos", "equipamentos"],
              ["Diferenciais", "diferenciais"],
              ["Sobre", "sobre"],
              ["Contato", "contato"],
            ].map(([label, id]) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {label}
              </button>
            ))}
            <Button onClick={() => scrollTo("contato")} size="sm">
              Solicitar Orçamento
            </Button>
          </div>

          <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden border-t border-border bg-background p-4 space-y-3">
            {[
              ["Início", "hero"],
              ["Equipamentos", "equipamentos"],
              ["Diferenciais", "diferenciais"],
              ["Sobre", "sobre"],
              ["Contato", "contato"],
            ].map(([label, id]) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="block w-full text-left text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                {label}
              </button>
            ))}
            <Button onClick={() => scrollTo("contato")} className="w-full" size="sm">
              Solicitar Orçamento
            </Button>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
