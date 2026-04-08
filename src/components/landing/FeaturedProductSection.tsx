import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const FeaturedProductSection = () => {
  const { companySettings } = useStore();

  const featured = companySettings?.siteContent?.featuredProduct;
  const sectionStyle = companySettings?.styleSettings?.sections?.featuredProduct;

  if (!featured) return null;

  const tag = featured.tag || "SOLUÇÕES PARA GRANDES EMPRESAS";
  const title = featured.title || "PDA TC60 - Mais rápido do mercado!";
  const description =
    featured.description ||
    "A TECH4RENT oferece soluções de automação personalizadas, colaborando com fabricantes para garantir ofertas competitivas e prazos rápidos. A gestão de projetos e a supervisão técnica asseguram a qualidade. Fornecemos suporte especializado na aplicação inicial e realizamos testes completos na instalação para garantir desempenho máximo. Com a Tech4Rent, sua operação é transformada com tecnologia de ponta e suporte dedicado.";
  const imageUrl = featured.imageUrl;
  const backgroundImageUrl = featured.backgroundImageUrl;

  const accentColor = sectionStyle?.accentColor;
  const titleColor = sectionStyle?.titleColor;
  const textColor = sectionStyle?.textColor;
  const backgroundColor = sectionStyle?.backgroundColor;

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      className="relative py-20 overflow-hidden"
      style={{
        backgroundColor: backgroundColor || undefined,
        color: textColor || undefined,
      }}
    >
      {isValidHttpUrl(backgroundImageUrl) ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImageUrl})` }}
          />
          <div className="absolute inset-0 bg-background/85 backdrop-blur-[2px]" />
        </>
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(var(--primary)/0.05),transparent_60%)]" />
      )}

      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span
              className="text-sm font-semibold tracking-widest uppercase"
              style={{ color: accentColor || "hsl(var(--primary))" }}
            >
              {tag}
            </span>

            <h2
              className="text-3xl sm:text-4xl font-bold leading-tight"
              style={{ color: titleColor || undefined }}
            >
              {title}
            </h2>

            <p
              className="text-base leading-relaxed max-w-xl"
              style={{ color: textColor || undefined }}
            >
              {description}
            </p>

            <Button
              size="lg"
              onClick={() => scrollTo("contato")}
              className="gap-2"
              style={{
                backgroundColor: accentColor || undefined,
                color: backgroundColor || undefined,
              }}
            >
              Saiba Mais <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex justify-center lg:justify-end">
            {isValidHttpUrl(imageUrl) ? (
              <img
                src={imageUrl}
                alt={title}
                className="max-h-[420px] w-auto object-contain drop-shadow-2xl"
              />
            ) : (
              <div className="w-64 h-96 rounded-2xl bg-muted/30 border border-border flex items-center justify-center text-muted-foreground text-sm">
                Imagem do produto
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProductSection;
