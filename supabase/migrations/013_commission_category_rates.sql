-- Taxas de comissão por categoria de produto + override opcional no produto

CREATE TABLE IF NOT EXISTS public.commission_category_rates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  category        TEXT NOT NULL,
  commission_rate NUMERIC(14, 4) NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'ativo',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT commission_category_rates_tenant_category_unique
    UNIQUE (tenant_id, category)
);

CREATE INDEX IF NOT EXISTS idx_commission_category_rates_tenant
  ON public.commission_category_rates (tenant_id);

COMMENT ON TABLE public.commission_category_rates IS
  'Percentual de comissão por categoria de produto. Use category = __default__ para taxa padrão.';

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(14, 4);

COMMENT ON COLUMN public.products.commission_rate IS
  'Override de comissão % para este produto (opcional; prevalece sobre a categoria)';

CREATE TRIGGER trg_commission_category_rates_updated_at
  BEFORE UPDATE ON public.commission_category_rates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.commission_category_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS commission_category_rates_tenant_all
  ON public.commission_category_rates;
CREATE POLICY commission_category_rates_tenant_all
  ON public.commission_category_rates
  FOR ALL
  USING (tenant_id = public.auth_tenant_id())
  WITH CHECK (tenant_id = public.auth_tenant_id());
