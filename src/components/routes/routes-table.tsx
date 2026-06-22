import Link from "next/link";
import { formatDate } from "@/lib/utils";
import type { RouteListItem } from "@/types/route";

const statusStyles: Record<string, string> = {
  planejada: "bg-slate-100 text-slate-600",
  em_andamento: "bg-blue-50 text-blue-700",
  concluida: "bg-emerald-50 text-emerald-700",
  cancelada: "bg-red-50 text-red-700",
};

export function RoutesTable({ routes }: { routes: RouteListItem[] }) {
  if (routes.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-slate-500">
        Nenhuma rota planejada.{" "}
        <Link href="/rotas/nova" className="text-brand-600 hover:underline">
          Criar primeira rota
        </Link>
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-300">
      <table className="min-w-full divide-y divide-slate-300 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-slate-600">Rota</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">Polo / Local</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">Semana</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">Data</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">Progresso</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">Status</th>
            <th className="px-3 py-2 text-right font-medium text-slate-600">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-300 bg-white">
          {routes.map((route) => (
            <tr key={route.id} className="hover:bg-slate-50/80">
              <td className="px-3 py-2 font-medium">{route.name}</td>
              <td className="px-3 py-2 text-slate-600">
                {[route.polo, route.city, route.state].filter(Boolean).join(" · ") ||
                  "—"}
              </td>
              <td className="px-3 py-2 text-slate-600">
                {route.week_number ? `Sem. ${route.week_number}` : "—"}
              </td>
              <td className="px-3 py-2 text-slate-600">
                {route.planned_date ? formatDate(route.planned_date) : "—"}
              </td>
              <td className="px-3 py-2 text-slate-600">
                {route.visited_count}/{route.stops_count}
              </td>
              <td className="px-3 py-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                    statusStyles[route.status] ?? "bg-slate-100"
                  }`}
                >
                  {route.status.replace("_", " ")}
                </span>
              </td>
              <td className="px-3 py-2 text-right">
                <Link
                  href={`/rotas/${route.id}`}
                  className="text-xs font-medium text-brand-600 hover:underline"
                >
                  Executar
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
