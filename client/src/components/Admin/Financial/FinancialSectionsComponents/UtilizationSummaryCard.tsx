import { AlertTriangle, CheckCircle2, Clock3, Wallet } from "lucide-react";
import type { FinancialSummary } from "../FinancialService";

type UtilizationSummaryCardProps = {
  summary: FinancialSummary | null;
};

function formatPeso(value: number) {
  return new Intl.NumberFormat("en-PH", {
    currency: "PHP",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function Insight({
  body,
  icon: Icon,
  tone,
  title,
}: {
  body: string;
  icon: typeof Wallet;
  tone: "amber" | "emerald" | "red" | "blue";
  title: string;
}) {
  const colors = {
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
  };

  const iconColors = {
    amber: "bg-amber-100 text-amber-700",
    blue: "bg-blue-100 text-blue-700",
    emerald: "bg-emerald-100 text-emerald-700",
    red: "bg-red-100 text-red-700",
  };

  return (
    <article className={`mt-4 flex gap-4 rounded-xl p-4 ${colors[tone]}`}>
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconColors[tone]}`}
      >
        <Icon className="h-5 w-5" />
      </span>

      <div>
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>

        <p className="mt-1 text-xs leading-relaxed text-slate-500">{body}</p>
      </div>
    </article>
  );
}

function UtilizationSummaryCard({ summary }: UtilizationSummaryCardProps) {
  const unallocated = summary?.unallocated_budget ?? 0;
  const available = summary?.available_to_spend ?? 0;

  return (
    <section className="rounded-[14px] border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-400">
        Budget Insights
      </h2>

      <p className="mt-1 text-xs text-slate-400">
        Based on allocations and completed transactions
      </p>

      <Insight
        body={
          unallocated < 0
            ? `Allocations exceed the annual budget by ${formatPeso(Math.abs(unallocated))}.`
            : `${formatPeso(unallocated)} remains unallocated for this fiscal year.`
        }
        icon={unallocated < 0 ? AlertTriangle : CheckCircle2}
        title={unallocated < 0 ? "Allocations exceed annual budget." : "Allocation balance is visible."}
        tone={unallocated < 0 ? "red" : "emerald"}
      />

      <Insight
        body={
          available < 0
            ? `Completed spending is over the annual budget by ${formatPeso(Math.abs(available))}.`
            : `${formatPeso(available)} is still available after completed spending.`
        }
        icon={Wallet}
        title="Available spending budget is tracked separately."
        tone={available < 0 ? "red" : "blue"}
      />

      <Insight
        body={`${formatPeso(summary?.total_approved_amount ?? 0)} approved but not counted as spent; ${formatPeso(summary?.total_pending_amount ?? 0)} is still pending.`}
        icon={Clock3}
        title="Approved and pending records are separate."
        tone="amber"
      />
    </section>
  );
}

export default UtilizationSummaryCard;
