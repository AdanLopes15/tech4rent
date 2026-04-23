const results = [
  { metric: "40%", title: "menos erros de leitura", description: "Coletores e leitores preparados para reduzir retrabalho na operação." },
  { metric: "2x", title: "mais agilidade no picking", description: "Dispositivos móveis para acelerar separação, conferência e expedição." },
  { metric: "5 dias", title: "para implantação", description: "Entrega técnica rápida para colocar sua equipe em produção." },
];

const ResultsSection = () => {
  return (
    <section className="bg-background py-20">
      <div className="container">
        <div className="mb-10 max-w-3xl">
          <span className="text-sm font-bold uppercase tracking-widest text-primary">Resultados reais</span>
          <h2 className="mt-3 text-3xl font-black text-foreground md:text-5xl">Performance para operações exigentes</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {results.map((item) => (
            <article key={item.title} className="rounded-lg border border-border bg-card p-7 shadow-sm transition-transform hover:-translate-y-1">
              <div className="text-5xl font-black text-primary">{item.metric}</div>
              <h3 className="mt-5 text-xl font-bold text-foreground">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ResultsSection;
