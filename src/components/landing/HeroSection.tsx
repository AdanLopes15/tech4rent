//src/components/landing/HeroSection.tsx

import { ArrowRight, MessageCircle, Zap, Target, Shield, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useStore } from "@/store";
import heroDevices from "@/assets/landing/hero-devices.png";

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

const microBenefits = [
  { icon: Zap, label: "Mais agilidade\nnos processos", color: "text-primary" },
  { icon: Target, label: "Menos erros\noperacionais", color: "text-success" },
  { icon: Shield, label: "Mais segurança\nna operação", color: "text-warning" },
  { icon: TrendingUp, label: "Mais resultados\npara o seu negócio", color: "text-primary" },
];

const HeroSection = () => {
  const { companySettings, equipments } = useStore();

  const heroImage =
    (Array.isArray(equipments) && equipments[0]?.imageUrls?.[0]) ||
    (Array.isArray(equipments) && equipments[0]?.imageUrl) ||
    "https://placehold.co/700x700/0a0f1a/ffffff?text=PDA";

  const validImage = isValidHttpUrl(heroImage)
    ? heroImage
    : "https://placehold.co/700x700/0a0f1a/ffffff?text=PDA";

  return (
    <section id="hero" className="relative overflow-hidden bg-background text-foreground">
      {/* Background pattern circuit */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07]" style={{
        backgroundImage:
          "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
        backgroundSize: "80px 80px",
      }} />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_75%_35%,hsl(var(--primary)/0.18),transparent_55%),radial-gradient(circle_at_15%_85%,hsl(var(--success)/0.12),transparent_55%)]" />

      <div className="container max-w-6xl py-16 md:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          {/* Texto */}
          <div className="space-y-7">
            <h1 className="text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              <span className="text-foreground">TECNOLOGIA</span>
              <br />
              <span className="text-foreground">QUE </span>
              <span className="text-success">MOVE</span>
              <br />
              <span className="text-primary">RESULTADOS.</span>
            </h1>

            <p className="max-w-md text-base leading-relaxed text-muted-foreground md:text-lg">
              Locação de equipamentos e soluções inteligentes para escalar sua operação logística com eficiência e controle.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={buildWhatsAppUrl(companySettings?.phone)}
                target="_blank"
                rel="noreferrer"
                className="btn-cta h-12 px-6 text-sm uppercase tracking-wide"
              >
                <MessageCircle className="h-5 w-5" /> Fale com um especialista
              </a>
              <Link to="/produtos" className="btn-outline-blue h-12 px-6 text-sm uppercase tracking-wide">
                Ver equipamentos <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-5 pt-4 sm:grid-cols-4">
              {microBenefits.map(({ icon: Icon, label, color }) => (
                <div key={label} className="flex flex-col items-start gap-2">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="whitespace-pre-line text-xs leading-snug text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mockup com aro de neon (imagem da referência) */}
          <div className="relative mx-auto w-full">
            <img
              src={heroDevices}
              alt="Equipamentos Tech4Rent"
              className="h-auto w-full object-contain"
              loading="eager"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
