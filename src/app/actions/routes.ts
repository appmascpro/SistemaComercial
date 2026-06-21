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

    const { data: route, error: routeError } = await supabase
      .from("routes")
      .insert({
        tenant_id: tenantId,
        seller_id: profile.id,
        name: input.name.trim(),
        polo: input.polo?.trim() || null,
        city: input.city?.trim() || null,
        state: input.state?.trim().toUpperCase() || null,
        planned_date: input.planned_date || null,
        priority: input.priority ?? "normal",
        status: "planejada",
        notes: input.notes?.trim() || null,
      })
      .select("id")
      .single();

    if (routeError || !route) {
      throw new Error(routeError?.message ?? "Erro ao criar rota.");
    }

    const stops = input.stops.map((stop) => ({
      tenant_id: tenantId,
      route_id: route.id,
      customer_id: stop.customer_id,
      stop_order: stop.stop_order,
      priority: stop.priority ?? "normal",
      status: "pendente" as const,
      notes: stop.notes?.trim() || null,
    }));

    const { error: stopsError } = await supabase.from("route_stops").insert(stops);

    if (stopsError) {
      await supabase.from("routes").delete().eq("id", route.id);
      throw new Error(stopsError.message);
    }

    revalidatePath("/");
    revalidatePath("/rotas");
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

    const { error } = await supabase
      .from("route_stops")
      .update(patch)
      .eq("id", stopId);

    if (error) throw new Error(error.message);

    revalidatePath(`/rotas/${routeId}`);
    return { success: "Parada atualizada." };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Não foi possível atualizar a parada.",
    };
  }
}
