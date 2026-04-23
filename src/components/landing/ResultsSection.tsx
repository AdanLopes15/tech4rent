import { Clock, TrendingUp, Zap } from "lucide-react";

const results = [
  {
    icon: TrendingUp,
    tag: "E-commerce",
    title: "Redução de 40% nos erros de leitura",
    description: "Operação de picking com SKUs migrou de coletores antigos para equipamentos atualizados. Os erros de separação caíram quase pela metade.",
  },
  {
    icon: Zap,
    tag: "Logística",
    title: "2x mais agilidade no picking",
    description: "Transportadora substituiu leitores convencionais por PDAs com leitor 2D integrado. O tempo médio de separação por pedido caiu de 4 para 2 minutos.",
  },
  {
    icon: Clock,
    tag: "Distribuição",
    title: "Implantação em 5 dias úteis",
    description: "Distribuidora recebeu equipamentos configurados e prontos para uso. Operação rodando sem paradas desde o primeiro dia.",
  },
];

const ResultsSection = () => {
  return (
    <section className="bg-background py-8 md:py-14">
      <div className="container max-w-5xl">
        <div className="mb-7 text-center">
          <span className="text-xs font-black uppercase tracking-[0.35em] text-muted-foreground">Cases</span>
          <h2 className="mt-3 text-3xl font-black text-foreground">Resultados reais de quem usa Tech4Rent</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {results.map(({ icon: Icon, tag, title, description }) => (
            <article key={title} className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">{tag}</span>
              </div>
              <h3 className="text-base font-black leading-snug text-foreground">{title}</h3>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ResultsSection;
