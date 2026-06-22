"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { markCommissionPaidAction } from "@/app/actions/commissions";
import { Button } from "@/components/ui/button";

export function MarkCommissionPaidButton({
  commissionId,
}: {
  commissionId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm("Marcar esta comissão como paga?")) return;

    startTransition(async () => {
      const result = await markCommissionPaidAction(commissionId);
      if (result.error) {
        alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant="primary"
      size="sm"
      disabled={isPending}
      onClick={handleClick}
    >
      {isPending ? "Salvando…" : "Marcar como paga"}
    </Button>
  );
}
