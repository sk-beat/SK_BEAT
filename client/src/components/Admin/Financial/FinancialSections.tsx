import AllocationCard from "./FinancialSectionsComponents/AllocationCard";
import EventsBudgetsCard from "./FinancialSectionsComponents/EventsBudgetCard";
import SummaryCards from "./FinancialSectionsComponents/SummaryCards";
import UtilizationCard from "./FinancialSectionsComponents/UtilizationCard";
import UtilizationSummaryCard from "./FinancialSectionsComponents/UtilizationSummaryCard";
import {
  type AnnualBudget,
  type FinancialEventBudget,
  type FinancialSummary,
  type FinancialTransaction,
} from "./FinancialService";

type FinancialSectionActions = {
  annualBudgets: AnnualBudget[];
  budgetYearId: number | null;
  errorMessage: string;
  eventBudgets: FinancialEventBudget[];
  isLoading: boolean;
  onAddExpense: () => void;
  onBudgetYearChange: (budgetYearId: number) => void;
  onExportData: () => void;
  onOpenAnnualBudget: () => void;
  onOpenEventExpense: (event: FinancialEventBudget) => void;
  selectedBudget: AnnualBudget | null;
  successMessage: string;
  summary: FinancialSummary | null;
  transactions: FinancialTransaction[];
};

function formatPeso(value: number) {
  return new Intl.NumberFormat("en-PH", {
    currency: "PHP",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en-PH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function labelize(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusClass(status: FinancialTransaction["status"]) {
  switch (status) {
    case "completed":
      return "bg-emerald-500/10 text-emerald-600";
    case "approved":
      return "bg-blue-500/10 text-blue-600";
    case "pending":
      return "bg-amber-500/10 text-amber-600";
    case "cancelled":
    case "rejected":
      return "bg-red-500/10 text-red-600";
    default:
      return "bg-slate-200 text-slate-600";
  }
}

function ExpenseHistoryTable({
  transactions,
}: {
  transactions: FinancialTransaction[];
}) {
  const sortedTransactions = [...transactions].sort((first, second) => {
    const firstDate = new Date(first.transaction_date).getTime();
    const secondDate = new Date(second.transaction_date).getTime();

    if (firstDate !== secondDate) {
      return secondDate - firstDate;
    }

    return second.transaction_id - first.transaction_id;
  });

  return (
    <section className="mt-6 rounded-[14px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-400">
            Expense History
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Saved expenses from Supabase for the selected budget year
          </p>
        </div>
      </div>

      <div className="overflow-hidden overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50">
              {["Date", "Description", "Event", "Status", "Amount"].map(
                (heading) => (
                  <th
                    className={[
                      "px-5 py-4 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-slate-400",
                      heading === "Amount" ? "text-right" : "text-left",
                    ].join(" ")}
                    key={heading}
                  >
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {sortedTransactions.length === 0 ? (
              <tr>
                <td
                  className="border-t border-slate-200 px-5 py-10 text-center text-sm text-slate-400"
                  colSpan={5}
                >
                  No expenses recorded yet.
                </td>
              </tr>
            ) : (
              sortedTransactions.map((transaction) => (
                <tr className="hover:bg-slate-50" key={transaction.transaction_id}>
                  <td className="border-t border-slate-200 px-5 py-4 text-slate-600">
                    {formatDate(transaction.transaction_date)}
                  </td>
                  <td className="border-t border-slate-200 px-5 py-4">
                    <p className="font-semibold text-slate-800">
                      {transaction.description || transaction.category}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {transaction.reference_number || labelize(transaction.transaction_type)}
                    </p>
                  </td>
                  <td className="border-t border-slate-200 px-5 py-4 text-slate-600">
                    {transaction.events?.event_name ?? "General expense"}
                  </td>
                  <td className="border-t border-slate-200 px-5 py-4">
                    <span
                      className={[
                        "inline-flex rounded-md px-2.5 py-1 text-xs font-semibold",
                        statusClass(transaction.status),
                      ].join(" ")}
                    >
                      {labelize(transaction.status)}
                    </span>
                  </td>
                  <td className="border-t border-slate-200 px-5 py-4 text-right font-semibold text-slate-800">
                    {formatPeso(transaction.amount)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function FinancialSections({
  annualBudgets,
  budgetYearId,
  errorMessage,
  eventBudgets,
  isLoading,
  onAddExpense,
  onBudgetYearChange,
  onExportData,
  onOpenAnnualBudget,
  onOpenEventExpense,
  selectedBudget,
  successMessage,
  summary,
  transactions,
}: FinancialSectionActions) {
  return (
    <div className="flex-1 p-8">
      {errorMessage ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <select
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-[#1e3a5f]"
          disabled={annualBudgets.length === 0}
          onChange={(event) => onBudgetYearChange(Number(event.target.value))}
          value={budgetYearId ?? ""}
        >
          {annualBudgets.length === 0 ? (
            <option value="">No budget year</option>
          ) : (
            annualBudgets.map((budget) => (
              <option key={budget.budget_year_id} value={budget.budget_year_id}>
                Budget Year {budget.fiscal_year}
              </option>
            ))
          )}
        </select>

        {isLoading ? (
          <span className="text-sm font-medium text-slate-400">Loading...</span>
        ) : null}
      </div>

      <SummaryCards isLoading={isLoading} summary={summary} />

      <div className="mb-6 flex justify-end gap-3">
        <button
          className="text-sm font-medium text-[#1e3a5f] hover:underline"
          onClick={onExportData}
          type="button"
        >
          Export PDF
        </button>

        <button
          className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-[#1e3a5f] hover:bg-blue-50"
          onClick={onAddExpense}
          type="button"
        >
          Add Expense
        </button>

        <button
          className="rounded-lg bg-[#1e3a5f] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#2a4a6f]"
          onClick={onOpenAnnualBudget}
          type="button"
        >
          Set Annual Budget
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6 max-xl:grid-cols-1">
        <AllocationCard
          eventBudgets={eventBudgets}
          selectedBudget={selectedBudget}
        />
        <UtilizationCard
          eventBudgets={eventBudgets}
        />
      </div>

      <div className="mt-6 grid grid-cols-[minmax(0,1.4fr)_minmax(300px,0.9fr)] gap-6 max-xl:grid-cols-1">
        <EventsBudgetsCard
          eventBudgets={eventBudgets}
          onOpenEventExpense={onOpenEventExpense}
        />

        <UtilizationSummaryCard summary={summary} />
      </div>

      <ExpenseHistoryTable
        transactions={transactions}
      />
    </div>
  );
}
