import { Headphones, ShieldCheck, Truck } from "lucide-react";

const benefits = [
  { icon: ShieldCheck, title: "Garantia", description: "Equipamentos revisados e prontos para operação." },
  { icon: Truck, title: "Solução para sua operação", description: "Locação, venda e implantação com agilidade." },
  { icon: Headphones, title: "Suporte especializado", description: "Time técnico para acompanhar sua equipe." },
];

const BenefitsBarSection = () => {
  return (
    <section className="border-b border-border bg-background py-8">
      <div className="container grid gap-5 md:grid-cols-3">
        {benefits.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex items-start gap-4 rounded-lg bg-card p-5 shadow-sm ring-1 ring-border">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">{title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default BenefitsBarSection;
