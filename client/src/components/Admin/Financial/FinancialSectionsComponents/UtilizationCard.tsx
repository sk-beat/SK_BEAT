import { budgetAllocation, eventBudgets } from "../financialData";

function parsePeso(value: string) {
  return Number(value.replace(/[^\d]/g, ""));
}

function UtilizationCard() {
  const maxAmount = Math.max(
    ...budgetAllocation.map((item) => parsePeso(item.amount)),
    ...eventBudgets.map((event) => parsePeso(event.spent))
  );

  return (
    <section className="rounded-[14px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-400">
            Budget utilization
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Allocated vs spent comparison
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-300" />
            Allocated
          </span>

          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#1e3a5f]" />
            Spent
          </span>
        </div>
      </div>

      <div className="grid grid-cols-[38px_1fr] gap-3">
        <div className="flex h-[220px] flex-col justify-between pb-8 pt-1 text-right text-[0.68rem] font-medium text-slate-400">
          {[140, 120, 100, 80, 60, 40, 20, 0].map((tick) => (
            <span key={tick}>{tick}k</span>
          ))}
        </div>

        <div className="relative h-[220px] border-b border-slate-200 bg-[linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[length:100%_27px] pt-4">
          <div className="flex h-[176px] items-end justify-between gap-4">
            {budgetAllocation.map((item, index) => {
              const spent = eventBudgets[index]
                ? parsePeso(eventBudgets[index].spent)
                : Math.round(parsePeso(item.amount) * 0.62);

              const allocatedHeight =
                (parsePeso(item.amount) / maxAmount) * 100;

              const spentHeight = (spent / maxAmount) * 100;

              return (
                <div
                  className="flex min-w-0 flex-1 flex-col items-center gap-2"
                  key={item.name}
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
                    {item.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default UtilizationCard;
