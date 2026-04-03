//src/components/landing/AboutSection.tsx

import { Building2, Award, Users, Calendar } from "lucide-react";
import { useStore } from "@/store";

function isValidHttpUrl(value?: string | null): boolean {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const stats = [
  { icon: Calendar, value: "10+", label: "Anos de Mercado" },
  { icon: Users, value: "500+", label: "Clientes Atendidos" },
  { icon: Building2, value: "2000+", label: "Equipamentos" },
  { icon: Award, value: "99%", label: "Satisfação" },
];

const AboutSection = () => {
  const { companySettings } = useStore();

  const about = companySettings?.siteContent?.about;
  const sectionStyle = companySettings?.styleSettings?.sections?.about;

  const title = about.title || "Sobre a TECH4RENT";
  const description =
    about.description ||
    "A TECH4RENT é referência em locação e venda de equipamentos de tecnologia. Com mais de uma década de experiência, oferecemos soluções completas para empresas que buscam eficiência, economia e tecnologia de ponta.";

  const backgroundImageUrl = about.backgroundImageUrl;
  const backgroundColor = sectionStyle.backgroundColor;
  const textColor = sectionStyle.textColor;
  const titleColor = sectionStyle.titleColor;
  const accentColor = sectionStyle.accentColor;

  return (
    <section
      id="sobre"
      className="relative py-20 overflow-hidden"
      style={{
        backgroundColor: backgroundColor || undefined,
        color: textColor || undefined,
      }}
    >
      {isValidHttpUrl(backgroundImageUrl) && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImageUrl})` }}
          />
          <div className="absolute inset-0 bg-background/80 backdrop-blur-[1px]" />
        </>
      )}

      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold" style={{ color: titleColor || undefined }}>
              {title}
            </h2>

            <p className="leading-relaxed text-base md:text-lg" style={{ color: textColor || undefined }}>
              {description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {stats.map(({ icon: Icon, value, label }) => (
              <div
                key={label}
                className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-6 text-center space-y-2 shadow-sm"
              >
                <div
                  className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: accentColor ? `${accentColor}1A` : undefined,
                  }}
                >
                  <Icon className="h-6 w-6" style={{ color: accentColor || undefined }} />
                </div>

                <div className="text-3xl font-bold" style={{ color: titleColor || undefined }}>
                  {value}
                </div>

                <div className="text-sm" style={{ color: textColor || undefined }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
