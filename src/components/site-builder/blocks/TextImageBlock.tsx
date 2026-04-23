// src/components/site-builder/blocks/TextImageBlock.tsx

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ImageIcon } from "lucide-react";
import { useInlineEdit } from "@/lib/site-builder/inline-context";
import InlineText from "@/components/site-builder/InlineText";

type Props = {
  eyebrow?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  imageSide?: "left" | "right";
  buttonLabel?: string;
  buttonUrl?: string;
  _blockId?: string;
};

const TextImageBlock = ({ eyebrow, title, description, imageUrl, imageSide = "right", buttonLabel, buttonUrl, _blockId }: Props) => {
  const isExternal = /^https?:\/\//i.test(buttonUrl || "");
  const inline = useInlineEdit();
  const upd = (key: string) => (v: string) => inline?.updateProp && _blockId && inline.updateProp(_blockId, key, v);

  return (
    <section className="bg-background py-16 md:py-20">
      <div className={`container grid max-w-6xl items-center gap-10 md:grid-cols-2 ${imageSide === "left" ? "" : ""}`}>
        <div className={imageSide === "left" ? "md:order-2" : "md:order-1"}>
          {(eyebrow || inline?.enabled) && (
            <InlineText as="p" className="text-xs font-black uppercase tracking-[0.35em] text-muted-foreground" value={eyebrow || ""} onChange={upd("eyebrow")} placeholder="Eyebrow" />
          )}
          {(title || inline?.enabled) && (
            <InlineText as="h2" className="mt-3 block text-3xl font-black text-foreground md:text-4xl" value={title || ""} onChange={upd("title")} placeholder="Título" />
          )}
          {(description || inline?.enabled) && (
            <InlineText as="p" multiline className="mt-4 block whitespace-pre-line text-base leading-relaxed text-muted-foreground md:text-lg" value={description || ""} onChange={upd("description")} placeholder="Descrição" />
          )}
          {buttonLabel && (
            <div className="mt-6">
              <Button asChild className="gap-2">
                {isExternal ? (
                  <a href={buttonUrl} target="_blank" rel="noreferrer">{buttonLabel}</a>
                ) : (
                  <Link to={buttonUrl || "/"}>{buttonLabel}</Link>
                )}
              </Button>
            </div>
          )}
        </div>

        <div className={imageSide === "left" ? "md:order-1" : "md:order-2"}>
          {imageUrl ? (
            <img src={imageUrl} alt={title || ""} className="h-full max-h-[480px] w-full rounded-lg object-cover shadow-md" />
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-border bg-muted text-muted-foreground">
              <ImageIcon className="h-10 w-10" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TextImageBlock;
