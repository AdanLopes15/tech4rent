// src/lib/site-builder/inline-context.tsx
// Contexto que sinaliza para os blocos quando estamos no editor (inline edit ativo).

import { createContext, useContext, type ReactNode } from "react";

type InlineEditContext = {
  enabled: boolean;
  // Atualiza uma prop do bloco em edição
  updateProp: (blockId: string, key: string, value: any) => void;
};

const Ctx = createContext<InlineEditContext | null>(null);

export const InlineEditProvider = ({ value, children }: { value: InlineEditContext; children: ReactNode }) => (
  <Ctx.Provider value={value}>{children}</Ctx.Provider>
);

export const useInlineEdit = () => useContext(Ctx);
