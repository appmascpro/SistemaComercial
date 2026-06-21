import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BrowserClientStatus } from "@/components/supabase/browser-client-status";
import { StatusItem } from "@/components/supabase/status-item";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getSupabaseProjectRef,
  getSupabasePublicEnv,
  getSupabaseAdminEnv,
} from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { Database } from "lucide-react";

type CheckResult = {
  status: "ok" | "error";
  detail: string;
};

async function getServerChecks() {
  const publicEnv = getSupabasePublicEnv();
  const adminEnv = getSupabaseAdminEnv();

  const checks: {
    publicEnv: CheckResult;
    serverClient: CheckResult;
    adminClient: CheckResult;
  } = {
    publicEnv: {
      status: publicEnv.ok ? "ok" : "error",
      detail: publicEnv.ok
        ? `Projeto: ${getSupabaseProjectRef(publicEnv.url)}`
        : `Ausentes: ${publicEnv.missing.join(", ")}`,
    },
    serverClient: {
      status: "error",
      detail: "Não verificado",
    },
    adminClient: {
      status: "error",
      detail: "Não verificado",
    },
  };

  if (!publicEnv.ok) {
    return checks;
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.getSession();
    checks.serverClient = {
      status: error ? "error" : "ok",
      detail: error
        ? error.message
        : "Cliente servidor criado e respondendo.",
    };
  } catch (error) {
    checks.serverClient = {
      status: "error",
      detail:
        error instanceof Error ? error.message : "Falha ao inicializar cliente.",
    };
  }

  if (!adminEnv.ok) {
    checks.adminClient = {
      status: "error",
      detail: `Ausentes: ${adminEnv.missing.join(", ")}`,
    };
    return checks;
  }

  try {
    createAdminClient();
    checks.adminClient = {
      status: "ok",
      detail:
        "Cliente admin disponível apenas no servidor (service role não exposta).",
    };
  } catch (error) {
    checks.adminClient = {
      status: "error",
      detail:
        error instanceof Error ? error.message : "Falha ao inicializar admin.",
    };
  }

  return checks;
}

export default async function SupabaseDashboardPage() {
  const checks = await getServerChecks();
  const allOk =
    checks.publicEnv.status === "ok" &&
    checks.serverClient.status === "ok" &&
    checks.adminClient.status === "ok";

  return (
    <div>
      <PageHeader
        title="Status do Supabase"
        description="Verificação visual da leitura das variáveis de ambiente e inicialização dos clientes."
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-brand-600" />
            <CardTitle>Conexão com Supabase</CardTitle>
          </div>
          <CardDescription>
            Nenhuma chave é exibida nesta página — apenas o status de cada
            cliente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <StatusItem
            label="Variáveis públicas"
            description="NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY"
            status={checks.publicEnv.status}
            detail={checks.publicEnv.detail}
          />

          <StatusItem
            label="Cliente servidor"
            description="createClient() em src/lib/supabase/server.ts"
            status={checks.serverClient.status}
            detail={checks.serverClient.detail}
          />

          <StatusItem
            label="Cliente admin"
            description="createAdminClient() em src/lib/supabase/admin.ts (somente backend)"
            status={checks.adminClient.status}
            detail={checks.adminClient.detail}
          />

          <BrowserClientStatus />

          <div
            className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
              allOk
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            {allOk
              ? "Todos os clientes Supabase foram inicializados com sucesso."
              : "Alguns itens precisam de atenção. Confira o .env.local e reinicie o servidor."}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
