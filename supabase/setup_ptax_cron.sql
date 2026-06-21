-- =============================================================================
-- PTAX BCB — agendamento via Supabase (pg_cron + pg_net)
-- =============================================================================
--
-- PASSO 1 — Dashboard Supabase → Database → Extensions
--   Ative manualmente (se ainda não estiverem):
--     • pg_cron
--     • pg_net
--
-- PASSO 2 — Substitua abaixo (busque por APP_URL e CRON_SECRET):
--     APP_URL      → URL pública do app (sem barra final)
--                    ex.: https://seu-app.vercel.app
--     CRON_SECRET  → mesmo valor de CRON_SECRET no Vercel / .env.local
--
-- PASSO 3 — Migration 008_ptax_bcb.sql já deve estar aplicada
--
-- Horários (UTC; BRT = UTC-3):
--   07:00 BRT → 10:00 UTC  (dias úteis)
--   13:30 BRT → 16:30 UTC  (dias úteis)
-- =============================================================================

-- Habilita extensões (ignora se já existirem)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Confirma que pg_cron está disponível antes de continuar
DO $$
BEGIN
  IF to_regnamespace('cron') IS NULL THEN
    RAISE EXCEPTION
      'Extensão pg_cron não está ativa. Vá em Database → Extensions no Supabase, '
      'ative "pg_cron" e "pg_net", depois execute este script novamente.';
  END IF;
END $$;

-- Remove jobs anteriores com o mesmo nome (idempotente; não falha se não existirem)
DO $$
DECLARE
  job record;
BEGIN
  FOR job IN
    SELECT jobid FROM cron.job
    WHERE jobname IN ('ptax-bcb-morning', 'ptax-bcb-afternoon')
  LOOP
    PERFORM cron.unschedule(job.jobid);
  END LOOP;
END $$;

-- 07:00 horário de Brasília (seg–sex)
SELECT cron.schedule(
  'ptax-bcb-morning',
  '0 10 * * 1-5',
  $$
  SELECT net.http_post(
    url := 'APP_URL/api/cron/ptax',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer CRON_SECRET'
    ),
    body := '{"slot":"morning"}'::jsonb
  ) AS request_id;
  $$
);

-- 13:30 horário de Brasília (seg–sex)
SELECT cron.schedule(
  'ptax-bcb-afternoon',
  '30 16 * * 1-5',
  $$
  SELECT net.http_post(
    url := 'APP_URL/api/cron/ptax',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer CRON_SECRET'
    ),
    body := '{"slot":"afternoon"}'::jsonb
  ) AS request_id;
  $$
);

-- Verifica jobs criados
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname IN ('ptax-bcb-morning', 'ptax-bcb-afternoon')
ORDER BY jobname;
