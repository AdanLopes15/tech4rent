import { BriefcaseBusiness, Headphones, Shield, Zap } from "lucide-react";

const benefits = [
  { icon: Zap, title: "Agilidade", description: "Operações mais rápidas do dia 1" },
  { icon: Shield, title: "Segurança", description: "Equipamentos com garantia de 1 ano" },
  { icon: BriefcaseBusiness, title: "Escalabilidade", description: "Solução que cresce com você" },
  { icon: Headphones, title: "Suporte", description: "Atendimento técnico dedicado" },
];

const BenefitsBarSection = () => {
  return (
    <section className="surface-soft border-y border-border py-12">
      <div className="container max-w-6xl">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="card-elevated flex items-start gap-4 p-5"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsBarSection;
