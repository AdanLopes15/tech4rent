// src/components/site-builder/blocks/GalleryBlock.tsx
import { ImageIcon } from "lucide-react";
import { useInlineEdit } from "@/lib/site-builder/inline-context";
import InlineText from "@/components/site-builder/InlineText";

type GalleryItem = { imageUrl?: string; caption?: string };

type Props = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  columns?: number;
  items?: GalleryItem[];
  _blockId?: string;
};

const GalleryBlock = ({ eyebrow, title, subtitle, columns = 3, items = [], _blockId }: Props) => {
  const inline = useInlineEdit();
  const upd = (key: string) => (v: string) =>
    inline?.updateProp && _blockId && inline.updateProp(_blockId, key, v);

  const cols = Math.max(2, Math.min(4, Number(columns) || 3));
  const gridClass =
    cols === 2 ? "md:grid-cols-2" : cols === 4 ? "md:grid-cols-4" : "md:grid-cols-3";

  return (
    <section className="bg-background py-16 md:py-20">
      <div className="container max-w-6xl">
        <div className="mb-10 text-center">
          {(eyebrow || inline?.enabled) && (
            <InlineText
              as="p"
              className="text-xs font-black uppercase tracking-[0.35em] text-primary"
              value={eyebrow || ""}
              onChange={upd("eyebrow")}
              placeholder="Eyebrow"
            />
          )}
          {(title || inline?.enabled) && (
            <InlineText
              as="h2"
              className="mt-3 block text-3xl font-black text-foreground md:text-4xl"
              value={title || ""}
              onChange={upd("title")}
              placeholder="Título da galeria"
            />
          )}
          {(subtitle || inline?.enabled) && (
            <InlineText
              as="p"
              multiline
              className="mx-auto mt-3 block max-w-2xl text-base text-muted-foreground"
              value={subtitle || ""}
              onChange={upd("subtitle")}
              placeholder="Subtítulo"
            />
          )}
        </div>

        <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${gridClass}`}>
          {items.map((it, i) => (
            <figure
              key={i}
              className="group overflow-hidden rounded-lg border border-border bg-muted shadow-sm"
            >
              {it.imageUrl ? (
                <img
                  src={it.imageUrl}
                  alt={it.caption || `Imagem ${i + 1}`}
                  className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="flex aspect-[4/3] w-full items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-10 w-10" />
                </div>
              )}
              {it.caption && (
                <figcaption className="border-t border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground">
                  {it.caption}
                </figcaption>
              )}
            </figure>
          ))}
          {items.length === 0 && (
            <div className="col-span-full rounded-lg border border-dashed border-border bg-muted p-10 text-center text-sm text-muted-foreground">
              Adicione imagens à galeria pelo painel à direita.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default GalleryBlock;
