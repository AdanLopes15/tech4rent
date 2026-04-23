// src/components/site-builder/blocks/CtaBlock.tsx

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useInlineEdit } from "@/lib/site-builder/inline-context";
import InlineText from "@/components/site-builder/InlineText";

type Props = {
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  buttonUrl?: string;
  variant?: "dark" | "light" | "primary";
  _blockId?: string;
};

const CtaBlock = ({ title, subtitle, buttonLabel, buttonUrl = "/contato", variant = "dark", _blockId }: Props) => {
  const isExternal = /^https?:\/\//i.test(buttonUrl || "");
  const inline = useInlineEdit();
  const upd = (key: string) => (v: string) => inline?.updateProp && _blockId && inline.updateProp(_blockId, key, v);

  const styles = {
    dark: "bg-foreground text-background",
    light: "bg-muted text-foreground",
    primary: "bg-primary text-primary-foreground",
  } as const;

  return (
    <section className={`py-16 md:py-20 ${styles[variant]}`}>
      <div className="container max-w-4xl text-center">
        {(title || inline?.enabled) && (
          <InlineText as="h2" className="block text-3xl font-black md:text-4xl" value={title || ""} onChange={upd("title")} placeholder="Título" />
        )}
        {(subtitle || inline?.enabled) && (
          <InlineText as="p" multiline className="mx-auto mt-4 block max-w-2xl text-base opacity-80 md:text-lg" value={subtitle || ""} onChange={upd("subtitle")} placeholder="Subtítulo" />
        )}
        {buttonLabel && (
          <div className="mt-8">
            <Button size="lg" asChild variant={variant === "primary" ? "secondary" : "default"} className="h-12 gap-2 px-8 text-base font-bold">
              {isExternal ? (
                <a href={buttonUrl} target="_blank" rel="noreferrer">
                  {buttonLabel} <ArrowRight className="h-4 w-4" />
                </a>
              ) : (
                <Link to={buttonUrl || "/"}>
                  {buttonLabel} <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default CtaBlock;
