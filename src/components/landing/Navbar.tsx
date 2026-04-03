//src/components/landing/Navbar.tsx

import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Phone, Mail, Instagram, Youtube, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { companySettings } = useStore();

  const fantasyName = companySettings?.fantasyName || companySettings?.name || "TECH4RENT";

  const phone = companySettings?.phone || "(11) 99999-9999";
  const email = companySettings?.email || "contato@tech4rent.com.br";

  const instagramUrl = companySettings?.instagramUrl;
  const youtubeUrl = companySettings?.youtubeUrl;
  const linkedinUrl = companySettings?.linkedinUrl;
  const siteLogoUrl = companySettings?.siteLogoUrl;

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setIsOpen(false);
  };

  return (
    <>
      {/* Top contact bar */}
      <div className="bg-primary text-primary-foreground py-2 text-sm">
        <div className="container flex justify-between items-center gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <a href={`tel:${phone}`} className="flex items-center gap-1 hover:opacity-80 transition-opacity">
              <Phone className="h-3 w-3" />
              {phone}
            </a>

            <a
              href={`mailto:${email}`}
              className="hidden sm:flex items-center gap-1 hover:opacity-80 transition-opacity"
            >
              <Mail className="h-3 w-3" />
              {email}
            </a>
          </div>

          <Link to="/login" className="hover:opacity-80 font-medium transition-opacity">
            Área Restrita
          </Link>
        </div>
      </div>

      {/* Main nav */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container flex justify-between items-center h-16 gap-4">
          <button onClick={() => scrollTo("hero")} className="flex items-center gap-3 min-w-0">
            {siteLogoUrl ? (
              <img src={siteLogoUrl} alt="Logo da empresa" className="h-9 w-9 object-contain rounded-sm shrink-0" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary font-bold shrink-0">
                T4
              </div>
            )}

            <span className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate">{fantasyName}</span>
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

            <div className="flex items-center gap-1">
              {instagramUrl && (
                <Button variant="ghost" size="icon" asChild>
                  <a href={instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram">
                    <Instagram className="h-4 w-4" />
                  </a>
                </Button>
              )}

              {youtubeUrl && (
                <Button variant="ghost" size="icon" asChild>
                  <a href={youtubeUrl} target="_blank" rel="noreferrer" aria-label="YouTube">
                    <Youtube className="h-4 w-4" />
                  </a>
                </Button>
              )}

              {linkedinUrl && (
                <Button variant="ghost" size="icon" asChild>
                  <a href={linkedinUrl} target="_blank" rel="noreferrer" aria-label="LinkedIn">
                    <Linkedin className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>

            <Button onClick={() => scrollTo("contato")} size="sm">
              Solicitar Orçamento
            </Button>
          </div>

          <button className="md:hidden" onClick={() => setIsOpen(!isOpen)} aria-label="Abrir menu">
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden border-t border-border bg-background p-4 space-y-4">
            <div className="space-y-3">
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
                  className="block w-full text-left text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>

            {(instagramUrl || youtubeUrl || linkedinUrl) && (
              <div className="flex items-center gap-1">
                {instagramUrl && (
                  <Button variant="ghost" size="icon" asChild>
                    <a href={instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram">
                      <Instagram className="h-4 w-4" />
                    </a>
                  </Button>
                )}

                {youtubeUrl && (
                  <Button variant="ghost" size="icon" asChild>
                    <a href={youtubeUrl} target="_blank" rel="noreferrer" aria-label="YouTube">
                      <Youtube className="h-4 w-4" />
                    </a>
                  </Button>
                )}

                {linkedinUrl && (
                  <Button variant="ghost" size="icon" asChild>
                    <a href={linkedinUrl} target="_blank" rel="noreferrer" aria-label="LinkedIn">
                      <Linkedin className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            )}

            <Button onClick={() => scrollTo("contato")} className="w-full" size="sm">
              Solicitar Orçamento
            </Button>

            <Button asChild variant="outline" className="w-full">
              <Link to="/login" onClick={() => setIsOpen(false)}>
                Área do Cliente
              </Link>
            </Button>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
