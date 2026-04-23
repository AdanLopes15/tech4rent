// src/components/site-builder/blocks/PricingBlock.tsx
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useInlineEdit } from "@/lib/site-builder/inline-context";
import InlineText from "@/components/site-builder/InlineText";

type Plan = {
  name?: string;
  price?: string;
  period?: string;
  description?: string;
  features?: { _value?: string }[] | string[];
  highlight?: boolean;
  buttonLabel?: string;
  buttonUrl?: string;
};

type Props = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  plans?: Plan[];
  _blockId?: string;
};

const normalizeFeatures = (features?: any[]): string[] => {
  if (!Array.isArray(features)) return [];
  return features
    .map((f) => (typeof f === "string" ? f : f?._value || ""))
    .filter(Boolean);
};

const PricingBlock = ({ eyebrow, title, subtitle, plans = [], _blockId }: Props) => {
  const inline = useInlineEdit();
  const upd = (key: string) => (v: string) =>
    inline?.updateProp && _blockId && inline.updateProp(_blockId, key, v);

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
              placeholder="Planos e valores"
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

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((p, i) => {
            const features = normalizeFeatures(p.features as any[]);
            const isExternal = /^https?:\/\//i.test(p.buttonUrl || "");
            return (
              <article
                key={i}
                className={`relative flex flex-col rounded-xl border bg-card p-6 shadow-sm transition-all ${
                  p.highlight
                    ? "border-primary ring-2 ring-primary/30 shadow-lg lg:scale-[1.03]"
                    : "border-border hover:border-primary/40"
                }`}
              >
                {p.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-wider text-primary-foreground">
                    Mais popular
                  </span>
                )}
                <h3 className="text-lg font-black text-foreground">{p.name}</h3>
                {p.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
                )}
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-foreground">{p.price}</span>
                  {p.period && (
                    <span className="text-sm font-semibold text-muted-foreground">/{p.period}</span>
                  )}
                </div>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {features.map((f, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-foreground/90">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {p.buttonLabel && (
                  <Button
                    asChild
                    className="mt-6 w-full"
                    variant={p.highlight ? "default" : "outline"}
                  >
                    {isExternal ? (
                      <a href={p.buttonUrl} target="_blank" rel="noreferrer">
                        {p.buttonLabel}
                      </a>
                    ) : (
                      <Link to={p.buttonUrl || "/contato"}>{p.buttonLabel}</Link>
                    )}
                  </Button>
                )}
              </article>
            );
          })}
          {plans.length === 0 && (
            <div className="col-span-full rounded-lg border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
              Adicione planos pelo painel à direita.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default PricingBlock;
