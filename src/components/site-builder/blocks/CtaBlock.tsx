// src/components/site-builder/blocks/CtaBlock.tsx

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

type Props = {
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  buttonUrl?: string;
  variant?: "dark" | "light" | "primary";
};

const CtaBlock = ({ title, subtitle, buttonLabel, buttonUrl = "/contato", variant = "dark" }: Props) => {
  const isExternal = /^https?:\/\//i.test(buttonUrl || "");

  const styles = {
    dark: "bg-foreground text-background",
    light: "bg-muted text-foreground",
    primary: "bg-primary text-primary-foreground",
  } as const;

  return (
    <section className={`py-16 md:py-20 ${styles[variant]}`}>
      <div className="container max-w-4xl text-center">
        {title && <h2 className="text-3xl font-black md:text-4xl">{title}</h2>}
        {subtitle && <p className="mx-auto mt-4 max-w-2xl text-base opacity-80 md:text-lg">{subtitle}</p>}
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
