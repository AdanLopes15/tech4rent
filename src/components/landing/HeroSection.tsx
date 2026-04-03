//src/components/landing/HeroSection.tsx

import { ArrowRight, Shield, Clock, Wrench } from "lucide-react";
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

const HeroSection = () => {
  const { companySettings } = useStore();

  const hero = companySettings?.siteContent?.hero || {};
  const heroStyle = companySettings?.styleSettings?.sections?.hero || {};

  const title = hero.title || "Locação e Venda de Equipamentos para sua Empresa";

  const subtitle =
    hero.subtitle ||
    "Soluções completas em tecnologia para locação e venda. Equipamentos de última geração com suporte técnico especializado e entrega rápida.";

  const backgroundImageUrl = hero.backgroundImageUrl;
  const accentColor = heroStyle.accentColor;
  const titleColor = heroStyle.titleColor;
  const textColor = heroStyle.textColor;
  const backgroundColor = heroStyle.backgroundColor;

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="hero"
      className="relative overflow-hidden py-20 lg:py-32"
      style={{
        backgroundColor: backgroundColor || undefined,
        color: textColor || undefined,
      }}
    >
      {isValidHttpUrl(backgroundImageUrl) ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImageUrl})` }}
          />
          <div className="absolute inset-0 bg-black/55" />
        </>
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.08),transparent_60%)]" />
      )}

      <div className="container relative z-10">
        <div className="max-w-3xl space-y-6 animate-fade-in">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium"
            style={{
              backgroundColor: accentColor ? `${accentColor}1A` : undefined,
              color: accentColor || undefined,
            }}
          >
            <Shield className="h-4 w-4" />
            Equipamentos de Alta Performance
          </div>

          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight"
            style={{ color: titleColor || undefined }}
          >
            {title}
          </h1>

          <p className="text-lg max-w-2xl" style={{ color: textColor || undefined }}>
            {subtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              onClick={() => scrollTo("contato")}
              className="gap-2"
              style={{
                backgroundColor: accentColor || undefined,
                color: backgroundColor || undefined,
              }}
            >
              Solicitar Orçamento <ArrowRight className="h-4 w-4" />
            </Button>

            <Button size="lg" variant="outline" onClick={() => scrollTo("equipamentos")}>
              Ver Equipamentos
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16">
          {[
            {
              icon: Shield,
              title: "Garantia Total",
              desc: "Equipamentos com garantia e seguro completo",
            },
            {
              icon: Clock,
              title: "Entrega Rápida",
              desc: "Logística ágil em todo o território",
            },
            {
              icon: Wrench,
              title: "Suporte Técnico",
              desc: "Assistência 24/7 para sua operação",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex items-start gap-4 rounded-xl border border-border bg-card/60 backdrop-blur-sm p-5"
            >
              <div
                className="rounded-lg p-2.5"
                style={{
                  backgroundColor: accentColor ? `${accentColor}1A` : undefined,
                }}
              >
                <Icon className="h-5 w-5" style={{ color: accentColor || undefined }} />
              </div>

              <div>
                <h3 className="font-semibold" style={{ color: titleColor || undefined }}>
                  {title}
                </h3>
                <p className="text-sm mt-1" style={{ color: textColor || undefined }}>
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
