import { Banknote, Calendar, PieChart, Receipt } from "lucide-react";
import type { FinancialSummary } from "../FinancialService";

type SummaryCardsProps = {
  isLoading: boolean;
  summary: FinancialSummary | null;
};

function formatPeso(value: number) {
  return new Intl.NumberFormat("en-PH", {
    currency: "PHP",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

export default function SummaryCards({ isLoading, summary }: SummaryCardsProps) {
  const remaining = summary?.available_to_spend ?? 0;
  const summaryItems = [
    {
      color: "bg-slate-100 text-[#1e3a5f]",
      icon: Calendar,
      note: summary ? `Budget Year ${summary.fiscal_year}` : "Current year",
      text: "text-[#1e3a5f]",
      title: "Total Annual Budget",
      value: summary?.total_annual_budget ?? 0,
    },
    {
      color: "bg-orange-100 text-orange-700",
      icon: PieChart,
      note: "Completed event allocations",
      text: "text-[#1e3a5f]",
      title: "Allocated",
      value: summary?.total_allocated_budget ?? 0,
    },
    {
      color: "bg-red-50 text-red-600",
      icon: Receipt,
      note: "Completed transactions only",
      text: "text-red-600",
      title: "Used",
      value: summary?.total_completed_spending ?? 0,
    },
    {
      color: "bg-emerald-100 text-emerald-700",
      icon: Banknote,
      note: "Total budget minus used amount",
      text: remaining < 0 ? "text-red-600" : "text-emerald-600",
      title: "Remaining",
      value: remaining,
    },
  ];

  return (
    <section className="mb-6 grid grid-cols-4 gap-6 max-xl:grid-cols-2 max-md:grid-cols-1">
      {summaryItems.map((item) => {
        const Icon = item.icon;

        return (
          <article
            key={item.title}
            className="flex min-h-[128px] items-center justify-between rounded-[14px] border border-[#1e3a5f]/15 bg-white px-6 py-5 shadow-sm"
          >
            <div>
              <p className="text-sm font-semibold tracking-[0.02em] text-slate-400">
                {item.title}
              </p>

              <p
                className={`mt-1 text-3xl font-bold tracking-tight ${item.text}`}
              >
                {isLoading ? "..." : formatPeso(item.value)}
              </p>

              <p className="mt-1 text-xs font-medium text-slate-400">
                {item.note}
              </p>
            </div>

            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${item.color}`}
            >
              <Icon size={24} strokeWidth={2} />
            </span>
          </article>
        );
      })}
    </section>
  );
}
