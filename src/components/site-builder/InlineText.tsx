// src/components/site-builder/InlineText.tsx
// Wrapper que torna textos editáveis quando o builder estiver no modo "edição inline".
// Em runtime normal (site público) renderiza apenas o filho.

import { useEffect, useRef } from "react";
import { useInlineEdit } from "@/lib/site-builder/inline-context";

type Props = {
  value: string;
  onChange?: (next: string) => void;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  multiline?: boolean;
  placeholder?: string;
};

const InlineText = ({ value, onChange, as = "span", className, multiline, placeholder }: Props) => {
  const ctx = useInlineEdit();
  const ref = useRef<HTMLElement>(null);
  const Tag = as as any;

  // Mantém o conteúdo sincronizado quando o valor externo muda e o usuário não está editando.
  useEffect(() => {
    if (!ctx?.enabled) return;
    const el = ref.current;
    if (el && document.activeElement !== el && el.innerText !== value) {
      el.innerText = value || "";
    }
  }, [value, ctx?.enabled]);

  if (!ctx?.enabled || !onChange) {
    return <Tag className={className}>{value || placeholder || ""}</Tag>;
  }

  return (
    <Tag
      ref={ref as any}
      className={`${className || ""} outline-none focus:ring-2 focus:ring-primary/60 rounded-sm transition-shadow hover:ring-1 hover:ring-primary/40`}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onClick={(e: any) => e.stopPropagation()}
      onMouseDown={(e: any) => e.stopPropagation()}
      onBlur={(e: any) => {
        const text = multiline ? e.currentTarget.innerText : e.currentTarget.innerText.replace(/\n/g, " ").trim();
        if (text !== value) onChange(text);
      }}
      onKeyDown={(e: any) => {
        if (!multiline && e.key === "Enter") {
          e.preventDefault();
          (e.currentTarget as HTMLElement).blur();
        }
      }}
      dangerouslySetInnerHTML={{ __html: value || "" }}
    />
  );
};

export default InlineText;
