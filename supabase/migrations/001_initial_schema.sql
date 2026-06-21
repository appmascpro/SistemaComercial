-- =============================================================================
-- ConectaInsumos — Schema inicial
-- Multi-tenant | UUID | numeric(14,4) para preços | RLS desativado
-- =============================================================================
-- Execute este arquivo no SQL Editor do Supabase.
-- RLS não está habilitado nesta versão — revisar antes de ativar em produção.
-- =============================================================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- Função auxiliar: atualizar updated_at automaticamente
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- TENANTS — empresas/organizações do SaaS (não possui tenant_id)
-- -----------------------------------------------------------------------------
CREATE TABLE public.tenants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL,
  logo_url      TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  settings      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tenants_slug_unique UNIQUE (slug)
);

CREATE INDEX idx_tenants_is_active ON public.tenants (is_active);

CREATE TRIGGER trg_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- PROFILES — usuários vinculados ao auth.users e a um tenant
-- -----------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL REFERENCES public.tenants (id) ON DELETE RESTRICT,
  email         TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'vendedor'
                CHECK (role IN ('admin', 'gerente', 'vendedor', 'financeiro')),
  avatar_url    TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_tenant_id ON public.profiles (tenant_id);
CREATE INDEX idx_profiles_email ON public.profiles (email);
CREATE INDEX idx_profiles_role ON public.profiles (role);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- COMPANIES — dados cadastrais da empresa do tenant (razão social, CNPJ etc.)
-- -----------------------------------------------------------------------------
CREATE TABLE public.companies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  legal_name      TEXT NOT NULL,
  trade_name      TEXT,
  cnpj            TEXT,
  state_registration TEXT,
  municipal_registration TEXT,
  email           TEXT,
  phone           TEXT,
  website         TEXT,
  address_line    TEXT,
  address_number  TEXT,
  address_complement TEXT,
  neighborhood    TEXT,
  city            TEXT,
  state           TEXT,
  zip_code        TEXT,
  country         TEXT NOT NULL DEFAULT 'BR',
  is_default      BOOLEAN NOT NULL DEFAULT true,
  status          TEXT NOT NULL DEFAULT 'ativo',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_companies_tenant_id ON public.companies (tenant_id);
CREATE INDEX idx_companies_city ON public.companies (city);
CREATE INDEX idx_companies_state ON public.companies (state);
CREATE INDEX idx_companies_status ON public.companies (status);

CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- PRODUCTS — catálogo de insumos
-- -----------------------------------------------------------------------------
CREATE TABLE public.products (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  internal_code     TEXT NOT NULL,
  commercial_name   TEXT NOT NULL,
  inci_name         TEXT,
  supplier_name     TEXT,
  category          TEXT,
  subcategory       TEXT,
  unit              TEXT NOT NULL DEFAULT 'kg',
  stock_quantity    NUMERIC(14, 4) NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'ativo',
  technical_notes   TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT products_tenant_code_unique UNIQUE (tenant_id, internal_code)
);

CREATE INDEX idx_products_tenant_id ON public.products (tenant_id);
CREATE INDEX idx_products_status ON public.products (status);
CREATE INDEX idx_products_commercial_name ON public.products (commercial_name);
CREATE INDEX idx_products_inci_name ON public.products (inci_name);
CREATE INDEX idx_products_category ON public.products (category);
CREATE INDEX idx_products_supplier_name ON public.products (supplier_name);

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- PRODUCT_PACKAGES — tamanhos/embalagens do produto
-- -----------------------------------------------------------------------------
CREATE TABLE public.product_packages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  size_value    NUMERIC(14, 4),
  size_unit     TEXT,
  barcode       TEXT,
  is_default    BOOLEAN NOT NULL DEFAULT false,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'ativo',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_packages_tenant_id ON public.product_packages (tenant_id);
CREATE INDEX idx_product_packages_product_id ON public.product_packages (product_id);
CREATE INDEX idx_product_packages_status ON public.product_packages (status);

CREATE TRIGGER trg_product_packages_updated_at
  BEFORE UPDATE ON public.product_packages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- PRODUCT_PRICES — preços por produto/embalagem
-- -----------------------------------------------------------------------------
CREATE TABLE public.product_prices (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  package_id    UUID REFERENCES public.product_packages (id) ON DELETE SET NULL,
  price_usd     NUMERIC(14, 4),
  price_brl     NUMERIC(14, 4),
  min_price     NUMERIC(14, 4),
  max_price     NUMERIC(14, 4),
  valid_from    DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until   DATE,
  status        TEXT NOT NULL DEFAULT 'ativo',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_prices_tenant_id ON public.product_prices (tenant_id);
CREATE INDEX idx_product_prices_product_id ON public.product_prices (product_id);
CREATE INDEX idx_product_prices_package_id ON public.product_prices (package_id);
CREATE INDEX idx_product_prices_status ON public.product_prices (status);
CREATE INDEX idx_product_prices_valid_from ON public.product_prices (valid_from);

CREATE TRIGGER trg_product_prices_updated_at
  BEFORE UPDATE ON public.product_prices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- PRODUCT_IMPORTS — histórico de importações de planilha
-- -----------------------------------------------------------------------------
CREATE TABLE public.product_imports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  imported_by     UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  file_name       TEXT NOT NULL,
  file_path       TEXT,
  total_rows      INTEGER NOT NULL DEFAULT 0,
  success_rows    INTEGER NOT NULL DEFAULT 0,
  error_rows      INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'pendente',
  error_details   JSONB NOT NULL DEFAULT '[]'::jsonb,
  started_at      TIMESTAMPTZ,
  finished_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_imports_tenant_id ON public.product_imports (tenant_id);
CREATE INDEX idx_product_imports_status ON public.product_imports (status);
CREATE INDEX idx_product_imports_imported_by ON public.product_imports (imported_by);

CREATE TRIGGER trg_product_imports_updated_at
  BEFORE UPDATE ON public.product_imports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- TAX_RULES — ICMS por UF/região e IPI por produto
-- -----------------------------------------------------------------------------
CREATE TABLE public.tax_rules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  product_id    UUID REFERENCES public.products (id) ON DELETE CASCADE,
  state         TEXT,
  region        TEXT,
  icms_rate     NUMERIC(14, 4) NOT NULL DEFAULT 0,
  ipi_rate      NUMERIC(14, 4) NOT NULL DEFAULT 0,
  description   TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  status        TEXT NOT NULL DEFAULT 'ativo',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tax_rules_tenant_id ON public.tax_rules (tenant_id);
CREATE INDEX idx_tax_rules_product_id ON public.tax_rules (product_id);
CREATE INDEX idx_tax_rules_state ON public.tax_rules (state);
CREATE INDEX idx_tax_rules_status ON public.tax_rules (status);

CREATE TRIGGER trg_tax_rules_updated_at
  BEFORE UPDATE ON public.tax_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- EXCHANGE_RATES — cotação de moeda (ex.: USD → BRL)
-- -----------------------------------------------------------------------------
CREATE TABLE public.exchange_rates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  from_currency   TEXT NOT NULL DEFAULT 'USD',
  to_currency     TEXT NOT NULL DEFAULT 'BRL',
  rate            NUMERIC(14, 4) NOT NULL,
  valid_from      DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until     DATE,
  status          TEXT NOT NULL DEFAULT 'ativo',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_exchange_rates_tenant_id ON public.exchange_rates (tenant_id);
CREATE INDEX idx_exchange_rates_status ON public.exchange_rates (status);
CREATE INDEX idx_exchange_rates_valid_from ON public.exchange_rates (valid_from);

CREATE TRIGGER trg_exchange_rates_updated_at
  BEFORE UPDATE ON public.exchange_rates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- CUSTOMERS — clientes
-- -----------------------------------------------------------------------------
CREATE TABLE public.customers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  seller_id           UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  company_name        TEXT NOT NULL,
  trade_name          TEXT,
  document            TEXT,
  document_type       TEXT CHECK (document_type IN ('cnpj', 'cpf') OR document_type IS NULL),
  segment             TEXT,
  purchase_potential  TEXT,
  email               TEXT,
  phone               TEXT,
  address_line        TEXT,
  address_number      TEXT,
  address_complement  TEXT,
  neighborhood        TEXT,
  city                TEXT,
  state               TEXT,
  zip_code            TEXT,
  country             TEXT NOT NULL DEFAULT 'BR',
  status              TEXT NOT NULL DEFAULT 'ativo',
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_customers_tenant_id ON public.customers (tenant_id);
CREATE INDEX idx_customers_seller_id ON public.customers (seller_id);
CREATE INDEX idx_customers_status ON public.customers (status);
CREATE INDEX idx_customers_city ON public.customers (city);
CREATE INDEX idx_customers_state ON public.customers (state);
CREATE INDEX idx_customers_company_name ON public.customers (company_name);
CREATE INDEX idx_customers_document ON public.customers (document);

CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- CUSTOMER_CONTACTS — contatos do cliente
-- -----------------------------------------------------------------------------
CREATE TABLE public.customer_contacts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  customer_id   UUID NOT NULL REFERENCES public.customers (id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  email         TEXT,
  phone         TEXT,
  mobile        TEXT,
  job_title     TEXT,
  is_primary    BOOLEAN NOT NULL DEFAULT false,
  status        TEXT NOT NULL DEFAULT 'ativo',
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_customer_contacts_tenant_id ON public.customer_contacts (tenant_id);
CREATE INDEX idx_customer_contacts_customer_id ON public.customer_contacts (customer_id);
CREATE INDEX idx_customer_contacts_status ON public.customer_contacts (status);

CREATE TRIGGER trg_customer_contacts_updated_at
  BEFORE UPDATE ON public.customer_contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- CARRIERS — transportadoras
-- -----------------------------------------------------------------------------
CREATE TABLE public.carriers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  cnpj          TEXT,
  email         TEXT,
  phone         TEXT,
  city          TEXT,
  state         TEXT,
  status        TEXT NOT NULL DEFAULT 'ativo',
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_carriers_tenant_id ON public.carriers (tenant_id);
CREATE INDEX idx_carriers_status ON public.carriers (status);
CREATE INDEX idx_carriers_city ON public.carriers (city);
CREATE INDEX idx_carriers_state ON public.carriers (state);

CREATE TRIGGER trg_carriers_updated_at
  BEFORE UPDATE ON public.carriers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- QUOTES — cotações comerciais
-- -----------------------------------------------------------------------------
CREATE TABLE public.quotes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  customer_id       UUID NOT NULL REFERENCES public.customers (id) ON DELETE RESTRICT,
  seller_id         UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  quote_number      TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'aberta',
  valid_until       DATE,
  subtotal          NUMERIC(14, 4) NOT NULL DEFAULT 0,
  discount_total    NUMERIC(14, 4) NOT NULL DEFAULT 0,
  icms_total        NUMERIC(14, 4) NOT NULL DEFAULT 0,
  ipi_total         NUMERIC(14, 4) NOT NULL DEFAULT 0,
  tax_total         NUMERIC(14, 4) NOT NULL DEFAULT 0,
  total             NUMERIC(14, 4) NOT NULL DEFAULT 0,
  customer_state    TEXT,
  notes             TEXT,
  internal_notes    TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT quotes_tenant_number_unique UNIQUE (tenant_id, quote_number)
);

CREATE INDEX idx_quotes_tenant_id ON public.quotes (tenant_id);
CREATE INDEX idx_quotes_customer_id ON public.quotes (customer_id);
CREATE INDEX idx_quotes_seller_id ON public.quotes (seller_id);
CREATE INDEX idx_quotes_status ON public.quotes (status);
CREATE INDEX idx_quotes_valid_until ON public.quotes (valid_until);

CREATE TRIGGER trg_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- QUOTE_ITEMS — itens da cotação
-- -----------------------------------------------------------------------------
CREATE TABLE public.quote_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  quote_id          UUID NOT NULL REFERENCES public.quotes (id) ON DELETE CASCADE,
  product_id        UUID NOT NULL REFERENCES public.products (id) ON DELETE RESTRICT,
  package_id        UUID REFERENCES public.product_packages (id) ON DELETE SET NULL,
  quantity          NUMERIC(14, 4) NOT NULL DEFAULT 1,
  unit_price        NUMERIC(14, 4) NOT NULL DEFAULT 0,
  min_price         NUMERIC(14, 4),
  max_price         NUMERIC(14, 4),
  discount_percent  NUMERIC(14, 4) NOT NULL DEFAULT 0,
  discount_amount   NUMERIC(14, 4) NOT NULL DEFAULT 0,
  icms_rate         NUMERIC(14, 4) NOT NULL DEFAULT 0,
  icms_amount       NUMERIC(14, 4) NOT NULL DEFAULT 0,
  ipi_rate          NUMERIC(14, 4) NOT NULL DEFAULT 0,
  ipi_amount        NUMERIC(14, 4) NOT NULL DEFAULT 0,
  line_subtotal     NUMERIC(14, 4) NOT NULL DEFAULT 0,
  line_total        NUMERIC(14, 4) NOT NULL DEFAULT 0,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_quote_items_tenant_id ON public.quote_items (tenant_id);
CREATE INDEX idx_quote_items_quote_id ON public.quote_items (quote_id);
CREATE INDEX idx_quote_items_product_id ON public.quote_items (product_id);

CREATE TRIGGER trg_quote_items_updated_at
  BEFORE UPDATE ON public.quote_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- ORDERS — pedidos
-- -----------------------------------------------------------------------------
CREATE TABLE public.orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  quote_id          UUID REFERENCES public.quotes (id) ON DELETE SET NULL,
  customer_id       UUID NOT NULL REFERENCES public.customers (id) ON DELETE RESTRICT,
  seller_id         UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  carrier_id        UUID REFERENCES public.carriers (id) ON DELETE SET NULL,
  order_number      TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'criado',
  payment_terms     TEXT,
  payment_method    TEXT,
  subtotal          NUMERIC(14, 4) NOT NULL DEFAULT 0,
  discount_total    NUMERIC(14, 4) NOT NULL DEFAULT 0,
  icms_total        NUMERIC(14, 4) NOT NULL DEFAULT 0,
  ipi_total         NUMERIC(14, 4) NOT NULL DEFAULT 0,
  tax_total         NUMERIC(14, 4) NOT NULL DEFAULT 0,
  total             NUMERIC(14, 4) NOT NULL DEFAULT 0,
  ordered_at        TIMESTAMPTZ,
  invoiced_at       TIMESTAMPTZ,
  cancelled_at      TIMESTAMPTZ,
  notes             TEXT,
  internal_notes    TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT orders_tenant_number_unique UNIQUE (tenant_id, order_number)
);

CREATE INDEX idx_orders_tenant_id ON public.orders (tenant_id);
CREATE INDEX idx_orders_quote_id ON public.orders (quote_id);
CREATE INDEX idx_orders_customer_id ON public.orders (customer_id);
CREATE INDEX idx_orders_seller_id ON public.orders (seller_id);
CREATE INDEX idx_orders_carrier_id ON public.orders (carrier_id);
CREATE INDEX idx_orders_status ON public.orders (status);

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- ORDER_ITEMS — itens do pedido
-- -----------------------------------------------------------------------------
CREATE TABLE public.order_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  order_id          UUID NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  product_id        UUID NOT NULL REFERENCES public.products (id) ON DELETE RESTRICT,
  package_id        UUID REFERENCES public.product_packages (id) ON DELETE SET NULL,
  quote_item_id     UUID REFERENCES public.quote_items (id) ON DELETE SET NULL,
  quantity          NUMERIC(14, 4) NOT NULL DEFAULT 1,
  unit_price        NUMERIC(14, 4) NOT NULL DEFAULT 0,
  discount_percent  NUMERIC(14, 4) NOT NULL DEFAULT 0,
  discount_amount   NUMERIC(14, 4) NOT NULL DEFAULT 0,
  icms_rate         NUMERIC(14, 4) NOT NULL DEFAULT 0,
  icms_amount       NUMERIC(14, 4) NOT NULL DEFAULT 0,
  ipi_rate          NUMERIC(14, 4) NOT NULL DEFAULT 0,
  ipi_amount        NUMERIC(14, 4) NOT NULL DEFAULT 0,
  line_subtotal     NUMERIC(14, 4) NOT NULL DEFAULT 0,
  line_total        NUMERIC(14, 4) NOT NULL DEFAULT 0,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_items_tenant_id ON public.order_items (tenant_id);
CREATE INDEX idx_order_items_order_id ON public.order_items (order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items (product_id);

CREATE TRIGGER trg_order_items_updated_at
  BEFORE UPDATE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- SAMPLES — envio de amostras
-- -----------------------------------------------------------------------------
CREATE TABLE public.samples (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  customer_id       UUID NOT NULL REFERENCES public.customers (id) ON DELETE RESTRICT,
  seller_id         UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  sample_number     TEXT,
  status            TEXT NOT NULL DEFAULT 'pendente',
  sent_at           TIMESTAMPTZ,
  delivered_at      TIMESTAMPTZ,
  feedback          TEXT,
  feedback_at       TIMESTAMPTZ,
  follow_up_date    DATE,
  auto_follow_up    BOOLEAN NOT NULL DEFAULT true,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_samples_tenant_id ON public.samples (tenant_id);
CREATE INDEX idx_samples_customer_id ON public.samples (customer_id);
CREATE INDEX idx_samples_seller_id ON public.samples (seller_id);
CREATE INDEX idx_samples_status ON public.samples (status);
CREATE INDEX idx_samples_follow_up_date ON public.samples (follow_up_date);

CREATE TRIGGER trg_samples_updated_at
  BEFORE UPDATE ON public.samples
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- SAMPLE_ITEMS — produtos enviados na amostra
-- -----------------------------------------------------------------------------
CREATE TABLE public.sample_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  sample_id     UUID NOT NULL REFERENCES public.samples (id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES public.products (id) ON DELETE RESTRICT,
  package_id    UUID REFERENCES public.product_packages (id) ON DELETE SET NULL,
  quantity      NUMERIC(14, 4) NOT NULL DEFAULT 1,
  status        TEXT NOT NULL DEFAULT 'enviado',
  feedback      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sample_items_tenant_id ON public.sample_items (tenant_id);
CREATE INDEX idx_sample_items_sample_id ON public.sample_items (sample_id);
CREATE INDEX idx_sample_items_product_id ON public.sample_items (product_id);
CREATE INDEX idx_sample_items_status ON public.sample_items (status);

CREATE TRIGGER trg_sample_items_updated_at
  BEFORE UPDATE ON public.sample_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- VISITS — visitas comerciais
-- -----------------------------------------------------------------------------
CREATE TABLE public.visits (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  customer_id           UUID NOT NULL REFERENCES public.customers (id) ON DELETE RESTRICT,
  seller_id             UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  route_id              UUID,
  visited_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  products_of_interest  TEXT,
  conversation_summary  TEXT,
  next_action           TEXT,
  next_action_date      DATE,
  status                TEXT NOT NULL DEFAULT 'realizada',
  city                  TEXT,
  state                 TEXT,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_visits_tenant_id ON public.visits (tenant_id);
CREATE INDEX idx_visits_customer_id ON public.visits (customer_id);
CREATE INDEX idx_visits_seller_id ON public.visits (seller_id);
CREATE INDEX idx_visits_status ON public.visits (status);
CREATE INDEX idx_visits_city ON public.visits (city);
CREATE INDEX idx_visits_state ON public.visits (state);
CREATE INDEX idx_visits_visited_at ON public.visits (visited_at);
CREATE INDEX idx_visits_next_action_date ON public.visits (next_action_date);

CREATE TRIGGER trg_visits_updated_at
  BEFORE UPDATE ON public.visits
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- ROUTES — planejamento de rotas de visita
-- -----------------------------------------------------------------------------
CREATE TABLE public.routes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  seller_id     UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  polo          TEXT,
  city          TEXT,
  state         TEXT,
  priority      TEXT NOT NULL DEFAULT 'normal',
  status        TEXT NOT NULL DEFAULT 'planejada',
  planned_date  DATE,
  started_at    TIMESTAMPTZ,
  finished_at   TIMESTAMPTZ,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_routes_tenant_id ON public.routes (tenant_id);
CREATE INDEX idx_routes_seller_id ON public.routes (seller_id);
CREATE INDEX idx_routes_status ON public.routes (status);
CREATE INDEX idx_routes_city ON public.routes (city);
CREATE INDEX idx_routes_state ON public.routes (state);
CREATE INDEX idx_routes_planned_date ON public.routes (planned_date);
CREATE INDEX idx_routes_priority ON public.routes (priority);

CREATE TRIGGER trg_routes_updated_at
  BEFORE UPDATE ON public.routes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- FK de visits.route_id (criada após routes existir)
ALTER TABLE public.visits
  ADD CONSTRAINT visits_route_id_fkey
  FOREIGN KEY (route_id) REFERENCES public.routes (id) ON DELETE SET NULL;

CREATE INDEX idx_visits_route_id ON public.visits (route_id);

-- -----------------------------------------------------------------------------
-- ROUTE_STOPS — paradas da rota (clientes na ordem de visita)
-- -----------------------------------------------------------------------------
CREATE TABLE public.route_stops (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  route_id      UUID NOT NULL REFERENCES public.routes (id) ON DELETE CASCADE,
  customer_id   UUID NOT NULL REFERENCES public.customers (id) ON DELETE RESTRICT,
  visit_id      UUID REFERENCES public.visits (id) ON DELETE SET NULL,
  stop_order    INTEGER NOT NULL DEFAULT 1,
  priority      TEXT NOT NULL DEFAULT 'normal',
  status        TEXT NOT NULL DEFAULT 'pendente',
  planned_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  city          TEXT,
  state         TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_route_stops_tenant_id ON public.route_stops (tenant_id);
CREATE INDEX idx_route_stops_route_id ON public.route_stops (route_id);
CREATE INDEX idx_route_stops_customer_id ON public.route_stops (customer_id);
CREATE INDEX idx_route_stops_visit_id ON public.route_stops (visit_id);
CREATE INDEX idx_route_stops_status ON public.route_stops (status);
CREATE INDEX idx_route_stops_city ON public.route_stops (city);
CREATE INDEX idx_route_stops_state ON public.route_stops (state);

CREATE TRIGGER trg_route_stops_updated_at
  BEFORE UPDATE ON public.route_stops
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- FOLLOWUPS — acompanhamentos automáticos ou manuais
-- -----------------------------------------------------------------------------
CREATE TABLE public.followups (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  customer_id     UUID REFERENCES public.customers (id) ON DELETE CASCADE,
  seller_id       UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  related_type    TEXT NOT NULL,
  related_id      UUID NOT NULL,
  title           TEXT,
  due_at          TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'pendente',
  notes           TEXT,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_followups_tenant_id ON public.followups (tenant_id);
CREATE INDEX idx_followups_customer_id ON public.followups (customer_id);
CREATE INDEX idx_followups_seller_id ON public.followups (seller_id);
CREATE INDEX idx_followups_status ON public.followups (status);
CREATE INDEX idx_followups_due_at ON public.followups (due_at);
CREATE INDEX idx_followups_related ON public.followups (related_type, related_id);

CREATE TRIGGER trg_followups_updated_at
  BEFORE UPDATE ON public.followups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- COMMISSIONS — comissões de vendedores
-- Regra de negócio: cotação não gera; pedido cria prevista; faturado libera; cancelado cancela
-- -----------------------------------------------------------------------------
CREATE TABLE public.commissions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  seller_id           UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  order_id            UUID NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  quote_id            UUID REFERENCES public.quotes (id) ON DELETE SET NULL,
  status              TEXT NOT NULL DEFAULT 'prevista',
  commission_rate     NUMERIC(14, 4) NOT NULL DEFAULT 0,
  commission_base     NUMERIC(14, 4) NOT NULL DEFAULT 0,
  commission_amount   NUMERIC(14, 4) NOT NULL DEFAULT 0,
  expected_at         TIMESTAMPTZ,
  released_at         TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_commissions_tenant_id ON public.commissions (tenant_id);
CREATE INDEX idx_commissions_seller_id ON public.commissions (seller_id);
CREATE INDEX idx_commissions_order_id ON public.commissions (order_id);
CREATE INDEX idx_commissions_status ON public.commissions (status);

CREATE TRIGGER trg_commissions_updated_at
  BEFORE UPDATE ON public.commissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- PAYMENT_ACCOUNTS — contas bancárias / meios de recebimento do tenant
-- -----------------------------------------------------------------------------
CREATE TABLE public.payment_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  account_type    TEXT NOT NULL DEFAULT 'banco',
  bank_code       TEXT,
  bank_name       TEXT,
  agency          TEXT,
  account_number  TEXT,
  pix_key         TEXT,
  holder_name     TEXT,
  holder_document TEXT,
  is_default      BOOLEAN NOT NULL DEFAULT false,
  status          TEXT NOT NULL DEFAULT 'ativo',
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_accounts_tenant_id ON public.payment_accounts (tenant_id);
CREATE INDEX idx_payment_accounts_status ON public.payment_accounts (status);

CREATE TRIGGER trg_payment_accounts_updated_at
  BEFORE UPDATE ON public.payment_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- ATTACHMENTS — arquivos anexados (PDFs, planilhas, imagens)
-- -----------------------------------------------------------------------------
CREATE TABLE public.attachments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  uploaded_by   UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  entity_type   TEXT NOT NULL,
  entity_id     UUID NOT NULL,
  file_name     TEXT NOT NULL,
  file_path     TEXT NOT NULL,
  mime_type     TEXT,
  file_size     BIGINT,
  status        TEXT NOT NULL DEFAULT 'ativo',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_attachments_tenant_id ON public.attachments (tenant_id);
CREATE INDEX idx_attachments_uploaded_by ON public.attachments (uploaded_by);
CREATE INDEX idx_attachments_entity ON public.attachments (entity_type, entity_id);
CREATE INDEX idx_attachments_status ON public.attachments (status);

CREATE TRIGGER trg_attachments_updated_at
  BEFORE UPDATE ON public.attachments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- AUDIT_LOGS — trilha de auditoria (somente created_at)
-- -----------------------------------------------------------------------------
CREATE TABLE public.audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  user_id       UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  action        TEXT NOT NULL,
  entity_type   TEXT NOT NULL,
  entity_id     UUID,
  old_data      JSONB,
  new_data      JSONB,
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_tenant_id ON public.audit_logs (tenant_id);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs (user_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs (action);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs (created_at);

-- =============================================================================
-- FIM DO SCHEMA INICIAL
-- RLS: intencionalmente NÃO habilitado nesta migration.
-- =============================================================================
