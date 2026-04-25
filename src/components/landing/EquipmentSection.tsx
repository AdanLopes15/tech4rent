//src/components/landing/EquipmentSection.tsx

import { MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useStore } from "@/store";
import imgColetor from "@/assets/landing/prod-coletor.png";
import imgLeitor from "@/assets/landing/prod-leitor.png";
import imgImpressora from "@/assets/landing/prod-impressora.png";
import imgEtiquetas from "@/assets/landing/prod-etiquetas.png";

const buildWhatsAppUrl = (phone?: string, product?: string) => {
  const digits = phone?.replace(/\D/g, "") || "";
  const message = product ? `Olá, gostaria de um orçamento para ${product}.` : "Olá, gostaria de solicitar um orçamento.";
  return digits ? `https://wa.me/55${digits}?text=${encodeURIComponent(message)}` : "#contato";
};

const products = [
  {
    image: imgColetor,
    name: "COLETOR TC60",
    features: ["Android 14", "Scanner 2D", "IP67", "Wi-Fi / 4G"],
    cta: "ALUGAR AGORA",
    variant: "primary" as const,
  },
  {
    image: imgLeitor,
    name: "LEITOR PISTOLA",
    features: ["Alta velocidade", "Precisão Industrial", "Plug & Play", "Leitura 1D e 2D"],
    cta: "SOLICITAR ORÇAMENTO",
    variant: "outline" as const,
  },
  {
    image: imgImpressora,
    name: "IMPRESSORAS TÉRMICAS",
    features: ["Etiquetas rápidas", "Alta durabilidade", "Integração fácil", "Diversos modelos"],
    cta: "SOLICITAR ORÇAMENTO",
    variant: "outline" as const,
  },
  {
    image: imgEtiquetas,
    name: "ETIQUETAS RESMA",
    features: ["Caixa com 10.000 unidades", "Alta qualidade", "Compatível com mercado", "Diversos tamanhos"],
    cta: "COMPRAR AGORA",
    variant: "outline" as const,
  },
];

const Check = () => (
  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
    <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  </span>
);

const EquipmentSection = () => {
  const { companySettings } = useStore();

  return (
    <section id="equipamentos" className="bg-background py-20">
      <div className="container max-w-6xl">
        <div className="mb-12 text-center">
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-success">Nossos Equipamentos</span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            VITRINE DE PRODUTOS
          </h2>
          <div className="mx-auto mt-3 h-[3px] w-20 rounded-full bg-primary" />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <article
              key={p.name}
              className="flex min-h-[460px] flex-col rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40"
            >
              <div className="h-[200px] overflow-hidden rounded-xl bg-[hsl(var(--surface))]">
                <img src={p.image} alt={p.name} className="h-full w-full object-contain p-2" loading="lazy" />
              </div>

              <h3 className="mt-5 text-base font-extrabold uppercase tracking-tight text-foreground">{p.name}</h3>

              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check /> {f}
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-5">
                {p.variant === "primary" ? (
                  <a
                    href={buildWhatsAppUrl(companySettings?.phone, p.name)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-cta w-full text-xs uppercase tracking-wider"
                  >
                    {p.cta}
                  </a>
                ) : (
                  <Link to="/produtos" className="btn-outline-blue w-full text-xs uppercase tracking-wider">
                    <MessageCircle className="h-4 w-4" /> {p.cta}
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EquipmentSection;
