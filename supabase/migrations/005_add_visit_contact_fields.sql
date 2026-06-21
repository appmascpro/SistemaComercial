-- Campos de contato comercial na visita
ALTER TABLE public.visits
  ADD COLUMN IF NOT EXISTS contact_type TEXT NOT NULL DEFAULT 'presencial',
  ADD COLUMN IF NOT EXISTS contact_person_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_person_phone TEXT;

ALTER TABLE public.visits
  DROP CONSTRAINT IF EXISTS visits_contact_type_check;

ALTER TABLE public.visits
  ADD CONSTRAINT visits_contact_type_check
  CHECK (contact_type IN ('presencial', 'whatsapp'));

CREATE INDEX IF NOT EXISTS idx_visits_contact_type ON public.visits (contact_type);
