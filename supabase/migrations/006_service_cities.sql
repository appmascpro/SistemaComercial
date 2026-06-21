-- Cidades de atuação comercial por tenant (apoio a rotas e filtros)

CREATE TABLE public.service_cities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  city        TEXT NOT NULL,
  state       TEXT NOT NULL DEFAULT 'SP',
  region      TEXT,
  status      TEXT NOT NULL DEFAULT 'ativo'
              CHECK (status IN ('ativo', 'inativo')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT service_cities_unique UNIQUE (tenant_id, city, state)
);

CREATE INDEX idx_service_cities_tenant_id ON public.service_cities (tenant_id);
CREATE INDEX idx_service_cities_city ON public.service_cities (city);
CREATE INDEX idx_service_cities_state ON public.service_cities (state);
CREATE INDEX idx_service_cities_status ON public.service_cities (status);

CREATE TRIGGER trg_service_cities_updated_at
  BEFORE UPDATE ON public.service_cities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.service_cities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_cities_tenant_all ON public.service_cities;
CREATE POLICY service_cities_tenant_all ON public.service_cities
  FOR ALL
  USING (tenant_id = public.auth_tenant_id())
  WITH CHECK (tenant_id = public.auth_tenant_id());
