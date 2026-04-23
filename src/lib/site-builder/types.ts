// src/lib/site-builder/types.ts

export type BlockType =
  | "hero"
  | "benefits"
  | "equipments"
  | "presence"
  | "results"
  | "video"
  | "cta"
  | "textImage"
  | "faq"
  | "spacer"
  | "gallery"
  | "testimonials"
  | "pricing"
  | "logoCloud"
  | "stats";

export type PageSeo = {
  title?: string;
  description?: string;
  keywords?: string;
  ogImageUrl?: string;
  canonicalUrl?: string;
  noindex?: boolean;
};

export type Block = {
  id: string;
  type: BlockType;
  props: Record<string, any>;
  visible?: boolean;
};

export type PropFieldType =
  | "text"
  | "textarea"
  | "image"
  | "video"
  | "color"
  | "number"
  | "switch"
  | "select"
  | "list";

export type PropField = {
  key: string;
  label: string;
  type: PropFieldType;
  placeholder?: string;
  options?: { label: string; value: string }[];
  itemFields?: PropField[]; // para type=list
  min?: number;
  max?: number;
  group?: string;
};

export type BlockMeta = {
  type: BlockType;
  label: string;
  description: string;
  icon: string; // nome lucide
  defaults: Record<string, any>;
  fields: PropField[];
};

export const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `b_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
