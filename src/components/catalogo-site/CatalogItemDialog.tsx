import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import MediaUploadField from "@/components/admin/MediaUploadField";
import { useStore } from "@/store";
import { toast } from "sonner";

interface Section {
  title?: string;
  text?: string;
  imageUrl?: string;
}
interface Spec {
  label: string;
  value: string;
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
  specs?: Spec[];
  sections?: Section[];
  whatsBoxItems?: string[];
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
  specs: [],
  sections: [],
  whatsBoxItems: [],
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
      setForm({
        ...empty,
        ...catalogItem,
        galleryUrls: catalogItem.galleryUrls || [],
        tags: catalogItem.tags || [],
        specs: catalogItem.specs || [],
        sections: catalogItem.sections || [],
        whatsBoxItems: catalogItem.whatsBoxItems || [],
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

  const addSection = () => setField("sections", [...(form.sections || []), { title: "", text: "" }]);
  const removeSection = (i: number) =>
    setField("sections", (form.sections || []).filter((_, idx) => idx !== i));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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

        <Tabs defaultValue="basico" className="mt-4">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="basico">Básico</TabsTrigger>
            <TabsTrigger value="midia">Mídia</TabsTrigger>
            <TabsTrigger value="tags">Tags</TabsTrigger>
            <TabsTrigger value="specs">Specs</TabsTrigger>
            <TabsTrigger value="secoes">Seções</TabsTrigger>
            <TabsTrigger value="caixa">Na caixa</TabsTrigger>
          </TabsList>

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
              label="Vídeo do produto"
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
                  placeholder="Ícone (opcional)"
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

          <TabsContent value="specs" className="space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Tabela de especificações técnicas.</p>
              <Button size="sm" variant="outline" onClick={() => setField("specs", [...(form.specs || []), { label: "", value: "" }])}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar
              </Button>
            </div>
            {(form.specs || []).map((spec, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  placeholder="Característica (ex: Sistema)"
                  value={spec.label}
                  onChange={(e) => {
                    const next = [...(form.specs || [])];
                    next[i] = { ...spec, label: e.target.value };
                    setField("specs", next);
                  }}
                />
                <Input
                  placeholder="Valor (ex: Android 14)"
                  value={spec.value}
                  onChange={(e) => {
                    const next = [...(form.specs || [])];
                    next[i] = { ...spec, value: e.target.value };
                    setField("specs", next);
                  }}
                />
                <Button size="icon" variant="ghost" onClick={() => setField("specs", (form.specs || []).filter((_, idx) => idx !== i))}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="secoes" className="space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Blocos de conteúdo livres na página de detalhe.</p>
              <Button size="sm" variant="outline" onClick={addSection}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar seção
              </Button>
            </div>
            {(form.sections || []).map((sec, i) => (
              <Card key={i}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold">Seção {i + 1}</Label>
                    <Button size="icon" variant="ghost" onClick={() => removeSection(i)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Título"
                    value={sec.title || ""}
                    onChange={(e) => {
                      const next = [...(form.sections || [])];
                      next[i] = { ...sec, title: e.target.value };
                      setField("sections", next);
                    }}
                  />
                  <Textarea
                    rows={3}
                    placeholder="Texto"
                    value={sec.text || ""}
                    onChange={(e) => {
                      const next = [...(form.sections || [])];
                      next[i] = { ...sec, text: e.target.value };
                      setField("sections", next);
                    }}
                  />
                  <MediaUploadField
                    label="Imagem da seção"
                    value={sec.imageUrl}
                    onChange={(file, dataUrl) => {
                      setFiles((p) => ({ ...p, [`section.${i}`]: file }));
                      const next = [...(form.sections || [])];
                      next[i] = { ...sec, imageUrl: dataUrl };
                      setField("sections", next);
                    }}
                    onClear={() => {
                      setFiles((p) => ({ ...p, [`section.${i}`]: null }));
                      const next = [...(form.sections || [])];
                      next[i] = { ...sec, imageUrl: "" };
                      setField("sections", next);
                    }}
                  />
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="caixa" className="space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Itens que vêm na caixa do produto.</p>
              <Button size="sm" variant="outline" onClick={() => setField("whatsBoxItems", [...(form.whatsBoxItems || []), ""])}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar
              </Button>
            </div>
            {(form.whatsBoxItems || []).map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  placeholder="Ex: Capa de silicone"
                  value={item}
                  onChange={(e) => {
                    const next = [...(form.whatsBoxItems || [])];
                    next[i] = e.target.value;
                    setField("whatsBoxItems", next);
                  }}
                />
                <Button size="icon" variant="ghost" onClick={() => setField("whatsBoxItems", (form.whatsBoxItems || []).filter((_, idx) => idx !== i))}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
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
