// src/pages/Comparar.tsx

import { useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, MessageCircle } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/store";

function isValidHttpUrl(value?: string | null): boolean {
  if (!value) return false;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

const buildWhatsAppUrl = (phone?: string, product?: string) => {
  const digits = phone?.replace(/\D/g, "") || "";
  const message = product ? `Olá, gostaria de um orçamento para ${product}.` : "Olá, gostaria de solicitar um orçamento.";
  return digits ? `https://wa.me/55${digits}?text=${encodeURIComponent(message)}` : "#";
};

const isComparable = (p: any) => {
  const haystack = `${p?.category || ""} ${p?.type || ""} ${p?.name || ""}`.toLowerCase();
  return /\b(pda|coletor|coletores|handheld|smartphone)\b/.test(haystack);
};

const getImage = (p: any) => {
  if (isValidHttpUrl(p?.heroImageUrl)) return p.heroImageUrl;
  if (Array.isArray(p?.galleryUrls)) {
    const v = p.galleryUrls.find(isValidHttpUrl);
    if (v) return v;
  }
  if (Array.isArray(p?.imageUrls)) {
    const v = p.imageUrls.find(isValidHttpUrl);
    if (v) return v;
  }
  if (isValidHttpUrl(p?.imageUrl)) return p.imageUrl;
  return "https://placehold.co/200x200.png";
};

// Extract spec rows as { label, value } from product.specGroups or legacy product.specs
const extractSpecs = (p: any): { label: string; value: string }[] => {
  if (!p) return [];
  const rows: { label: string; value: string }[] = [];
  if (Array.isArray(p?.specGroups)) {
    for (const g of p.specGroups) {
      if (Array.isArray(g?.rows)) {
        for (const r of g.rows) {
          const label = String(r?.label || r?.[0] || "").trim();
          const value = String(r?.value || r?.[1] || "").trim();
          if (label) rows.push({ label, value });
        }
      }
    }
  }
  if (Array.isArray(p?.specs)) {
    for (const s of p.specs) {
      const label = String(s?.label || s?.[0] || "").trim();
      const value = String(s?.value || s?.[1] || "").trim();
      if (label) rows.push({ label, value });
    }
  }
  return rows;
};

const Comparar = () => {
  const fetchAllData = useStore((s) => s.fetchAllData);
  const { companySettings, equipments, catalogItems } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  // Merge published catalog + equipments (skip duplicates), only comparable
  const products = useMemo(() => {
    const published = (catalogItems || []).filter((c: any) => c.published);
    const usedIds = new Set(published.map((c: any) => c.equipmentId).filter(Boolean));
    const fromCatalog = published.map((c: any) => ({
      id: String(c.id),
      name: c.name,
      code: c.code,
      category: c.category,
      heroImageUrl: c.heroImageUrl,
      galleryUrls: c.galleryUrls,
      shortDescription: c.shortDescription,
      specGroups: c.specGroups,
      specs: c.specs,
    }));
    const fromEquipments = (equipments || [])
      .filter((e: any) => !usedIds.has(e.id))
      .map((e: any) => ({ ...e, id: String(e.id) }));
    return [...fromCatalog, ...fromEquipments].filter(isComparable);
  }, [equipments, catalogItems]);

  const normCategory = (p: any) => String(p?.category || "").trim().toLowerCase();

  const aId = searchParams.get("a") || products[0]?.id || "";
  const productA = products.find((p) => p.id === aId) || null;

  // B precisa ser da mesma categoria de A
  const sameCategoryProducts = useMemo(
    () => (productA ? products.filter((p) => normCategory(p) === normCategory(productA)) : products),
    [products, productA],
  );

  const requestedB = searchParams.get("b");
  const bId =
    (requestedB && sameCategoryProducts.find((p) => p.id === requestedB)?.id) ||
    sameCategoryProducts.find((p) => p.id !== aId)?.id ||
    "";
  const productB = sameCategoryProducts.find((p) => p.id === bId) || null;

  const setA = (id: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("a", id);
    // Se a nova categoria não casa com B atual, limpa B
    const newA = products.find((p) => p.id === id);
    const currentB = products.find((p) => p.id === next.get("b"));
    if (!newA || !currentB || normCategory(newA) !== normCategory(currentB)) {
      next.delete("b");
    }
    setSearchParams(next, { replace: true });
  };
  const setB = (id: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("b", id);
    if (!next.get("a") && aId) next.set("a", aId);
    setSearchParams(next, { replace: true });
  };


  // Union of spec labels (preserve order: A first, then B unique)
  const comparisonRows = useMemo(() => {
    const specsA = extractSpecs(productA);
    const specsB = extractSpecs(productB);
    const mapA = new Map(specsA.map((r) => [r.label, r.value]));
    const mapB = new Map(specsB.map((r) => [r.label, r.value]));
    const labels: string[] = [];
    const seen = new Set<string>();
    for (const r of specsA) if (!seen.has(r.label)) { seen.add(r.label); labels.push(r.label); }
    for (const r of specsB) if (!seen.has(r.label)) { seen.add(r.label); labels.push(r.label); }
    return labels.map((label) => ({
      label,
      a: mapA.get(label) || "—",
      b: mapB.get(label) || "—",
    }));
  }, [productA, productB]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="container max-w-6xl py-6">
          <Link to="/produtos" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Produtos / Comparativo
          </Link>
        </div>

        <section className="border-t border-border bg-muted/30 py-12 md:py-16">
          <div className="container max-w-6xl">
            <div className="text-center">
              <h1 className="text-3xl font-black md:text-4xl">Compare Coletores</h1>
              <p className="mt-3 text-muted-foreground">Selecione dois modelos para ver as diferenças lado a lado.</p>
            </div>

            {products.length < 2 ? (
              <div className="mt-10 rounded-lg border border-dashed border-border bg-card p-10 text-center">
                <p className="text-sm text-muted-foreground">É necessário ter ao menos dois coletores cadastrados para comparar.</p>
              </div>
            ) : (
              <>
                <div className="mt-10 grid grid-cols-1 items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
                  <div>
                    <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-muted-foreground">Produto A</p>
                    <Select value={aId} onValueChange={setA}>
                      <SelectTrigger className="h-14">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            <span className="flex flex-col">
                              <span className="font-medium">{p.name}</span>
                              {p.code && <span className="text-xs text-muted-foreground">{p.code}</span>}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="hidden text-center text-xl font-black text-primary md:block">VS</div>

                  <div>
                    <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-muted-foreground">Produto B</p>
                    <Select value={bId} onValueChange={setB}>
                      <SelectTrigger className="h-14">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            <span className="flex flex-col">
                              <span className="font-medium">{p.name}</span>
                              {p.code && <span className="text-xs text-muted-foreground">{p.code}</span>}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Cabeçalhos com imagem */}
                <div className="mt-10 grid grid-cols-2 gap-6">
                  {[productA, productB].map((p, i) => (
                    <div key={i} className="text-center">
                      <div className="mx-auto flex aspect-square w-full max-w-[260px] items-center justify-center overflow-hidden rounded-lg bg-muted">
                        <img src={getImage(p)} alt={p?.name || "Produto"} className="h-full w-full object-contain p-6" loading="lazy" />
                      </div>
                      <h2 className="mt-4 text-lg font-black">{p?.name || "—"}</h2>
                      {p?.code && <p className="text-xs text-muted-foreground">{p.code}</p>}
                      {p?.shortDescription && (
                        <p className="mx-auto mt-3 max-w-xs text-sm text-muted-foreground">{p.shortDescription}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Tabela de specs */}
                {comparisonRows.length > 0 ? (
                  <div className="mt-10 overflow-hidden rounded-lg border border-border bg-card">
                    <table className="w-full text-sm">
                      <tbody>
                        {comparisonRows.map((row, idx) => (
                          <tr key={row.label} className={idx % 2 === 0 ? "bg-background" : "bg-muted/40"}>
                            <td className="w-1/3 px-4 py-3 font-semibold text-primary">{row.label}</td>
                            <td className="w-1/3 px-4 py-3 text-center font-semibold">{row.a}</td>
                            <td className="w-1/3 px-4 py-3 text-center font-semibold">{row.b}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="mt-10 rounded-lg border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                    Os produtos selecionados ainda não possuem especificações cadastradas para comparação.
                  </div>
                )}

                {/* CTAs */}
                <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {[productA, productB].map((p, i) => (
                    <Button key={i} asChild size="lg" className="h-12 gap-2" disabled={!p}>
                      <a href={buildWhatsAppUrl(companySettings?.phone, p?.name)} target="_blank" rel="noreferrer">
                        <MessageCircle className="h-5 w-5" /> Cotar {p?.name || "—"}
                      </a>
                    </Button>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Comparar;
