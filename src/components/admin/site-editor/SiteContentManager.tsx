import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MediaUploadField from "@/components/admin/MediaUploadField";
import RepeaterField from "@/components/admin/RepeaterField";
import { SectionShell, TextField } from "@/components/admin/site-editor/EditorPrimitives";
import { setByPath } from "@/lib/object-path";
import { useStore, type SiteContent } from "@/store";

type FilesMap = { [path: string]: File | null };

const SiteContentManager = () => {
  const { companySettings, updateSiteContent } = useStore();
  const [content, setContent] = useState<SiteContent | null>(null);
  const [files, setFiles] = useState<FilesMap>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (companySettings?.siteContent) {
      setContent(JSON.parse(JSON.stringify(companySettings.siteContent)));
    }
  }, [companySettings?.siteContent]);

  const update = (path: string, value: any) => {
    setContent((prev) => (prev ? setByPath(prev, path, value) : prev));
  };

  const updateMedia = (path: string, file: File, dataUrl: string) => {
    update(path, dataUrl);
    setFiles((prev) => ({ ...prev, [path]: file }));
  };

  const clearMedia = (path: string) => {
    update(path, "");
    setFiles((prev) => {
      const next = { ...prev };
      delete next[path];
      return next;
    });
  };

  const handleSave = async () => {
    if (!content) return;
    setSaving(true);
    try {
      await updateSiteContent(content, files);
      setFiles({});
      toast.success("Conteúdo do site salvo com sucesso!");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar o conteúdo do site.");
    } finally {
      setSaving(false);
    }
  };

  const home = content?.home;
  const produtos = content?.produtos;
  const sobre = content?.sobre;
  const contato = content?.contato;
  const navbar = content?.navbar;
  const footer = content?.footer;
  const hero = content?.hero;
  const featured = content?.featuredProduct;
  const differentiators = content?.differentiators;
  const aboutSection = content?.about;
  const contactSection = content?.contact;

  const interestsCsv = useMemo(() => (contato?.form?.interests || []).join("\n"), [contato?.form?.interests]);
  const logosCsv = useMemo(() => (home?.presence?.logos || []).join("\n"), [home?.presence?.logos]);

  if (!content) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando conteúdo...</div>;
  }

  return (
    <div className="space-y-4">
      <Card className="border-border">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Configurações do Site</CardTitle>
            <CardDescription>
              Edite todos os textos, imagens e vídeos das páginas públicas do seu site.
            </CardDescription>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar tudo"}
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="home" className="space-y-4">
            <TabsList className="w-full justify-start overflow-auto bg-muted/50">
              <TabsTrigger value="home">Home</TabsTrigger>
              <TabsTrigger value="produtos">Produtos</TabsTrigger>
              <TabsTrigger value="sobre">Sobre / Dúvidas</TabsTrigger>
              <TabsTrigger value="contato">Contato</TabsTrigger>
              <TabsTrigger value="navfooter">Navbar & Footer</TabsTrigger>
            </TabsList>

            {/* ============ HOME ============ */}
            <TabsContent value="home" className="space-y-4">
              <SectionShell title="Hero (banner principal)" description="Primeira seção da home, com título grande e botões.">
                <TextField label="Título principal" value={hero?.title || ""} onChange={(v) => update("hero.title", v)} />
                <TextField label="Subtítulo" value={hero?.subtitle || ""} onChange={(v) => update("hero.subtitle", v)} textarea rows={2} />
                <div className="grid gap-3 md:grid-cols-2">
                  <TextField label="Botão primário (CTA)" value={hero?.primaryCtaLabel || ""} onChange={(v) => update("hero.primaryCtaLabel", v)} />
                  <TextField label="Botão secundário (CTA)" value={hero?.secondaryCtaLabel || ""} onChange={(v) => update("hero.secondaryCtaLabel", v)} />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <MediaUploadField label="Imagem de fundo" type="image" value={hero?.backgroundImageUrl} onChange={(f, d) => updateMedia("hero.backgroundImageUrl", f, d)} onClear={() => clearMedia("hero.backgroundImageUrl")} />
                  <MediaUploadField label="Vídeo de fundo (opcional, sobrepõe imagem)" type="video" value={hero?.backgroundVideoUrl} onChange={(f, d) => updateMedia("hero.backgroundVideoUrl", f, d)} onClear={() => clearMedia("hero.backgroundVideoUrl")} />
                </div>
              </SectionShell>

              <SectionShell title="Barra de benefícios" description="Linha com 3 benefícios logo abaixo do hero.">
                <RepeaterField
                  label="Benefícios"
                  items={home?.benefits || []}
                  pathPrefix="home.benefits"
                  fields={[
                    { key: "icon", label: "Ícone (Shield, Headphones, BriefcaseBusiness, etc)" },
                    { key: "title", label: "Título" },
                    { key: "description", label: "Descrição", type: "textarea", rows: 2 },
                  ]}
                  newItem={() => ({ icon: "Shield", title: "Novo benefício", description: "" })}
                  onChange={(next) => update("home.benefits", next)}
                />
              </SectionShell>

              <SectionShell title="Vitrine de equipamentos (cabeçalho)" description="Os produtos vêm do cadastro de equipamentos.">
                <div className="grid gap-3 md:grid-cols-3">
                  <TextField label="Eyebrow" value={home?.equipmentHeader?.eyebrow || ""} onChange={(v) => update("home.equipmentHeader.eyebrow", v)} />
                  <TextField label="Título" value={home?.equipmentHeader?.title || ""} onChange={(v) => update("home.equipmentHeader.title", v)} />
                  <TextField label="Subtítulo" value={home?.equipmentHeader?.subtitle || ""} onChange={(v) => update("home.equipmentHeader.subtitle", v)} />
                </div>
              </SectionShell>

              <SectionShell title="Presença (logos + mapa + segmentos)">
                <TextField label="Título do carrossel de logos" value={home?.presence?.logosTitle || ""} onChange={(v) => update("home.presence.logosTitle", v)} />
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Logos (uma por linha)</Label>
                  <textarea
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    rows={5}
                    value={logosCsv}
                    onChange={(e) => update("home.presence.logos", e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))}
                  />
                </div>
                <TextField label="Título da seção" value={home?.presence?.sectionTitle || ""} onChange={(v) => update("home.presence.sectionTitle", v)} />

                <RepeaterField
                  label="Estatísticas"
                  items={home?.presence?.stats || []}
                  pathPrefix="home.presence.stats"
                  fields={[
                    { key: "icon", label: "Ícone (Package, Users, MapPin)" },
                    { key: "value", label: "Valor (ex: 10.000+)" },
                    { key: "label", label: "Rótulo" },
                  ]}
                  newItem={() => ({ icon: "Package", value: "0+", label: "Novo" })}
                  onChange={(next) => update("home.presence.stats", next)}
                />

                <TextField label="Título dos segmentos" value={home?.presence?.segmentsTitle || ""} onChange={(v) => update("home.presence.segmentsTitle", v)} />
                <RepeaterField
                  label="Segmentos atendidos"
                  items={home?.presence?.segments || []}
                  pathPrefix="home.presence.segments"
                  fields={[
                    { key: "icon", label: "Ícone (Truck, Factory, Heart, Warehouse, ShoppingCart, Package)" },
                    { key: "title", label: "Nome do segmento" },
                  ]}
                  newItem={() => ({ icon: "Package", title: "Novo segmento" })}
                  onChange={(next) => update("home.presence.segments", next)}
                />
              </SectionShell>

              <SectionShell title="Resultados / Cases">
                <TextField label="Eyebrow" value={home?.results?.eyebrow || ""} onChange={(v) => update("home.results.eyebrow", v)} />
                <TextField label="Título" value={home?.results?.title || ""} onChange={(v) => update("home.results.title", v)} />
                <RepeaterField
                  label="Cases"
                  items={home?.results?.items || []}
                  pathPrefix="home.results.items"
                  fields={[
                    { key: "icon", label: "Ícone (TrendingUp, Zap, Clock)" },
                    { key: "tag", label: "Tag (ex: E-commerce)" },
                    { key: "title", label: "Título do case" },
                    { key: "description", label: "Descrição", type: "textarea", rows: 3 },
                  ]}
                  newItem={() => ({ icon: "TrendingUp", tag: "Novo", title: "Novo case", description: "" })}
                  onChange={(next) => update("home.results.items", next)}
                />
              </SectionShell>

              <SectionShell title="Vídeo institucional">
                <TextField label="Título" value={home?.video?.title || ""} onChange={(v) => update("home.video.title", v)} />
                <MediaUploadField label="Vídeo (upload)" type="video" value={home?.video?.videoUrl} onChange={(f, d) => updateMedia("home.video.videoUrl", f, d)} onClear={() => clearMedia("home.video.videoUrl")} />
                <div className="grid gap-3 md:grid-cols-2">
                  <TextField label="Texto do placeholder (linha 1)" value={home?.video?.placeholderTopText || ""} onChange={(v) => update("home.video.placeholderTopText", v)} />
                  <TextField label="Texto do placeholder (linha 2)" value={home?.video?.placeholderBottomText || ""} onChange={(v) => update("home.video.placeholderBottomText", v)} />
                </div>
              </SectionShell>
            </TabsContent>

            {/* ============ PRODUTOS ============ */}
            <TabsContent value="produtos" className="space-y-4">
              <SectionShell title="Hero da página de Produtos">
                <TextField label="Título" value={produtos?.hero?.title || ""} onChange={(v) => update("produtos.hero.title", v)} />
                <TextField label="Subtítulo" value={produtos?.hero?.subtitle || ""} onChange={(v) => update("produtos.hero.subtitle", v)} />
                <TextField label="Botão (CTA)" value={produtos?.hero?.ctaLabel || ""} onChange={(v) => update("produtos.hero.ctaLabel", v)} />
              </SectionShell>

              <SectionShell title="Estado vazio (quando não há produtos no filtro)">
                <TextField label="Título" value={produtos?.emptyTitle || ""} onChange={(v) => update("produtos.emptyTitle", v)} />
                <TextField label="Subtítulo" value={produtos?.emptySubtitle || ""} onChange={(v) => update("produtos.emptySubtitle", v)} />
              </SectionShell>

              <SectionShell title="Tags padrão dos produtos" description="Tags exibidas em cada card de produto.">
                <RepeaterField
                  label="Tags"
                  items={produtos?.fallbackTags || []}
                  pathPrefix="produtos.fallbackTags"
                  fields={[
                    { key: "icon", label: "Ícone (Smartphone, Wifi, Bluetooth, Usb)" },
                    { key: "label", label: "Rótulo" },
                  ]}
                  newItem={() => ({ icon: "Wifi", label: "Nova tag" })}
                  onChange={(next) => update("produtos.fallbackTags", next)}
                />
              </SectionShell>
            </TabsContent>

            {/* ============ SOBRE ============ */}
            <TabsContent value="sobre" className="space-y-4">
              <SectionShell title="Hero (banner)">
                <TextField label="Eyebrow" value={sobre?.hero?.eyebrow || ""} onChange={(v) => update("sobre.hero.eyebrow", v)} />
                <TextField label="Título" value={sobre?.hero?.title || ""} onChange={(v) => update("sobre.hero.title", v)} />
                <TextField label="Subtítulo" value={sobre?.hero?.subtitle || ""} onChange={(v) => update("sobre.hero.subtitle", v)} textarea rows={2} />
                <div className="grid gap-3 md:grid-cols-2">
                  <MediaUploadField label="Imagem de fundo" type="image" value={sobre?.hero?.backgroundImageUrl} onChange={(f, d) => updateMedia("sobre.hero.backgroundImageUrl", f, d)} onClear={() => clearMedia("sobre.hero.backgroundImageUrl")} />
                  <MediaUploadField label="Vídeo de fundo (opcional)" type="video" value={sobre?.hero?.backgroundVideoUrl} onChange={(f, d) => updateMedia("sobre.hero.backgroundVideoUrl", f, d)} onClear={() => clearMedia("sobre.hero.backgroundVideoUrl")} />
                </div>
              </SectionShell>

              <SectionShell title="Quem somos">
                <div className="grid gap-3 md:grid-cols-3">
                  <TextField label="Eyebrow" value={sobre?.quemSomos?.eyebrow || ""} onChange={(v) => update("sobre.quemSomos.eyebrow", v)} />
                  <TextField label="Título" value={sobre?.quemSomos?.title || ""} onChange={(v) => update("sobre.quemSomos.title", v)} />
                  <TextField label="Destaque do título" value={sobre?.quemSomos?.titleHighlight || ""} onChange={(v) => update("sobre.quemSomos.titleHighlight", v)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Parágrafos (separe com linha em branco)</Label>
                  <textarea
                    className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={(sobre?.quemSomos?.paragraphs || []).join("\n\n")}
                    onChange={(e) => update("sobre.quemSomos.paragraphs", e.target.value.split("\n\n").map((s) => s.trim()).filter(Boolean))}
                  />
                </div>
              </SectionShell>

              <SectionShell title="Missão / Visão / Propósito">
                <RepeaterField
                  label="Cards"
                  items={sobre?.mvp || []}
                  pathPrefix="sobre.mvp"
                  fields={[
                    { key: "icon", label: "Ícone (Target, Eye, Heart)" },
                    { key: "title", label: "Título" },
                    { key: "text", label: "Texto", type: "textarea", rows: 3 },
                  ]}
                  newItem={() => ({ icon: "Target", title: "Novo", text: "" })}
                  onChange={(next) => update("sobre.mvp", next)}
                />
              </SectionShell>

              <SectionShell title="Estatísticas (faixa do meio)">
                <RepeaterField
                  label="Estatísticas"
                  items={sobre?.stats || []}
                  pathPrefix="sobre.stats"
                  fields={[
                    { key: "value", label: "Valor" },
                    { key: "label", label: "Rótulo" },
                  ]}
                  newItem={() => ({ value: "0+", label: "Novo" })}
                  onChange={(next) => update("sobre.stats", next)}
                />
              </SectionShell>

              <SectionShell title="Conheça nossa estrutura" description="Cards com fotos da empresa.">
                <div className="grid gap-3 md:grid-cols-2">
                  <TextField label="Eyebrow" value={sobre?.estrutura?.eyebrow || ""} onChange={(v) => update("sobre.estrutura.eyebrow", v)} />
                  <TextField label="Título" value={sobre?.estrutura?.title || ""} onChange={(v) => update("sobre.estrutura.title", v)} />
                </div>
                <RepeaterField
                  label="Itens"
                  items={sobre?.estrutura?.items || []}
                  pathPrefix="sobre.estrutura.items"
                  fields={[
                    { key: "title", label: "Título" },
                    { key: "description", label: "Descrição", type: "textarea", rows: 2 },
                    { key: "imageUrl", label: "Imagem", type: "image" },
                  ]}
                  newItem={() => ({ title: "Novo item", description: "", imageUrl: "" })}
                  onChange={(next) => update("sobre.estrutura.items", next)}
                  onMediaPick={(path, file) => setFiles((p) => ({ ...p, [path]: file }))}
                />
              </SectionShell>

              <SectionShell title="Dúvidas / Por que escolher" description="Aparece também ao clicar em 'Dúvidas' no menu.">
                <div className="grid gap-3 md:grid-cols-2">
                  <TextField label="Eyebrow" value={sobre?.duvidas?.eyebrow || ""} onChange={(v) => update("sobre.duvidas.eyebrow", v)} />
                  <TextField label="Título" value={sobre?.duvidas?.title || ""} onChange={(v) => update("sobre.duvidas.title", v)} />
                </div>
                <RepeaterField
                  label="Itens"
                  items={sobre?.duvidas?.items || []}
                  pathPrefix="sobre.duvidas.items"
                  fields={[
                    { key: "icon", label: "Ícone/Emoji (ex: 🛠️, ✅, BR)" },
                    { key: "text", label: "Texto" },
                  ]}
                  newItem={() => ({ icon: "✅", text: "Novo motivo" })}
                  onChange={(next) => update("sobre.duvidas.items", next)}
                />
              </SectionShell>

              <SectionShell title="Valores">
                <div className="grid gap-3 md:grid-cols-2">
                  <TextField label="Eyebrow" value={sobre?.valores?.eyebrow || ""} onChange={(v) => update("sobre.valores.eyebrow", v)} />
                  <TextField label="Título" value={sobre?.valores?.title || ""} onChange={(v) => update("sobre.valores.title", v)} />
                </div>
                <RepeaterField
                  label="Valores"
                  items={sobre?.valores?.items || []}
                  pathPrefix="sobre.valores.items"
                  fields={[
                    { key: "icon", label: "Ícone (Shield, Zap, Users)" },
                    { key: "title", label: "Título" },
                    { key: "description", label: "Descrição", type: "textarea", rows: 2 },
                  ]}
                  newItem={() => ({ icon: "Shield", title: "Novo valor", description: "" })}
                  onChange={(next) => update("sobre.valores.items", next)}
                />
              </SectionShell>

              <SectionShell title="Onde estamos (cabeçalho)">
                <div className="grid gap-3 md:grid-cols-2">
                  <TextField label="Eyebrow" value={sobre?.localizacao?.eyebrow || ""} onChange={(v) => update("sobre.localizacao.eyebrow", v)} />
                  <TextField label="Título" value={sobre?.localizacao?.title || ""} onChange={(v) => update("sobre.localizacao.title", v)} />
                </div>
              </SectionShell>

              <SectionShell title="CTA final (banner final do Sobre)">
                <TextField label="Título" value={sobre?.cta?.title || ""} onChange={(v) => update("sobre.cta.title", v)} />
                <TextField label="Subtítulo" value={sobre?.cta?.subtitle || ""} onChange={(v) => update("sobre.cta.subtitle", v)} textarea rows={2} />
                <TextField label="Botão" value={sobre?.cta?.buttonLabel || ""} onChange={(v) => update("sobre.cta.buttonLabel", v)} />
              </SectionShell>
            </TabsContent>

            {/* ============ CONTATO ============ */}
            <TabsContent value="contato" className="space-y-4">
              <SectionShell title="Hero (banner da página de Contato)">
                <TextField label="Eyebrow" value={contato?.hero?.eyebrow || ""} onChange={(v) => update("contato.hero.eyebrow", v)} />
                <TextField label="Título" value={contato?.hero?.title || ""} onChange={(v) => update("contato.hero.title", v)} />
                <TextField label="Subtítulo" value={contato?.hero?.subtitle || ""} onChange={(v) => update("contato.hero.subtitle", v)} textarea rows={2} />
                <div className="grid gap-3 md:grid-cols-2">
                  <MediaUploadField label="Imagem de fundo" type="image" value={contato?.hero?.backgroundImageUrl} onChange={(f, d) => updateMedia("contato.hero.backgroundImageUrl", f, d)} onClear={() => clearMedia("contato.hero.backgroundImageUrl")} />
                  <MediaUploadField label="Vídeo de fundo" type="video" value={contato?.hero?.backgroundVideoUrl} onChange={(f, d) => updateMedia("contato.hero.backgroundVideoUrl", f, d)} onClear={() => clearMedia("contato.hero.backgroundVideoUrl")} />
                </div>
              </SectionShell>

              <SectionShell title="Canais de contato (cards)">
                <RepeaterField
                  label="Canais"
                  items={contato?.channels || []}
                  pathPrefix="contato.channels"
                  fields={[
                    { key: "icon", label: "Ícone (MessageCircle, Mail, Clock, MapPin)" },
                    { key: "title", label: "Título" },
                    { key: "subtitle", label: "Subtítulo" },
                    { key: "value", label: "Valor (deixe vazio p/ usar telefone/email/endereço da empresa)" },
                    { key: "actionLabel", label: "Texto do link" },
                  ]}
                  newItem={() => ({ icon: "MessageCircle", title: "Novo", subtitle: "", value: "", actionLabel: "" })}
                  onChange={(next) => update("contato.channels", next)}
                />
              </SectionShell>

              <SectionShell title="Formulário">
                <div className="grid gap-3 md:grid-cols-3">
                  <TextField label="Eyebrow" value={contato?.form?.eyebrow || ""} onChange={(v) => update("contato.form.eyebrow", v)} />
                  <TextField label="Título" value={contato?.form?.title || ""} onChange={(v) => update("contato.form.title", v)} />
                  <TextField label="Subtítulo" value={contato?.form?.subtitle || ""} onChange={(v) => update("contato.form.subtitle", v)} />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <TextField label="Botão enviar" value={contato?.form?.submitLabel || ""} onChange={(v) => update("contato.form.submitLabel", v)} />
                  <TextField label="Botão WhatsApp" value={contato?.form?.whatsappLabel || ""} onChange={(v) => update("contato.form.whatsappLabel", v)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Opções de "Interesse" (uma por linha)</Label>
                  <textarea
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    rows={5}
                    value={interestsCsv}
                    onChange={(e) => update("contato.form.interests", e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))}
                  />
                </div>
              </SectionShell>
            </TabsContent>

            {/* ============ NAVBAR & FOOTER ============ */}
            <TabsContent value="navfooter" className="space-y-4">
              <SectionShell title="Menu de navegação (Navbar)">
                <div className="grid gap-3 md:grid-cols-2">
                  <TextField label="Item: Produtos" value={navbar?.productsLabel || ""} onChange={(v) => update("navbar.productsLabel", v)} />
                  <TextField label="Item: Dúvidas" value={navbar?.questionsLabel || ""} onChange={(v) => update("navbar.questionsLabel", v)} />
                  <TextField label="Item: Sobre" value={navbar?.aboutLabel || ""} onChange={(v) => update("navbar.aboutLabel", v)} />
                  <TextField label="Item: Contato" value={navbar?.contactLabel || ""} onChange={(v) => update("navbar.contactLabel", v)} />
                  <TextField label="Botão CTA" value={navbar?.ctaLabel || ""} onChange={(v) => update("navbar.ctaLabel", v)} />
                  <TextField label="Tooltip Área Restrita" value={navbar?.restrictedAreaLabel || ""} onChange={(v) => update("navbar.restrictedAreaLabel", v)} />
                </div>
              </SectionShell>

              <SectionShell title="Rodapé (Footer)">
                <TextField label="Texto descritivo (abaixo do logo)" value={footer?.tagline || ""} onChange={(v) => update("footer.tagline", v)} textarea rows={2} />
                <TextField label="Horário de atendimento" value={footer?.hoursLabel || ""} onChange={(v) => update("footer.hoursLabel", v)} />
                <TextField label="Texto extra (rodapé inferior)" value={footer?.copyrightExtra || ""} onChange={(v) => update("footer.copyrightExtra", v)} />
                <TextField label="Link Área Restrita" value={footer?.restrictedAreaLabel || ""} onChange={(v) => update("footer.restrictedAreaLabel", v)} />

                <RepeaterField
                  label="Colunas do rodapé"
                  items={footer?.columns || []}
                  pathPrefix="footer.columns"
                  fields={[
                    { key: "title", label: "Título da coluna" },
                  ]}
                  newItem={() => ({ title: "Nova coluna", items: [] })}
                  onChange={(next) => update("footer.columns", next)}
                />
                {(footer?.columns || []).map((col, idx) => (
                  <div key={idx} className="rounded-md border border-border bg-muted/30 p-3">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Itens da coluna "{col.title}" (um por linha)
                    </Label>
                    <textarea
                      className="mt-2 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      rows={4}
                      value={(col.items || []).join("\n")}
                      onChange={(e) => update(`footer.columns.${idx}.items`, e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))}
                    />
                  </div>
                ))}
              </SectionShell>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-end border-t border-border pt-4">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar tudo"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SiteContentManager;
