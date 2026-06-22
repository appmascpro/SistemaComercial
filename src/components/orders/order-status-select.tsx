"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updateOrderStatusAction } from "@/app/actions/orders";
import type { OrderStatus } from "@/types/order";

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "criado", label: "Criado" },
  { value: "confirmado", label: "Confirmado" },
  { value: "parcial", label: "Parcialmente atendido" },
  { value: "faturado", label: "Faturado" },
  { value: "cancelado", label: "Cancelado" },
];

function parseInvoicedAmount(raw: string): number | null {
  const normalized = raw.trim().replace(/\./g, "").replace(",", ".");
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

export function OrderStatusSelect({
  orderId,
  currentStatus,
  orderTotal,
}: {
  orderId: string;
  currentStatus: string;
  orderTotal?: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(status: OrderStatus) {
    let invoicedAmount: number | undefined;

    if (status === "parcial") {
      const hint =
        orderTotal != null
          ? `Informe o valor já faturado (total do pedido: R$ ${orderTotal.toFixed(2).replace(".", ",")}):`
          : "Informe o valor já faturado (R$):";
      const raw = window.prompt(hint);
      if (!raw) return;

      const parsed = parseInvoicedAmount(raw);
      if (parsed == null) {
        alert("Valor faturado inválido.");
        return;
      }
      invoicedAmount = parsed;
    }

    startTransition(async () => {
      const result = await updateOrderStatusAction(
        orderId,
        status,
        invoicedAmount != null ? { invoicedAmount } : undefined
      );
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
