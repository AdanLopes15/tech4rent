// src/components/site-builder/blocks/EquipmentsBlock.tsx

import { Link } from "react-router-dom";
import { MessageCircle, Smartphone, Wifi, Bluetooth, Usb, PackageSearch } from "lucide-react";
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
  return digits ? `https://wa.me/55${digits}?text=${encodeURIComponent(message)}` : "#";
};

const fallbackTags = [Smartphone, Wifi, Bluetooth, Usb];

type Props = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  maxItems?: number;
};

const EquipmentsBlock = ({ eyebrow, title, subtitle, maxItems = 3 }: Props) => {
  const { companySettings, equipments, catalogItems } = useStore();
  const published = (catalogItems || []).filter((c: any) => c.published);
  const usedIds = new Set(published.map((c: any) => c.equipmentId).filter(Boolean));
  const fromCatalog = published.map((c: any) => ({
    id: `cat-${c.id}`,
    name: c.name,
    code: c.code,
    description: c.shortDescription,
    imageUrl: c.heroImageUrl,
    imageUrls: [c.heroImageUrl, ...(c.galleryUrls || [])].filter(Boolean),
  }));
  const fromEquipments = (equipments || []).filter((e: any) => !usedIds.has(e.id));
  const all = [...fromCatalog, ...fromEquipments].slice(0, maxItems);

  return (
    <section className="bg-background py-16 md:py-20">
      <div className="container max-w-6xl">
        {(eyebrow || title || subtitle) && (
          <div className="mb-10 text-center">
            {eyebrow && <p className="text-xs font-black uppercase tracking-[0.35em] text-muted-foreground">{eyebrow}</p>}
            {title && <h2 className="mt-3 text-3xl font-black text-foreground md:text-4xl">{title}</h2>}
            {subtitle && <p className="mt-3 text-base text-muted-foreground">{subtitle}</p>}
          </div>
        )}

        {all.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {all.map((equipment: any) => {
              const validUrls = (equipment?.imageUrls || []).filter((u: string) => isValidHttpUrl(u));
              const firstValidUrl = validUrls[0] || (isValidHttpUrl(equipment?.imageUrl) ? equipment.imageUrl : "https://placehold.co/620x620.png");
              const productName = equipment?.name || "Equipamento";
              const code = equipment?.code || equipment?.patrimony || equipment?.model || productName.split(" ").slice(-1).join("");
              return (
                <Card key={equipment.id || productName} className="overflow-hidden rounded-lg border-border bg-card shadow-sm">
                  <div className="m-4 mb-0 aspect-square overflow-hidden bg-muted">
                    <img src={firstValidUrl} alt={productName} className="h-full w-full object-contain p-5" loading="lazy" />
                  </div>
                  <CardContent className="flex min-h-[292px] flex-col p-5 pt-6">
                    <span className="mb-2 text-sm font-medium uppercase text-muted-foreground">{code}</span>
                    <h3 className="text-xl font-bold leading-snug text-foreground">{productName}</h3>
                    <a
                      href={buildWhatsAppUrl(companySettings?.phone, productName)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-5 inline-flex text-sm font-black text-primary"
                    >
                      Sob Consulta →
                    </a>
                    <p className="mt-5 line-clamp-2 text-base leading-relaxed text-muted-foreground">
                      {equipment?.description || "Projetado para ambientes industriais e operações logísticas intensivas."}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {fallbackTags.map((Icon, i) => (
                        <span key={i} className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                          <Icon className="h-3 w-3" />
                        </span>
                      ))}
                    </div>
                    <div className="mt-auto flex gap-2 pt-6">
                      <Button variant="outline" className="h-10 flex-1" asChild>
                        <Link to={`/produtos/${encodeURIComponent(equipment.id || productName)}`}>Ver detalhes</Link>
                      </Button>
                      <Button size="icon" asChild className="h-10 w-10 shrink-0">
                        <a href={buildWhatsAppUrl(companySettings?.phone, productName)} target="_blank" rel="noreferrer" aria-label={`Solicitar orçamento para ${productName}`}>
                          <MessageCircle className="h-4 w-4" />
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
            <h3 className="mt-4 text-xl font-bold text-foreground">Nenhum equipamento disponível</h3>
            <p className="mt-2 text-sm text-muted-foreground">Cadastre equipamentos para exibi-los aqui.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default EquipmentsBlock;
