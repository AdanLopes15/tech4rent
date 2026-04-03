//src/components/landing/EquipmentSection.tsx

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

const EquipmentSection = () => {
  const { companySettings, equipments } = useStore();

  const sectionStyle = companySettings?.styleSettings?.sections?.productHighlight || {};

  const titleColor = sectionStyle.titleColor;
  const textColor = sectionStyle.textColor;
  const backgroundColor = sectionStyle.backgroundColor;
  const accentColor = sectionStyle.accentColor;

  const hasEquipments = Array.isArray(equipments) && equipments.length > 0;

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="equipamentos"
      className="py-20"
      style={{
        backgroundColor: backgroundColor || undefined,
        color: textColor || undefined,
      }}
    >
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold mb-3" style={{ color: titleColor || undefined }}>
            Produtos Mais Procurados
          </h2>
          <p className="text-muted-foreground" style={{ color: textColor || undefined }}>
            Confira alguns dos equipamentos disponíveis para locação e venda
          </p>
        </div>

        {hasEquipments ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {equipments.map((equipment: any) => {
              const imageUrls =
                Array.isArray(equipment?.imageUrls) &&
                equipment.imageUrls.filter((url: string) => isValidHttpUrl(url)).length > 0
                  ? equipment.imageUrls.filter((url: string) => isValidHttpUrl(url))
                  : [isValidHttpUrl(equipment?.imageUrl) ? equipment.imageUrl : "https://placehold.co/600x400.png"];

              const firstValidUrl = imageUrls[0] || "https://placehold.co/600x400.png";

              return (
                <Card
                  key={equipment.id || equipment.name}
                  className="group overflow-hidden border-border hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-card flex flex-col"
                >
                  <div className="relative h-52 w-full overflow-hidden bg-muted">
                    <img
                      src={firstValidUrl}
                      alt={equipment?.name || "Equipamento"}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  <CardContent className="p-6 flex flex-col flex-1">
                    <h3
                      className="text-lg font-semibold mb-2 line-clamp-2 min-h-[3.5rem]"
                      style={{ color: titleColor || undefined }}
                    >
                      {equipment?.name || "Equipamento"}
                    </h3>

                    {equipment?.description && (
                      <p className="text-sm mb-4 line-clamp-3" style={{ color: textColor || undefined }}>
                        {equipment.description}
                      </p>
                    )}

                    <div className="mt-auto pt-2">
                      <Button
                        onClick={() => scrollTo("contato")}
                        className="w-full"
                        style={{
                          backgroundColor: accentColor || undefined,
                          color: backgroundColor || undefined,
                        }}
                      >
                        Solicitar Orçamento
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center bg-card">
            <h3 className="text-xl font-semibold mb-2" style={{ color: titleColor || undefined }}>
              Nenhum equipamento disponível no momento
            </h3>
            <p className="text-sm" style={{ color: textColor || undefined }}>
              Em breve novos equipamentos aparecerão aqui.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default EquipmentSection;
