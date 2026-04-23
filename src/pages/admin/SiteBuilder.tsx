// src/pages/admin/SiteBuilder.tsx
// Page Builder MVP: lista de blocos com adicionar, reordenar, duplicar, excluir, editar props.
// Drag & drop de reordenação. Painel de propriedades à direita. Salvar rascunho e publicar.

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as Icons from "lucide-react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  GripVertical,
  Layers,
  Monitor,
  Plus,
  RotateCcw,
  Save,
  Settings,
  Smartphone,
  Tablet,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useStore } from "@/store";
import { BLOCK_LIBRARY, BLOCK_META, renderBlock } from "@/lib/site-builder/registry";
import { newId, type Block, type BlockType, type PropField } from "@/lib/site-builder/types";
import { buildDefaultHomeBlocks } from "@/lib/site-builder/seed";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const getIcon = (name?: string) => (name && (Icons as any)[name]) || Layers;

type Viewport = "desktop" | "tablet" | "mobile";

const VIEWPORT_WIDTHS: Record<Viewport, string> = {
  desktop: "100%",
  tablet: "820px",
  mobile: "390px",
};

const SortableBlockCard = ({
  block,
  selected,
  onSelect,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  onToggleVisible,
}: {
  block: Block;
  selected: boolean;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleVisible: () => void;
}) => {
  const meta = BLOCK_META[block.type];
  const Icon = getIcon(meta?.icon);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`group flex items-center gap-2 rounded-md border bg-card p-2 text-sm transition-colors ${
        selected ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40"
      }`}
    >
      <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground" aria-label="Arrastar">
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold">{meta?.label || block.type}</div>
        <div className="truncate text-xs text-muted-foreground">{meta?.description}</div>
      </div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onToggleVisible(); }} title={block.visible === false ? "Mostrar" : "Ocultar"}>
          <Eye className={`h-3.5 w-3.5 ${block.visible === false ? "opacity-30" : ""}`} />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onMoveUp(); }} title="Mover acima">
          <ArrowUp className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onMoveDown(); }} title="Mover abaixo">
          <ArrowDown className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onDuplicate(); }} title="Duplicar">
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Excluir">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

const FieldEditor = ({ field, value, onChange }: { field: PropField; value: any; onChange: (v: any) => void }) => {
  if (field.type === "textarea") {
    return <Textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} rows={4} />;
  }
  if (field.type === "number") {
    return <Input type="number" value={value ?? ""} min={field.min} max={field.max} onChange={(e) => onChange(Number(e.target.value))} />;
  }
  if (field.type === "switch") {
    return <Switch checked={!!value} onCheckedChange={onChange} />;
  }
  if (field.type === "select" && field.options) {
    return (
      <Select value={String(value ?? "")} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
        <SelectContent>
          {field.options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    );
  }
  if (field.type === "list") {
    const list: any[] = Array.isArray(value) ? value : [];
    const updateAt = (i: number, next: any) => onChange(list.map((it, idx) => (idx === i ? next : it)));
    const removeAt = (i: number) => onChange(list.filter((_, idx) => idx !== i));
    const addNew = () => {
      const empty: any = {};
      (field.itemFields || []).forEach((f) => (empty[f.key] = f.type === "number" ? 0 : ""));
      onChange([...list, empty]);
    };
    return (
      <div className="space-y-2">
        {list.map((item, i) => (
          <div key={i} className="space-y-2 rounded-md border border-border p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Item {i + 1}</span>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeAt(i)}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
            {(field.itemFields || []).map((sub) => {
              const isShorthand = sub.key === "_value";
              const itemValue = isShorthand ? (typeof item === "string" ? item : item?._value || "") : item?.[sub.key];
              const setItemValue = (v: any) => {
                if (isShorthand) updateAt(i, typeof item === "string" ? v : { ...item, _value: v });
                else updateAt(i, { ...item, [sub.key]: v });
              };
              return (
                <div key={sub.key} className="space-y-1">
                  <Label className="text-xs">{sub.label}</Label>
                  <FieldEditor field={sub} value={itemValue} onChange={setItemValue} />
                </div>
              );
            })}
          </div>
        ))}
        <Button variant="outline" size="sm" className="w-full gap-2" onClick={addNew}>
          <Plus className="h-3.5 w-3.5" /> Adicionar
        </Button>
      </div>
    );
  }
  // text, image, video → input + preview
  return (
    <div className="space-y-1">
      <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} />
      {field.type === "image" && value ? (
        <img src={value} alt="" className="mt-1 h-20 w-full rounded border border-border object-cover" />
      ) : null}
    </div>
  );
};

const SiteBuilder = () => {
  const fetchAllData = useStore((s) => s.fetchAllData);
  const homePage = useStore((s) => s.homePage);
  const companySettings = useStore((s) => s.companySettings);
  const saveHomeDraft = useStore((s) => s.saveHomeDraft);
  const publishHome = useStore((s) => s.publishHome);
  const resetHomeDraft = useStore((s) => s.resetHomeDraft);

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  useEffect(() => {
    fetchAllData(false);
  }, [fetchAllData]);

  useEffect(() => {
    const initial = homePage?.draft?.length ? homePage.draft : (homePage?.published?.length ? homePage.published : buildDefaultHomeBlocks(companySettings?.siteContent));
    setBlocks(initial as Block[]);
  }, [homePage?.draft, homePage?.published, companySettings?.siteContent]);

  const selected = useMemo(() => blocks.find((b) => b.id === selectedId) || null, [blocks, selectedId]);
  const meta = selected ? BLOCK_META[selected.type] : null;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const updateBlocks = (next: Block[]) => {
    setBlocks(next);
    setDirty(true);
  };

  const addBlock = (type: BlockType) => {
    const m = BLOCK_META[type];
    const block: Block = { id: newId(), type, props: { ...m.defaults } };
    updateBlocks([...blocks, block]);
    setSelectedId(block.id);
    setLibraryOpen(false);
  };

  const moveBlock = (id: string, dir: -1 | 1) => {
    const i = blocks.findIndex((b) => b.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= blocks.length) return;
    updateBlocks(arrayMove(blocks, i, j));
  };

  const duplicateBlock = (id: string) => {
    const i = blocks.findIndex((b) => b.id === id);
    if (i < 0) return;
    const copy: Block = { ...blocks[i], id: newId(), props: JSON.parse(JSON.stringify(blocks[i].props)) };
    const next = [...blocks];
    next.splice(i + 1, 0, copy);
    updateBlocks(next);
    setSelectedId(copy.id);
  };

  const deleteBlock = (id: string) => {
    updateBlocks(blocks.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const toggleVisible = (id: string) => {
    updateBlocks(blocks.map((b) => (b.id === id ? { ...b, visible: b.visible === false ? true : false } : b)));
  };

  const updateSelectedProp = (key: string, value: any) => {
    if (!selected) return;
    updateBlocks(blocks.map((b) => (b.id === selected.id ? { ...b, props: { ...b.props, [key]: value } } : b)));
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    updateBlocks(arrayMove(blocks, oldIndex, newIndex));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await saveHomeDraft(blocks);
      setDirty(false);
      toast.success("Rascunho salvo");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    try {
      setPublishing(true);
      if (dirty) await saveHomeDraft(blocks);
      await publishHome();
      setDirty(false);
      toast.success("Homepage publicada!");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao publicar");
    } finally {
      setPublishing(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Descartar rascunho e voltar ao publicado?")) return;
    await resetHomeDraft();
    setDirty(false);
    toast.success("Rascunho descartado");
  };

  const groupedFields = useMemo(() => {
    if (!meta) return new Map<string, PropField[]>();
    const map = new Map<string, PropField[]>();
    meta.fields.forEach((f) => {
      const key = f.group || "Geral";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(f);
    });
    return map;
  }, [meta]);

  return (
    <div className="-m-6 flex h-[calc(100vh-4rem)] flex-col bg-muted">
      {/* Topbar */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="text-sm font-bold text-primary">← Admin</Link>
          <span className="text-sm text-muted-foreground">/</span>
          <h1 className="text-sm font-bold">Page Builder · Homepage</h1>
          {dirty && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">Alterações não salvas</span>}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border border-border bg-background p-0.5">
            <Button size="icon" variant={viewport === "desktop" ? "secondary" : "ghost"} className="h-7 w-7" onClick={() => setViewport("desktop")}><Monitor className="h-3.5 w-3.5" /></Button>
            <Button size="icon" variant={viewport === "tablet" ? "secondary" : "ghost"} className="h-7 w-7" onClick={() => setViewport("tablet")}><Tablet className="h-3.5 w-3.5" /></Button>
            <Button size="icon" variant={viewport === "mobile" ? "secondary" : "ghost"} className="h-7 w-7" onClick={() => setViewport("mobile")}><Smartphone className="h-3.5 w-3.5" /></Button>
          </div>
          <Button size="sm" variant="outline" asChild><a href="/" target="_blank" rel="noreferrer" className="gap-1"><Eye className="mr-1 h-3.5 w-3.5" /> Ver site</a></Button>
          <Button size="sm" variant="outline" onClick={handleReset} className="gap-1"><RotateCcw className="h-3.5 w-3.5" /> Descartar</Button>
          <Button size="sm" variant="outline" onClick={handleSave} disabled={saving} className="gap-1"><Save className="h-3.5 w-3.5" /> {saving ? "Salvando..." : "Salvar rascunho"}</Button>
          <Button size="sm" onClick={handlePublish} disabled={publishing} className="gap-1"><Upload className="h-3.5 w-3.5" /> {publishing ? "Publicando..." : "Publicar"}</Button>
        </div>
      </div>

      {/* Workspace: sidebar esquerda + canvas + sidebar direita */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar esquerda: estrutura + biblioteca */}
        <aside className="flex w-72 shrink-0 flex-col border-r border-border bg-card">
          <Tabs defaultValue="estrutura" className="flex flex-1 flex-col">
            <TabsList className="m-2 grid grid-cols-2">
              <TabsTrigger value="estrutura">Estrutura</TabsTrigger>
              <TabsTrigger value="biblioteca">Adicionar</TabsTrigger>
            </TabsList>
            <TabsContent value="estrutura" className="flex-1 overflow-auto px-2 pb-2">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1.5">
                    {blocks.map((block) => (
                      <SortableBlockCard
                        key={block.id}
                        block={block}
                        selected={selectedId === block.id}
                        onSelect={() => setSelectedId(block.id)}
                        onMoveUp={() => moveBlock(block.id, -1)}
                        onMoveDown={() => moveBlock(block.id, 1)}
                        onDuplicate={() => duplicateBlock(block.id)}
                        onDelete={() => deleteBlock(block.id)}
                        onToggleVisible={() => toggleVisible(block.id)}
                      />
                    ))}
                    {blocks.length === 0 && (
                      <div className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                        Sem blocos. Adicione na aba "Adicionar".
                      </div>
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            </TabsContent>
            <TabsContent value="biblioteca" className="flex-1 overflow-auto px-2 pb-2">
              <div className="grid grid-cols-2 gap-2">
                {BLOCK_LIBRARY.map((b) => {
                  const Icon = getIcon(b.icon);
                  return (
                    <button
                      key={b.type}
                      onClick={() => addBlock(b.type)}
                      className="flex flex-col items-start gap-1 rounded-md border border-border bg-background p-2 text-left text-xs transition-colors hover:border-primary hover:bg-primary/5"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded bg-muted"><Icon className="h-4 w-4 text-muted-foreground" /></div>
                      <div className="font-bold">{b.label}</div>
                      <div className="line-clamp-2 text-[10px] leading-tight text-muted-foreground">{b.description}</div>
                    </button>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </aside>

        {/* Canvas central */}
        <div className="flex-1 overflow-auto bg-muted/40">
          <div className="mx-auto my-4 transition-all" style={{ width: VIEWPORT_WIDTHS[viewport], maxWidth: "100%" }}>
            <div className="overflow-hidden rounded-md border border-border bg-background shadow-sm">
              <Navbar />
              <main>
                {blocks.filter((b) => b.visible !== false).map((block) => (
                  <div
                    key={block.id}
                    onClick={() => setSelectedId(block.id)}
                    className={`relative cursor-pointer outline-offset-[-2px] transition-all hover:outline hover:outline-2 hover:outline-primary/40 ${selectedId === block.id ? "outline outline-2 outline-primary" : ""}`}
                  >
                    {selectedId === block.id && (
                      <div className="pointer-events-none absolute left-2 top-2 z-20 rounded bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                        {BLOCK_META[block.type]?.label}
                      </div>
                    )}
                    {renderBlock(block)}
                  </div>
                ))}
                {blocks.length === 0 && (
                  <div className="p-20 text-center text-muted-foreground">
                    Adicione blocos pela barra lateral à esquerda.
                  </div>
                )}
              </main>
              <Footer />
            </div>
          </div>
        </div>

        {/* Sidebar direita: propriedades */}
        <aside className="flex w-80 shrink-0 flex-col border-l border-border bg-card">
          {selected && meta ? (
            <>
              <div className="flex items-center justify-between border-b border-border p-3">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-bold">{meta.label}</h2>
                </div>
              </div>
              <div className="flex-1 space-y-4 overflow-auto p-3">
                {Array.from(groupedFields.entries()).map(([group, fields]) => (
                  <div key={group} className="space-y-3">
                    {group !== "Geral" && <div className="border-b border-border pb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">{group}</div>}
                    {fields.map((f) => (
                      <div key={f.key} className="space-y-1.5">
                        <Label className="text-xs font-semibold">{f.label}</Label>
                        <FieldEditor
                          field={f}
                          value={selected.props[f.key] ?? meta.defaults[f.key]}
                          onChange={(v) => updateSelectedProp(f.key, v)}
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-6 text-center text-sm text-muted-foreground">
              <Settings className="mb-2 h-8 w-8 opacity-30" />
              Clique em um bloco no canvas ou na lista para editar suas propriedades.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default SiteBuilder;
