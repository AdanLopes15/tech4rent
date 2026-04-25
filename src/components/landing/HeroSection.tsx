//src/components/landing/HeroSection.tsx

import { ArrowRight, MessageCircle, Zap, Target, ShieldCheck, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { useStore } from "@/store";
import heroStage from "@/assets/landing/hero-stage.png";
import devicesOnly from "@/assets/landing/devices-only.png";

const buildWhatsAppUrl = (phone?: string, message = "Olá, gostaria de falar com um especialista.") => {
  const digits = phone?.replace(/\D/g, "") || "";
  return digits ? `https://wa.me/55${digits}?text=${encodeURIComponent(message)}` : "#contato";
};

type Benefit = {
  Icon: typeof Zap;
  title: string;
  desc: string;
  ring: string; // tailwind border + text + shadow color
  text: string;
  glow: string;
};

const benefits: Benefit[] = [
  {
    Icon: Zap,
    title: "MAIS AGILIDADE",
    desc: "Processos mais rápidos\ne eficientes.",
    ring: "border-[#3B82F6]",
    text: "text-[#3B82F6]",
    glow: "shadow-[0_0_18px_rgba(59,130,246,0.55),inset_0_0_12px_rgba(59,130,246,0.35)]",
  },
  {
    Icon: Target,
    title: "MENOS ERROS",
    desc: "Dados precisos e operações\nmais seguras.",
    ring: "border-[#7CFC00]",
    text: "text-[#7CFC00]",
    glow: "shadow-[0_0_18px_rgba(124,252,0,0.55),inset_0_0_12px_rgba(124,252,0,0.35)]",
  },
  {
    Icon: ShieldCheck,
    title: "MAIS SEGURANÇA",
    desc: "Equipamentos robustos\ne confiáveis.",
    ring: "border-[#FFB020]",
    text: "text-[#FFB020]",
    glow: "shadow-[0_0_18px_rgba(255,176,32,0.55),inset_0_0_12px_rgba(255,176,32,0.35)]",
  },
  {
    Icon: BarChart3,
    title: "MAIS RESULTADOS",
    desc: "Soluções que elevam o\ndesempenho da sua empresa.",
    ring: "border-[#3B82F6]",
    text: "text-[#3B82F6]",
    glow: "shadow-[0_0_18px_rgba(59,130,246,0.55),inset_0_0_12px_rgba(59,130,246,0.35)]",
  },
];

const HeroSection = () => {
  const { companySettings } = useStore();

  return (
    <section
      id="hero"
      className="relative isolate overflow-hidden text-foreground"
      style={{ backgroundColor: "#05070D" }}
    >
      {/* Brilhos sutis de ambiente */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_85%_45%,hsl(var(--primary)/0.10),transparent_50%),radial-gradient(circle_at_15%_85%,hsl(var(--success)/0.08),transparent_50%)]" />

      <div className="container mx-auto max-w-[1280px] px-6 py-16 md:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
          {/* TEXTO */}
          <div className="space-y-7 animate-fade-in">
            <h1 className="font-extrabold uppercase leading-[0.95] tracking-tight text-5xl sm:text-6xl lg:text-7xl xl:text-[5.25rem]">
              <span className="text-foreground">TECNOLOGIA</span>
              <br />
              <span className="text-foreground">QUE </span>
              <span className="text-success">MOVE</span>
              <br />
              <span className="text-primary">RESULTADOS.</span>
            </h1>

            <p className="max-w-[500px] text-lg leading-relaxed text-muted-foreground md:text-xl">
              Locação de equipamentos e soluções inteligentes para escalar sua operação logística com{" "}
              <span className="text-primary">eficiência</span> e{" "}
              <span className="text-success">controle</span>.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={buildWhatsAppUrl(companySettings?.phone)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-[#7CFC00] bg-[#7CFC00]/10 px-6 text-sm font-semibold uppercase tracking-wide text-white shadow-[0_0_20px_rgba(124,252,0,0.55),inset_0_0_14px_rgba(124,252,0,0.35)] transition-transform hover:-translate-y-0.5"
              >
                <MessageCircle className="h-5 w-5 text-[#7CFC00]" /> Fale com um especialista
              </a>
              <Link
                to="/produtos"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-[#3B82F6] bg-transparent px-6 text-sm font-semibold uppercase tracking-wide text-white shadow-[0_0_20px_rgba(59,130,246,0.55),inset_0_0_14px_rgba(59,130,246,0.35)] transition-transform hover:-translate-y-0.5"
              >
                Ver equipamentos <ArrowRight className="h-4 w-4 text-[#3B82F6]" />
              </Link>
            </div>
          </div>

          {/* PALCO REAL + DEVICES POR CIMA */}
          <div className="relative mx-auto w-full max-w-[640px]">
            <div className="relative aspect-[3/2] w-full">
              {/* Fundo: warehouse + plataforma neon (imagem real) */}
              <img
                src={heroStage}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full rounded-2xl object-cover"
              />
              {/* Devices posicionados sobre a plataforma */}
              <img
                src={devicesOnly}
                alt="PDAs e leitor de código de barras Tech4Rent"
                className="absolute left-1/2 top-1/2 w-[78%] -translate-x-1/2 -translate-y-[58%] object-contain drop-shadow-[0_25px_40px_rgba(0,0,0,0.7)]"
                loading="eager"
              />
            </div>
          </div>
        </div>

        {/* BARRA DE BENEFÍCIOS — ícones com glow neon */}
        <div className="mt-14 grid grid-cols-2 gap-x-8 gap-y-10 border-t border-white/10 pt-12 md:grid-cols-4">
          {benefits.map(({ Icon, title, desc, ring, text, glow }) => (
            <div key={title} className="flex items-start gap-4">
              <div
                className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 bg-black/40 ${ring} ${glow}`}
              >
                <Icon className={`h-9 w-9 ${text}`} strokeWidth={2.25} />
              </div>
              <div className="space-y-2">
                <h3 className={`text-lg font-bold tracking-wide ${text}`}>{title}</h3>
                <p className="whitespace-pre-line text-sm leading-snug text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
