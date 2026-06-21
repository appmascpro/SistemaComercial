"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ShoppingCart } from "lucide-react";
import { createOrderFromQuoteAction } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";

interface ConvertQuoteButtonProps {
  quoteId: string;
  existingOrderId?: string | null;
  existingOrderNumber?: string | null;
}

export function ConvertQuoteButton({
  quoteId,
  existingOrderId,
  existingOrderNumber,
}: ConvertQuoteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (existingOrderId) {
    return (
      <Link
        href={`/pedidos/${existingOrderId}`}
        className="inline-flex h-8 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
      >
        <ShoppingCart className="h-4 w-4" />
        Pedido {existingOrderNumber}
      </Link>
    );
  }

  function handleConvert() {
    startTransition(async () => {
      const result = await createOrderFromQuoteAction(quoteId);
      if (result.orderId) {
        router.push(`/pedidos/${result.orderId}`);
      } else if (result.error) {
        alert(result.error);
      }
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleConvert}
      disabled={isPending}
    >
      <ShoppingCart className="h-4 w-4" />
      {isPending ? "Convertendo..." : "Converter em pedido"}
    </Button>
  );
}
