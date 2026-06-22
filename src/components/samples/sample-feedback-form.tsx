"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateSampleFeedbackAction } from "@/app/actions/samples";
import { Button } from "@/components/ui/button";
import {
  SAMPLE_NEXT_ACTION_LABELS,
  SAMPLE_STATUS_LABELS,
  type SampleDetail,
  type SampleNextAction,
  type SampleStatus,
} from "@/types/sample";

export function SampleFeedbackForm({ sample }: { sample: SampleDetail }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState(sample.feedback ?? "");
  const [nextAction, setNextAction] = useState<SampleNextAction | "">(
    sample.next_action ?? ""
  );
  const [status, setStatus] = useState<SampleStatus>(
    (sample.status as SampleStatus) ?? "testando"
  );
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit() {
    startTransition(async () => {
      const result = await updateSampleFeedbackAction(sample.id, {
        feedback,
        next_action: nextAction || null,
        status: status !== sample.status ? status : undefined,
      });
      setMessage(result.error ?? result.success ?? null);
      if (!result.error) router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm">
        <span className="mb-1 block text-slate-600">Retorno técnico</span>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={3}
          placeholder="Feedback do cliente sobre testes, aplicação, aprovação..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">Próxima ação</span>
          <select
            value={nextAction}
            onChange={(e) =>
              setNextAction((e.target.value as SampleNextAction) || "")
            }
            className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
          >
            <option value="">—</option>
            {(Object.entries(SAMPLE_NEXT_ACTION_LABELS) as [SampleNextAction, string][]).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              )
            )}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">Status após retorno</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as SampleStatus)}
            className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
          >
            {(Object.entries(SAMPLE_STATUS_LABELS) as [SampleStatus, string][]).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              )
            )}
          </select>
        </label>
      </div>

      {message ? (
        <p
          className={`text-sm ${
            message.includes("salvo") ? "text-emerald-700" : "text-red-600"
          }`}
        >
          {message}
        </p>
      ) : null}

      <Button type="button" size="sm" onClick={handleSubmit} disabled={isPending}>
        {isPending ? "Salvando..." : "Salvar retorno"}
      </Button>
    </div>
  );
}
