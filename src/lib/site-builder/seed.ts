// src/lib/site-builder/seed.ts
// Cria a estrutura padrão de blocos baseada nas seções atuais da home

import type { Block } from "./types";
import { BLOCK_META, newId } from "./types";
import { BLOCK_META as META } from "./registry";

export function buildDefaultHomeBlocks(siteContent?: any): Block[] {
  const heroDefaults = META.hero.defaults;
  const heroOverride: any = siteContent?.hero
    ? {
        title: siteContent.hero.title || heroDefaults.title,
        subtitle: siteContent.hero.subtitle || heroDefaults.subtitle,
        backgroundImageUrl: siteContent.hero.backgroundImageUrl || "",
        backgroundVideoUrl: siteContent.hero.backgroundVideoUrl || "",
      }
    : {};

  const blocks: Block[] = [
    { id: newId(), type: "hero", props: heroOverride },
    { id: newId(), type: "benefits", props: {} },
    { id: newId(), type: "equipments", props: {} },
    { id: newId(), type: "presence", props: {} },
    { id: newId(), type: "results", props: {} },
    { id: newId(), type: "video", props: {} },
  ];

  return blocks;
}
