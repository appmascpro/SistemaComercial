"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { StatusItem, type ConnectionStatus } from "./status-item";

export function BrowserClientStatus() {
  const [status, setStatus] = useState<ConnectionStatus>("loading");
  const [detail, setDetail] = useState<string>();

  useEffect(() => {
    let cancelled = false;

    async function verifyBrowserClient() {
      try {
        const supabase = createClient();
        const { error } = await supabase.auth.getSession();

        if (cancelled) return;

        if (error) {
          setStatus("error");
          setDetail(error.message);
          return;
        }

        setStatus("ok");
        setDetail("Cliente do navegador criado e respondendo.");
      } catch (error) {
        if (cancelled) return;
        setStatus("error");
        setDetail(
          error instanceof Error ? error.message : "Falha ao inicializar cliente."
        );
      }
    }

    verifyBrowserClient();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <StatusItem
      label="Cliente navegador"
      description="createClient() em src/lib/supabase/client.ts"
      status={status}
      detail={detail}
    />
  );
}
