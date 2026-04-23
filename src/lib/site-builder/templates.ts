// src/lib/site-builder/templates.ts
// Templates pré-prontos que substituem completamente os blocos da página atual.

import type { Block } from "./types";
import { newId } from "./types";
import type { PageSlug } from "./seed";

export type Template = {
  id: string;
  name: string;
  description: string;
  appliesTo: PageSlug[] | "all";
  thumbnail?: string;
  build: () => Block[];
};

const b = (type: Block["type"], props: Record<string, any> = {}): Block => ({
  id: newId(),
  type,
  props,
});

export const TEMPLATES: Template[] = [
  // ============= HOME =============
  {
    id: "home-conversion",
    name: "Home — Conversão",
    description: "Hero impactante + benefícios + produtos + depoimentos + CTA forte",
    appliesTo: ["home"],
    build: () => [
      b("hero", {
        title: "Equipamentos profissionais para acelerar sua operação",
        subtitle: "Locação e venda de PDAs, leitores e impressoras para logística e varejo.",
        primaryCtaLabel: "Falar no WhatsApp",
        secondaryCtaLabel: "Ver Catálogo",
        secondaryCtaUrl: "/produtos",
        overlayOpacity: 70,
        orangeWords: 4,
      }),
      b("benefits"),
      b("equipments"),
      b("testimonials", {
        eyebrow: "Depoimentos",
        title: "O que dizem nossos clientes",
        items: [
          {
            quote: "A Tech4Rent transformou nossa operação de picking. Reduzimos erros em 40%.",
            author: "Carlos Mendes",
            role: "Gerente de Logística",
            rating: 5,
          },
          {
            quote: "Atendimento técnico impecável e entrega rápida.",
            author: "Ana Souza",
            role: "Diretora de Operações",
            rating: 5,
          },
          {
            quote: "Equipamentos modernos com excelente custo-benefício.",
            author: "Roberto Lima",
            role: "Supervisor de CD",
            rating: 5,
          },
        ],
      }),
      b("cta", {
        title: "Pronto para acelerar sua operação?",
        subtitle: "Fale com um especialista agora",
        buttonLabel: "Solicitar orçamento",
        buttonUrl: "/contato",
        variant: "primary",
      }),
    ],
  },
  {
    id: "home-saas",
    name: "Home — Estilo SaaS",
    description: "Hero + logos de clientes + benefícios + pricing + FAQ",
    appliesTo: ["home"],
    build: () => [
      b("hero", {
        title: "A solução completa para gestão de equipamentos",
        subtitle: "Locação flexível com suporte técnico dedicado.",
        primaryCtaLabel: "Começar agora",
        secondaryCtaLabel: "Ver planos",
        secondaryCtaUrl: "#pricing",
        overlayOpacity: 75,
        orangeWords: 3,
      }),
      b("logoCloud", {
        eyebrow: "Confiam em nós",
        title: "Empresas que aceleram com a Tech4Rent",
        items: [
          { alt: "Pelog" },
          { alt: "Memphis" },
          { alt: "CEVA" },
          { alt: "VDC Log" },
          { alt: "Porto Guimarães" },
          { alt: "Maxton" },
        ],
      }),
      b("benefits"),
      b("stats", {
        eyebrow: "Resultados",
        title: "Números que falam por nós",
        variant: "light",
        items: [
          { icon: "Package", value: "10.000+", label: "Aparelhos em operação" },
          { icon: "Users", value: "1.000+", label: "Clientes ativos" },
          { icon: "MapPin", value: "20+", label: "Estados atendidos" },
          { icon: "Clock", value: "24h", label: "Suporte técnico" },
        ],
      }),
      b("pricing", {
        eyebrow: "Planos",
        title: "Escolha o plano ideal",
        plans: [
          {
            name: "Starter",
            price: "R$ 199",
            period: "mês",
            description: "Ideal para pequenas operações",
            features: [
              { _value: "Até 5 equipamentos" },
              { _value: "Suporte por e-mail" },
              { _value: "Garantia padrão" },
            ],
            buttonLabel: "Começar",
            buttonUrl: "/contato",
          },
          {
            name: "Pro",
            price: "R$ 499",
            period: "mês",
            description: "Para operações em crescimento",
            features: [
              { _value: "Até 25 equipamentos" },
              { _value: "Suporte prioritário 24h" },
              { _value: "Garantia estendida" },
              { _value: "Treinamento incluso" },
            ],
            highlight: true,
            buttonLabel: "Quero esse",
            buttonUrl: "/contato",
          },
          {
            name: "Enterprise",
            price: "Sob consulta",
            period: "",
            description: "Soluções customizadas",
            features: [
              { _value: "Equipamentos ilimitados" },
              { _value: "SLA dedicado" },
              { _value: "Integração com seu sistema" },
              { _value: "Account manager" },
            ],
            buttonLabel: "Falar com vendas",
            buttonUrl: "/contato",
          },
        ],
      }),
      b("faq", {
        eyebrow: "Dúvidas",
        title: "Perguntas frequentes",
      }),
    ],
  },

  // ============= SOBRE =============
  {
    id: "sobre-institucional",
    name: "Sobre — Institucional",
    description: "Hero + nossa história + galeria + estatísticas + CTA",
    appliesTo: ["sobre"],
    build: () => [
      b("hero", {
        title: "Sobre a Tech4Rent",
        subtitle: "Tecnologia e equipamentos para quem move o Brasil.",
        primaryCtaLabel: "Falar conosco",
        secondaryCtaLabel: "Ver Catálogo",
        secondaryCtaUrl: "/produtos",
        overlayOpacity: 75,
        orangeWords: 1,
      }),
      b("textImage", {
        eyebrow: "Nossa história",
        title: "Uma marca brasileira feita para o campo de operação",
        description:
          "Há mais de 10 anos transformando a operação de empresas brasileiras com equipamentos de ponta e suporte técnico dedicado.",
        imageSide: "right",
      }),
      b("stats", {
        title: "Tech4Rent em números",
        variant: "primary",
        items: [
          { icon: "Calendar", value: "10+", label: "Anos de mercado" },
          { icon: "Users", value: "1.000+", label: "Clientes ativos" },
          { icon: "Package", value: "10.000+", label: "Equipamentos" },
          { icon: "MapPin", value: "20+", label: "Estados" },
        ],
      }),
      b("gallery", {
        eyebrow: "Estrutura",
        title: "Nosso ambiente",
        columns: 3,
        items: [
          { caption: "Recepção" },
          { caption: "Bancada técnica" },
          { caption: "Equipamentos em operação" },
        ],
      }),
      b("cta", {
        title: "Quer conhecer melhor?",
        subtitle: "Agende uma visita ou converse com nosso time",
        buttonLabel: "Falar com especialista",
        buttonUrl: "/contato",
        variant: "dark",
      }),
    ],
  },

  // ============= CONTATO =============
  {
    id: "contato-completo",
    name: "Contato — Completo",
    description: "Hero + benefícios + FAQ + CTA WhatsApp",
    appliesTo: ["contato"],
    build: () => [
      b("hero", {
        title: "Fale com a Tech4Rent",
        subtitle: "Estamos prontos para atender. Escolha o melhor canal.",
        primaryCtaLabel: "WhatsApp",
        secondaryCtaLabel: "Ver Produtos",
        secondaryCtaUrl: "/produtos",
        overlayOpacity: 75,
        orangeWords: 1,
      }),
      b("benefits"),
      b("faq"),
      b("cta", {
        title: "Precisa de ajuda agora?",
        subtitle: "Fale no WhatsApp",
        buttonLabel: "Abrir WhatsApp",
        variant: "primary",
      }),
    ],
  },

  // ============= GENÉRICO =============
  {
    id: "blank",
    name: "Em branco",
    description: "Comece do zero com apenas um Hero",
    appliesTo: "all",
    build: () => [
      b("hero", {
        title: "Novo título",
        subtitle: "Edite este conteúdo",
        primaryCtaLabel: "WhatsApp",
        secondaryCtaLabel: "Saiba mais",
        secondaryCtaUrl: "/",
      }),
    ],
  },
];

export const getTemplatesForPage = (slug: PageSlug): Template[] =>
  TEMPLATES.filter((t) => t.appliesTo === "all" || (t.appliesTo as string[]).includes(slug));
