"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updateSampleStatusAction } from "@/app/actions/samples";
import {
  SAMPLE_STATUS_LABELS,
  type SampleStatus,
} from "@/types/sample";

const STATUS_OPTIONS = (
  Object.entries(SAMPLE_STATUS_LABELS) as [SampleStatus, string][]
).map(([value, label]) => ({ value, label }));

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

  const normalizedStatus =
    currentStatus === "enviada"
      ? "enviado"
      : currentStatus === "entregue"
        ? "recebido"
        : currentStatus === "feedback_recebido"
          ? "testando"
          : currentStatus;

  return (
    <select
      value={normalizedStatus}
      disabled={isPending}
      onChange={(e) => handleChange(e.target.value as SampleStatus)}
      className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm disabled:opacity-50"
    >
      {STATUS_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
