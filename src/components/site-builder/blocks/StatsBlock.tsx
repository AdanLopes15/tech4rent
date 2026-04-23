// src/components/site-builder/blocks/StatsBlock.tsx
import * as Icons from "lucide-react";
import { Layers } from "lucide-react";
import { useInlineEdit } from "@/lib/site-builder/inline-context";
import InlineText from "@/components/site-builder/InlineText";

type StatItem = { icon?: string; value?: string; label?: string };

type Props = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  variant?: "light" | "dark" | "primary";
  items?: StatItem[];
  _blockId?: string;
};

const getIcon = (name?: string) => (name && (Icons as any)[name]) || Layers;

const StatsBlock = ({
  eyebrow,
  title,
  subtitle,
  variant = "light",
  items = [],
  _blockId,
}: Props) => {
  const inline = useInlineEdit();
  const upd = (key: string) => (v: string) =>
    inline?.updateProp && _blockId && inline.updateProp(_blockId, key, v);

  const styles = {
    light: "bg-muted/40 text-foreground",
    dark: "bg-foreground text-background",
    primary: "bg-primary text-primary-foreground",
  } as const;

  const accentClass =
    variant === "light" ? "text-primary" : variant === "dark" ? "text-primary" : "text-primary-foreground";

  return (
    <section className={`py-16 md:py-20 ${styles[variant]}`}>
      <div className="container max-w-6xl">
        {(eyebrow || title || subtitle || inline?.enabled) && (
          <div className="mb-10 text-center">
            {(eyebrow || inline?.enabled) && (
              <InlineText
                as="p"
                className={`text-xs font-black uppercase tracking-[0.35em] ${accentClass}`}
                value={eyebrow || ""}
                onChange={upd("eyebrow")}
                placeholder="Eyebrow"
              />
            )}
            {(title || inline?.enabled) && (
              <InlineText
                as="h2"
                className="mt-3 block text-3xl font-black md:text-4xl"
                value={title || ""}
                onChange={upd("title")}
                placeholder="Números que falam por nós"
              />
            )}
            {(subtitle || inline?.enabled) && (
              <InlineText
                as="p"
                multiline
                className="mx-auto mt-3 block max-w-2xl text-base opacity-80"
                value={subtitle || ""}
                onChange={upd("subtitle")}
                placeholder="Subtítulo"
              />
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {items.map((s, i) => {
            const Icon = getIcon(s.icon);
            return (
              <div key={i} className="text-center">
                <div
                  className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
                    variant === "light" ? "bg-primary/10" : "bg-background/15"
                  }`}
                >
                  <Icon className={`h-6 w-6 ${accentClass}`} />
                </div>
                <div className="mt-3 text-3xl font-black md:text-4xl">{s.value}</div>
                <div className="mt-1 text-sm opacity-80">{s.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default StatsBlock;
