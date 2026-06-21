"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updateRouteStopStatusAction } from "@/app/actions/routes";
import type { RouteStopStatus } from "@/types/route";

export function RouteStopStatusButton({
  stopId,
  routeId,
  currentStatus,
}: {
  stopId: string;
  routeId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function markVisited() {
    startTransition(async () => {
      const result = await updateRouteStopStatusAction(
        stopId,
        routeId,
        "visitado"
      );
      if (result.error) alert(result.error);
      else router.refresh();
    });
  }

  if (currentStatus === "visitado") {
    return (
      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
        Visitado
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={markVisited}
      className="rounded-lg border border-brand-200 bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100 disabled:opacity-50"
    >
      {isPending ? "..." : "Marcar visitado"}
    </button>
  );
}
