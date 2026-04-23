// src/components/site-builder/blocks/LogoCloudBlock.tsx
import { useInlineEdit } from "@/lib/site-builder/inline-context";
import InlineText from "@/components/site-builder/InlineText";

type LogoItem = { imageUrl?: string; alt?: string; url?: string };

type Props = {
  eyebrow?: string;
  title?: string;
  items?: LogoItem[];
  grayscale?: boolean;
  _blockId?: string;
};

const LogoCloudBlock = ({ eyebrow, title, items = [], grayscale = true, _blockId }: Props) => {
  const inline = useInlineEdit();
  const upd = (key: string) => (v: string) =>
    inline?.updateProp && _blockId && inline.updateProp(_blockId, key, v);

  return (
    <section className="border-y border-border bg-card py-12 md:py-16">
      <div className="container max-w-6xl">
        <div className="mb-8 text-center">
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
              className="mt-2 block text-xl font-bold text-foreground md:text-2xl"
              value={title || ""}
              onChange={upd("title")}
              placeholder="Empresas que confiam em nós"
            />
          )}
        </div>

        <div className="grid grid-cols-2 items-center gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((logo, i) => {
            const content = logo.imageUrl ? (
              <img
                src={logo.imageUrl}
                alt={logo.alt || `Logo ${i + 1}`}
                className={`mx-auto h-10 max-w-[140px] object-contain opacity-70 transition-all hover:opacity-100 ${
                  grayscale ? "grayscale hover:grayscale-0" : ""
                }`}
                loading="lazy"
              />
            ) : (
              <div className="mx-auto flex h-10 items-center justify-center text-sm font-bold text-muted-foreground">
                {logo.alt || `Logo ${i + 1}`}
              </div>
            );
            return logo.url ? (
              <a key={i} href={logo.url} target="_blank" rel="noreferrer" className="block">
                {content}
              </a>
            ) : (
              <div key={i}>{content}</div>
            );
          })}
          {items.length === 0 && (
            <div className="col-span-full text-center text-sm text-muted-foreground">
              Adicione logos pelo painel à direita.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default LogoCloudBlock;
