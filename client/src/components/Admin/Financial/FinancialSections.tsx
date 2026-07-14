import type { EventBudget } from "./financialData";
import AllocationCard from "./FinancialSectionsComponents/AllocationCard";
import EventsBudgetsCard from "./FinancialSectionsComponents/EventsBudgetCard";
import SummaryCards from "./FinancialSectionsComponents/SummaryCards";
import UtilizationCard from "./FinancialSectionsComponents/UtilizationCard";
import UtilizationSummaryCard from "./FinancialSectionsComponents/UtilizationSummaryCard";
import type { AnnualBudget } from "./types";

type FinancialSectionActions = {
  annualBudget: AnnualBudget | null;
  onAddExpense: () => void;
  onEditEventBudget: (event: EventBudget) => void;
  onOpenAnnualBudget: () => void;
  onOpenEventExpense: (event: EventBudget) => void;
};

export default function FinancialSections({
  annualBudget,
  onAddExpense,
  onEditEventBudget,
  onOpenAnnualBudget,
  onOpenEventExpense,
}: FinancialSectionActions) {
  return (
    <div className="flex-1 p-8">
      <SummaryCards annualBudget={annualBudget} />

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
        <AllocationCard annualBudget={annualBudget} />
        <UtilizationCard />
      </div>

      <div className="mt-6 grid grid-cols-[minmax(0,1.4fr)_minmax(300px,0.9fr)] gap-6 max-xl:grid-cols-1">
        <EventsBudgetsCard
          onEditEventBudget={onEditEventBudget}
          onOpenEventExpense={onOpenEventExpense}
        />

        <UtilizationSummaryCard />
      </div>
    </div>
  );
}
