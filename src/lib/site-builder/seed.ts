// src/lib/site-builder/seed.ts
// Estruturas padrão de blocos para cada página (home, sobre, contato)

import type { Block } from "./types";
import { newId } from "./types";

export function buildDefaultHomeBlocks(siteContent?: any): Block[] {
  const heroOverride: any = siteContent?.hero
    ? {
        title: siteContent.hero.title || undefined,
        subtitle: siteContent.hero.subtitle || undefined,
        backgroundImageUrl: siteContent.hero.backgroundImageUrl || "",
        backgroundVideoUrl: siteContent.hero.backgroundVideoUrl || "",
      }
    : {};

  return [
    { id: newId(), type: "hero", props: heroOverride },
    { id: newId(), type: "benefits", props: {} },
    { id: newId(), type: "equipments", props: {} },
    { id: newId(), type: "presence", props: {} },
    { id: newId(), type: "results", props: {} },
    { id: newId(), type: "video", props: {} },
  ];
}

export function buildDefaultSobreBlocks(siteContent?: any): Block[] {
  return [
    {
      id: newId(),
      type: "hero",
      props: {
        title: "Sobre a TECH4RENT",
        subtitle: "Tecnologia e equipamentos para quem move o Brasil.",
        backgroundImageUrl: siteContent?.about?.backgroundImageUrl || "",
        primaryCtaLabel: "Falar no WhatsApp",
        primaryCtaUrl: "",
        secondaryCtaLabel: "Ver Catálogo",
        secondaryCtaUrl: "/produtos",
        overlayOpacity: 75,
        orangeWords: 1,
      },
    },
    {
      id: newId(),
      type: "textImage",
      props: {
        eyebrow: "Quem somos",
        title: "Uma marca brasileira feita para o campo de operação",
        description: siteContent?.about?.description || "Somos especializados em locação e venda de equipamentos para logística, varejo e indústria.",
        imageUrl: "",
        imageSide: "right",
      },
    },
    { id: newId(), type: "results", props: { eyebrow: "Cases", title: "Resultados reais de quem usa Tech4Rent" } },
    { id: newId(), type: "presence", props: {} },
    {
      id: newId(),
      type: "cta",
      props: {
        title: "Pronto para modernizar sua operação?",
        subtitle: "Fale com nosso time comercial",
        buttonLabel: "Falar com especialista",
        buttonUrl: "/contato",
        variant: "dark",
      },
    },
  ];
}

export function buildDefaultContatoBlocks(): Block[] {
  return [
    {
      id: newId(),
      type: "hero",
      props: {
        title: "Fale com a Tech4Rent",
        subtitle: "Estamos prontos para ajudar. Escolha o melhor canal para falar conosco.",
        primaryCtaLabel: "WhatsApp",
        primaryCtaUrl: "",
        secondaryCtaLabel: "Ver Produtos",
        secondaryCtaUrl: "/produtos",
        overlayOpacity: 75,
        orangeWords: 1,
      },
    },
    { id: newId(), type: "benefits", props: {} },
    {
      id: newId(),
      type: "faq",
      props: {
        eyebrow: "Dúvidas",
        title: "Perguntas frequentes",
        items: [
          { question: "Como funciona a locação?", answer: "Locação mensal ou personalizada conforme sua operação." },
          { question: "Qual o prazo de entrega?", answer: "Entrega em até 5 dias úteis após assinatura do contrato." },
        ],
      },
    },
    {
      id: newId(),
      type: "cta",
      props: {
        title: "Precisa de ajuda agora?",
        subtitle: "Fale com um especialista no WhatsApp",
        buttonLabel: "Abrir WhatsApp",
        buttonUrl: "",
        variant: "primary",
      },
    },
  ];
}

export const PAGE_DEFINITIONS = [
  { slug: "home", label: "Homepage", path: "/", build: buildDefaultHomeBlocks },
  { slug: "sobre", label: "Sobre", path: "/sobre", build: buildDefaultSobreBlocks },
  { slug: "contato", label: "Contato", path: "/contato", build: buildDefaultContatoBlocks },
] as const;

export type PageSlug = typeof PAGE_DEFINITIONS[number]["slug"];
