// src/components/site-builder/blocks/ResultsBlock.tsx

import * as Icons from "lucide-react";
import { TrendingUp } from "lucide-react";

type Item = { icon?: string; tag?: string; title?: string; description?: string };
type Props = { eyebrow?: string; title?: string; items?: Item[] };

const getIcon = (name?: string) => (name && (Icons as any)[name]) || TrendingUp;

const ResultsBlock = ({ eyebrow, title, items = [] }: Props) => {
  return (
    <section className="bg-background py-8 md:py-14">
      <div className="container max-w-5xl">
        {(eyebrow || title) && (
          <div className="mb-7 text-center">
            {eyebrow && <span className="text-xs font-black uppercase tracking-[0.35em] text-muted-foreground">{eyebrow}</span>}
            {title && <h2 className="mt-3 text-3xl font-black text-foreground">{title}</h2>}
          </div>
        )}
        <div className="grid gap-5 md:grid-cols-3">
          {items.map((r, i) => {
            const Icon = getIcon(r.icon);
            return (
              <article key={i} className="rounded-lg border border-border bg-card p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
                    <Icon className="h-4 w-4" />
                  </div>
                  {r.tag && <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">{r.tag}</span>}
                </div>
                <h3 className="text-base font-black leading-snug text-foreground">{r.title}</h3>
                {r.description && <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{r.description}</p>}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ResultsBlock;
