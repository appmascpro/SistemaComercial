-- Amostras: transportadora, custo, retorno, próxima ação e novos status

ALTER TABLE public.samples
  ADD COLUMN IF NOT EXISTS carrier_id UUID REFERENCES public.carriers (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS carrier_name TEXT,
  ADD COLUMN IF NOT EXISTS tracking_code TEXT,
  ADD COLUMN IF NOT EXISTS internal_cost NUMERIC(14, 4),
  ADD COLUMN IF NOT EXISTS next_action TEXT
    CHECK (next_action IN ('cotar', 'visitar', 'ligar', 'descartar')),
  ADD COLUMN IF NOT EXISTS followups_scheduled BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_samples_carrier_id ON public.samples (carrier_id);
CREATE INDEX IF NOT EXISTS idx_samples_next_action ON public.samples (next_action);

-- Migra status antigos para o fluxo comercial
UPDATE public.samples SET status = 'enviado' WHERE status = 'enviada';
UPDATE public.samples SET status = 'recebido' WHERE status = 'entregue';
UPDATE public.samples SET status = 'testando' WHERE status = 'feedback_recebido';

COMMENT ON COLUMN public.samples.internal_cost IS 'Custo interno do envio da amostra (R$)';
COMMENT ON COLUMN public.samples.tracking_code IS 'Código de rastreio da transportadora';
COMMENT ON COLUMN public.samples.followups_scheduled IS 'Follow-ups automáticos (2/7/15 dias) já criados';
