import { Factory, Heart, MapPin, Package, ShoppingCart, Truck, Users, Warehouse } from "lucide-react";

const logos = ["Pelog", "Memphis Courier", "CEVA Logistics", "VDC Log", "Porto Guimarães", "Maxton", "Pelog", "Memphis"];
const stats = [
  { icon: Package, value: "10.000+", label: "Aparelhos em operação" },
  { icon: Users, value: "1.000+", label: "Clientes ativos" },
  { icon: MapPin, value: "20+", label: "Estados atendidos" },
];
const segments = [
  { icon: Truck, label: "Logística & Transporte" },
  { icon: ShoppingCart, label: "E-commerce & Fulfillment" },
  { icon: Warehouse, label: "Varejo & Atacado" },
  { icon: Factory, label: "Indústria & Manufatura" },
  { icon: Heart, label: "Saúde & Hospitalar" },
  { icon: Package, label: "Alimentício & Frigorífico" },
];
const dots = [
  [58, 18], [48, 23], [63, 33], [71, 42], [69, 51], [61, 60], [57, 70], [55, 82], [47, 75], [43, 64], [38, 53], [34, 42], [29, 34], [25, 47], [48, 39], [53, 51], [50, 66], [64, 72], [72, 28],
];

const PresenceSection = () => {
  return (
    <section id="diferenciais" className="bg-background py-0">
      <div className="overflow-hidden border-y border-border bg-muted py-8">
        <h2 className="mb-7 text-center text-lg font-black uppercase tracking-widest text-muted-foreground">
          Empresas que tiveram resultados com a Tech4Rent
        </h2>
        <div className="flex w-max animate-[marquee_24s_linear_infinite] items-center gap-20 px-10 opacity-60 grayscale">
          {[...logos, ...logos].map((logo, index) => (
            <span key={`${logo}-${index}`} className="whitespace-nowrap text-3xl font-black italic text-foreground/70">
              {logo}
            </span>
          ))}
        </div>
      </div>

      <div className="container max-w-6xl py-20">
        <h2 className="mb-12 text-center text-2xl font-black uppercase tracking-[0.35em] text-foreground">Presença em todo o Brasil</h2>
        <div className="grid gap-12 lg:grid-cols-[180px_1fr_280px] lg:items-center">
          <div className="space-y-10">
            {stats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-sm">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-4xl font-black text-foreground">{value}</div>
                <div className="text-sm text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>

          <div className="relative mx-auto aspect-[0.95] w-full max-w-[460px]">
            <div className="absolute inset-[10%] rounded-[48%_52%_45%_55%] bg-muted shadow-inner" />
            <div className="absolute left-[23%] top-[8%] h-[78%] w-[52%] rounded-[55%_45%_52%_48%] border border-border bg-card/70 shadow-sm" />
            <div className="absolute left-[35%] top-[18%] h-[55%] w-[35%] rotate-[-14deg] rounded-[45%_60%_40%_55%] border border-border bg-muted" />
            {dots.map(([left, top], index) => (
              <span
                key={index}
                className="absolute h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_0_5px_hsl(var(--primary)/0.14)]"
                style={{ left: `${left}%`, top: `${top}%` }}
              />
            ))}
          </div>

          <div>
            <h3 className="mb-5 text-sm font-black uppercase text-foreground">Segmentos atendidos</h3>
            <div className="space-y-3">
              {segments.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PresenceSection;
