import { useMemo, useState } from "react";
import { CheckCircle2, Eye, EyeOff, Pencil, PlusCircle, Search, Trash2 } from "lucide-react";
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
  const { equipments, catalogItems, deleteCatalogItem, updateCatalogItem } = useStore();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<any | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const itemsByEquipment = useMemo(() => {
    const map: Record<string, any> = {};
    (catalogItems || []).forEach((c: any) => {
      if (c.equipmentId) map[c.equipmentId] = c;
    });
    return map;
  }, [catalogItems]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (equipments || []).filter((e: any) =>
      [e.name, e.code, e.category, e.model].filter(Boolean).join(" ").toLowerCase().includes(q),
    );
  }, [equipments, search]);

  const handlePublish = (equipment: any) => {
    setSelectedEquipment(equipment);
    setEditingItem(null);
    setDialogOpen(true);
  };

  const handleEdit = (equipment: any, item: any) => {
    setSelectedEquipment(equipment);
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
        <CardHeader>
          <CardTitle>Catálogo do Site</CardTitle>
          <p className="text-sm text-muted-foreground">
            Selecione um equipamento e crie sua publicação para a página <strong>/produtos</strong>. Itens
            publicados aparecem na vitrine pública junto com os demais.
          </p>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar equipamento por nome, código ou categoria..."
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card className="flex h-48 items-center justify-center">
          <p className="text-muted-foreground">Nenhum equipamento cadastrado. Cadastre primeiro em Equipamentos.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((equipment: any) => {
            const item = itemsByEquipment[equipment.id];
            const img = item?.heroImageUrl || equipment.imageUrl || equipment.imageUrls?.[0] || "https://placehold.co/400x300.png";
            const isPublished = item?.published;
            return (
              <Card key={equipment.id} className="overflow-hidden">
                <div className="relative aspect-[4/3] bg-muted">
                  <img src={img} alt={equipment.name} className="h-full w-full object-contain p-3" />
                  {item ? (
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
                  ) : (
                    <Badge variant="outline" className="absolute right-2 top-2 bg-background/90">
                      Sem publicação
                    </Badge>
                  )}
                </div>
                <CardContent className="space-y-3 p-4">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">{equipment.category || "—"}</p>
                    <h3 className="line-clamp-1 text-base font-bold">{equipment.name}</h3>
                    <p className="text-xs text-muted-foreground">ID: {equipment.id}</p>
                  </div>

                  {item ? (
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEdit(equipment, item)}>
                        <Pencil className="mr-1.5 h-3.5 w-3.5" /> Editar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => togglePublished(item)} title={isPublished ? "Despublicar" : "Publicar"}>
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
                            <AlertDialogTitle>Excluir publicação?</AlertDialogTitle>
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
                  ) : (
                    <Button size="sm" className="w-full" onClick={() => handlePublish(equipment)}>
                      <PlusCircle className="mr-1.5 h-4 w-4" /> Publicar no site
                    </Button>
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
