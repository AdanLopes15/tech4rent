//src/components/landing/HeroSection.tsx

import { ArrowRight, MessageCircle, Zap, Target, Shield, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { useStore } from "@/store";
import heroBgWarehouse from "@/assets/landing/hero-bg-warehouse.jpg";
import devicesOnly from "@/assets/landing/devices-only.png";

const buildWhatsAppUrl = (phone?: string, message = "Olá, gostaria de falar com um especialista.") => {
  const digits = phone?.replace(/\D/g, "") || "";
  return digits ? `https://wa.me/55${digits}?text=${encodeURIComponent(message)}` : "#contato";
};

const benefits = [
  { Icon: Zap, title: "Mais agilidade", desc: "Processos mais rápidos e eficientes.", color: "text-primary", glow: "shadow-[0_0_20px_hsl(var(--primary)/0.5)]" },
  { Icon: Target, title: "Menos erros", desc: "Dados precisos e operações seguras.", color: "text-success", glow: "shadow-[0_0_20px_hsl(var(--success)/0.5)]" },
  { Icon: Shield, title: "Mais segurança", desc: "Equipamentos robustos e confiáveis.", color: "text-warning", glow: "shadow-[0_0_20px_hsl(var(--warning)/0.5)]" },
  { Icon: BarChart3, title: "Mais resultados", desc: "Soluções que elevam o desempenho.", color: "text-primary", glow: "shadow-[0_0_20px_hsl(var(--primary)/0.5)]" },
];

const HeroSection = () => {
  const { companySettings } = useStore();

  return (
    <section
      id="hero"
      className="relative isolate min-h-[700px] overflow-hidden text-foreground"
      style={{ backgroundColor: "#05070D" }}
    >
      {/* Fundo warehouse */}
      <img
        src={heroBgWarehouse}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 -z-20 h-full w-full object-cover"
      />
      {/* Overlay escuro */}
      <div className="absolute inset-0 -z-10" style={{ backgroundColor: "rgba(5,7,13,0.7)" }} />
      {/* Vinheta + brilhos laterais */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_40%,hsl(var(--primary)/0.18),transparent_55%),radial-gradient(circle_at_20%_85%,hsl(var(--success)/0.15),transparent_55%)]" />

      <div className="container mx-auto max-w-[1280px] px-6 py-20 md:py-28">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          {/* TEXTO */}
          <div className="space-y-7 animate-fade-in">
            <h1 className="font-extrabold uppercase leading-[0.95] tracking-tight text-5xl sm:text-6xl lg:text-7xl xl:text-[5rem]">
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
                className="btn-cta h-12 px-6 text-sm uppercase tracking-wide transition-transform hover:-translate-y-0.5"
              >
                <MessageCircle className="h-5 w-5" /> Fale com um especialista
              </a>
              <Link
                to="/produtos"
                className="btn-outline-blue h-12 px-6 text-sm uppercase tracking-wide transition-transform hover:-translate-y-0.5"
              >
                Ver equipamentos <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* PRODUTOS COM NEON + PLATAFORMA */}
          <div className="relative mx-auto flex h-[460px] w-full max-w-[560px] items-center justify-center md:h-[520px]">
            {/* Círculo neon grande atrás */}
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, hsl(210 79% 51% / 0.55) 0%, hsl(108 62% 47% / 0.35) 35%, transparent 70%)",
                filter: "blur(20px)",
              }}
            />

            {/* Plataforma oval com glow azul → verde */}
            <div
              className="pointer-events-none absolute left-1/2 bottom-6 h-[80px] w-[400px] -translate-x-1/2 rounded-[50%]"
              style={{
                background:
                  "radial-gradient(ellipse at center, hsl(210 79% 51% / 0.9) 0%, hsl(108 62% 47% / 0.7) 60%, transparent 80%)",
                boxShadow:
                  "0 0 60px 10px hsl(210 79% 51% / 0.6), 0 0 120px 30px hsl(108 62% 47% / 0.45)",
              }}
            />
            <div
              className="pointer-events-none absolute left-1/2 bottom-[34px] h-[6px] w-[380px] -translate-x-1/2 rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, hsl(210 79% 51%) 0%, hsl(108 62% 47%) 100%)",
                boxShadow: "0 0 20px hsl(210 79% 51% / 0.9), 0 0 40px hsl(108 62% 47% / 0.7)",
              }}
            />

            {/* PDAs + scanner */}
            <img
              src={devicesOnly}
              alt="PDAs e leitor de código de barras Tech4Rent"
              className="relative z-10 w-[420px] max-w-full object-contain drop-shadow-[0_25px_45px_rgba(0,0,0,0.6)]"
              loading="eager"
            />
          </div>
        </div>

        {/* BARRA DE BENEFÍCIOS */}
        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map(({ Icon, title, desc, color, glow }) => (
            <div
              key={title}
              className="group flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06]"
            >
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 ${color} ${glow}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className={`text-sm font-bold uppercase tracking-wide ${color}`}>{title}</h3>
                <p className="text-xs leading-snug text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
