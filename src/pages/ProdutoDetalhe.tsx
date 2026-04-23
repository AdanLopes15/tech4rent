import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Battery, Bluetooth, CheckCircle2, MessageCircle, PackageCheck, ShieldCheck, Smartphone, Truck, Wifi } from "lucide-react";
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

const getImages = (equipment: any) => {
  const urls = Array.isArray(equipment?.imageUrls) ? equipment.imageUrls.filter((url: string) => isValidHttpUrl(url)) : [];
  if (urls.length > 0) return urls;
  return [isValidHttpUrl(equipment?.imageUrl) ? equipment.imageUrl : "https://placehold.co/900x900.png"];
};

const getProductPath = (equipment: any) => `/produtos/${encodeURIComponent(String(equipment?.id || equipment?.name || "produto"))}`;

const featureCards = [
  { icon: Smartphone, title: "Android", description: "Sistema pronto para operação" },
  { icon: Wifi, title: "Wi-Fi + 4G", description: "Conectividade completa" },
  { icon: Battery, title: "Bateria reforçada", description: "Mais autonomia no turno" },
  { icon: Bluetooth, title: "Bluetooth", description: "Integração com acessórios" },
];

const ProdutoDetalhe = () => {
  const { productId } = useParams();
  const fetchAllData = useStore((s) => s.fetchAllData);
  const { companySettings, equipments } = useStore();
  const decodedId = productId ? decodeURIComponent(productId) : "";

  useEffect(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  const product = useMemo(
    () => equipments.find((equipment: any) => String(equipment?.id) === decodedId || String(equipment?.name) === decodedId),
    [equipments, decodedId],
  );

  const images = useMemo(() => getImages(product), [product]);
  const [selectedImage, setSelectedImage] = useState(images[0]);

  useEffect(() => {
    setSelectedImage(images[0]);
  }, [images]);

  const relatedProducts = useMemo(
    () => equipments.filter((equipment: any) => equipment?.id !== product?.id).slice(0, 3),
    [equipments, product?.id],
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
  const specs = [
    ["Categoria", product?.category],
    ["Código", code],
    ["Modelo", product?.model],
    ["Estoque", product?.stock ? `${product.stock} ${product?.unit || "un."}` : undefined],
    ["Finalidade", product?.purpose],
    ["Garantia", "1 ano + assistência no Brasil"],
  ].filter(([, value]) => Boolean(value));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <section className="py-8 md:py-16">
          <div className="container max-w-6xl">
            <Link to="/produtos" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-4 w-4" /> Produtos / {product?.category || "Catálogo"} / {productName}
            </Link>

            <div className="grid gap-12 lg:grid-cols-[1fr_0.95fr] lg:items-center">
              <div>
                <div className="aspect-square overflow-hidden rounded-lg bg-muted p-8">
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
                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{code}</p>
                <h1 className="mt-4 text-4xl font-black leading-tight md:text-5xl">{productName}</h1>
                <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">{description}</p>

                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {featureCards.map(({ icon: Icon, title, description: itemDescription }) => (
                    <div key={title} className="rounded-lg border border-border bg-card p-4">
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
                    <Link to="/produtos">Voltar ao catálogo</Link>
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

        <section className="bg-foreground py-20 text-background">
          <div className="container max-w-5xl">
            <h2 className="text-center text-3xl font-black md:text-4xl">Detalhes do <span className="text-primary">{productName}</span></h2>
            <div className="mt-12 grid gap-10 lg:grid-cols-[0.9fr_1fr] lg:items-center">
              <div>
                <div className="mb-7 h-1 w-16 bg-primary" />
                <h3 className="text-4xl font-black leading-tight">AGUENTA O TRANCO. <span className="text-primary">PONTO.</span></h3>
                <p className="mt-5 text-lg leading-relaxed text-background/70">Equipamento preparado para operação intensa, logística, estoque, expedição e loja.</p>
                <div className="mt-6 rounded-lg border border-background/15 bg-background/5 p-5 text-sm font-bold italic text-background/80">
                  “Não é para ficar bonito na mesa. É para sobreviver no chão.”
                </div>
              </div>
              <div className="overflow-hidden rounded-lg border border-background/10 bg-background/5 p-8">
                <img src={selectedImage} alt={`Detalhes do ${productName}`} className="mx-auto h-80 w-full object-contain" loading="lazy" />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-foreground py-20 text-background">
          <div className="container max-w-4xl">
            <div className="mb-8 h-1 w-14 bg-primary" />
            <h2 className="text-3xl font-black"><span className="text-background">DADOS </span><span className="text-primary">TÉCNICOS</span></h2>
            <div className="mt-10 overflow-hidden rounded-lg border border-background/15">
              {specs.map(([label, value], index) => (
                <div key={label} className={`grid gap-3 px-5 py-4 text-sm sm:grid-cols-[160px_1fr] ${index % 2 === 0 ? "bg-background/6" : "bg-background/3"}`}>
                  <span className="font-black text-primary">{label}:</span>
                  <span className="text-background/85">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-foreground py-20 text-center text-background">
          <div className="container max-w-3xl">
            <ShieldCheck className="mx-auto h-14 w-14 text-primary" />
            <h2 className="mt-8 text-3xl font-black">VOCÊ NÃO FICA <span className="text-primary">NA MÃO.</span></h2>
            <p className="mt-4 text-lg text-background/70">1 ano de garantia + assistência técnica no Brasil.</p>
            <div className="mx-auto mt-7 max-w-lg rounded-lg border border-background/15 bg-background/5 p-5 text-sm font-bold italic text-background/85">
              “Deu problema, resolve.”
            </div>
          </div>
        </section>

        {relatedProducts.length > 0 && (
          <section className="py-16">
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