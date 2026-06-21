"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updateOrderStatusAction } from "@/app/actions/orders";
import type { OrderStatus } from "@/types/order";

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "criado", label: "Criado" },
  { value: "confirmado", label: "Confirmado" },
  { value: "faturado", label: "Faturado" },
  { value: "cancelado", label: "Cancelado" },
];

export function OrderStatusSelect({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(status: OrderStatus) {
    startTransition(async () => {
      const result = await updateOrderStatusAction(orderId, status);
      if (result.error) {
        alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <select
      value={currentStatus}
      disabled={isPending}
      onChange={(e) => handleChange(e.target.value as OrderStatus)}
      className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm capitalize disabled:opacity-50"
    >
      {STATUS_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
