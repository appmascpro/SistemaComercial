-- Campos comerciais do cliente (CRM / visitas)

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS customer_type TEXT
    CHECK (customer_type IN ('formal', 'artesanal', 'revenda', 'fonte_indicacao')),
  ADD COLUMN IF NOT EXISTS lead_status TEXT
    CHECK (lead_status IN ('frio', 'morno', 'quente', 'cliente')),
  ADD COLUMN IF NOT EXISTS buyer_name TEXT,
  ADD COLUMN IF NOT EXISTS buyer_phone TEXT,
  ADD COLUMN IF NOT EXISTS potential_volume TEXT,
  ADD COLUMN IF NOT EXISTS products_of_interest TEXT,
  ADD COLUMN IF NOT EXISTS current_supplier TEXT,
  ADD COLUMN IF NOT EXISTS pain_point TEXT,
  ADD COLUMN IF NOT EXISTS last_visit_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_visit_at DATE;

CREATE INDEX IF NOT EXISTS idx_customers_lead_status
  ON public.customers (tenant_id, lead_status);

CREATE INDEX IF NOT EXISTS idx_customers_next_visit_at
  ON public.customers (tenant_id, next_visit_at);

COMMENT ON COLUMN public.customers.customer_type IS 'formal | artesanal | revenda | fonte_indicacao';
COMMENT ON COLUMN public.customers.lead_status IS 'frio | morno | quente | cliente';
COMMENT ON COLUMN public.customers.potential_volume IS 'Ex.: 10L, 50L, 200L/mês';
COMMENT ON COLUMN public.customers.last_visit_at IS 'Último contato registrado';
COMMENT ON COLUMN public.customers.next_visit_at IS 'Próximo contato planejado';
