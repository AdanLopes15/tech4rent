//src/components/landing/HeroSection.tsx

import { ArrowRight, MessageCircle, ShieldCheck, Zap, Headphones } from "lucide-react";
import { Link } from "react-router-dom";
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

const buildWhatsAppUrl = (phone?: string, message = "Olá, gostaria de falar com um especialista.") => {
  const digits = phone?.replace(/\D/g, "") || "";
  return digits ? `https://wa.me/55${digits}?text=${encodeURIComponent(message)}` : "#contato";
};

const HeroSection = () => {
  const { companySettings, equipments } = useStore();
  const hero = companySettings?.siteContent?.hero;

  const heroImage =
    (Array.isArray(equipments) && equipments[0]?.imageUrls?.[0]) ||
    (Array.isArray(equipments) && equipments[0]?.imageUrl) ||
    hero?.backgroundImageUrl ||
    "https://placehold.co/620x720/png?text=Coletor+PDA";

  const validImage = isValidHttpUrl(heroImage) ? heroImage : "https://placehold.co/620x720/png?text=Coletor+PDA";

  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-background"
    >
      {/* Background sutil */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_85%_15%,hsl(var(--primary)/0.10),transparent_45%),radial-gradient(circle_at_10%_90%,hsl(var(--success)/0.08),transparent_40%)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,transparent,hsl(var(--surface)))]" />

      <div className="container max-w-6xl py-20 md:py-[80px]">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Texto */}
          <div className="space-y-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              <Zap className="h-3.5 w-3.5" /> Tecnologia para operações que não param
            </span>

            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              TECNOLOGIA QUE{" "}
              <span className="text-success">MOVE</span>{" "}
              <span className="text-primary">RESULTADOS</span>
            </h1>

            <p className="max-w-xl text-lg font-medium leading-relaxed text-muted-foreground">
              {hero?.subtitle ||
                "Coletores, leitores, tablets e equipamentos robustos para logística, varejo e indústria — com suporte e implantação rápida."}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={buildWhatsAppUrl(companySettings?.phone)}
                target="_blank"
                rel="noreferrer"
                className="btn-cta h-12 px-6 text-base"
              >
                <MessageCircle className="h-5 w-5" /> Fale com especialista
              </a>
              <Link to="/produtos" className="btn-outline-blue h-12 px-6 text-base">
                Ver equipamentos <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 pt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-success" /> Garantia de 1 ano</span>
              <span className="flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /> Implantação rápida</span>
              <span className="flex items-center gap-2"><Headphones className="h-4 w-4" style={{ color: "hsl(var(--warning))" }} /> Suporte dedicado</span>
            </div>
          </div>

          {/* Mockup produto */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.15),transparent_60%)] blur-2xl" />
            <div className="relative rounded-3xl border border-border bg-card p-8 shadow-[0_30px_80px_-30px_hsl(var(--primary)/0.4)]">
              <div className="aspect-square overflow-hidden rounded-2xl bg-[hsl(var(--surface))]">
                <img
                  src={validImage}
                  alt="Equipamento Tech4Rent"
                  className="h-full w-full animate-float object-contain p-6"
                  loading="eager"
                />
              </div>
              <div className="mt-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Linha PDA</p>
                  <p className="text-lg font-extrabold text-foreground">Coletor robusto Android</p>
                </div>
                <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">Disponível</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
