import { Factory, HeartPulse, PackageCheck, ShoppingCart, Snowflake, Truck } from "lucide-react";

const stats = [
  ["10.000+", "aparelhos em operação"],
  ["1.000+", "clientes ativos"],
  ["20+", "estados atendidos"],
];

const segments = [
  { icon: Truck, label: "Logística & Transporte" },
  { icon: PackageCheck, label: "E-commerce & Fulfillment" },
  { icon: ShoppingCart, label: "Varejo & Atacado" },
  { icon: Factory, label: "Indústria & Manufatura" },
  { icon: HeartPulse, label: "Saúde & Hospitalar" },
  { icon: Snowflake, label: "Alimentício & Frigorífico" },
];

const PresenceSection = () => {
  return (
    <section id="diferenciais" className="overflow-hidden bg-foreground py-20 text-background">
      <div className="container grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div className="space-y-7">
          <span className="text-sm font-bold uppercase tracking-widest text-primary">Atendimento nacional</span>
          <h2 className="text-3xl font-black leading-tight md:text-5xl">Presença em todo o Brasil</h2>
          <p className="text-lg leading-relaxed text-background/75">
            Equipamentos de automação, coleta de dados e mobilidade corporativa para operações que não podem parar.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {stats.map(([value, label]) => (
              <div key={label} className="border-l-2 border-primary pl-4">
                <div className="text-3xl font-black text-primary">{value}</div>
                <div className="mt-1 text-sm text-background/70">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative rounded-lg border border-background/10 bg-background/5 p-6">
          <div className="absolute inset-6 rounded-full border border-primary/20" />
          <div className="relative grid gap-3 sm:grid-cols-2">
            {segments.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 rounded-md border border-background/10 bg-background/10 p-4 backdrop-blur-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold text-background/90">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PresenceSection;
