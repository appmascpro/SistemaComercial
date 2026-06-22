"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/session";
import { createTenantClient } from "@/lib/supabase/tenant-db";
import type {
  RouteFormInput,
  RouteStatus,
  RouteStopStatus,
} from "@/types/route";

export interface RouteActionState {
  error?: string;
  success?: string;
  routeId?: string;
}

function normalizeStopPriority(value?: string): "A" | "B" | "C" {
  if (value === "A" || value === "B" || value === "C") return value;
  return "B";
}

export async function createRouteAction(
  input: RouteFormInput
): Promise<RouteActionState> {
  try {
    if (!input.name.trim()) {
      return { error: "Informe o nome da rota." };
    }
    if (!input.stops.length) {
      return { error: "Adicione ao menos um cliente à rota." };
    }

    const profile = await requireProfile();
    const { supabase, tenantId } = await createTenantClient();

    const customerIds = [...new Set(input.stops.map((s) => s.customer_id))];
    const { data: customerRows } = await supabase
      .from("customers")
      .select("id, city, state")
      .in("id", customerIds);

    const customerMap = new Map(
      (customerRows ?? []).map((row) => [row.id, row] as const)
    );

    const { data: route, error: routeError } = await supabase
      .from("routes")
      .insert({
        tenant_id: tenantId,
        seller_id: profile.id,
        name: input.name.trim(),
        polo: input.polo?.trim() || null,
        city: input.city?.trim() || null,
        state: input.state?.trim().toUpperCase() || null,
        week_number: input.week_number ?? null,
        planned_date: input.planned_date || null,
        priority: "normal",
        status: "planejada",
        notes: input.notes?.trim() || null,
      })
      .select("id")
      .single();

    if (routeError || !route) {
      throw new Error(routeError?.message ?? "Erro ao criar rota.");
    }

    const stops = input.stops.map((stop) => {
      const customer = customerMap.get(stop.customer_id);
      return {
        tenant_id: tenantId,
        route_id: route.id,
        customer_id: stop.customer_id,
        stop_order: stop.stop_order,
        priority: normalizeStopPriority(stop.priority),
        status: "planejado" as const,
        planned_at: stop.planned_at || null,
        city: customer?.city ?? null,
        state: customer?.state ?? null,
        notes: stop.notes?.trim() || null,
      };
    });

    const { error: stopsError } = await supabase.from("route_stops").insert(stops);

    if (stopsError) {
      await supabase.from("routes").delete().eq("id", route.id);
      throw new Error(stopsError.message);
    }

    revalidatePath("/");
    revalidatePath("/rotas");
    revalidatePath("/rotas/hoje");
    return { success: "Rota criada com sucesso.", routeId: route.id };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Não foi possível salvar a rota.",
    };
  }
}

export async function updateRouteStatusAction(
  routeId: string,
  status: RouteStatus
): Promise<RouteActionState> {
  try {
    const { supabase } = await createTenantClient();
    const now = new Date().toISOString();
    const patch: Record<string, unknown> = { status };

    if (status === "em_andamento") patch.started_at = now;
    if (status === "concluida") patch.finished_at = now;

    const { error } = await supabase.from("routes").update(patch).eq("id", routeId);

    if (error) throw new Error(error.message);

    revalidatePath("/");
    revalidatePath("/rotas");
    revalidatePath("/rotas/hoje");
    revalidatePath(`/rotas/${routeId}`);

    return { success: "Status da rota atualizado." };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Não foi possível atualizar a rota.",
    };
  }
}

export async function updateRouteStopStatusAction(
  stopId: string,
  routeId: string,
  status: RouteStopStatus
): Promise<RouteActionState> {
  try {
    const { supabase } = await createTenantClient();
    const patch: Record<string, unknown> = { status };

    if (status === "visitado") {
      patch.completed_at = new Date().toISOString();
    }
    if (status === "planejado" || status === "reagendar") {
      patch.completed_at = null;
      patch.visit_id = null;
    }

    const { error } = await supabase
      .from("route_stops")
      .update(patch)
      .eq("id", stopId);

    if (error) throw new Error(error.message);

    revalidatePath(`/rotas/${routeId}`);
    revalidatePath("/rotas/hoje");
    return { success: "Parada atualizada." };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Não foi possível atualizar a parada.",
    };
  }
}

export async function rescheduleRouteStopAction(
  stopId: string,
  routeId: string,
  nextDate: string
): Promise<RouteActionState> {
  try {
    const { supabase } = await createTenantClient();

    const { data: stop, error: stopError } = await supabase
      .from("route_stops")
      .select("customer_id")
      .eq("id", stopId)
      .maybeSingle();

    if (stopError || !stop) {
      return { error: "Parada não encontrada." };
    }

    await supabase
      .from("route_stops")
      .update({
        status: "reagendar",
        planned_at: `${nextDate}T09:00:00`,
      })
      .eq("id", stopId);

    await supabase
      .from("customers")
      .update({ next_visit_at: nextDate })
      .eq("id", stop.customer_id);

    revalidatePath(`/rotas/${routeId}`);
    revalidatePath("/rotas/hoje");
    revalidatePath(`/clientes/${stop.customer_id}`);

    return { success: "Visita reagendada." };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Não foi possível reagendar.",
    };
  }
}
