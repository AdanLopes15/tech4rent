// src/components/site-builder/blocks/HeroBlock.tsx

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
  return digits ? `https://wa.me/55${digits}?text=${encodeURIComponent(message)}` : "#";
};

type Props = {
  title?: string;
  subtitle?: string;
  backgroundImageUrl?: string;
  backgroundVideoUrl?: string;
  primaryCtaLabel?: string;
  primaryCtaUrl?: string;
  secondaryCtaLabel?: string;
  secondaryCtaUrl?: string;
  overlayOpacity?: number;
  orangeWords?: number;
};

const HeroBlock = ({
  title = "Soluções em Equipamentos para sua Empresa",
  subtitle = "Qualidade, segurança e a tecnologia que você precisa para alcançar os melhores resultados.",
  backgroundImageUrl,
  backgroundVideoUrl,
  primaryCtaLabel = "Falar no WhatsApp",
  primaryCtaUrl,
  secondaryCtaLabel = "Ver Catálogo",
  secondaryCtaUrl = "/produtos",
  overlayOpacity = 70,
  orangeWords = 3,
}: Props) => {
  const { companySettings } = useStore();
  const hasVideo = isValidHttpUrl(backgroundVideoUrl);
  const hasImage = isValidHttpUrl(backgroundImageUrl);
  const titleParts = (title || "").split(" ");
  const orangeStart = Math.max(0, titleParts.length - (orangeWords || 0));
  const opacity = Math.max(0, Math.min(100, overlayOpacity)) / 100;

  const primaryHref = primaryCtaUrl?.trim() ? primaryCtaUrl : buildWhatsAppUrl(companySettings?.phone);
  const isPrimaryExternal = /^https?:\/\//i.test(primaryHref);
  const secondaryHref = secondaryCtaUrl?.trim() || "/produtos";
  const isSecondaryExternal = /^https?:\/\//i.test(secondaryHref);

  return (
    <section className="relative min-h-[760px] overflow-hidden bg-foreground text-background lg:min-h-[calc(100vh-5rem)]">
      {hasVideo ? (
        <video className="absolute inset-0 h-full w-full object-cover" src={backgroundVideoUrl} autoPlay muted loop playsInline />
      ) : hasImage ? (
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${backgroundImageUrl})` }} />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_84%_72%,hsl(var(--primary)/0.22),transparent_34%),linear-gradient(110deg,hsl(var(--foreground)),hsl(var(--foreground)/0.9)_46%,hsl(var(--primary)/0.22))]" />
      )}

      <div className="absolute inset-0 bg-foreground" style={{ opacity }} />
      <div className="absolute inset-0 bg-gradient-to-r from-foreground via-foreground/80 to-foreground/30" />
      <div className="absolute inset-0 bg-gradient-to-b from-foreground/40 via-transparent to-foreground/70" />

      <div className="container relative z-10 flex min-h-[760px] items-center lg:min-h-[calc(100vh-5rem)]">
        <div className="mx-auto max-w-4xl translate-y-6 space-y-7 text-left lg:mx-0 lg:ml-[12%]">
          <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-normal sm:text-6xl lg:text-7xl">
            {titleParts.map((part, index) => (
              <span key={`${part}-${index}`} className={index >= orangeStart ? "text-primary" : "text-background"}>
                {part}
                {index < titleParts.length - 1 ? " " : ""}
              </span>
            ))}
          </h1>

          {subtitle && (
            <p className="max-w-3xl text-lg font-semibold leading-relaxed text-background/78 md:text-2xl">{subtitle}</p>
          )}

          <div className="flex flex-col gap-4 pt-3 sm:flex-row">
            {secondaryCtaLabel && (
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-14 min-w-48 gap-4 border-background/45 bg-background/5 px-8 text-background hover:bg-background hover:text-foreground"
              >
                {isSecondaryExternal ? (
                  <a href={secondaryHref} target="_blank" rel="noreferrer">
                    {secondaryCtaLabel} <ArrowRight className="h-4 w-4" />
                  </a>
                ) : (
                  <Link to={secondaryHref}>
                    {secondaryCtaLabel} <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </Button>
            )}
            {primaryCtaLabel && (
              <Button size="lg" asChild className="h-14 min-w-56 gap-2 px-8 text-base font-bold">
                {isPrimaryExternal ? (
                  <a href={primaryHref} target="_blank" rel="noreferrer">
                    <MessageCircle className="h-5 w-5" /> {primaryCtaLabel}
                  </a>
                ) : (
                  <Link to={primaryHref}>
                    <MessageCircle className="h-5 w-5" /> {primaryCtaLabel}
                  </Link>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroBlock;
