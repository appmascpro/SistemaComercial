-- Descrição comercial do produto (coluna DESCRIÇÃO da planilha Tavares)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS description TEXT;

CREATE INDEX IF NOT EXISTS idx_products_description
  ON public.products (description);
