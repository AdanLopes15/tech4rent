import { useMemo, useState } from "react";
import { CheckCircle2, Eye, EyeOff, Pencil, PlusCircle, Search, Trash2, X } from "lucide-react";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStore } from "@/store";
import CatalogItemDialog from "@/components/catalogo-site/CatalogItemDialog";
import { toast } from "sonner";

const CatalogoSite = () => {
  const { equipments, catalogItems, deleteCatalogItem, updateCatalogItem } = useStore();
  const [search, setSearch] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<any | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const equipmentsById = useMemo(() => {
    const map: Record<string, any> = {};
    (equipments || []).forEach((e: any) => {
      map[e.id] = e;
    });
    return map;
  }, [equipments]);

  // Equipamentos que JÁ têm anúncio
  const usedEquipmentIds = useMemo(
    () => new Set((catalogItems || []).map((c: any) => c.equipmentId).filter(Boolean)),
    [catalogItems],
  );

  // Anúncios já criados (filtrados por busca)
  const filteredAnnouncements = useMemo(() => {
    const q = search.toLowerCase();
    return (catalogItems || []).filter((c: any) =>
      [c.name, c.code, c.category].filter(Boolean).join(" ").toLowerCase().includes(q),
    );
  }, [catalogItems, search]);

  // Todos os equipamentos (filtrados pela busca) — já marcando os que têm anúncio
  const pickerEquipments = useMemo(() => {
    const q = pickerSearch.toLowerCase();
    return (equipments || [])
      .filter((e: any) =>
        [e.name, e.code, e.category, e.model].filter(Boolean).join(" ").toLowerCase().includes(q),
      );
  }, [equipments, pickerSearch]);

  const handlePickEquipment = (equipment: any) => {
    if (usedEquipmentIds.has(equipment.id)) return;
    setSelectedEquipment(equipment);
    setEditingItem(null);
    setPickerOpen(false);
    setDialogOpen(true);
  };

  const handleEdit = (item: any) => {
    const equip = equipmentsById[item.equipmentId];
    setSelectedEquipment(equip || null);
    setEditingItem(item);
    setDialogOpen(true);
  };

  const togglePublished = async (item: any) => {
    try {
      await updateCatalogItem({ ...item, published: !item.published });
      toast.success(item.published ? "Despublicado." : "Publicado!");
    } catch (e: any) {
      toast.error(e?.message || "Erro");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle>Catálogo do Site</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Anúncios que aparecem na página pública <strong>/produtos</strong>. Crie um novo anúncio escolhendo um
              equipamento já cadastrado.
            </p>
          </div>
          <Button onClick={() => { setPickerSearch(""); setPickerOpen(true); }}>
            <PlusCircle className="mr-2 h-4 w-4" /> Criar anúncio
          </Button>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar anúncio por nome, código ou categoria..."
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {filteredAnnouncements.length === 0 ? (
        <Card className="flex h-48 flex-col items-center justify-center gap-3 text-center">
          <p className="text-muted-foreground">
            {search ? "Nenhum anúncio encontrado para essa busca." : "Você ainda não criou nenhum anúncio."}
          </p>
          {!search && (
            <Button variant="outline" onClick={() => setPickerOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Criar primeiro anúncio
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAnnouncements.map((item: any) => {
            const equip = equipmentsById[item.equipmentId];
            const img =
              item.heroImageUrl ||
              equip?.imageUrl ||
              equip?.imageUrls?.[0] ||
              "https://placehold.co/400x300.png";
            const isPublished = item.published;
            return (
              <Card key={item.id} className="overflow-hidden">
                <div className="relative aspect-[4/3] bg-muted">
                  <img src={img} alt={item.name} className="h-full w-full object-contain p-3" />
                  <Badge
                    variant={isPublished ? "default" : "secondary"}
                    className="absolute right-2 top-2"
                  >
                    {isPublished ? (
                      <>
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Publicado
                      </>
                    ) : (
                      <>
                        <EyeOff className="mr-1 h-3 w-3" /> Oculto
                      </>
                    )}
                  </Badge>
                </div>
                <CardContent className="space-y-3 p-4">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">{item.category || equip?.category || "—"}</p>
                    <h3 className="line-clamp-1 text-base font-bold">{item.name || equip?.name || "Sem nome"}</h3>
                    <p className="text-xs text-muted-foreground">
                      Equipamento: {equip?.name || item.equipmentId || "—"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEdit(item)}>
                      <Pencil className="mr-1.5 h-3.5 w-3.5" /> Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => togglePublished(item)}
                      title={isPublished ? "Despublicar" : "Publicar"}
                    >
                      {isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir anúncio?</AlertDialogTitle>
                          <AlertDialogDescription>
                            O equipamento continua cadastrado, mas o anúncio do site será removido.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteCatalogItem(item.id)}>Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Picker: escolher um equipamento para criar o anúncio */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Selecione um equipamento</DialogTitle>
            <DialogDescription>
              Escolha qual equipamento cadastrado você quer transformar em anúncio na página /produtos.
            </DialogDescription>
          </DialogHeader>

          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={pickerSearch}
              onChange={(e) => setPickerSearch(e.target.value)}
              placeholder="Buscar equipamento..."
              className="pl-9"
            />
          </div>

          {pickerEquipments.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-center">
              <X className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {pickerSearch
                  ? "Nenhum equipamento encontrado."
                  : "Nenhum equipamento cadastrado. Cadastre em Equipamentos."}
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {pickerEquipments.map((equipment: any) => {
                const img =
                  equipment.imageUrl ||
                  equipment.imageUrls?.[0] ||
                  "https://placehold.co/200x150.png";
                const alreadyUsed = usedEquipmentIds.has(equipment.id);
                return (
                  <button
                    key={equipment.id}
                    type="button"
                    disabled={alreadyUsed}
                    onClick={() => handlePickEquipment(equipment)}
                    className={`flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors ${
                      alreadyUsed
                        ? "cursor-not-allowed opacity-60"
                        : "hover:border-primary hover:bg-muted/50"
                    }`}
                  >
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                      <img src={img} alt={equipment.name} className="h-full w-full object-contain p-1" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs uppercase text-muted-foreground">{equipment.category || "—"}</p>
                        {alreadyUsed && (
                          <Badge variant="secondary" className="text-[10px]">
                            <CheckCircle2 className="mr-1 h-3 w-3" /> Já anunciado
                          </Badge>
                        )}
                      </div>
                      <p className="line-clamp-1 font-semibold">{equipment.name}</p>
                      <p className="text-xs text-muted-foreground">ID: {equipment.id}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
