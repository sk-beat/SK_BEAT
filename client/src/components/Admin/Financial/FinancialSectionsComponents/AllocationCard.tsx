import type { AnnualBudget, FinancialEventBudget } from "../FinancialService";

type AllocationCardProps = {
  eventBudgets: FinancialEventBudget[];
  selectedBudget: AnnualBudget | null;
};

const colors = ["#1a529b", "#0d9488", "#ff9f68", "#7c3aed", "#26ba9a", "#dc2626"];

function formatPeso(value: number) {
  return new Intl.NumberFormat("en-PH", {
    currency: "PHP",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function formatPercent(value: number) {
  if (value === 0) {
    return "0%";
  }

  if (Math.abs(value) < 1) {
    return `${value.toFixed(2)}%`;
  }

  return `${value.toFixed(1)}%`;
}

function AllocationCard({ eventBudgets, selectedBudget }: AllocationCardProps) {
  const totalBudget = selectedBudget?.total_allocation ?? 0;
  const categoryTotals = eventBudgets
    .filter((event) => event.status === "completed")
    .reduce<Record<string, number>>((totals, event) => {
      totals[event.category] = (totals[event.category] ?? 0) + event.allocated_budget;
      return totals;
    }, {});

  const rows = Object.entries(categoryTotals)
    .map(([name, amount], index) => ({
      amount,
      color: colors[index % colors.length],
      name,
      percent: totalBudget === 0 ? 0 : (amount / totalBudget) * 100,
    }))
    .sort((first, second) => second.amount - first.amount);
  const allocatedTotal = rows.reduce((total, row) => total + row.amount, 0);
  const allocatedPercent = totalBudget === 0 ? 0 : (allocatedTotal / totalBudget) * 100;
  const unallocatedPercent = Math.max(0, 100 - allocatedPercent);

  const gradient =
    totalBudget === 0 || rows.length === 0
      ? "#e2e8f0 0 100%"
      : [
          ...rows
            .reduce<{ cursor: number; parts: string[] }>(
            (state, row) => {
              const start = state.cursor;
              const end = state.cursor + row.percent;
              state.parts.push(`${row.color} ${start}% ${end}%`);
              state.cursor = end;
              return state;
            },
            { cursor: 0, parts: [] },
          )
            .parts,
          `#e2e8f0 ${allocatedPercent}% ${allocatedPercent + unallocatedPercent}%`,
        ].join(",");

  return (
    <section className="rounded-[14px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-400">
            Budget allocation
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Completed event allocations by category
          </p>
        </div>

        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
          Total: {formatPeso(totalBudget)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <div
          className="relative h-[200px] w-[200px] shrink-0 rounded-full"
          style={{ background: `conic-gradient(${gradient})` }}
        >
          <div className="absolute inset-[26px] rounded-full bg-white" />

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold">
              {formatPercent(allocatedPercent)}
            </span>
            <span className="text-xs text-slate-500">Allocated</span>
          </div>
        </div>

        <div className="flex min-w-64 flex-1 flex-col gap-2 text-sm">
          {rows.length === 0 ? (
            <p className="text-sm text-slate-400">No allocated event budget yet.</p>
          ) : (
            rows.map((item) => (
              <div
                className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2"
                key={item.name}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />

                <span className="text-slate-800">{item.name}</span>

                <span className="text-slate-500">{formatPeso(item.amount)}</span>

                <span className="text-slate-500">
                  ({formatPercent(item.percent)})
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export default AllocationCard;
