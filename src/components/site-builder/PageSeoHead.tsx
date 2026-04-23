// src/components/site-builder/PageSeoHead.tsx
// Renderiza tags SEO (title/description/og) por página usando react-helmet-async.

import { Helmet } from "react-helmet-async";
import type { PageSeo } from "@/lib/site-builder/types";

type Props = {
  seo?: PageSeo;
  fallbackTitle?: string;
  fallbackDescription?: string;
};

const PageSeoHead = ({ seo, fallbackTitle, fallbackDescription }: Props) => {
  const title = seo?.title || fallbackTitle || "TECH4RENT";
  const description = seo?.description || fallbackDescription || "";
  const ogImage = seo?.ogImageUrl;
  const canonical = seo?.canonicalUrl;
  const keywords = seo?.keywords;

  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}
      {seo?.noindex && <meta name="robots" content="noindex, nofollow" />}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content="website" />
      {ogImage && <meta property="og:image" content={ogImage} />}

      {/* Twitter */}
      <meta name="twitter:card" content={ogImage ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
      {ogImage && <meta name="twitter:image" content={ogImage} />}
    </Helmet>
  );
};

export default PageSeoHead;
