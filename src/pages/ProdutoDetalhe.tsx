import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Battery, Bluetooth, CheckCircle2, GitCompare, MessageCircle, PackageCheck, QrCode, ScanLine, ShieldCheck, Smartphone, Truck, Wifi } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
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

const getImages = (product: any) => {
  const fromCatalog = Array.isArray(product?.galleryUrls) ? product.galleryUrls.filter((url: string) => isValidHttpUrl(url)) : [];
  const hero = isValidHttpUrl(product?.heroImageUrl) ? [product.heroImageUrl] : [];
  const merged = [...hero, ...fromCatalog];
  if (merged.length > 0) return Array.from(new Set(merged));
  const urls = Array.isArray(product?.imageUrls) ? product.imageUrls.filter((url: string) => isValidHttpUrl(url)) : [];
  if (urls.length > 0) return urls;
  return [isValidHttpUrl(product?.imageUrl) ? product.imageUrl : "https://placehold.co/900x900.png"];
};

const getProductPath = (item: any) => `/produtos/${encodeURIComponent(String(item?.id || item?.name || "produto"))}`;

const featureCards = [
  { icon: Smartphone, title: "Android", description: "Sistema pronto para operação" },
  { icon: Wifi, title: "Wi-Fi + 4G", description: "Conectividade completa" },
  { icon: Battery, title: "Bateria reforçada", description: "Mais autonomia no turno" },
  { icon: Bluetooth, title: "Bluetooth", description: "Integração com acessórios" },
];

const highlightSpecs = [
  { icon: ScanLine, title: "Scanner 2D com IA", description: "Lê até código danificado" },
  { icon: Battery, title: "Bateria 5000mAh", description: "Turno inteiro sem carregar" },
  { icon: Smartphone, title: "Android 14", description: "Google Play Store nativo" },
  { icon: Wifi, title: "Wi‑Fi 5 + 4G LTE", description: "Conectividade completa" },
];

const operationPerks = ["Leitura 1D/2D de alta performance", "Funciona com códigos danificados ou mal impressos", "Mais agilidade no picking, recebimento e inventário"];

const ProdutoDetalhe = () => {
  const { productId } = useParams();
  const fetchAllData = useStore((s) => s.fetchAllData);
  const { companySettings, equipments, catalogItems } = useStore();
  const decodedId = productId ? decodeURIComponent(productId) : "";

  useEffect(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  const catalogItem = useMemo(() => {
    if (decodedId.startsWith("cat-")) {
      const realId = decodedId.replace(/^cat-/, "");
      return (catalogItems || []).find((c: any) => String(c.id) === realId);
    }
    // fallback: catalog item linked to the same equipmentId or matching by name
    return (catalogItems || []).find(
      (c: any) => c.published && (String(c.equipmentId) === decodedId || String(c.name) === decodedId),
    );
  }, [catalogItems, decodedId]);

  const baseEquipment = useMemo(
    () => equipments.find((equipment: any) => String(equipment?.id) === decodedId || String(equipment?.name) === decodedId),
    [equipments, decodedId],
  );

  // Merge: catalog item overrides equipment fields when present
  const product = useMemo(() => {
    if (!catalogItem && !baseEquipment) return null;
    if (!catalogItem) return baseEquipment;
    const linkedEquip = baseEquipment || equipments.find((e: any) => String(e.id) === String(catalogItem.equipmentId));
    return {
      ...(linkedEquip || {}),
      ...catalogItem,
      description: catalogItem.longDescription || catalogItem.shortDescription || linkedEquip?.description,
    };
  }, [catalogItem, baseEquipment, equipments]);

  const images = useMemo(() => getImages(product), [product]);
  const [selectedImage, setSelectedImage] = useState(images[0]);

  useEffect(() => {
    setSelectedImage(images[0]);
  }, [images]);

  const relatedProducts = useMemo(
    () => equipments.filter((equipment: any) => equipment?.id !== product?.id && equipment?.id !== catalogItem?.equipmentId).slice(0, 3),
    [equipments, product?.id, catalogItem?.equipmentId],
  );

  if (!product) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="container flex min-h-[60vh] max-w-4xl flex-col items-center justify-center text-center">
          <PackageCheck className="h-12 w-12 text-primary" />
          <h1 className="mt-5 text-3xl font-black">Produto não encontrado</h1>
          <p className="mt-3 text-muted-foreground">Volte ao catálogo para escolher outro equipamento.</p>
          <Button asChild className="mt-7">
            <Link to="/produtos">Ver catálogo</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const productName = product?.name || "Equipamento";
  const code = product?.code || product?.model || product?.patrimony || product?.category || "TECH4RENT";
  const description = product?.description || "Projetado para ambientes industriais e operações logísticas intensivas.";
  const whatsappUrl = buildWhatsAppUrl(companySettings?.phone, productName);
  // ===== Custom data from catalog item (overrides fallback when present) =====
  const customSpecGroups = Array.isArray(product?.specGroups) && product.specGroups.length > 0
    ? product.specGroups.filter((g: any) => g?.title || (Array.isArray(g?.rows) && g.rows.length > 0))
    : null;
  const legacySpecs = Array.isArray(product?.specs) && product.specs.length > 0
    ? product.specs.map((s: any) => [s.label, s.value])
    : null;
  // Fallback "specs" array (for the right sidebar table) in case nothing custom
  const fallbackSpecs = [
    ["Categoria", product?.category],
    ["Código", code],
    ["Modelo", product?.model],
    ["Estoque", product?.stock ? `${product.stock} ${product?.unit || "un."}` : undefined],
    ["Finalidade", product?.purpose],
    ["Garantia", "1 ano + assistência no Brasil"],
  ].filter(([, value]) => Boolean(value));
  const flatSpecs = legacySpecs || fallbackSpecs;

  const customTags = Array.isArray(product?.tags) && product.tags.length > 0 ? product.tags : null;
  const customSections = Array.isArray(product?.sections)
    ? product.sections.filter((s: any) => s?.title || s?.text || s?.imageUrl || s?.videoUrl)
    : [];
  const customKit = Array.isArray(product?.kitItems) && product.kitItems.length > 0
    ? product.kitItems.filter((k: any) => k?.name || k?.imageUrl)
    : null;
  const legacyBox = Array.isArray(product?.whatsBoxItems) ? product.whatsBoxItems.filter(Boolean) : [];
  const customVideo = product?.videoUrl;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <section className="border-b border-border bg-card py-8 md:py-16">
          <div className="container max-w-6xl">
            <Link to="/produtos" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-4 w-4" /> Produtos / {product?.category || "Catálogo"} / {productName}
            </Link>

            <div className="grid gap-12 lg:grid-cols-[1fr_0.95fr] lg:items-center">
              <div>
                <div className="aspect-square overflow-hidden rounded-lg border border-border bg-background p-8 shadow-sm">
                  <img src={selectedImage} alt={productName} className="h-full w-full object-contain" />
                </div>
                {images.length > 1 && (
                  <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                    {images.map((url: string, index: number) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => setSelectedImage(url)}
                        className={`h-20 w-20 shrink-0 overflow-hidden rounded-md border bg-muted p-2 ${selectedImage === url ? "border-primary" : "border-border"}`}
                        aria-label={`Imagem ${index + 1} de ${productName}`}
                      >
                        <img src={url} alt="" className="h-full w-full object-contain" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-primary">{code}</p>
                <h1 className="mt-4 text-4xl font-black leading-tight md:text-5xl">{productName}</h1>
                <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">{description}</p>

                <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
                  {customTags
                    ? customTags.map((tag: any) => (
                        <span key={tag.label} className="rounded-full border border-border bg-muted px-3 py-1">{tag.label}</span>
                      ))
                    : ["Android", "2D", "Wi‑Fi", "Bluetooth", "Chip 4G"].map((t) => (
                        <span key={t} className="rounded-full border border-border bg-muted px-3 py-1">{t}</span>
                      ))}
                </div>

                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {highlightSpecs.map(({ icon: Icon, title, description: itemDescription }) => (
                    <div key={title} className="rounded-lg border border-border bg-background p-4 shadow-sm">
                      <Icon className="h-5 w-5 text-primary" />
                      <h2 className="mt-3 text-sm font-black">{title}</h2>
                      <p className="mt-1 text-xs text-muted-foreground">{itemDescription}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-9 flex flex-wrap gap-3">
                  <Button asChild size="lg" className="gap-2">
                    <a href={whatsappUrl} target="_blank" rel="noreferrer">
                      <MessageCircle className="h-5 w-5" /> Cotar agora
                    </a>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link to="/produtos"><GitCompare className="mr-2 h-4 w-4" /> Comparar</Link>
                  </Button>
                </div>

                <div className="mt-5 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2"><Truck className="h-4 w-4" /> Envio para todo o Brasil</span>
                  <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Suporte no Brasil</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ SEÇÕES LIVRES (substitui as fixas quando configuradas) ============ */}
        {customSections.length > 0 ? (
          <section className="bg-background py-16 md:py-20">
            <div className="container max-w-5xl space-y-16">
              {customSections.map((sec: any, i: number) => {
                const mediaOnRight = (sec.mediaSide || "left") === "right";
                const hasMedia = sec.imageUrl || sec.videoUrl;
                return (
                  <div key={i} className={`grid gap-10 lg:grid-cols-2 lg:items-center ${mediaOnRight ? "lg:[&>*:first-child]:order-1 lg:[&>*:last-child]:order-2" : "lg:[&>*:first-child]:order-1"}`}>
                    {hasMedia && !mediaOnRight && (
                      <div className="overflow-hidden rounded-lg border border-border bg-muted p-6">
                        {sec.videoUrl ? (
                          <video src={sec.videoUrl} className="mx-auto h-72 w-full object-contain" autoPlay muted loop playsInline />
                        ) : (
                          <img src={sec.imageUrl} alt={sec.title || `Seção ${i + 1}`} className="mx-auto h-72 w-full object-contain" loading="lazy" />
                        )}
                      </div>
                    )}
                    <div>
                      <div className="mb-5 h-1 w-14 bg-primary" />
                      {sec.title && <h2 className="text-3xl font-black leading-tight md:text-4xl">{sec.title}</h2>}
                      {sec.text && <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-muted-foreground">{sec.text}</p>}
                      {sec.highlight && (
                        <div className="mt-6 rounded-lg border border-border bg-muted p-4 text-sm font-bold italic text-foreground">
                          “{sec.highlight}”
                        </div>
                      )}
                    </div>
                    {hasMedia && mediaOnRight && (
                      <div className="overflow-hidden rounded-lg border border-border bg-muted p-6">
                        {sec.videoUrl ? (
                          <video src={sec.videoUrl} className="mx-auto h-72 w-full object-contain" autoPlay muted loop playsInline />
                        ) : (
                          <img src={sec.imageUrl} alt={sec.title || `Seção ${i + 1}`} className="mx-auto h-72 w-full object-contain" loading="lazy" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <>
            <section className="py-20 text-background" style={{ background: "linear-gradient(180deg, hsl(var(--foreground)), hsl(var(--foreground) / 0.96))" }}>
              <div className="container max-w-5xl">
                <h2 className="text-center text-3xl font-black md:text-4xl">Detalhes do <span className="text-primary">{productName}</span></h2>
                <div className="mx-auto mt-8 max-w-3xl overflow-hidden rounded-lg border border-background/10 bg-primary/10 p-4 shadow-2xl shadow-foreground/30">
                  <img src={selectedImage} alt={`Demonstração do ${productName}`} className="mx-auto h-72 w-full object-contain" loading="lazy" />
                </div>
                <div className="mt-14 grid gap-10 lg:grid-cols-[0.9fr_1fr] lg:items-center">
                  <div>
                    <div className="mb-5 h-1 w-16 bg-primary" />
                    <h3 className="text-4xl font-black leading-tight">AGUENTA O TRANCO. <span className="text-primary">PONTO.</span></h3>
                    <p className="mt-5 text-lg leading-relaxed text-background/70">Construção robusta para operação intensa em logística, estoque, expedição e loja.</p>
                    <div className="mt-6 rounded-lg border border-background/15 bg-background/10 p-5 text-sm font-bold italic text-background/85">
                      “Não é para ficar bonito na mesa. É para sobreviver no chão.”
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-background/10 bg-background/10 p-8">
                    <img src={selectedImage} alt={`Resistência do ${productName}`} className="mx-auto h-80 w-full object-contain" loading="lazy" />
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-muted py-20 text-foreground">
              <div className="container max-w-5xl">
                <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                  <div className="overflow-hidden rounded-lg border border-border bg-card p-8 shadow-sm">
                    <img src={selectedImage} alt={`Leitura rápida com ${productName}`} className="mx-auto h-80 w-full object-contain" loading="lazy" />
                  </div>
                  <div>
                    <div className="mb-5 h-1 w-14 bg-primary" />
                    <h2 className="text-3xl font-black leading-tight">LEITURA RÁPIDA. <span className="text-primary">MESMO COM O CÓDIGO FEIO.</span></h2>
                    <p className="mt-4 text-base leading-relaxed text-muted-foreground">Leitura 1D/2D de alta performance, inclusive em códigos danificados ou com impressão ruim.</p>
                    <ul className="mt-6 space-y-3 text-sm font-semibold text-foreground">
                      {operationPerks.map((perk) => (
                        <li key={perk} className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-primary" /> {perk}</li>
                      ))}
                    </ul>
                    <p className="mt-6 text-sm font-black italic text-muted-foreground">“Se o código existe, o <span className="text-primary">{code}</span> faz a leitura.”</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="py-20 text-background" style={{ background: "linear-gradient(180deg, hsl(var(--foreground) / 0.96), hsl(var(--foreground)))" }}>
              <div className="container max-w-5xl">
                <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
                  <div>
                    <div className="mb-5 h-1 w-14 bg-primary" />
                    <h2 className="text-3xl font-black leading-tight">ATUALIZADO DE VERDADE: <span className="text-primary">ANDROID 14.</span></h2>
                    <p className="mt-4 text-background/70">Compatível com sistemas ERP, WMS e apps Android. Opera online/offline conforme sua rotina.</p>
                    <div className="mt-6 rounded-lg border border-background/15 bg-background/5 p-4 text-sm font-bold italic text-background/85">
                      “Chega de comprar coletor que nasce velho.”
                    </div>
                  </div>
                  <div className="rounded-lg border border-background/10 bg-background/5 p-8">
                    <img src={selectedImage} alt={`Android no ${productName}`} className="mx-auto h-72 w-full object-contain" loading="lazy" />
                  </div>
                </div>

                <div className="mt-20 grid gap-14 lg:grid-cols-[0.9fr_1fr] lg:items-center">
                  <div className="rounded-lg border border-background/10 bg-background/5 p-8">
                    <img src={selectedImage} alt={`Bateria e operação do ${productName}`} className="mx-auto h-72 w-full object-contain" loading="lazy" />
                  </div>
                  <div>
                    <div className="mb-5 h-1 w-14 bg-primary" />
                    <h2 className="text-3xl font-black leading-tight">TRABALHA O TURNO INTEIRO <span className="text-primary">SEM PEDIR ARREGO.</span></h2>
                    <div className="mt-6 space-y-3">
                      {featureCards.map(({ icon: Icon, title, description: itemDescription }) => (
                        <div key={title} className="flex items-center gap-4 rounded-lg border border-background/15 bg-background/5 p-4">
                          <Icon className="h-5 w-5 text-primary" />
                          <div>
                            <h3 className="text-sm font-black">{title}</h3>
                            <p className="text-xs text-background/60">{itemDescription}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="mt-6 text-sm font-black italic text-background/75">“Operação não para porque <span className="text-primary">o coletor cansou</span>.”</p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ============ DADOS TÉCNICOS ============ */}
        <section className="border-y border-border bg-muted py-20 text-foreground">
          <div className="container max-w-4xl">
            <div className="mb-8 h-1 w-14 bg-primary" />
            <h2 className="text-3xl font-black"><span>DADOS </span><span className="text-primary">TÉCNICOS</span></h2>

            {customSpecGroups ? (
              <div className="mt-10 space-y-8">
                {customSpecGroups.map((group: any, gi: number) => (
                  <div key={gi}>
                    <h3 className="mb-3 text-sm font-black uppercase tracking-wider text-primary">{group.title}</h3>
                    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                      {(group.rows || []).map((row: any, ri: number) => (
                        <div key={ri} className={`grid gap-3 px-5 py-4 text-sm sm:grid-cols-[200px_1fr] ${ri % 2 === 0 ? "bg-card" : "bg-muted"}`}>
                          <span className="font-black text-foreground">{row.label}</span>
                          <span className="text-muted-foreground">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-10 overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                {flatSpecs.map(([label, value], index) => (
                  <div key={String(label)} className={`grid gap-3 px-5 py-4 text-sm sm:grid-cols-[160px_1fr] ${index % 2 === 0 ? "bg-card" : "bg-muted"}`}>
                    <span className="font-black text-primary">{label}:</span>
                    <span className="text-muted-foreground">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {customVideo && (
          <section className="bg-background py-16">
            <div className="container max-w-5xl">
              <h2 className="text-center text-3xl font-black">Veja o <span className="text-primary">{productName}</span> em ação</h2>
              <div className="mx-auto mt-8 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
                <video src={customVideo} controls className="h-full w-full" />
              </div>
            </div>
          </section>
        )}

        <section className="bg-card py-20 text-center text-foreground">
          <div className="container max-w-4xl">
            <div className="mx-auto mb-6 h-1 w-14 bg-primary" />
            <h2 className="text-3xl font-black">VOCÊ JÁ RECEBE <span className="text-primary">PRONTO PRA OPERAÇÃO.</span></h2>
            <p className="mt-2 text-sm text-muted-foreground">O que vem na caixa</p>

            {customKit ? (
              <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2 md:grid-cols-4">
                {customKit.map((item: any, i: number) => (
                  <div key={i} className="flex flex-col items-center rounded-lg border border-border bg-muted p-4 shadow-sm">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="h-24 w-24 object-contain" loading="lazy" />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-md bg-card">
                        <QrCode className="h-10 w-10 text-primary" />
                      </div>
                    )}
                    <p className="mt-3 text-center text-xs font-black uppercase text-foreground">{item.name}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mx-auto mt-10 grid max-w-2xl gap-3 rounded-lg border border-border bg-muted p-5 sm:grid-cols-4">
                {(legacyBox.length > 0 ? legacyBox : ["Capa silicone", "Película vidro", "Fonte com cabo", "Gatilho"]).map((item: string) => (
                  <div key={item} className="rounded-md bg-card p-4 text-sm font-black uppercase shadow-sm">
                    <QrCode className="mx-auto mb-3 h-8 w-8 text-primary" /> {item}
                  </div>
                ))}
              </div>
            )}

            <Button asChild size="lg" className="mt-8 gap-2 px-10">
              <a href={whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle className="h-5 w-5" /> Solicitar orçamento</a>
            </Button>
          </div>
        </section>

        {relatedProducts.length > 0 && (
          <section className="bg-background py-16">
            <div className="container max-w-5xl">
              <h2 className="text-2xl font-black">Produtos Relacionados</h2>
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                {relatedProducts.map((item: any) => {
                  const imageUrl = getImages(item)[0];
                  return (
                    <Card key={item?.id || item?.name} className="overflow-hidden rounded-lg border-border">
                      <div className="m-4 mb-0 aspect-square bg-muted p-5">
                        <img src={imageUrl} alt={item?.name || "Produto relacionado"} className="h-full w-full object-contain" loading="lazy" />
                      </div>
                      <CardContent className="p-5">
                        <p className="text-xs font-bold uppercase text-muted-foreground">{item?.code || item?.category}</p>
                        <h3 className="mt-2 line-clamp-2 font-black">{item?.name}</h3>
                        <Button asChild variant="outline" className="mt-5 w-full">
                          <Link to={getProductPath(item)}>Ver produto</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProdutoDetalhe;