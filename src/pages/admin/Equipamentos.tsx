import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { PlusCircle, Pencil, Trash2 } from "lucide-react";

import { useState } from "react";
import { useStore } from "@/store";

import { AddEquipmentDialog } from "@/components/equipamentos/AddEquipmentDialog";

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

import { formatCurrency } from "@/lib/utils";

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

export default function Equipamentos() {
  const { equipments, deleteEquipment } = useStore();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<any>(null);

  const handleEdit = (equipment: any) => {
    setEditingEquipment(equipment);
    setIsAddDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingEquipment(null);
    setIsAddDialogOpen(false);
  };

  const handleAddNew = () => {
    setEditingEquipment(null);
    setIsAddDialogOpen(true);
  };

  const isValidHttpUrl = (string?: string | null): boolean => {
    if (!string) return false;
    try {
      const url = new URL(string);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* FILTROS */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Equipamentos</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <Input placeholder="Buscar por nome, ID ou nº de série..." />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Todas as Categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="pda">PDA</SelectItem>
                <SelectItem value="leitor">Leitor</SelectItem>
                <SelectItem value="impressora">Impressora</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Todos os Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="disponivel">Disponível</SelectItem>
                <SelectItem value="alugado">Alugado</SelectItem>
                <SelectItem value="manutencao">Manutenção</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Todas as Finalidades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="aluguel">Aluguel</SelectItem>
                <SelectItem value="venda">Venda</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* LISTA */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Catálogo de Equipamentos</h2>

          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Equipamento
          </Button>
        </div>

        {equipments.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {equipments.map((equipment: any) => {
              const imageUrls =
                Array.isArray(equipment.imageUrls) && equipment.imageUrls.filter(isValidHttpUrl).length > 0
                  ? equipment.imageUrls.filter(isValidHttpUrl)
                  : [isValidHttpUrl(equipment.imageUrl) ? equipment.imageUrl : "https://placehold.co/600x400.png"];

              return (
                <Card key={equipment.id} className="flex flex-col">
                  <div className="relative">
                    <Carousel>
                      <CarouselContent>
                        {imageUrls.map((url: string, index: number) => (
                          <CarouselItem key={index}>
                            <div className="relative w-full aspect-[3/2]">
                              <img
                                src={url}
                                alt={`${equipment.name}`}
                                className="rounded-t-lg object-contain w-full h-full"
                              />
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>

                      {imageUrls.length > 1 && (
                        <>
                          <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2" />
                          <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2" />
                        </>
                      )}
                    </Carousel>

                    <Badge className="absolute top-2 right-2">{equipment.status || "Disponível"}</Badge>

                    <div className="absolute top-2 left-2 space-y-1">
                      <Badge variant="secondary">
                        Estoque: {equipment.stock} {equipment.unit}
                      </Badge>
                      <Badge variant="secondary">{equipment.purpose}</Badge>
                    </div>
                  </div>

                  <CardContent className="p-4 flex flex-col flex-grow">
                    <p className="text-sm text-muted-foreground">{equipment.category}</p>

                    <h3 className="text-lg font-bold">{equipment.name}</h3>

                    <p className="text-xs text-muted-foreground">ID: {equipment.id}</p>

                    <div className="mt-4 flex-grow">
                      <div className="flex justify-between text-sm">
                        <span>Diária:</span>
                        <span>{formatCurrency(equipment.dailyRate)}</span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span>Semanal:</span>
                        <span>{formatCurrency(equipment.weeklyRate)}</span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span>Mensal:</span>
                        <span>{formatCurrency(equipment.monthlyRate)}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" className="w-full" onClick={() => handleEdit(equipment)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="w-full">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>

                            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
                          </AlertDialogHeader>

                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>

                            <AlertDialogAction onClick={() => deleteEquipment(equipment.id)}>
                              Continuar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Nenhum equipamento para exibir.</p>
          </Card>
        )}
      </div>

      <AddEquipmentDialog open={isAddDialogOpen} onOpenChange={handleCloseDialog} equipment={editingEquipment} />
    </div>
  );
}
