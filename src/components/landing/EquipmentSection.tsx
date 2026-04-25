//src/components/landing/EquipmentSection.tsx

import { MessageCircle, Smartphone, Wifi, Bluetooth, Usb, PackageSearch } from "lucide-react";
import { Link } from "react-router-dom";
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

const fallbackTags = [
  { icon: Smartphone, label: "Android" },
  { icon: Wifi, label: "Wi-Fi" },
  { icon: Bluetooth, label: "Bluetooth" },
  { icon: Usb, label: "USB" },
];

const EquipmentSection = () => {
  const { companySettings, equipments } = useStore();
  const hasEquipments = Array.isArray(equipments) && equipments.length > 0;
  const visibleEquipments = hasEquipments ? equipments.slice(0, 3) : [];

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

        {hasEquipments ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {(equipments as any[]).slice(0, 4).map((equipment: any) => {
              const imageUrls =
                Array.isArray(equipment?.imageUrls) && equipment.imageUrls.filter((url: string) => isValidHttpUrl(url)).length > 0
                  ? equipment.imageUrls.filter((url: string) => isValidHttpUrl(url))
                  : [isValidHttpUrl(equipment?.imageUrl) ? equipment.imageUrl : "https://placehold.co/620x620.png"];
              const firstValidUrl = imageUrls[0] || "https://placehold.co/620x620.png";
              const productName = equipment?.name || "Equipamento";

              const features = Array.isArray(equipment?.features) && equipment.features.length
                ? equipment.features.slice(0, 4)
                : ["Android", "Wi-Fi", "Bluetooth", "USB"];

              return (
                <article
                  key={equipment.id || productName}
                  className="card-elevated flex min-h-[420px] flex-col p-5"
                >
                  <div className="h-[180px] overflow-hidden rounded-xl bg-[hsl(var(--surface))]">
                    <img src={firstValidUrl} alt={productName} className="h-full w-full object-contain p-3" loading="lazy" />
                  </div>

                  <h3 className="mt-5 line-clamp-2 text-base font-extrabold uppercase tracking-tight text-foreground">{productName}</h3>

                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {features.map((label: string) => (
                      <li key={label} className="flex items-center gap-2">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-success/15 text-success">
                          <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                        {label}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto pt-5">
                    <Link
                      to={`/produtos/${encodeURIComponent(equipment.id || productName)}`}
                      className="btn-outline-blue w-full"
                    >
                      Solicitar Orçamento
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="card-elevated mx-auto max-w-xl text-center">
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
