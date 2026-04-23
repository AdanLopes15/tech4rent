import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Eye, EyeOff, Pencil, Plus, RefreshCw, Search, Sparkles, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useStore } from "@/store";
import CatalogItemDialog from "@/components/catalogo-site/CatalogItemDialog";
import { toast } from "sonner";

const CatalogoSite = () => {
  const { equipments, catalogItems, deleteCatalogItem, updateCatalogItem, fetchAllData } = useStore();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<any | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  useEffect(() => {
    fetchAllData?.();
  }, [fetchAllData]);

  // Map: equipmentId -> catalogItem
  const catalogByEquipmentId = useMemo(() => {
    const map: Record<string, any> = {};
    (catalogItems || []).forEach((c: any) => {
      if (c.equipmentId) map[c.equipmentId] = c;
    });
    return map;
  }, [catalogItems]);

  // Lista combinada: TODOS os equipamentos cadastrados, indicando se já tem anúncio personalizado
  const rows = useMemo(() => {
    const q = search.toLowerCase();
    return (equipments || [])
      .map((e: any) => {
        const item = catalogByEquipmentId[e.id];
        return {
          equipment: e,
          item,
          hasItem: !!item,
          published: item ? !!item.published : true, // sem item = exibido por padrão em /produtos
        };
      })
      .filter(({ equipment, item }) =>
        [equipment?.name, equipment?.code, equipment?.category, item?.name]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
  }, [equipments, catalogByEquipmentId, search]);

  const handleEdit = (equipment: any, item: any | null) => {
    setSelectedEquipment(equipment);
    setEditingItem(item || null);
    setDialogOpen(true);
  };

  const togglePublished = async (item: any) => {
    try {
      await updateCatalogItem({ ...item, published: !item.published });
      toast.success(item.published ? "Anúncio ocultado." : "Anúncio publicado!");
    } catch (e: any) {
      toast.error(e?.message || "Erro");
    }
  };

  const stats = useMemo(() => {
    const total = rows.length;
    const personalizados = rows.filter((r) => r.hasItem).length;
    const publicados = rows.filter((r) => r.published).length;
    return { total, personalizados, publicados };
  }, [rows]);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle>Catálogo do Site</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Estes são os produtos que aparecem na página pública <strong>/produtos</strong>. Clique em um equipamento
              para personalizar seu anúncio (fotos, descrição, vídeo, especificações, seções).
            </p>
          </div>
          <Button variant="outline" onClick={() => fetchAllData?.()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Total no /produtos</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Personalizados</p>
              <p className="text-2xl font-bold">{stats.personalizados}</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Visíveis no site</p>
              <p className="text-2xl font-bold">{stats.publicados}</p>
            </div>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, código ou categoria..."
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {rows.length === 0 ? (
        <Card className="flex h-48 flex-col items-center justify-center gap-2 text-center">
          <p className="text-muted-foreground">
            {search
              ? "Nenhum equipamento encontrado para essa busca."
              : "Nenhum equipamento cadastrado. Cadastre em Equipamentos para que apareça aqui e na página /produtos."}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map(({ equipment, item, hasItem, published }) => {
            const img =
              item?.heroImageUrl ||
              equipment?.imageUrl ||
              equipment?.imageUrls?.[0] ||
              "https://placehold.co/400x300.png";
            const displayName = item?.name || equipment?.name || "Sem nome";
            const displayCategory = item?.category || equipment?.category || "—";

            return (
              <Card key={equipment.id} className="overflow-hidden">
                <div className="relative aspect-[4/3] bg-muted">
                  <img src={img} alt={displayName} className="h-full w-full object-contain p-3" />
                  <div className="absolute right-2 top-2 flex flex-col gap-1.5">
                    {hasItem ? (
                      <Badge variant="default" className="gap-1">
                        <Sparkles className="h-3 w-3" /> Personalizado
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Padrão</Badge>
                    )}
                    {hasItem && !published && (
                      <Badge variant="outline" className="gap-1 bg-background/90">
                        <EyeOff className="h-3 w-3" /> Oculto
                      </Badge>
                    )}
                  </div>
                </div>
                <CardContent className="space-y-3 p-4">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">{displayCategory}</p>
                    <h3 className="line-clamp-1 text-base font-bold">{displayName}</h3>
                    <p className="text-xs text-muted-foreground">
                      Equipamento: {equipment?.name || equipment?.id || "—"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleEdit(equipment, item)}
                    >
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      {hasItem ? "Editar anúncio" : "Personalizar"}
                    </Button>
                    {hasItem && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => togglePublished(item)}
                          title={published ? "Ocultar do site" : "Publicar no site"}
                        >
                          {published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" title="Remover personalização">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover personalização?</AlertDialogTitle>
                              <AlertDialogDescription>
                                O equipamento continua aparecendo na página /produtos com os dados padrão. Apenas a
                                personalização (fotos extras, descrição rica, vídeo, seções...) será apagada.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteCatalogItem(item.id)}>
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>

                  {hasItem && (
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 text-primary" />
                      Possui personalização salva
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CatalogItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        equipment={selectedEquipment}
        catalogItem={editingItem}
      />
    </div>
  );
};

export default CatalogoSite;
