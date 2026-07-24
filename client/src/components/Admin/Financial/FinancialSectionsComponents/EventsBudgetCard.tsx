import { useState } from "react";
import type { FinancialEventBudget } from "../FinancialService";

type EventsBudgetsCardProps = {
  canAddExpense: boolean;
  eventBudgets: FinancialEventBudget[];
  onExportEventExpense: () => void;
  onOpenEventExpense: (event: FinancialEventBudget) => void;
};

function formatPeso(value: number) {
  return new Intl.NumberFormat("en-PH", {
    currency: "PHP",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function percentUsed(event: FinancialEventBudget) {
  if (event.allocated_budget === 0) {
    return event.completed_spending > 0 ? 100 : 0;
  }

  return (event.completed_spending / event.allocated_budget) * 100;
}

export default function EventsBudgetsCard({
  canAddExpense,
  eventBudgets,
  onExportEventExpense,
  onOpenEventExpense,
}: EventsBudgetsCardProps) {
  const [statusFilter, setStatusFilter] = useState<"scheduled" | "completed">("scheduled");
  const visibleEventBudgets = eventBudgets.filter((event) => event.status === statusFilter);
  const completedEvents = eventBudgets.filter((event) => event.status === "completed");

  return (
    <section className="rounded-[14px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-400">
            Event Budgets
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Allocated budget and completed spending by activity
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-slate-400">
            Filter
            <select
              className="min-w-32 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium normal-case tracking-normal text-slate-700 outline-none"
              onChange={(event) => setStatusFilter(event.target.value as "scheduled" | "completed")}
              value={statusFilter}
            >
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
            </select>
          </label>

          <button
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-[#1e3a5f] hover:bg-blue-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
            disabled={completedEvents.length === 0}
            onClick={onExportEventExpense}
            title={completedEvents.length === 0 ? "No completed events to export." : "Export completed event expenses"}
            type="button"
          >
            Export
          </button>
        </div>
      </div>

      <div className="mt-5 flex max-h-[520px] flex-col gap-4 overflow-y-auto pr-1">
        {visibleEventBudgets.length === 0 ? (
          <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
            No {statusFilter} event budgets for this year.
          </p>
        ) : (
          visibleEventBudgets.map((event) => {
            const used = percentUsed(event);
            const barWidth = Math.min(Math.abs(used), 100);
            const overBudget = event.remaining_event_budget < 0;
            const canAddExpenseForEvent = canAddExpense && event.status === "scheduled";

            return (
              <article
                className="border-t border-slate-200 pt-4 first:border-t-0 first:pt-0"
                key={event.event_id}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">
                      {event.event_name}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {event.category} - {event.status}
                    </p>
                  </div>

                  <span
                    className={[
                      "text-xs font-medium",
                      overBudget ? "text-red-600" : "text-slate-400",
                    ].join(" ")}
                  >
                    {used.toFixed(0)}% used
                  </span>
                </div>

                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={[
                      "h-full rounded-full",
                      overBudget ? "bg-red-500" : "bg-[#1e3a5f]",
                    ].join(" ")}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>

                <p className="mt-2 text-sm text-slate-500">
                  Allocated:{" "}
                  <strong className="text-[#1e3a5f]">
                    {formatPeso(event.allocated_budget)}
                  </strong>{" "}
                  | Completed:{" "}
                  <strong className="text-slate-700">
                    {formatPeso(event.completed_spending)}
                  </strong>{" "}
                  | Remaining:{" "}
                  <strong className={overBudget ? "text-red-600" : "text-slate-700"}>
                    {formatPeso(event.remaining_event_budget)}
                  </strong>
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Pending: {formatPeso(event.pending_amount)}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-[#1e3a5f] hover:bg-blue-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                    disabled={!canAddExpenseForEvent}
                    onClick={() => onOpenEventExpense(event)}
                    title={
                      !canAddExpense
                        ? "The annual budget is fully used."
                        : canAddExpenseForEvent
                          ? "Add expense"
                          : "Expenses can only be added to scheduled events."
                    }
                    type="button"
                  >
                    Add Expense
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
