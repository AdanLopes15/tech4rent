//src/pages/Produtos.tsx

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bluetooth, Download, MessageCircle, PackageSearch, Search, Smartphone, Usb, Wifi } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

const fallbackTags = [
  { icon: Smartphone, label: "Android" },
  { icon: Wifi, label: "Wi-Fi" },
  { icon: Bluetooth, label: "Bluetooth" },
  { icon: Usb, label: "USB" },
];

const defaultCategories = ["Coletores PDA", "Acessórios", "Impressoras"];

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const getProductPath = (equipment: any) => `/produtos/${encodeURIComponent(String(equipment?.id || equipment?.name || "produto"))}`;

const Produtos = () => {
  const fetchAllData = useStore((s) => s.fetchAllData);
  const { companySettings, equipments } = useStore();
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sort, setSort] = useState("destaques");

  useEffect(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  const categories = useMemo(() => {
    const fromProducts = equipments.map((equipment: any) => equipment?.category).filter(Boolean);
    return Array.from(new Set([...defaultCategories, ...fromProducts]));
  }, [equipments]);

  const filteredProducts = useMemo(() => {
    const query = normalize(search);
    const result = equipments.filter((equipment: any) => {
      const category = equipment?.category || "";
      const haystack = normalize(
        [equipment?.name, equipment?.code, equipment?.model, equipment?.patrimony, equipment?.category, equipment?.description]
          .filter(Boolean)
          .join(" "),
      );
      const matchesSearch = !query || haystack.includes(query);
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(category);
      return matchesSearch && matchesCategory;
    });

    return [...result].sort((a: any, b: any) => {
      if (sort === "nome") return String(a?.name || "").localeCompare(String(b?.name || ""));
      if (sort === "categoria") return String(a?.category || "").localeCompare(String(b?.category || ""));
      return 0;
    });
  }, [equipments, search, selectedCategories, sort]);

  const toggleCategory = (category: string) => {
    setSelectedCategories((current) =>
      current.includes(category) ? current.filter((item) => item !== category) : [...current, category],
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <section className="bg-foreground py-20 text-background">
          <div className="container max-w-6xl">
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-4xl font-black tracking-normal md:text-5xl">Catálogo de Produtos</h1>
                <p className="mt-3 text-lg text-background/75">Coletores, leitores e impressoras para sua operação</p>
              </div>
              <Button variant="outline" onClick={() => window.print()} className="h-12 gap-2 border-primary bg-background text-primary hover:bg-primary hover:text-primary-foreground">
                <Download className="h-4 w-4" /> Baixar Catálogo PDF
              </Button>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container max-w-6xl">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por nome, SKU ou tag..."
                  className="h-12 pl-12 text-base"
                />
              </div>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="h-12 rounded-md border border-input bg-background px-4 text-sm font-medium text-foreground lg:w-44"
              >
                <option value="destaques">Destaques</option>
                <option value="nome">Nome</option>
                <option value="categoria">Categoria</option>
              </select>
            </div>

            <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
              <aside className="h-fit rounded-lg border border-border bg-card p-6 shadow-sm">
                <h2 className="text-xl font-black text-foreground">Filtros</h2>
                <div className="mt-7">
                  <h3 className="mb-4 text-sm font-black text-foreground">Categoria</h3>
                  <div className="space-y-3">
                    {categories.map((category) => (
                      <label key={category} className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-foreground">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category)}
                          onChange={() => toggleCategory(category)}
                          className="h-4 w-4 rounded border-input accent-primary"
                        />
                        {category}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="mt-7 border-t border-border pt-6">
                  <Button variant="outline" onClick={() => window.print()} className="w-full gap-2">
                    <Download className="h-4 w-4" /> Download Catálogo
                  </Button>
                </div>
              </aside>

              <div>
                <p className="mb-6 text-sm text-muted-foreground">{filteredProducts.length} produtos encontrados</p>
                {filteredProducts.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {filteredProducts.map((equipment: any) => {
                      const imageUrls =
                        Array.isArray(equipment?.imageUrls) && equipment.imageUrls.filter((url: string) => isValidHttpUrl(url)).length > 0
                          ? equipment.imageUrls.filter((url: string) => isValidHttpUrl(url))
                          : [isValidHttpUrl(equipment?.imageUrl) ? equipment.imageUrl : "https://placehold.co/620x620.png"];
                      const firstValidUrl = imageUrls[0] || "https://placehold.co/620x620.png";
                      const productName = equipment?.name || "Equipamento";
                      const code = equipment?.code || equipment?.patrimony || equipment?.model || productName.split(" ").slice(-1).join("");

                      return (
                        <Card key={equipment.id || productName} className="overflow-hidden rounded-lg border-border bg-card shadow-sm">
                          <div className="m-4 mb-0 aspect-square overflow-hidden bg-muted">
                            <img src={firstValidUrl} alt={productName} className="h-full w-full object-contain p-5" loading="lazy" />
                          </div>
                          <CardContent className="flex min-h-[300px] flex-col p-5 pt-6">
                            <span className="mb-2 text-sm font-medium uppercase text-muted-foreground">{code}</span>
                            <h2 className="text-xl font-bold leading-snug text-foreground">{productName}</h2>
                            <a href={buildWhatsAppUrl(companySettings?.phone, productName)} target="_blank" rel="noreferrer" className="mt-5 inline-flex text-sm font-black text-primary">
                              Sob Consulta →
                            </a>
                            <p className="mt-5 line-clamp-2 text-base leading-relaxed text-muted-foreground">
                              {equipment?.description || "Projetado para ambientes industriais e operações logísticas intensivas."}
                            </p>
                            <div className="mt-5 flex flex-wrap gap-2">
                              {fallbackTags.map(({ icon: Icon, label }) => (
                                <span key={label} className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                                  <Icon className="h-3 w-3" /> {label}
                                </span>
                              ))}
                              <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">+1</span>
                            </div>
                            <div className="mt-auto flex gap-2 pt-6">
                              <Button variant="outline" className="h-10 flex-1" asChild>
                                <Link to={getProductPath(equipment)}>Ver produto</Link>
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
                    <h2 className="mt-4 text-xl font-bold text-foreground">Nenhum produto encontrado</h2>
                    <p className="mt-2 text-sm text-muted-foreground">Tente ajustar sua busca ou remover filtros.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Produtos;
