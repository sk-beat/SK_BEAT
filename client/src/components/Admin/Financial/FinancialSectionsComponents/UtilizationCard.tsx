import type { FinancialEventBudget } from "../FinancialService";

type UtilizationCardProps = {
  eventBudgets: FinancialEventBudget[];
};

function formatCompact(value: number) {
  if (Math.abs(value) >= 1000) {
    return `${Math.round(value / 1000)}k`;
  }

  return String(value);
}

function UtilizationCard({ eventBudgets }: UtilizationCardProps) {
  const rows = eventBudgets
    .filter((event) => event.status === "completed")
    .reduce<Record<string, { allocated: number; spent: number }>>(
      (totals, event) => {
        if (!totals[event.category]) {
          totals[event.category] = {
            allocated: 0,
            spent: 0,
          };
        }

        totals[event.category].allocated += event.allocated_budget;
        totals[event.category].spent += event.completed_spending;
        return totals;
      },
      {},
    );

  const chartRows = Object.entries(rows).map(([category, totals]) => ({
    category,
    ...totals,
  }));
  const maxAmount = Math.max(
    1,
    ...chartRows.flatMap((row) => [row.allocated, row.spent]),
  );
  const ticks = Array.from({ length: 6 }, (_, index) =>
    Math.round((maxAmount / 5) * (5 - index)),
  );

  return (
    <section className="rounded-[14px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-400">
            Budget utilization
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Allocated versus completed spending
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-300" />
            Allocated
          </span>

          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#1e3a5f]" />
            Completed
          </span>
        </div>
      </div>

      {chartRows.length === 0 ? (
        <div className="flex h-[220px] items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">
          No event allocation data yet.
        </div>
      ) : (
        <div className="grid grid-cols-[38px_1fr] gap-3">
          <div className="flex h-[220px] flex-col justify-between pb-8 pt-1 text-right text-[0.68rem] font-medium text-slate-400">
            {ticks.map((tick) => (
              <span key={tick}>{formatCompact(tick)}</span>
            ))}
          </div>

          <div className="relative h-[220px] border-b border-slate-200 bg-[linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[length:100%_36px] pt-4">
            <div className="flex h-[176px] items-end justify-between gap-4">
              {chartRows.map((item) => {
                const allocatedHeight = (item.allocated / maxAmount) * 100;
                const spentHeight = (item.spent / maxAmount) * 100;

                return (
                  <div
                    className="flex min-w-0 flex-1 flex-col items-center gap-2"
                    key={item.category}
                  >
                    <div className="flex h-40 items-end justify-center gap-2">
                      <span
                        className="w-8 rounded-t-xl bg-slate-300"
                        style={{
                          height: `${allocatedHeight}%`,
                        }}
                      />

                      <span
                        className="w-8 rounded-t-xl bg-[#1e3a5f]"
                        style={{
                          height: `${spentHeight}%`,
                        }}
                      />
                    </div>

                    <span className="line-clamp-2 min-h-8 text-center text-[0.68rem] font-medium leading-4 text-slate-400">
                      {item.category}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default UtilizationCard;
