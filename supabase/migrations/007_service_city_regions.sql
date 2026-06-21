-- Índice para filtros por micro-região em rotas

CREATE INDEX IF NOT EXISTS idx_service_cities_region
  ON public.service_cities (tenant_id, region);
