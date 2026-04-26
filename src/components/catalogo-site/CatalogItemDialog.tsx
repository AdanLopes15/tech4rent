import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Image as ImageIcon, Plus, Trash2, Video } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MediaUploadField from "@/components/admin/MediaUploadField";
import { useStore } from "@/store";
import { toast } from "sonner";

type MediaKind = "image" | "video";

interface SectionBlock {
  title?: string;
  text?: string;
  mediaSide?: "left" | "right";
  mediaKind?: MediaKind;
  imageUrl?: string;
  videoUrl?: string;
  highlight?: string; // citação opcional
}
interface SpecGroup {
  title: string;
  rows: { label: string; value: string }[];
}
interface KitItem {
  name: string;
  imageUrl?: string;
}
interface Tag {
  label: string;
  icon?: string;
}

interface CatalogItemForm {
  id?: string;
  equipmentId: string;
  published: boolean;
  name?: string;
  code?: string;
  category?: string;
  shortDescription?: string;
  longDescription?: string;
  heroImageUrl?: string;
  videoUrl?: string;
  galleryUrls?: string[];
  tags?: Tag[];
  specGroups?: SpecGroup[];
  // legado: specs simples (mantidas para back-compat na leitura)
  specs?: { label: string; value: string }[];
  sections?: SectionBlock[];
  kitItems?: KitItem[];
  // legado
  whatsBoxItems?: string[];
  show_on_home?: boolean;
  show_on_landing?: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: any | null;
  catalogItem?: any | null;
}

const empty: CatalogItemForm = {
  equipmentId: "",
  published: true,
  galleryUrls: [],
  tags: [],
  specGroups: [],
  sections: [],
  kitItems: [],
};

const CatalogItemDialog = ({ open, onOpenChange, equipment, catalogItem }: Props) => {
  const { addCatalogItem, updateCatalogItem } = useStore();
  const [form, setForm] = useState<CatalogItemForm>(empty);
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [galleryFiles, setGalleryFiles] = useState<(File | null)[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (catalogItem) {
      // Migra specs antigas para specGroups se necessário
      const legacySpecs = Array.isArray(catalogItem.specs) ? catalogItem.specs : [];
      const groups: SpecGroup[] = Array.isArray(catalogItem.specGroups) && catalogItem.specGroups.length > 0
        ? catalogItem.specGroups
        : legacySpecs.length > 0
          ? [{ title: "Especificações", rows: legacySpecs }]
          : [];
      // Migra whatsBoxItems para kitItems se necessário
      const legacyKit = Array.isArray(catalogItem.whatsBoxItems) ? catalogItem.whatsBoxItems : [];
      const kit: KitItem[] = Array.isArray(catalogItem.kitItems) && catalogItem.kitItems.length > 0
        ? catalogItem.kitItems
        : legacyKit.map((n: string) => ({ name: n }));

      setForm({
        ...empty,
        ...catalogItem,
        galleryUrls: catalogItem.galleryUrls || [],
        tags: catalogItem.tags || [],
        sections: (catalogItem.sections || []).map((s: any) => ({
          mediaSide: s.mediaSide || "left",
          mediaKind: s.videoUrl ? "video" : "image",
          ...s,
        })),
        specGroups: groups,
        kitItems: kit,
        show_on_home: catalogItem.show_on_home ?? false,
        show_on_landing: catalogItem.show_on_landing ?? false,
      });
    } else if (equipment) {
      setForm({
        ...empty,
        equipmentId: equipment.id,
        name: equipment.name,
        code: equipment.code || equipment.model || "",
        category: equipment.category,
        shortDescription: equipment.description,
        longDescription: equipment.description,
        heroImageUrl: equipment.imageUrl || equipment.imageUrls?.[0] || "",
        galleryUrls: Array.isArray(equipment.imageUrls) ? equipment.imageUrls : [],
        show_on_home: equipment.show_on_home ?? false,
        show_on_landing: equipment.show_on_landing ?? false,
      });
    }
    setFiles({});
    setGalleryFiles([]);
  }, [open, catalogItem, equipment]);

  const setField = <K extends keyof CatalogItemForm>(key: K, value: CatalogItemForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    if (!form.equipmentId) {
      toast.error("Selecione um equipamento.");
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        ...form,
        mediaFiles: { ...files, galleryFiles },
      };
      if (form.id) await updateCatalogItem(payload);
      else await addCatalogItem(payload);
      toast.success("Catálogo salvo!");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  // ===== Sections helpers =====
  const sections = form.sections || [];
  const updateSection = (i: number, patch: Partial<SectionBlock>) => {
    const next = [...sections];
    next[i] = { ...next[i], ...patch };
    setField("sections", next);
  };
  const addSection = () =>
    setField("sections", [...sections, { title: "", text: "", mediaSide: "left", mediaKind: "image" }]);
  const removeSection = (i: number) => {
    setField("sections", sections.filter((_, idx) => idx !== i));
    // Limpa arquivos pendentes da seção
    setFiles((p) => {
      const np = { ...p };
      delete np[`section.${i}.image`];
      delete np[`section.${i}.video`];
      return np;
    });
  };
  const moveSection = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= sections.length) return;
    const next = [...sections];
    [next[i], next[j]] = [next[j], next[i]];
    setField("sections", next);
  };

  // ===== Spec groups helpers =====
  const specGroups = form.specGroups || [];
  const updateGroup = (gi: number, patch: Partial<SpecGroup>) => {
    const next = [...specGroups];
    next[gi] = { ...next[gi], ...patch };
    setField("specGroups", next);
  };
  const addGroup = () => setField("specGroups", [...specGroups, { title: "Categoria", rows: [] }]);
  const removeGroup = (gi: number) => setField("specGroups", specGroups.filter((_, idx) => idx !== gi));
  const addRow = (gi: number) => updateGroup(gi, { rows: [...(specGroups[gi].rows || []), { label: "", value: "" }] });
  const updateRow = (gi: number, ri: number, patch: Partial<{ label: string; value: string }>) => {
    const rows = [...(specGroups[gi].rows || [])];
    rows[ri] = { ...rows[ri], ...patch };
    updateGroup(gi, { rows });
  };
  const removeRow = (gi: number, ri: number) =>
    updateGroup(gi, { rows: (specGroups[gi].rows || []).filter((_, idx) => idx !== ri) });

  // ===== Kit helpers =====
  const kitItems = form.kitItems || [];
  const addKitItem = () => setField("kitItems", [...kitItems, { name: "" }]);
  const updateKitItem = (i: number, patch: Partial<KitItem>) => {
    const next = [...kitItems];
    next[i] = { ...next[i], ...patch };
    setField("kitItems", next);
  };
  const removeKitItem = (i: number) => {
    setField("kitItems", kitItems.filter((_, idx) => idx !== i));
    setFiles((p) => {
      const np = { ...p };
      delete np[`kit.${i}`];
      return np;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{form.id ? "Editar publicação" : "Publicar no Catálogo do Site"}</DialogTitle>
          <DialogDescription>
            {form.name ? <>Equipamento: <strong>{form.name}</strong></> : "Configure como esse equipamento aparecerá em /produtos."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
          <div>
            <Label className="text-sm font-semibold">Publicado em /produtos</Label>
            <p className="text-xs text-muted-foreground">Quando desativado, o anúncio fica oculto no site.</p>
          </div>
          <Switch checked={form.published} onCheckedChange={(v) => setField("published", v)} />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
          <div>
            <Label className="text-sm font-semibold">Exibir na Vitrine da Página Inicial</Label>
            <p className="text-xs text-muted-foreground">O produto aparecerá no carrossel de destaques da home.</p>
          </div>
          <Switch checked={form.show_on_home || form.show_on_landing} onCheckedChange={(v) => {
            setField("show_on_home", v);
            setField("show_on_landing", v);
          }} />
        </div>

        <Tabs defaultValue="basico" className="mt-4">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="basico">Básico</TabsTrigger>
            <TabsTrigger value="midia">Mídia</TabsTrigger>
            <TabsTrigger value="tags">Tags</TabsTrigger>
            <TabsTrigger value="specs">Dados Técnicos</TabsTrigger>
            <TabsTrigger value="secoes">Seções</TabsTrigger>
            <TabsTrigger value="kit">Kit Completo</TabsTrigger>
          </TabsList>

          {/* ============ BÁSICO ============ */}
          <TabsContent value="basico" className="space-y-4 pt-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>Nome exibido</Label>
                <Input value={form.name || ""} onChange={(e) => setField("name", e.target.value)} />
              </div>
              <div>
                <Label>Código / SKU</Label>
                <Input value={form.code || ""} onChange={(e) => setField("code", e.target.value)} />
              </div>
              <div>
                <Label>Categoria</Label>
                <Input value={form.category || ""} onChange={(e) => setField("category", e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Descrição curta (card)</Label>
              <Textarea rows={2} value={form.shortDescription || ""} onChange={(e) => setField("shortDescription", e.target.value)} />
            </div>
            <div>
              <Label>Descrição longa (página de detalhe)</Label>
              <Textarea rows={5} value={form.longDescription || ""} onChange={(e) => setField("longDescription", e.target.value)} />
            </div>
          </TabsContent>

          {/* ============ MÍDIA ============ */}
          <TabsContent value="midia" className="space-y-4 pt-4">
            <MediaUploadField
              label="Imagem principal (hero)"
              value={form.heroImageUrl}
              onChange={(file, dataUrl) => {
                setFiles((p) => ({ ...p, heroImageUrl: file }));
                setField("heroImageUrl", dataUrl);
              }}
              onClear={() => {
                setFiles((p) => ({ ...p, heroImageUrl: null }));
                setField("heroImageUrl", "");
              }}
            />
            <MediaUploadField
              label="Vídeo principal do produto"
              type="video"
              value={form.videoUrl}
              onChange={(file, dataUrl) => {
                setFiles((p) => ({ ...p, videoUrl: file }));
                setField("videoUrl", dataUrl);
              }}
              onClear={() => {
                setFiles((p) => ({ ...p, videoUrl: null }));
                setField("videoUrl", "");
              }}
            />

            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Galeria de fotos</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setField("galleryUrls", [...(form.galleryUrls || []), ""]);
                    setGalleryFiles((g) => [...g, null]);
                  }}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar foto
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {(form.galleryUrls || []).map((url, i) => (
                  <Card key={i}>
                    <CardContent className="p-3">
                      <MediaUploadField
                        label={`Foto ${i + 1}`}
                        value={url}
                        onChange={(file, dataUrl) => {
                          const next = [...(form.galleryUrls || [])];
                          next[i] = dataUrl;
                          setField("galleryUrls", next);
                          setGalleryFiles((g) => {
                            const arr = [...g];
                            arr[i] = file;
                            return arr;
                          });
                        }}
                        onClear={() => {
                          const next = (form.galleryUrls || []).filter((_, idx) => idx !== i);
                          setField("galleryUrls", next);
                          setGalleryFiles((g) => g.filter((_, idx) => idx !== i));
                        }}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ============ TAGS ============ */}
          <TabsContent value="tags" className="space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Badges exibidas no card e na página de detalhe.</p>
              <Button size="sm" variant="outline" onClick={() => setField("tags", [...(form.tags || []), { label: "" }])}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar
              </Button>
            </div>
            {(form.tags || []).map((tag, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  placeholder="Ex: Wi-Fi"
                  value={tag.label}
                  onChange={(e) => {
                    const next = [...(form.tags || [])];
                    next[i] = { ...tag, label: e.target.value };
                    setField("tags", next);
                  }}
                />
                <Input
                  placeholder="Ícone (opcional, ex: Wifi)"
                  value={tag.icon || ""}
                  onChange={(e) => {
                    const next = [...(form.tags || [])];
                    next[i] = { ...tag, icon: e.target.value };
                    setField("tags", next);
                  }}
                />
                <Button size="icon" variant="ghost" onClick={() => setField("tags", (form.tags || []).filter((_, idx) => idx !== i))}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </TabsContent>

          {/* ============ DADOS TÉCNICOS (categorias) ============ */}
          <TabsContent value="specs" className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Especificações agrupadas por categoria (ex: Hardware, Conectividade, Físico).
              </p>
              <Button size="sm" variant="outline" onClick={addGroup}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar categoria
              </Button>
            </div>
            {specGroups.length === 0 && (
              <p className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                Nenhuma categoria. Clique em "Adicionar categoria" para começar.
              </p>
            )}
            {specGroups.map((group, gi) => (
              <Card key={gi}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center gap-2">
                    <Input
                      className="font-semibold"
                      placeholder="Nome da categoria (ex: Hardware)"
                      value={group.title}
                      onChange={(e) => updateGroup(gi, { title: e.target.value })}
                    />
                    <Button size="icon" variant="ghost" onClick={() => removeGroup(gi)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  {(group.rows || []).map((row, ri) => (
                    <div key={ri} className="flex items-center gap-2">
                      <Input
                        placeholder="Característica (ex: Sistema)"
                        value={row.label}
                        onChange={(e) => updateRow(gi, ri, { label: e.target.value })}
                      />
                      <Input
                        placeholder="Valor (ex: Android 14)"
                        value={row.value}
                        onChange={(e) => updateRow(gi, ri, { value: e.target.value })}
                      />
                      <Button size="icon" variant="ghost" onClick={() => removeRow(gi, ri)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Button size="sm" variant="outline" onClick={() => addRow(gi)}>
                    <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar linha
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ============ SEÇÕES LIVRES ============ */}
          <TabsContent value="secoes" className="space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Blocos livres com título, texto e mídia (foto OU vídeo). Ordene com as setas.
              </p>
              <Button size="sm" variant="outline" onClick={addSection}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar seção
              </Button>
            </div>
            {sections.length === 0 && (
              <p className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                Nenhuma seção. Crie blocos livres para a página de detalhe.
              </p>
            )}
            {sections.map((sec, i) => {
              const kind: MediaKind = sec.mediaKind || (sec.videoUrl ? "video" : "image");
              return (
                <Card key={i}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="font-semibold">Seção {i + 1}</Label>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" onClick={() => moveSection(i, -1)} disabled={i === 0} title="Mover para cima">
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => moveSection(i, 1)} disabled={i === sections.length - 1} title="Mover para baixo">
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => removeSection(i)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <Label className="text-xs">Lado da mídia</Label>
                        <Select value={sec.mediaSide || "left"} onValueChange={(v) => updateSection(i, { mediaSide: v as "left" | "right" })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Mídia à esquerda</SelectItem>
                            <SelectItem value="right">Mídia à direita</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Tipo de mídia</Label>
                        <Select
                          value={kind}
                          onValueChange={(v) =>
                            updateSection(i, {
                              mediaKind: v as MediaKind,
                              // limpa o tipo oposto
                              ...(v === "image" ? { videoUrl: "" } : { imageUrl: "" }),
                            })
                          }
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="image"><span className="inline-flex items-center gap-2"><ImageIcon className="h-3.5 w-3.5" /> Foto</span></SelectItem>
                            <SelectItem value="video"><span className="inline-flex items-center gap-2"><Video className="h-3.5 w-3.5" /> Vídeo</span></SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Input
                      placeholder="Título (ex: AGUENTA O TRANCO. PONTO.)"
                      value={sec.title || ""}
                      onChange={(e) => updateSection(i, { title: e.target.value })}
                    />
                    <Textarea
                      rows={3}
                      placeholder="Texto descritivo do bloco"
                      value={sec.text || ""}
                      onChange={(e) => updateSection(i, { text: e.target.value })}
                    />
                    <Input
                      placeholder="Citação em destaque (opcional, ex: 'Não é para ficar bonito na mesa.')"
                      value={sec.highlight || ""}
                      onChange={(e) => updateSection(i, { highlight: e.target.value })}
                    />

                    {kind === "image" ? (
                      <MediaUploadField
                        label="Foto da seção"
                        value={sec.imageUrl}
                        onChange={(file, dataUrl) => {
                          setFiles((p) => ({ ...p, [`section.${i}.image`]: file }));
                          updateSection(i, { imageUrl: dataUrl, videoUrl: "" });
                        }}
                        onClear={() => {
                          setFiles((p) => ({ ...p, [`section.${i}.image`]: null }));
                          updateSection(i, { imageUrl: "" });
                        }}
                      />
                    ) : (
                      <MediaUploadField
                        label="Vídeo da seção"
                        type="video"
                        value={sec.videoUrl}
                        onChange={(file, dataUrl) => {
                          setFiles((p) => ({ ...p, [`section.${i}.video`]: file }));
                          updateSection(i, { videoUrl: dataUrl, imageUrl: "" });
                        }}
                        onClear={() => {
                          setFiles((p) => ({ ...p, [`section.${i}.video`]: null }));
                          updateSection(i, { videoUrl: "" });
                        }}
                      />
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* ============ KIT COMPLETO ============ */}
          <TabsContent value="kit" className="space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Itens que vêm na caixa, cada um com imagem própria.</p>
              <Button size="sm" variant="outline" onClick={addKitItem}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar item
              </Button>
            </div>
            {kitItems.length === 0 && (
              <p className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                Nenhum item. Adicione PDA, Capa, Película etc.
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              {kitItems.map((item, i) => (
                <Card key={i}>
                  <CardContent className="space-y-3 p-3">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Nome (ex: Capa Silicone)"
                        value={item.name}
                        onChange={(e) => updateKitItem(i, { name: e.target.value })}
                      />
                      <Button size="icon" variant="ghost" onClick={() => removeKitItem(i)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <MediaUploadField
                      label="Imagem do item"
                      value={item.imageUrl}
                      onChange={(file, dataUrl) => {
                        setFiles((p) => ({ ...p, [`kit.${i}`]: file }));
                        updateKitItem(i, { imageUrl: dataUrl });
                      }}
                      onClear={() => {
                        setFiles((p) => ({ ...p, [`kit.${i}`]: null }));
                        updateKitItem(i, { imageUrl: "" });
                      }}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar publicação"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CatalogItemDialog;
