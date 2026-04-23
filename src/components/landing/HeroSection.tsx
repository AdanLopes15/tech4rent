//src/components/landing/HeroSection.tsx

import { ArrowRight, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
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

  const title = hero?.title || "Tecnologia para acelerar sua operação";
  const subtitle =
    hero?.subtitle ||
    "Coletores, leitores, tablets e equipamentos robustos para logística, estoque e operações que não podem parar.";

  const backgroundVideoUrl = hero?.backgroundVideoUrl;
  const backgroundImageUrl = hero?.backgroundImageUrl;
  const hasVideo = isValidHttpUrl(backgroundVideoUrl);
  const hasImage = isValidHttpUrl(backgroundImageUrl);
  const titleParts = title.split(" ");
  const orangeStart = Math.max(0, titleParts.length - 3);

  

  return (
    <section id="hero" className="relative min-h-[760px] overflow-hidden bg-foreground text-background lg:min-h-[calc(100vh-5rem)]">
      {hasVideo ? (
        <video className="absolute inset-0 h-full w-full object-cover" src={backgroundVideoUrl} autoPlay muted loop playsInline />
      ) : hasImage ? (
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${backgroundImageUrl})` }} />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_84%_72%,hsl(var(--primary)/0.22),transparent_34%),linear-gradient(110deg,hsl(var(--foreground)),hsl(var(--foreground)/0.9)_46%,hsl(var(--primary)/0.22))]" />
      )}

      <div className="absolute inset-0 bg-foreground/70 backdrop-blur-[2px]" />
      <div className="absolute inset-0 bg-gradient-to-r from-foreground via-foreground/82 to-foreground/38" />
      <div className="absolute inset-0 bg-gradient-to-b from-foreground/50 via-transparent to-foreground/80" />

      <div className="container relative z-10 flex min-h-[760px] items-center lg:min-h-[calc(100vh-5rem)]">
        <div className="mx-auto max-w-4xl translate-y-6 space-y-7 text-left lg:mx-0 lg:ml-[12%]">
          <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-normal sm:text-6xl lg:text-7xl">
            {titleParts.map((part, index) => (
              <span key={`${part}-${index}`} className={index >= orangeStart ? "text-primary" : "text-background"}>
                {part}{index < titleParts.length - 1 ? " " : ""}
              </span>
            ))}
          </h1>

          <p className="max-w-3xl text-lg font-semibold leading-relaxed text-background/78 md:text-2xl">{subtitle}</p>

          <div className="flex flex-col gap-4 pt-3 sm:flex-row">
            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-14 min-w-48 gap-4 border-background/45 bg-background/5 px-8 text-background hover:bg-background hover:text-foreground"
            >
              <Link to="/produtos">
                Ver Catálogo <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" asChild className="h-14 min-w-56 gap-2 px-8 text-base font-bold">
              <a href={buildWhatsAppUrl(companySettings?.phone)} target="_blank" rel="noreferrer">
                <MessageCircle className="h-5 w-5" /> Falar no WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
