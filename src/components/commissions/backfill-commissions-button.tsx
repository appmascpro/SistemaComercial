"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { backfillCommissionsAction } from "@/app/actions/commissions";
import { Button } from "@/components/ui/button";

export function BackfillCommissionsButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  function handleClick() {
    if (
      !window.confirm(
        "Gerar ou recalcular comissões para todos os pedidos existentes? Comissões já pagas não serão alteradas."
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await backfillCommissionsAction();
      if (result.error) {
        setFeedback({ type: "error", message: result.error });
        return;
      }
      setFeedback({
        type: "success",
        message: result.success ?? "Comissões geradas.",
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={isPending}
        onClick={handleClick}
      >
        {isPending ? "Gerando comissões…" : "Gerar comissões dos pedidos"}
      </Button>
      {feedback ? (
        <p
          className={`text-sm ${
            feedback.type === "error" ? "text-red-700" : "text-emerald-700"
          }`}
        >
          {feedback.message}
        </p>
      ) : (
        <p className="text-xs text-slate-500">
          Use para pedidos antigos que ainda não tinham comissão. Cotações sem
          pedido não geram comissão.
        </p>
      )}
    </div>
  );
}
