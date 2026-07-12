import { type ComponentType } from "react";
import {
  ArrowRightIcon,
  BanknoteIcon,
  CalendarIcon,
  DollarIcon,
  type IconProps,
} from "../Dashboard/icons";
import {
  type EventBudget,
  budgetAllocation,
  eventBudgets,
  financialSummary,
} from "./financialData";

const summaryIconClasses: Record<string, string> = {
  blue: "bg-slate-100 text-[#1e3a5f]",
  yellow: "bg-orange-100 text-orange-700",
  red: "bg-red-50 text-red-600",
  green: "bg-emerald-100 text-emerald-700",
};

function PieChartIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M21 12a9 9 0 1 1-9-9v9Z" />
      <path d="M12 3a9 9 0 0 1 9 9h-9Z" />
    </svg>
  );
}

function ReceiptIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2Z" />
      <path d="M8 7h8" />
      <path d="M8 11h8" />
      <path d="M8 15h5" />
    </svg>
  );
}

const summaryIcons: Record<string, ComponentType<IconProps>> = {
  "Total Annual Budget": CalendarIcon,
  Allocated: PieChartIcon,
  Used: ReceiptIcon,
  Remaining: BanknoteIcon,
};

function parsePeso(value: string) {
  return Number(value.replace(/[^\d]/g, ""));
}

function SummaryCards() {
  return (
    <section className="mb-6 grid grid-cols-4 gap-6 max-xl:grid-cols-2 max-md:grid-cols-1">
      {financialSummary.map((item) => {
        const Icon = summaryIcons[item.title] ?? DollarIcon;

        return (
          <article
            className="flex min-h-[128px] items-center justify-between rounded-[14px] border border-[#1e3a5f]/15 bg-white px-6 py-5 shadow-sm"
            key={item.title}
          >
            <div>
              <p className="text-sm font-semibold tracking-[0.02em] text-slate-400">
                {item.title}
              </p>
              <p
                className={[
                  "mt-1 text-3xl font-bold tracking-tight",
                  item.tone === "red"
                    ? "text-red-600"
                    : item.tone === "green"
                      ? "text-emerald-600"
                      : "text-[#1e3a5f]",
                ].join(" ")}
              >
                {item.value}
              </p>
              {item.note ? (
                <p className="mt-1 text-xs font-medium text-slate-400">
                  {item.note}
                </p>
              ) : null}
            </div>
            <span
              className={[
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                summaryIconClasses[item.tone],
              ].join(" ")}
            >
              <Icon className="h-6 w-6" />
            </span>
          </article>
        );
      })}
    </section>
  );
}

function AllocationCard() {
  return (
    <section className="rounded-[14px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-400">Budget allocation</h2>
          <p className="mt-1 text-xs text-slate-400">Distribution across departments</p>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">Total: P450,000</span>
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
            <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-2" key={item.name}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
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

function UtilizationCard() {
  const maxAmount = Math.max(
    ...budgetAllocation.map((item) => parsePeso(item.amount)),
    ...eventBudgets.map((event) => parsePeso(event.spent)),
  );

  return (
    <section className="rounded-[14px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-400">Budget utilization</h2>
          <p className="mt-1 text-xs text-slate-400">Allocated vs spent comparison</p>
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
              const allocatedHeight = (parsePeso(item.amount) / maxAmount) * 100;
              const spentHeight = (spent / maxAmount) * 100;

              return (
                <div
                  className="flex min-w-0 flex-1 flex-col items-center gap-2"
                  key={item.name}
                >
                  <div className="flex h-40 items-end justify-center gap-2">
                    <span
                      className="w-8 rounded-t-xl bg-slate-300"
                      style={{ height: `${allocatedHeight}%` }}
                      title={`${item.name} allocated ${item.amount}`}
                    />
                    <span
                      className="w-8 rounded-t-xl bg-[#1e3a5f]"
                      style={{ height: `${spentHeight}%` }}
                      title={`${item.name} spent P${spent.toLocaleString()}`}
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

function UtilizationSummaryCard() {
  return (
    <section className="rounded-[14px] border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-400">Budget Allocation Insights</h2>
      <p className="mt-1 text-xs text-slate-400">Suggestions based on survey demand and past event performance</p>
      <article className="mt-5 flex gap-4 rounded-xl bg-emerald-50 p-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
          <ArrowRightIcon className="h-5 w-5 -rotate-45" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Sports programs have the highest participation.</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">Consider increasing budget for sports activities.</p>
        </div>
      </article>
      <article className="mt-4 flex gap-4 rounded-xl bg-amber-50 p-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <DollarIcon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Keep a reserve before adding new expenses.</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">Use remaining funds for late-year youth requests and urgent program needs.</p>
        </div>
      </article>
    </section>
  );
}

function EventBudgetsCard({
  onEditEventBudget,
  onOpenEventExpense,
}: Pick<FinancialSectionActions, "onEditEventBudget" | "onOpenEventExpense">) {
  return (
    <section className="rounded-[14px] border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-400">Event Budgets</h2>
      <p className="mt-1 text-xs text-slate-400">Allocated budget per SK event</p>
      <div className="mt-5 flex flex-col gap-4">
        {eventBudgets.map((event) => (
          <article className="border-t border-slate-200 pt-4 first:border-t-0 first:pt-0" key={event.title}>
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-sm font-semibold text-slate-800">{event.title}</h3>
              <span className="text-xs font-medium text-slate-400">{event.percent}% used</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-[#1e3a5f]" style={{ width: `${event.percent}%` }} />
            </div>
            <p className="mt-2 text-sm text-slate-500">Allocated: <strong className="text-[#1e3a5f]">{event.allocated}</strong> | Spent: <strong className="text-slate-700">{event.spent}</strong></p>
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

type FinancialSectionActions = {
  onAddExpense: () => void;
  onEditEventBudget: (event: EventBudget) => void;
  onOpenAnnualBudget: () => void;
  onOpenEventExpense: (event: EventBudget) => void;
};

export default function FinancialSections({
  onAddExpense,
  onEditEventBudget,
  onOpenAnnualBudget,
  onOpenEventExpense,
}: FinancialSectionActions) {
  return (
    <div className="flex-1 p-8">
      <SummaryCards />
      <div className="mb-6 flex justify-end gap-3">
        <button className="text-sm font-medium text-[#1e3a5f] hover:underline" type="button">Export data</button>
        <button className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-[#1e3a5f] hover:bg-blue-50" onClick={onAddExpense} type="button">Add Expense</button>
        <button className="rounded-lg bg-[#1e3a5f] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#2a4a6f]" onClick={onOpenAnnualBudget} type="button">Set Annual Budget</button>
      </div>
      <div className="grid grid-cols-2 gap-6 max-xl:grid-cols-1">
        <AllocationCard />
        <UtilizationCard />
      </div>
      <div className="mt-6 grid grid-cols-[minmax(0,1.4fr)_minmax(300px,0.9fr)] gap-6 max-xl:grid-cols-1">
        <EventBudgetsCard
          onEditEventBudget={onEditEventBudget}
          onOpenEventExpense={onOpenEventExpense}
        />
        <UtilizationSummaryCard />
      </div>
    </div>
  );
}
