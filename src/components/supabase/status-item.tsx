import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

export type ConnectionStatus = "ok" | "error" | "loading";

interface StatusItemProps {
  label: string;
  description: string;
  status: ConnectionStatus;
  detail?: string;
}

const statusConfig = {
  ok: {
    icon: CheckCircle2,
    label: "Conectado",
    className: "text-emerald-600 bg-emerald-50 border-emerald-200",
    iconClassName: "text-emerald-600",
  },
  error: {
    icon: XCircle,
    label: "Erro",
    className: "text-red-600 bg-red-50 border-red-200",
    iconClassName: "text-red-600",
  },
  loading: {
    icon: Loader2,
    label: "Verificando",
    className: "text-amber-600 bg-amber-50 border-amber-200",
    iconClassName: "text-amber-600 animate-spin",
  },
};

export function StatusItem({
  label,
  description,
  status,
  detail,
}: StatusItemProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-slate-100 bg-slate-50/50 p-4">
      <div className="min-w-0">
        <p className="font-medium text-slate-900">{label}</p>
        <p className="mt-0.5 text-sm text-slate-500">{description}</p>
        {detail && (
          <p className="mt-2 text-xs text-slate-400">{detail}</p>
        )}
      </div>
      <div
        className={cn(
          "flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
          config.className
        )}
      >
        <Icon className={cn("h-3.5 w-3.5", config.iconClassName)} />
        {config.label}
      </div>
    </div>
  );
}
