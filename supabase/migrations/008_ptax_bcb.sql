-- Origem da PTAX e data de referência BCB

ALTER TABLE public.exchange_rates
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS bcb_reference_date DATE;

COMMENT ON COLUMN public.exchange_rates.source IS 'manual | bcb';
COMMENT ON COLUMN public.exchange_rates.bcb_reference_date IS 'Data da cotação PTAX no BCB';

CREATE INDEX IF NOT EXISTS idx_exchange_rates_source
  ON public.exchange_rates (tenant_id, source);
