//src/components/landing/DifferentialsSection.tsx

import { TrendingUp, Users, HeadphonesIcon, Truck, ShieldCheck, Settings } from "lucide-react";
import { useStore } from "@/store";

const fallbackItems = [
  {
    icon: TrendingUp,
    title: "Economia Inteligente",
    desc: "Reduza custos com CAPEX transformando em OPEX. Pague somente pelo que usar.",
  },
  {
    icon: Users,
    title: "Atendimento Personalizado",
    desc: "Equipe dedicada para entender suas necessidades e propor a melhor solução.",
  },
  {
    icon: HeadphonesIcon,
    title: "Suporte 24/7",
    desc: "Assistência técnica disponível a qualquer momento para manter sua operação.",
  },
  {
    icon: Truck,
    title: "Logística Nacional",
    desc: "Entrega e instalação em todo o Brasil com prazo garantido.",
  },
  {
    icon: ShieldCheck,
    title: "Equipamentos Segurados",
    desc: "Todos os itens locados possuem seguro contra danos e roubo.",
  },
  {
    icon: Settings,
    title: "Manutenção Preventiva",
    desc: "Programa de manutenção periódica incluso em todos os contratos.",
  },
];

const icons = [TrendingUp, Users, HeadphonesIcon, Truck, ShieldCheck, Settings];

const DifferentialsSection = () => {
  const { companySettings } = useStore();

  const differentiators = companySettings?.siteContent?.differentiators || {};
  const sectionStyle = companySettings?.styleSettings?.sections?.differentiators || {};

  const items =
    Array.isArray(differentiators?.items) && differentiators.items.length > 0 ? differentiators.items : fallbackItems;

  const title = differentiators?.title || "Por que escolher a TECH4RENT?";

  const subtitle = differentiators?.subtitle || "Diferenciais que fazem a diferença na sua operação";

  const backgroundColor = sectionStyle.backgroundColor;
  const textColor = sectionStyle.textColor;
  const titleColor = sectionStyle.titleColor;
  const accentColor = sectionStyle.accentColor;

  return (
    <section
      id="diferenciais"
      className="py-20"
      style={{
        backgroundColor: backgroundColor || undefined,
        color: textColor || undefined,
      }}
    >
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold mb-3" style={{ color: titleColor || undefined }}>
            {title}
          </h2>
          <p className="text-muted-foreground" style={{ color: textColor || undefined }}>
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item: any, index: number) => {
            const Icon = icons[index % icons.length];

            return (
              <div
                key={`${item?.title || "item"}-${index}`}
                className="text-center space-y-3 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div
                  className="inline-flex items-center justify-center rounded-2xl p-4 mx-auto"
                  style={{
                    backgroundColor: accentColor ? `${accentColor}1A` : undefined,
                  }}
                >
                  <Icon className="h-7 w-7" style={{ color: accentColor || undefined }} />
                </div>

                <h3 className="text-lg font-semibold" style={{ color: titleColor || undefined }}>
                  {item?.title || "Diferencial"}
                </h3>

                <p className="text-sm leading-relaxed" style={{ color: textColor || undefined }}>
                  {item?.description || item?.desc || ""}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default DifferentialsSection;
