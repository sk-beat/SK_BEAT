import { budgetAllocation } from "../financialData";
import type { AnnualBudget } from "../types";

type AllocationCardProps = {
  annualBudget: AnnualBudget | null;
};

function AllocationCard({ annualBudget }: AllocationCardProps) {
  return (
    <section className="rounded-[14px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-400">
            Budget allocation
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Distribution across departments
          </p>
        </div>

        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
          Total: ₱{annualBudget?.total_allocation.toLocaleString() ?? "0"}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <div className="relative h-[200px] w-[200px] shrink-0 rounded-full bg-[conic-gradient(#1a529b_0_27%,#0d9488_27%_49%,#ff9f68_49%_67%,#312e81_67%_83%,#26ba9a_83%_100%)]">
          <div className="absolute inset-[26px] rounded-full bg-white" />

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold">100%</span>
            <span className="text-xs text-slate-500">Total Budget</span>
          </div>
        </div>

        <div className="flex min-w-64 flex-1 flex-col gap-2 text-sm">
          {budgetAllocation.map((item) => (
            <div
              className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2"
              key={item.name}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />

              <span className="text-slate-800">{item.name}</span>

              <span className="text-slate-500">{item.amount}</span>

              <span className="text-slate-500">({item.percent})</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default AllocationCard;
