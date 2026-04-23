// src/lib/site-builder/registry.tsx
// Registry de blocos: meta (campos editáveis + defaults) + componente de renderização

import { lazy, Suspense } from "react";
import type { Block, BlockMeta, BlockType } from "./types";

// Componentes de render (importados de novos blocos editáveis)
import HeroBlock from "@/components/site-builder/blocks/HeroBlock";
import BenefitsBlock from "@/components/site-builder/blocks/BenefitsBlock";
import EquipmentsBlock from "@/components/site-builder/blocks/EquipmentsBlock";
import PresenceBlock from "@/components/site-builder/blocks/PresenceBlock";
import ResultsBlock from "@/components/site-builder/blocks/ResultsBlock";
import VideoBlock from "@/components/site-builder/blocks/VideoBlock";
import CtaBlock from "@/components/site-builder/blocks/CtaBlock";
import TextImageBlock from "@/components/site-builder/blocks/TextImageBlock";
import FaqBlock from "@/components/site-builder/blocks/FaqBlock";
import SpacerBlock from "@/components/site-builder/blocks/SpacerBlock";

export const BLOCK_META: Record<BlockType, BlockMeta> = {
  hero: {
    type: "hero",
    label: "Hero",
    description: "Banner principal com título, subtítulo e botões",
    icon: "Sparkles",
    defaults: {
      title: "Soluções em Equipamentos para sua Empresa",
      subtitle: "Qualidade, segurança e a tecnologia que você precisa para alcançar os melhores resultados.",
      backgroundImageUrl: "",
      backgroundVideoUrl: "",
      primaryCtaLabel: "Falar no WhatsApp",
      primaryCtaUrl: "",
      secondaryCtaLabel: "Ver Catálogo",
      secondaryCtaUrl: "/produtos",
      overlayOpacity: 70,
      orangeWords: 3,
    },
    fields: [
      { key: "title", label: "Título", type: "text" },
      { key: "subtitle", label: "Subtítulo", type: "textarea" },
      { key: "orangeWords", label: "Palavras finais em laranja", type: "number", min: 0, max: 8 },
      { key: "backgroundImageUrl", label: "Imagem de fundo (URL)", type: "image" },
      { key: "backgroundVideoUrl", label: "Vídeo de fundo (URL)", type: "video" },
      { key: "overlayOpacity", label: "Opacidade do overlay (0-100)", type: "number", min: 0, max: 100 },
      { key: "primaryCtaLabel", label: "Botão principal — texto", type: "text", group: "Botão Principal" },
      { key: "primaryCtaUrl", label: "Botão principal — URL (vazio = WhatsApp)", type: "text", group: "Botão Principal" },
      { key: "secondaryCtaLabel", label: "Botão secundário — texto", type: "text", group: "Botão Secundário" },
      { key: "secondaryCtaUrl", label: "Botão secundário — URL", type: "text", group: "Botão Secundário" },
    ],
  },
  benefits: {
    type: "benefits",
    label: "Barra de Benefícios",
    description: "Faixa horizontal com benefícios",
    icon: "BadgeCheck",
    defaults: {
      items: [
        { icon: "Shield", title: "Garantia de 1 ano", description: "Todos os produtos com garantia" },
        { icon: "BriefcaseBusiness", title: "Solução para sua operação", description: "Indicação conforme sua rotina" },
        { icon: "Headphones", title: "Suporte especializado", description: "Atendimento técnico dedicado" },
      ],
    },
    fields: [
      {
        key: "items",
        label: "Benefícios",
        type: "list",
        itemFields: [
          { key: "icon", label: "Ícone (lucide)", type: "text", placeholder: "Shield" },
          { key: "title", label: "Título", type: "text" },
          { key: "description", label: "Descrição", type: "text" },
        ],
      },
    ],
  },
  equipments: {
    type: "equipments",
    label: "Produtos / Equipamentos",
    description: "Lista os equipamentos cadastrados",
    icon: "Package",
    defaults: {
      eyebrow: "Catálogo",
      title: "Produtos mais procurados",
      subtitle: "",
      maxItems: 3,
    },
    fields: [
      { key: "eyebrow", label: "Eyebrow", type: "text" },
      { key: "title", label: "Título", type: "text" },
      { key: "subtitle", label: "Subtítulo", type: "text" },
      { key: "maxItems", label: "Quantidade máxima", type: "number", min: 1, max: 12 },
    ],
  },
  presence: {
    type: "presence",
    label: "Presença / Estatísticas",
    description: "Marquee de logos + stats + segmentos",
    icon: "Map",
    defaults: {
      marqueeTitle: "Empresas que tiveram resultados com a Tech4Rent",
      logos: ["Pelog", "Memphis Courier", "CEVA Logistics", "VDC Log", "Porto Guimarães", "Maxton"],
      sectionTitle: "Presença em todo o Brasil",
      stats: [
        { icon: "Package", value: "10.000+", label: "Aparelhos em operação" },
        { icon: "Users", value: "1.000+", label: "Clientes ativos" },
        { icon: "MapPin", value: "20+", label: "Estados atendidos" },
      ],
      segmentsTitle: "Segmentos atendidos",
      segments: [
        { icon: "Truck", label: "Logística & Transporte" },
        { icon: "ShoppingCart", label: "E-commerce & Fulfillment" },
        { icon: "Warehouse", label: "Varejo & Atacado" },
        { icon: "Factory", label: "Indústria & Manufatura" },
        { icon: "Heart", label: "Saúde & Hospitalar" },
        { icon: "Package", label: "Alimentício & Frigorífico" },
      ],
    },
    fields: [
      { key: "marqueeTitle", label: "Título do marquee", type: "text" },
      {
        key: "logos",
        label: "Logos (texto)",
        type: "list",
        itemFields: [{ key: "_value", label: "Logo", type: "text" }],
      },
      { key: "sectionTitle", label: "Título da seção", type: "text" },
      {
        key: "stats",
        label: "Estatísticas",
        type: "list",
        itemFields: [
          { key: "icon", label: "Ícone", type: "text" },
          { key: "value", label: "Valor", type: "text" },
          { key: "label", label: "Rótulo", type: "text" },
        ],
      },
      { key: "segmentsTitle", label: "Título de segmentos", type: "text" },
      {
        key: "segments",
        label: "Segmentos",
        type: "list",
        itemFields: [
          { key: "icon", label: "Ícone", type: "text" },
          { key: "label", label: "Rótulo", type: "text" },
        ],
      },
    ],
  },
  results: {
    type: "results",
    label: "Cases / Resultados",
    description: "Cards com resultados/cases",
    icon: "TrendingUp",
    defaults: {
      eyebrow: "Cases",
      title: "Resultados reais de quem usa Tech4Rent",
      items: [
        { icon: "TrendingUp", tag: "E-commerce", title: "Redução de 40% nos erros de leitura", description: "Operação de picking com SKUs migrou de coletores antigos para equipamentos atualizados." },
        { icon: "Zap", tag: "Logística", title: "2x mais agilidade no picking", description: "Transportadora substituiu leitores convencionais por PDAs com leitor 2D integrado." },
        { icon: "Clock", tag: "Distribuição", title: "Implantação em 5 dias úteis", description: "Distribuidora recebeu equipamentos configurados e prontos para uso." },
      ],
    },
    fields: [
      { key: "eyebrow", label: "Eyebrow", type: "text" },
      { key: "title", label: "Título", type: "text" },
      {
        key: "items",
        label: "Cases",
        type: "list",
        itemFields: [
          { key: "icon", label: "Ícone", type: "text" },
          { key: "tag", label: "Tag", type: "text" },
          { key: "title", label: "Título", type: "text" },
          { key: "description", label: "Descrição", type: "textarea" },
        ],
      },
    ],
  },
  video: {
    type: "video",
    label: "Vídeo Demonstrativo",
    description: "Bloco de vídeo (YouTube ou MP4)",
    icon: "Play",
    defaults: {
      title: "Veja na prática",
      videoUrl: "",
    },
    fields: [
      { key: "title", label: "Título", type: "text" },
      { key: "videoUrl", label: "URL (YouTube ou MP4)", type: "video" },
    ],
  },
  cta: {
    type: "cta",
    label: "CTA / Chamada",
    description: "Bloco de chamada para ação",
    icon: "Megaphone",
    defaults: {
      title: "Pronto para acelerar sua operação?",
      subtitle: "Fale com um especialista e receba uma proposta personalizada",
      buttonLabel: "Falar agora",
      buttonUrl: "/contato",
      variant: "dark",
    },
    fields: [
      { key: "title", label: "Título", type: "text" },
      { key: "subtitle", label: "Subtítulo", type: "text" },
      { key: "buttonLabel", label: "Texto do botão", type: "text" },
      { key: "buttonUrl", label: "URL do botão", type: "text" },
      {
        key: "variant",
        label: "Estilo",
        type: "select",
        options: [
          { label: "Escuro", value: "dark" },
          { label: "Claro", value: "light" },
          { label: "Laranja", value: "primary" },
        ],
      },
    ],
  },
  textImage: {
    type: "textImage",
    label: "Texto + Imagem",
    description: "Coluna de texto ao lado de imagem",
    icon: "Columns2",
    defaults: {
      eyebrow: "",
      title: "Sobre a Tech4Rent",
      description: "Somos especializados em locação e venda de equipamentos para logística, varejo e indústria.",
      imageUrl: "",
      imageSide: "right",
      buttonLabel: "",
      buttonUrl: "",
    },
    fields: [
      { key: "eyebrow", label: "Eyebrow", type: "text" },
      { key: "title", label: "Título", type: "text" },
      { key: "description", label: "Descrição", type: "textarea" },
      { key: "imageUrl", label: "Imagem", type: "image" },
      {
        key: "imageSide",
        label: "Lado da imagem",
        type: "select",
        options: [
          { label: "Esquerda", value: "left" },
          { label: "Direita", value: "right" },
        ],
      },
      { key: "buttonLabel", label: "Botão — texto", type: "text" },
      { key: "buttonUrl", label: "Botão — URL", type: "text" },
    ],
  },
  faq: {
    type: "faq",
    label: "FAQ / Dúvidas",
    description: "Lista de perguntas frequentes",
    icon: "HelpCircle",
    defaults: {
      eyebrow: "Dúvidas",
      title: "Perguntas frequentes",
      items: [
        { question: "Como funciona a locação?", answer: "Locação mensal ou personalizada conforme sua operação." },
        { question: "Qual o prazo de entrega?", answer: "Entrega em até 5 dias úteis após assinatura do contrato." },
      ],
    },
    fields: [
      { key: "eyebrow", label: "Eyebrow", type: "text" },
      { key: "title", label: "Título", type: "text" },
      {
        key: "items",
        label: "Perguntas",
        type: "list",
        itemFields: [
          { key: "question", label: "Pergunta", type: "text" },
          { key: "answer", label: "Resposta", type: "textarea" },
        ],
      },
    ],
  },
  spacer: {
    type: "spacer",
    label: "Espaçador",
    description: "Espaço em branco entre blocos",
    icon: "MoveVertical",
    defaults: { height: 60 },
    fields: [{ key: "height", label: "Altura (px)", type: "number", min: 8, max: 400 }],
  },
};

export const BLOCK_LIBRARY: BlockMeta[] = Object.values(BLOCK_META);

export function renderBlock(block: Block) {
  const props = { ...BLOCK_META[block.type]?.defaults, ...block.props };
  switch (block.type) {
    case "hero":
      return <HeroBlock {...(props as any)} />;
    case "benefits":
      return <BenefitsBlock {...(props as any)} />;
    case "equipments":
      return <EquipmentsBlock {...(props as any)} />;
    case "presence":
      return <PresenceBlock {...(props as any)} />;
    case "results":
      return <ResultsBlock {...(props as any)} />;
    case "video":
      return <VideoBlock {...(props as any)} />;
    case "cta":
      return <CtaBlock {...(props as any)} />;
    case "textImage":
      return <TextImageBlock {...(props as any)} />;
    case "faq":
      return <FaqBlock {...(props as any)} />;
    case "spacer":
      return <SpacerBlock {...(props as any)} />;
    default:
      return null;
  }
}
