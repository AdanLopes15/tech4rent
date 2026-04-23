//src/components/landing/Navbar.tsx

import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, ChevronDown, Lock, Menu, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store";

const languages = [
  { code: "pt", label: "BR Português" },
  { code: "en", label: "US English" },
  { code: "es", label: "ES Español" },
  { code: "zh-CN", label: "CN 中文" },
  { code: "ru", label: "RU Русский" },
  { code: "fr", label: "FR Français" },
  { code: "de", label: "DE Deutsch" },
  { code: "it", label: "IT Italiano" },
];

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate?: {
        TranslateElement: new (options: Record<string, unknown>, elementId: string) => void;
      };
    };
  }
}

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(() => localStorage.getItem("site-language") || "pt");
  const location = useLocation();
  const navigate = useNavigate();
  const { companySettings } = useStore();

  const fantasyName = companySettings?.fantasyName || companySettings?.name || "TECH4RENT";
  const siteLogoUrl = companySettings?.siteLogoUrl;

  // Rotas públicas onde a tradução fica ativa (não se aplica ao /admin e /login)
  const isPublicRoute = !location.pathname.startsWith("/admin") && !location.pathname.startsWith("/login");

  useEffect(() => {
    if (!isPublicRoute) return;
    if (document.getElementById("google-translate-script")) return;

    window.googleTranslateElementInit = () => {
      if (!window.google?.translate?.TranslateElement) return;

      new window.google.translate.TranslateElement(
        {
          pageLanguage: "pt",
          includedLanguages: languages.map((language) => language.code).join(","),
          autoDisplay: false,
          layout: 0,
        },
        "google_translate_element",
      );
    };

    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  }, [isPublicRoute]);

  const setGoogTransCookie = (languageCode: string) => {
    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    const cookieValue = languageCode === "pt" ? "/pt/pt" : `/pt/${languageCode}`;
    const hostname = window.location.hostname;

    // Limpa cookies antigos em todos os escopos possíveis
    const clearPaths = ["/", window.location.pathname];
    clearPaths.forEach((path) => {
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
      if (hostname.includes(".")) {
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; domain=${hostname}`;
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; domain=.${hostname}`;
      }
    });

    // Define o novo cookie
    document.cookie = `googtrans=${cookieValue}; expires=${expires}; path=/`;
    if (hostname.includes(".")) {
      document.cookie = `googtrans=${cookieValue}; expires=${expires}; path=/; domain=${hostname}`;
      document.cookie = `googtrans=${cookieValue}; expires=${expires}; path=/; domain=.${hostname}`;
    }
  };

  const changeLanguage = (languageCode: string) => {
    setGoogTransCookie(languageCode);
    localStorage.setItem("site-language", languageCode);
    setSelectedLanguage(languageCode);
    setIsLanguageOpen(false);
    setIsOpen(false);
    // Hard reload para o Google Translate aplicar o cookie
    window.location.reload();
  };

  const selectedLanguageLabel = languages.find((language) => language.code === selectedLanguage)?.label || "BR Português";

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
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsLanguageOpen((open) => !open)}
              className="flex h-11 items-center gap-2 px-3 text-xs font-bold text-background/75 transition-colors hover:text-background"
              aria-expanded={isLanguageOpen}
              aria-label="Trocar idioma"
            >
              {selectedLanguageLabel}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isLanguageOpen ? "rotate-180" : ""}`} />
            </button>

            {isLanguageOpen && (
              <div className="absolute right-0 top-full mt-2 w-40 overflow-hidden rounded-md border border-background/10 bg-foreground shadow-lg">
                {languages.map((language) => (
                  <button
                    key={language.code}
                    type="button"
                    onClick={() => changeLanguage(language.code)}
                    className={`flex w-full px-3 py-3 text-left text-xs font-bold transition-colors hover:bg-primary/15 hover:text-primary ${selectedLanguage === language.code ? "bg-primary/15 text-primary" : "text-background/75"}`}
                  >
                    {language.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button onClick={goToContact} className="h-11 gap-2 px-5 font-bold">
            <MessageCircle className="h-4 w-4" /> Fale Conosco
          </Button>
          <Link
            to="/login"
            className="flex h-11 w-11 items-center justify-center rounded-md text-background/60 transition-colors hover:bg-background/10 hover:text-background"
            aria-label="Área Restrita - Acesso ao Sistema"
            title="Área Restrita"
          >
            <Lock className="h-4 w-4" />
          </Link>
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
            <div className="space-y-2 pt-2">
              <p className="text-xs font-black uppercase tracking-widest text-background/45">Idioma</p>
              <div className="grid grid-cols-2 gap-2">
                {languages.map((language) => (
                  <button
                    key={language.code}
                    type="button"
                    onClick={() => changeLanguage(language.code)}
                    className={`rounded-md border border-background/10 px-3 py-2 text-left text-xs font-bold ${selectedLanguage === language.code ? "bg-primary/15 text-primary" : "text-background/75"}`}
                  >
                    {language.label}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={goToContact} className="w-full gap-2">
              Fale Conosco <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      <div
        id="google_translate_element"
        style={{ position: "absolute", left: "-9999px", top: "-9999px", visibility: "hidden" }}
        aria-hidden="true"
      />
    </nav>
  );
};

export default Navbar;
