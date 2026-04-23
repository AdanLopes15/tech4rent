DROP TABLE IF EXISTS public.site_page_versions CASCADE;
DROP TABLE IF EXISTS public.site_pages CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP FUNCTION IF EXISTS public.has_role(UUID, public.app_role) CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;