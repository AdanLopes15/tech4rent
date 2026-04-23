//src/components/landing/EquipmentSection.tsx

import { ArrowRight, MessageCircle, PackageSearch } from "lucide-react";
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

const buildWhatsAppUrl = (phone?: string, product?: string) => {
  const digits = phone?.replace(/\D/g, "") || "";
  const message = product ? `Olá, gostaria de um orçamento para ${product}.` : "Olá, gostaria de solicitar um orçamento.";
  return digits ? `https://wa.me/55${digits}?text=${encodeURIComponent(message)}` : "#contato";
};

const EquipmentSection = () => {
  const { companySettings, equipments } = useStore();
  const hasEquipments = Array.isArray(equipments) && equipments.length > 0;
  const visibleEquipments = hasEquipments ? equipments.slice(0, 8) : [];

  const scrollToContact = () => document.getElementById("contato")?.scrollIntoView({ behavior: "smooth" });

  return (
    <section id="equipamentos" className="bg-background py-20">
      <div className="container">
        <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <span className="text-sm font-bold uppercase tracking-widest text-primary">Produtos mais procurados</span>
            <h2 className="mt-3 text-3xl font-black leading-tight text-foreground md:text-5xl">
              Equipamentos para locação e venda
            </h2>
            <p className="mt-4 text-muted-foreground">
              Soluções sob consulta para automação, coleta de dados, mobilidade e produtividade operacional.
            </p>
          </div>
          <Button variant="outline" onClick={scrollToContact} className="gap-2 md:shrink-0">
            Falar com especialista <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {hasEquipments ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {visibleEquipments.map((equipment: any) => {
              const imageUrls =
                Array.isArray(equipment?.imageUrls) && equipment.imageUrls.filter((url: string) => isValidHttpUrl(url)).length > 0
                  ? equipment.imageUrls.filter((url: string) => isValidHttpUrl(url))
                  : [isValidHttpUrl(equipment?.imageUrl) ? equipment.imageUrl : "https://placehold.co/600x440.png"];
              const firstValidUrl = imageUrls[0] || "https://placehold.co/600x440.png";
              const productName = equipment?.name || "Equipamento";
              const code = equipment?.code || equipment?.patrimony || equipment?.id;

              return (
                <Card key={equipment.id || productName} className="group overflow-hidden border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
                    <img src={firstValidUrl} alt={productName} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  </div>
                  <CardContent className="flex min-h-[260px] flex-col p-5">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase text-primary">
                        {equipment?.category || "TECH4RENT"}
                      </span>
                      {code && <span className="text-xs font-semibold text-muted-foreground">{code}</span>}
                    </div>

                    <h3 className="line-clamp-2 min-h-[3.5rem] text-lg font-bold leading-snug text-foreground">{productName}</h3>
                    {equipment?.description && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{equipment.description}</p>}

                    <div className="mt-auto pt-5">
                      <div className="mb-4 flex items-center justify-between border-t border-border pt-4">
                        <span className="text-sm font-bold text-foreground">Sob Consulta</span>
                        <ArrowRight className="h-4 w-4 text-primary" />
                      </div>
                      <Button asChild className="w-full gap-2">
                        <a href={buildWhatsAppUrl(companySettings?.phone, productName)} target="_blank" rel="noreferrer">
                          <MessageCircle className="h-4 w-4" /> Ver detalhes
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
            <PackageSearch className="mx-auto h-10 w-10 text-primary" />
            <h3 className="mt-4 text-xl font-bold text-foreground">Nenhum equipamento disponível no momento</h3>
            <p className="mt-2 text-sm text-muted-foreground">Em breve novos equipamentos aparecerão aqui.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default EquipmentSection;
