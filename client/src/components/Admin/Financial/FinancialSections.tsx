import AllocationCard from "./FinancialSectionsComponents/AllocationCard";
import EventsBudgetsCard from "./FinancialSectionsComponents/EventsBudgetCard";
import SummaryCards from "./FinancialSectionsComponents/SummaryCards";
import UtilizationCard from "./FinancialSectionsComponents/UtilizationCard";
import UtilizationSummaryCard from "./FinancialSectionsComponents/UtilizationSummaryCard";
import {
  type AnnualBudget,
  type FinancialEventBudget,
  type FinancialSummary,
} from "./FinancialService";

type FinancialSectionActions = {
  annualBudgets: AnnualBudget[];
  budgetYearId: number | null;
  errorMessage: string;
  eventBudgets: FinancialEventBudget[];
  isLoading: boolean;
  onAddExpense: () => void;
  onBudgetYearChange: (budgetYearId: number) => void;
  onOpenAnnualBudget: () => void;
  onOpenEventExpense: (event: FinancialEventBudget) => void;
  selectedBudget: AnnualBudget | null;
  successMessage: string;
  summary: FinancialSummary | null;
};

export default function FinancialSections({
  annualBudgets,
  budgetYearId,
  errorMessage,
  eventBudgets,
  isLoading,
  onAddExpense,
  onBudgetYearChange,
  onOpenAnnualBudget,
  onOpenEventExpense,
  selectedBudget,
  successMessage,
  summary,
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
          type="button"
        >
          Export data
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
    </div>
  );
}
