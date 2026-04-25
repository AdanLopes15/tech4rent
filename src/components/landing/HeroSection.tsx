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

          {/* Mockup com aro de neon */}
          <div className="relative mx-auto w-full max-w-lg">
            {/* Aros de neon */}
            <div className="absolute left-1/2 top-1/2 h-[110%] w-[110%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-success/70 blur-[1px]" style={{ boxShadow: "0 0 60px hsl(var(--success)/0.5)" }} />
            <div className="absolute left-1/2 top-1/2 h-[95%] w-[95%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary/70 blur-[1px]" style={{ boxShadow: "0 0 80px hsl(var(--primary)/0.6)" }} />
            <div className="absolute left-1/2 top-1/2 h-[80%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,hsl(var(--primary)/0.18),transparent_70%)] blur-2xl" />

            <div className="relative aspect-square">
              <img
                src={validImage}
                alt="Equipamentos Tech4Rent"
                className="relative z-10 h-full w-full animate-float object-contain p-6"
                loading="eager"
              />
              {/* Base elíptica */}
              <div className="absolute bottom-[8%] left-1/2 h-3 w-2/3 -translate-x-1/2 rounded-[50%] bg-primary/40 blur-md" />
              <div className="absolute bottom-[10%] left-1/2 h-1 w-1/2 -translate-x-1/2 rounded-full bg-primary" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
