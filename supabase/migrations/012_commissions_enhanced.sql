-- Comissões: campos de margem, faturamento parcial e índice único por pedido

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS invoiced_amount NUMERIC(14, 4);

COMMENT ON COLUMN public.orders.invoiced_amount IS 'Valor já faturado (pedido parcial)';

ALTER TABLE public.commissions
  ADD COLUMN IF NOT EXISTS order_total NUMERIC(14, 4),
  ADD COLUMN IF NOT EXISTS margin_percent NUMERIC(14, 4),
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_commissions_order_unique
  ON public.commissions (order_id);

COMMENT ON COLUMN public.commissions.order_total IS 'Total do pedido no momento do cálculo';
COMMENT ON COLUMN public.commissions.margin_percent IS 'Margem estimada %';
COMMENT ON COLUMN public.commissions.commission_base IS 'Base de cálculo (total do pedido)';
COMMENT ON COLUMN public.commissions.status IS 'prevista | pendente | proporcional | liberada | cancelada | paga';
