import { Clock, TrendingUp, Zap, MessageCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useStore } from "@/store";

const buildWhatsAppUrl = (phone?: string) => {
  const digits = phone?.replace(/\D/g, "") || "";
  return digits
    ? `https://wa.me/55${digits}?text=${encodeURIComponent("Olá, gostaria de levar minha operação para o próximo nível.")}`
    : "#contato";
};

const results = [
  {
    icon: TrendingUp,
    tag: "E-commerce",
    title: "Redução de 40% nos erros de leitura",
    description:
      "Operação de picking com SKUs migrou de coletores antigos para equipamentos atualizados. Os erros de separação caíram quase pela metade.",
  },
  {
    icon: Zap,
    tag: "Logística",
    title: "2x mais agilidade no picking",
    description:
      "Transportadora substituiu leitores convencionais por PDAs com leitor 2D integrado. O tempo médio caiu de 4 para 2 minutos.",
  },
  {
    icon: Clock,
    tag: "Distribuição",
    title: "Implantação em 5 dias úteis",
    description:
      "Distribuidora recebeu equipamentos configurados e prontos para uso. Operação rodando sem paradas desde o primeiro dia.",
  },
];

const ResultsSection = () => {
  const { companySettings } = useStore();

  return (
    <>
      <section className="bg-background py-20">
        <div className="container max-w-6xl">
          <div className="mb-12 text-center">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Cases</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              Resultados reais de quem usa Tech4Rent
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {results.map(({ icon: Icon, tag, title, description }) => (
              <article key={title} className="card-elevated">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{tag}</span>
                <h3 className="mt-2 text-lg font-bold leading-snug text-foreground">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-[hsl(var(--surface))] py-20">
        <div className="container max-w-4xl">
          <div className="card-elevated overflow-hidden text-center md:p-12">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.08),transparent_60%)]" />
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              Vamos levar sua operação para o <span className="text-primary">próximo nível</span>?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
              Fale com um especialista e receba uma proposta sob medida para o seu cenário.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={buildWhatsAppUrl(companySettings?.phone)}
                target="_blank"
                rel="noreferrer"
                className="btn-cta h-12 px-6"
              >
                <MessageCircle className="h-5 w-5" /> WhatsApp
              </a>
              <Link to="/contato" className="btn-outline-blue h-12 px-6">
                Solicitar orçamento <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ResultsSection;
