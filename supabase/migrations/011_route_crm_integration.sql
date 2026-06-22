-- Rotas integradas ao CRM (semana, prioridade A/B/C, resultado, reagendar)

ALTER TABLE public.routes
  ADD COLUMN IF NOT EXISTS week_number INTEGER
    CHECK (week_number IS NULL OR (week_number >= 1 AND week_number <= 12));

COMMENT ON COLUMN public.routes.week_number IS 'Semana do ciclo comercial (1–12, ex. operação 60 dias)';

ALTER TABLE public.visits
  ADD COLUMN IF NOT EXISTS visit_result TEXT
    CHECK (
      visit_result IS NULL OR visit_result IN (
        'cotou',
        'pediu',
        'pediu_amostra',
        'sem_interesse'
      )
    );

COMMENT ON COLUMN public.visits.visit_result IS 'Resultado comercial: cotou | pediu | pediu_amostra | sem_interesse';

-- Paradas: pendente → planejado; cancelado → reagendar (legado)
UPDATE public.route_stops SET status = 'planejado' WHERE status = 'pendente';
UPDATE public.route_stops SET status = 'reagendar' WHERE status = 'cancelado';

-- Prioridade legado → A/B/C
UPDATE public.route_stops SET priority = 'A' WHERE priority = 'alta';
UPDATE public.route_stops SET priority = 'B' WHERE priority IN ('normal', 'media', 'medio');
UPDATE public.route_stops SET priority = 'C' WHERE priority = 'baixa';

CREATE INDEX IF NOT EXISTS idx_routes_week_number
  ON public.routes (tenant_id, week_number);

CREATE INDEX IF NOT EXISTS idx_routes_planned_date_status
  ON public.routes (tenant_id, planned_date, status);

CREATE INDEX IF NOT EXISTS idx_visits_route_id
  ON public.visits (tenant_id, route_id);
