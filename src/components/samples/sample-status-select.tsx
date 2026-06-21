"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updateSampleStatusAction } from "@/app/actions/samples";
import type { SampleStatus } from "@/types/sample";

const STATUS_OPTIONS: { value: SampleStatus; label: string }[] = [
  { value: "pendente", label: "Pendente" },
  { value: "enviada", label: "Enviada" },
  { value: "entregue", label: "Entregue" },
  { value: "feedback_recebido", label: "Feedback recebido" },
  { value: "cancelada", label: "Cancelada" },
];

export function SampleStatusSelect({
  sampleId,
  currentStatus,
}: {
  sampleId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(status: SampleStatus) {
    startTransition(async () => {
      const result = await updateSampleStatusAction(sampleId, status);
      if (result.error) alert(result.error);
      else router.refresh();
    });
  }

  return (
    <select
      value={currentStatus}
      disabled={isPending}
      onChange={(e) => handleChange(e.target.value as SampleStatus)}
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
