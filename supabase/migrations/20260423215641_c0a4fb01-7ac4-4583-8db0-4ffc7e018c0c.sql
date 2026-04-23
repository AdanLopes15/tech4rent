-- Tabela principal de páginas do site
CREATE TABLE public.site_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  draft_blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  published_blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  published_at TIMESTAMPTZ,
  published_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Histórico de versões publicadas
CREATE TABLE public.site_page_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.site_pages(id) ON DELETE CASCADE,
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  published_by UUID,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_site_page_versions_page_id ON public.site_page_versions(page_id, published_at DESC);

-- RLS
ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_page_versions ENABLE ROW LEVEL SECURITY;

-- Acesso público apenas leitura (para o site público renderizar)
CREATE POLICY "Public can read site pages"
ON public.site_pages
FOR SELECT
USING (true);

-- Admin (autenticado) pode tudo nas páginas
CREATE POLICY "Authenticated can insert site pages"
ON public.site_pages
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated can update site pages"
ON public.site_pages
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated can delete site pages"
ON public.site_pages
FOR DELETE
TO authenticated
USING (true);

-- Histórico apenas para autenticados
CREATE POLICY "Authenticated can read versions"
ON public.site_page_versions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated can insert versions"
ON public.site_page_versions
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_site_pages_updated_at
BEFORE UPDATE ON public.site_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Semente: página home
INSERT INTO public.site_pages (slug, title, draft_blocks, published_blocks)
VALUES ('home', 'Homepage', '[]'::jsonb, '[]'::jsonb)
ON CONFLICT (slug) DO NOTHING;