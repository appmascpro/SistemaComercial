export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  created_at: string;
}

export interface TenantScoped {
  tenant_id: string;
}
