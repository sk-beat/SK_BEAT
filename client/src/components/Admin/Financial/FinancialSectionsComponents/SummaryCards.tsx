import { Calendar, PieChart, Receipt, Banknote } from "lucide-react";
import type { AnnualBudget } from "../types";

type SummaryCardsProps = {
  annualBudget: AnnualBudget | null;
};

export default function SummaryCards({ annualBudget }: SummaryCardsProps) {
  const totalBudget = annualBudget?.total_allocation ?? 0;
  const remaining = annualBudget?.remaining_balance ?? 0;
  const used = totalBudget - remaining;

  const summary = [
    {
      title: "Total Annual Budget",
      value: totalBudget,
      note: "Current fiscal year",
      icon: Calendar,
      color: "bg-slate-100 text-[#1e3a5f]",
      text: "text-[#1e3a5f]",
    },
    {
      title: "Allocated",
      value: totalBudget,
      note: "",
      icon: PieChart,
      color: "bg-orange-100 text-orange-700",
      text: "text-[#1e3a5f]",
    },
    {
      title: "Used",
      value: used,
      note: "",
      icon: Receipt,
      color: "bg-red-50 text-red-600",
      text: "text-red-600",
    },
    {
      title: "Remaining",
      value: remaining,
      note: "",
      icon: Banknote,
      color: "bg-emerald-100 text-emerald-700",
      text: "text-emerald-600",
    },
  ];

  return (
    <section className="mb-6 grid grid-cols-4 gap-6 max-xl:grid-cols-2 max-md:grid-cols-1">
      {summary.map((item) => {
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
                ₱{item.value.toLocaleString()}
              </p>

              {item.note && (
                <p className="mt-1 text-xs font-medium text-slate-400">
                  {item.note}
                </p>
              )}
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
