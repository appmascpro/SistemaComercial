-- Tenant de desenvolvimento para importação de produtos
-- Execute no SQL Editor se ainda não tiver um tenant cadastrado.

INSERT INTO public.tenants (name, slug, is_active)
VALUES ('Empresa Principal', 'empresa-principal', true)
ON CONFLICT (slug) DO NOTHING;

-- Depois de executar, copie o id gerado e coloque em DEFAULT_TENANT_ID no .env.local:
-- SELECT id, name, slug FROM public.tenants WHERE slug = 'empresa-principal';
