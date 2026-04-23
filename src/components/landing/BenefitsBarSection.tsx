import { BriefcaseBusiness, Headphones, Shield } from "lucide-react";

const benefits = [
  { icon: Shield, title: "Garantia de 1 ano", description: "Todos os produtos com garantia" },
  { icon: BriefcaseBusiness, title: "Solução para sua operação", description: "Indicação conforme sua rotina logística" },
  { icon: Headphones, title: "Suporte especializado", description: "Atendimento técnico dedicado" },
];

const BenefitsBarSection = () => {
  return (
    <section className="border-b border-border bg-muted py-5">
      <div className="container grid gap-6 md:grid-cols-3">
        {benefits.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex items-center justify-center gap-4 md:justify-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wide text-foreground">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default BenefitsBarSection;
