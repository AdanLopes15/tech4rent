// src/components/site-builder/blocks/FaqBlock.tsx

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type Item = { question?: string; answer?: string };
type Props = { eyebrow?: string; title?: string; items?: Item[] };

const FaqBlock = ({ eyebrow, title, items = [] }: Props) => {
  return (
    <section className="bg-background py-16 md:py-20">
      <div className="container max-w-3xl">
        {(eyebrow || title) && (
          <div className="mb-8 text-center">
            {eyebrow && <p className="text-xs font-black uppercase tracking-[0.35em] text-muted-foreground">{eyebrow}</p>}
            {title && <h2 className="mt-3 text-3xl font-black text-foreground md:text-4xl">{title}</h2>}
          </div>
        )}
        <Accordion type="single" collapsible className="w-full">
          {items.map((it, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-base font-bold">{it.question}</AccordionTrigger>
              <AccordionContent className="text-base leading-relaxed text-muted-foreground">{it.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FaqBlock;
