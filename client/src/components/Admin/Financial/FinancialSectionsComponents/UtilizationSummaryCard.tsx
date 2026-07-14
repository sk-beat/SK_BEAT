import { ArrowUpRight, Wallet } from "lucide-react";

function UtilizationSummaryCard() {
  return (
    <section className="rounded-[14px] border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-400">
        Budget Allocation Insights
      </h2>

      <p className="mt-1 text-xs text-slate-400">
        Suggestions based on survey demand and past event performance
      </p>

      <article className="mt-5 flex gap-4 rounded-xl bg-emerald-50 p-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
          <ArrowUpRight className="h-5 w-5 -rotate-45" />
        </span>

        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            Sports programs have the highest participation.
          </h3>

          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Consider increasing budget for sports activities.
          </p>
        </div>
      </article>

      <article className="mt-4 flex gap-4 rounded-xl bg-amber-50 p-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <Wallet className="h-5 w-5" />
        </span>

        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            Keep a reserve before adding new expenses.
          </h3>

          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Use remaining funds for late-year youth requests and urgent program
            needs.
          </p>
        </div>
      </article>
    </section>
  );
}

export default UtilizationSummaryCard;
