// src/components/site-builder/blocks/TestimonialsBlock.tsx
import { Quote, Star } from "lucide-react";
import { useInlineEdit } from "@/lib/site-builder/inline-context";
import InlineText from "@/components/site-builder/InlineText";

type Testimonial = {
  quote?: string;
  author?: string;
  role?: string;
  avatarUrl?: string;
  rating?: number;
};

type Props = {
  eyebrow?: string;
  title?: string;
  items?: Testimonial[];
  _blockId?: string;
};

const TestimonialsBlock = ({ eyebrow, title, items = [], _blockId }: Props) => {
  const inline = useInlineEdit();
  const upd = (key: string) => (v: string) =>
    inline?.updateProp && _blockId && inline.updateProp(_blockId, key, v);

  return (
    <section className="bg-muted/40 py-16 md:py-20">
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
              placeholder="O que dizem nossos clientes"
            />
          )}
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((t, i) => {
            const rating = Math.max(0, Math.min(5, Number(t.rating ?? 5)));
            return (
              <article
                key={i}
                className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <Quote className="h-6 w-6 text-primary/70" />
                <p className="mt-4 flex-1 text-sm leading-relaxed text-foreground/90 md:text-base">
                  {t.quote}
                </p>
                {rating > 0 && (
                  <div className="mt-4 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        className={`h-4 w-4 ${idx < rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
                      />
                    ))}
                  </div>
                )}
                <div className="mt-4 flex items-center gap-3 border-t border-border pt-4">
                  {t.avatarUrl ? (
                    <img
                      src={t.avatarUrl}
                      alt={t.author || "Avatar"}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {(t.author || "?").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-foreground">{t.author}</div>
                    {t.role && (
                      <div className="truncate text-xs text-muted-foreground">{t.role}</div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
          {items.length === 0 && (
            <div className="col-span-full rounded-lg border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
              Adicione depoimentos pelo painel à direita.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsBlock;
