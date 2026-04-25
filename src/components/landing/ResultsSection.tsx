import { Gauge, Target, Shield, TrendingUp, Users, Warehouse, Truck, Handshake, MessageCircle, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { useStore } from "@/store";

const buildWhatsAppUrl = (phone?: string) => {
  const digits = phone?.replace(/\D/g, "") || "";
  return digits
    ? `https://wa.me/55${digits}?text=${encodeURIComponent("Olá, gostaria de levar minha operação para o próximo nível.")}`
    : "#contato";
};

const techPillars = [
  { icon: Gauge, title: "AGILIDADE", description: "Processos mais rápidos e automatizados.", color: "text-primary" },
  { icon: Target, title: "PRECISÃO", description: "Redução de erros e retrabalhos.", color: "text-success" },
  { icon: Shield, title: "SEGURANÇA", description: "Equipamentos resistentes para o dia a dia.", color: "text-warning" },
  { icon: TrendingUp, title: "ESCALABILIDADE", description: "Soluções prontas para acompanhar seu crescimento.", color: "text-primary" },
];

const clients = [
  { icon: Users, value: "+300", label: "EMPRESAS\nATENDIDAS", color: "text-primary" },
  { icon: Warehouse, value: "DIVERSOS", label: "SEGMENTOS\nATENDIDOS", color: "text-success" },
  { icon: Truck, value: "OPERAÇÕES", label: "LOGÍSTICAS\nATIVAS", color: "text-warning" },
  { icon: Handshake, value: "PARCEIROS", label: "EM CONSTANTE\nCRESCIMENTO", color: "text-primary" },
];

const ResultsSection = () => {
  const { companySettings } = useStore();

  return (
    <>
      {/* TECNOLOGIA QUE IMPULSIONA */}
      <section className="bg-background py-20">
        <div className="container max-w-6xl">
          <div className="mb-12 text-center">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-success">Sobre os equipamentos</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              TECNOLOGIA QUE IMPULSIONA SUA OPERAÇÃO
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {techPillars.map(({ icon: Icon, title, description, color }) => (
              <article
                key={title}
                className="rounded-2xl border border-border bg-card p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/40"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center">
                  <Icon className={`h-12 w-12 ${color}`} strokeWidth={1.5} />
                </div>
                <h3 className="mt-5 text-base font-extrabold tracking-tight text-foreground">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CLIENTES ATENDIDOS */}
      <section className="bg-background py-12">
        <div className="container max-w-6xl">
          <div className="mb-8 text-center">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-success">Clientes atendidos</span>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
              EMPRESAS QUE CONFIAM NA TECH<span className="text-success">4</span>RENT
            </h2>
          </div>
          <div className="rounded-2xl border border-border bg-card p-8">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {clients.map(({ icon: Icon, value, label, color }) => (
                <div key={label} className="flex items-center gap-4">
                  <Icon className={`h-12 w-12 shrink-0 ${color}`} strokeWidth={1.5} />
                  <div>
                    <div className={`text-2xl font-extrabold tracking-tight ${color}`}>{value}</div>
                    <p className="mt-1 whitespace-pre-line text-[11px] font-bold tracking-wider text-muted-foreground">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-background pb-20 pt-10">
        <div className="container max-w-6xl">
          <div className="rounded-2xl border border-success/30 bg-card p-8 md:p-10">
            <div className="grid items-center gap-8 md:grid-cols-[auto_1fr_auto]">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-success bg-success/10" style={{ boxShadow: "0 0 40px hsl(var(--success)/0.5)" }}>
                <MessageCircle className="h-10 w-10 text-success" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-foreground md:text-3xl">
                  VAMOS LEVAR SUA OPERAÇÃO PARA O <span className="text-success">PRÓXIMO NÍVEL?</span>
                </h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Fale agora com nossos especialistas e descubra como podemos acelerar seus resultados.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <a
                  href={buildWhatsAppUrl(companySettings?.phone)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-cta h-12 px-6 text-xs uppercase tracking-wider"
                >
                  <MessageCircle className="h-4 w-4" /> Fale agora pelo WhatsApp
                </a>
                <Link to="/contato" className="btn-outline-blue h-12 px-6 text-xs uppercase tracking-wider">
                  <FileText className="h-4 w-4" /> Solicitar orçamento
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ResultsSection;
