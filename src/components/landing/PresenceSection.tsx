import { Rocket, Target, ShieldCheck, TrendingUp, MapPin, Truck, Headphones } from "lucide-react";

const pillars = [
  { icon: Rocket, title: "+ EFICIÊNCIA", description: "Mais produtividade em todos os processos.", color: "text-primary" },
  { icon: Target, title: "+ CONTROLE", description: "Gestão inteligente e dados precisos.", color: "text-success" },
  { icon: ShieldCheck, title: "+ SEGURANÇA", description: "Equipamentos robustos e confiáveis.", color: "text-warning" },
  { icon: TrendingUp, title: "+ ESCALA", description: "Soluções que crescem com seu negócio.", color: "text-primary" },
];

const PresenceSection = () => {
  return (
    <>
      {/* QUEM SOMOS */}
      <section id="quem-somos" className="relative overflow-hidden border-y border-border bg-background py-20">
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.05]" style={{
          backgroundImage:
            "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />
        <div className="container max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-success">Quem somos</span>
              <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-foreground md:text-4xl">
                QUEM É A<br />TECH<span className="text-primary">4</span>RENT
              </h2>
              <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted-foreground">
                <p>A Tech4Rent nasceu para simplificar e escalar operações logísticas através da tecnologia.</p>
                <p>Atuamos com locação de equipamentos e soluções inteligentes que reduzem custos, aumentam produtividade e eliminam gargalos operacionais.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              {pillars.map(({ icon: Icon, title, description, color }) => (
                <div key={title} className="border-l border-border pl-4">
                  <Icon className={`h-9 w-9 ${color}`} strokeWidth={1.5} />
                  <h3 className="mt-4 text-sm font-extrabold tracking-tight text-foreground">{title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ABRANGÊNCIA */}
      <section className="relative overflow-hidden bg-background py-20">
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.05]" style={{
          backgroundImage:
            "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />
        <div className="container max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-success">Abrangência</span>
              <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-foreground md:text-4xl">
                ATENDEMOS<br />TODO O BRASIL
              </h2>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
                Estrutura preparada para atender operações logísticas em qualquer região do país, com entrega rápida e suporte especializado.
              </p>

              <div className="mt-8 grid grid-cols-3 gap-4">
                {[
                  { icon: MapPin, label: "ATENDIMENTO\nNACIONAL", color: "text-primary" },
                  { icon: Truck, label: "ENTREGA\nRÁPIDA", color: "text-success" },
                  { icon: Headphones, label: "SUPORTE\nESPECIALIZADO", color: "text-warning" },
                ].map(({ icon: Icon, label, color }) => (
                  <div key={label} className="flex flex-col items-start gap-2">
                    <Icon className={`h-7 w-7 ${color}`} strokeWidth={1.5} />
                    <p className="whitespace-pre-line text-[11px] font-bold tracking-wider text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md">
              <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.25),transparent_70%)] blur-2xl" />
              {/* Mapa simplificado */}
              <svg viewBox="0 0 400 420" className="h-auto w-full" fill="none">
                <path
                  d="M180 40 L240 60 L290 90 L320 140 L340 200 L330 270 L300 330 L240 370 L180 380 L130 360 L90 320 L70 260 L80 200 L110 140 L140 90 Z"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                  fill="hsl(var(--primary) / 0.08)"
                  style={{ filter: "drop-shadow(0 0 10px hsl(var(--primary) / 0.6))" }}
                />
                {[
                  [200, 110], [240, 160], [280, 200], [180, 180], [220, 230],
                  [260, 270], [200, 290], [150, 240], [240, 330], [180, 350],
                ].map(([cx, cy], i) => (
                  <g key={i}>
                    <circle cx={cx} cy={cy} r="6" fill="hsl(var(--success))" style={{ filter: "drop-shadow(0 0 6px hsl(var(--success)))" }} />
                    <circle cx={cx} cy={cy} r="2" fill="white" />
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default PresenceSection;
