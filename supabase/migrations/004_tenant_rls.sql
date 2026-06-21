-- -----------------------------------------------------------------------------
-- RLS multi-tenant — isolamento por tenant_id via profiles
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.auth_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id
  FROM public.profiles
  WHERE id = auth.uid()
    AND is_active = true
$$;

REVOKE ALL ON FUNCTION public.auth_tenant_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auth_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.auth_tenant_id() TO service_role;

-- tenants: usuário só vê o próprio tenant
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenants_select_own ON public.tenants;
CREATE POLICY tenants_select_own ON public.tenants
  FOR SELECT
  USING (id = public.auth_tenant_id());

-- profiles (003 pode já ter rodado — garante policies)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Helper: aplica RLS padrão em tabelas com tenant_id
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'companies',
    'products',
    'product_packages',
    'product_prices',
    'product_imports',
    'tax_rules',
    'exchange_rates',
    'customers',
    'customer_contacts',
    'carriers',
    'quotes',
    'quote_items',
    'orders',
    'order_items',
    'samples',
    'sample_items',
    'visits',
    'routes',
    'route_stops',
    'followups',
    'commissions',
    'payment_accounts',
    'attachments',
    'audit_logs'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);

    EXECUTE format('DROP POLICY IF EXISTS %I_tenant_all ON public.%I', tbl, tbl);
    EXECUTE format(
      'CREATE POLICY %I_tenant_all ON public.%I FOR ALL
       USING (tenant_id = public.auth_tenant_id())
       WITH CHECK (tenant_id = public.auth_tenant_id())',
      tbl,
      tbl
    );
  END LOOP;
END $$;
