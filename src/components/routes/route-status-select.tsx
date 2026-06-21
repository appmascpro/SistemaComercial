"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updateRouteStatusAction } from "@/app/actions/routes";
import type { RouteStatus } from "@/types/route";

const STATUS_OPTIONS: { value: RouteStatus; label: string }[] = [
  { value: "planejada", label: "Planejada" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "concluida", label: "Concluída" },
  { value: "cancelada", label: "Cancelada" },
];

export function RouteStatusSelect({
  routeId,
  currentStatus,
}: {
  routeId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(status: RouteStatus) {
    startTransition(async () => {
      const result = await updateRouteStatusAction(routeId, status);
      if (result.error) alert(result.error);
      else router.refresh();
    });
  }

  return (
    <select
      value={currentStatus}
      disabled={isPending}
      onChange={(e) => handleChange(e.target.value as RouteStatus)}
      className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm capitalize disabled:opacity-50"
    >
      {STATUS_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
