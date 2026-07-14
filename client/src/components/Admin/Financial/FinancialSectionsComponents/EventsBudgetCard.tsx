import type { EventBudget } from "../financialData";
import { eventBudgets } from "../financialData";

type EventsBudgetsCardProps = {
  onEditEventBudget: (event: EventBudget) => void;
  onOpenEventExpense: (event: EventBudget) => void;
};

export default function EventsBudgetsCard({
  onEditEventBudget,
  onOpenEventExpense,
}: EventsBudgetsCardProps) {
  return (
    <section className="rounded-[14px] border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-400">
        Event Budgets
      </h2>

      <p className="mt-1 text-xs text-slate-400">
        Allocated budget per SK event
      </p>

      <div className="mt-5 flex flex-col gap-4">
        {eventBudgets.map((event) => (
          <article
            className="border-t border-slate-200 pt-4 first:border-t-0 first:pt-0"
            key={event.title}
          >
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-sm font-semibold text-slate-800">
                {event.title}
              </h3>

              <span className="text-xs font-medium text-slate-400">
                {event.percent}% used
              </span>
            </div>

            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[#1e3a5f]"
                style={{ width: `${event.percent}%` }}
              />
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Allocated:{" "}
              <strong className="text-[#1e3a5f]">{event.allocated}</strong> |
              Spent: <strong className="text-slate-700">{event.spent}</strong>
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => onEditEventBudget(event)}
                type="button"
              >
                Edit Budget
              </button>

              <button
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-[#1e3a5f] hover:bg-blue-50"
                onClick={() => onOpenEventExpense(event)}
                type="button"
              >
                Add Expense
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
