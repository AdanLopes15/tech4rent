import { ArrowRight, Shield, Clock, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="hero" className="relative overflow-hidden bg-gradient-to-br from-card via-background to-accent py-20 lg:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.08),transparent_60%)]" />
      <div className="container relative">
        <div className="max-w-3xl space-y-6 animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Shield className="h-4 w-4" />
            Equipamentos de Alta Performance
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
            Locação e Venda de{" "}
            <span className="text-primary">Equipamentos</span> para sua Empresa
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Soluções completas em tecnologia para locação e venda. Equipamentos de última geração
            com suporte técnico especializado e entrega rápida.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" onClick={() => scrollTo("contato")} className="gap-2">
              Solicitar Orçamento <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => scrollTo("equipamentos")}>
              Ver Equipamentos
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16">
          {[
            { icon: Shield, title: "Garantia Total", desc: "Equipamentos com garantia e seguro completo" },
            { icon: Clock, title: "Entrega Rápida", desc: "Logística ágil em todo o território" },
            { icon: Wrench, title: "Suporte Técnico", desc: "Assistência 24/7 para sua operação" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-4 rounded-xl border border-border bg-card/60 backdrop-blur-sm p-5">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
