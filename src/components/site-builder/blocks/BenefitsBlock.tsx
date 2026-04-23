// src/components/site-builder/blocks/BenefitsBlock.tsx

import * as Icons from "lucide-react";
import { CheckCircle2 } from "lucide-react";

type Item = { icon?: string; title?: string; description?: string };
type Props = { items?: Item[] };

const getIcon = (name?: string) => {
  if (!name) return CheckCircle2;
  const Cmp = (Icons as any)[name];
  return Cmp || CheckCircle2;
};

const BenefitsBlock = ({ items = [] }: Props) => {
  return (
    <section className="border-b border-border bg-muted py-5">
      <div className="container grid gap-6 md:grid-cols-3">
        {items.map((it, i) => {
          const Icon = getIcon(it.icon);
          return (
            <div key={i} className="flex items-center justify-center gap-4 md:justify-start">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase tracking-wide text-foreground">{it.title}</h2>
                {it.description && <p className="mt-1 text-sm text-muted-foreground">{it.description}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default BenefitsBlock;
