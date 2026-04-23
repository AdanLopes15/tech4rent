//src/components/landing/HeroSection.tsx

import { ArrowRight, MessageCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store";

function isValidHttpUrl(value?: string | null): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const buildWhatsAppUrl = (phone?: string, message = "Olá, gostaria de solicitar um orçamento.") => {
  const digits = phone?.replace(/\D/g, "") || "";
  return digits ? `https://wa.me/55${digits}?text=${encodeURIComponent(message)}` : "#contato";
};

const HeroSection = () => {
  const { companySettings } = useStore();
  const hero = companySettings?.siteContent?.hero;

  const title = hero?.title || "Locação e venda de coletores, tablets e equipamentos para sua operação";
  const subtitle =
    hero?.subtitle ||
    "Tecnologia, suporte especializado e equipamentos prontos para acelerar logística, varejo, indústria e operações críticas.";

  const backgroundVideoUrl = hero?.backgroundVideoUrl;
  const backgroundImageUrl = hero?.backgroundImageUrl;
  const hasVideo = isValidHttpUrl(backgroundVideoUrl);
  const hasImage = isValidHttpUrl(backgroundImageUrl);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section id="hero" className="relative min-h-[calc(100vh-5rem)] overflow-hidden bg-foreground text-background">
      {hasVideo ? (
        <video className="absolute inset-0 h-full w-full object-cover" src={backgroundVideoUrl} autoPlay muted loop playsInline />
      ) : hasImage ? (
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${backgroundImageUrl})` }} />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,hsl(var(--primary)/0.34),transparent_34%),linear-gradient(135deg,hsl(var(--foreground)),hsl(var(--foreground)/0.88))]" />
      )}
      <div className="absolute inset-0 bg-foreground/78" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-background/0" />

      <div className="container relative z-10 flex min-h-[calc(100vh-5rem)] items-center py-16">
        <div className="max-w-5xl space-y-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/15 px-4 py-2 text-sm font-semibold text-primary">
            <ShieldCheck className="h-4 w-4" />
            Equipamentos revisados, suporte técnico e pronta entrega
          </div>

          <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-normal sm:text-6xl lg:text-7xl">
            {title.split(" ").slice(0, -3).join(" ") || title}{" "}
            <span className="text-primary">{title.split(" ").slice(-3).join(" ")}</span>
          </h1>

          <p className="max-w-2xl text-lg leading-relaxed text-background/85 md:text-xl">{subtitle}</p>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Button size="lg" onClick={() => scrollTo("equipamentos")} className="gap-2">
              Ver Catálogo <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" asChild className="border-background/35 bg-background/10 text-background hover:bg-background hover:text-foreground">
              <a href={buildWhatsAppUrl(companySettings?.phone)} target="_blank" rel="noreferrer">
                <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
