"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CustomerForm } from "@/components/customers/customer-form";
import {
  CustomerVisitForm,
  CustomerVisitHistory,
} from "@/components/customers/customer-visit-history";
import type { CustomerDetail, CustomerVisitHistoryItem } from "@/types/customer";

type Tab = "visita" | "cadastro";

export function CustomerDetailTabs({
  customer,
  visits,
}: {
  customer: CustomerDetail;
  visits: CustomerVisitHistoryItem[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("visita");

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setTab("visita")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            tab === "visita"
              ? "bg-brand-600 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Registrar contato
        </button>
        <button
          type="button"
          onClick={() => setTab("cadastro")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            tab === "cadastro"
              ? "bg-brand-600 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Editar cadastro
        </button>
      </div>

      {tab === "visita" ? (
        <div className="space-y-6">
          <CustomerVisitForm
            customer={customer}
            onSuccess={() => router.refresh()}
          />
          <section>
            <h3 className="mb-3 text-sm font-semibold text-slate-900">
              Histórico de conversas ({visits.length})
            </h3>
            <CustomerVisitHistory visits={visits} />
          </section>
        </div>
      ) : (
        <CustomerForm customer={customer} />
      )}
    </div>
  );
}
