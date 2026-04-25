//src/components/landing/HeroSection.tsx

import { ArrowRight, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useStore } from "@/store";
import heroStage from "@/assets/landing/hero-stage.png";
import devicesOnly from "@/assets/landing/devices-only.png";
import iconAgilidade from "@/assets/landing/icon-agilidade.png";
import iconErros from "@/assets/landing/icon-erros.png";
import iconSeguranca from "@/assets/landing/icon-seguranca.png";
import iconResultados from "@/assets/landing/icon-resultados.png";

const buildWhatsAppUrl = (phone?: string, message = "Olá, gostaria de falar com um especialista.") => {
  const digits = phone?.replace(/\D/g, "") || "";
  return digits ? `https://wa.me/55${digits}?text=${encodeURIComponent(message)}` : "#contato";
};

const benefits = [
  { img: iconAgilidade, title: "MAIS AGILIDADE", desc: "Processos mais rápidos\ne eficientes.", color: "text-primary" },
  { img: iconErros, title: "MENOS ERROS", desc: "Dados precisos e operações\nmais seguras.", color: "text-success" },
  { img: iconSeguranca, title: "MAIS SEGURANÇA", desc: "Equipamentos robustos\ne confiáveis.", color: "text-warning" },
  { img: iconResultados, title: "MAIS RESULTADOS", desc: "Soluções que elevam o\ndesempenho da sua empresa.", color: "text-primary" },
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

        {/* BARRA DE BENEFÍCIOS — ícones reais */}
        <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-white/10 pt-10 md:grid-cols-4">
          {benefits.map(({ img, title, desc, color }) => (
            <div key={title} className="flex items-start gap-3">
              <img src={img} alt="" className="h-14 w-14 shrink-0 object-contain" loading="lazy" />
              <div className="space-y-1">
                <h3 className={`text-sm font-bold tracking-wide ${color}`}>{title}</h3>
                <p className="whitespace-pre-line text-xs leading-snug text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
