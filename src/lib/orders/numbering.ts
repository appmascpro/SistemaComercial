import { createTenantClient } from "@/lib/supabase/tenant-db";

export async function generateOrderNumber(): Promise<string> {
  const { supabase, tenantId } = await createTenantClient();
  const year = new Date().getFullYear();
  const prefix = `PED-${year}-`;

  const { count, error } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .like("order_number", `${prefix}%`);

  if (error) throw new Error(error.message);

  const next = (count ?? 0) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}
