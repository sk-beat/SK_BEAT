import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../auth/useAuth";
import Sidebar from "../../Sidebar/Sidebar";
import FinancialHeader from "./FinancialHeader";
import FinancialModals, { type FinancialModalMode } from "./FinancialModals";
import {
  createAnnualBudget,
  downloadFinancialTransactionsPdf,
  getAnnualBudgets,
  getFinancialEventBudgets,
  getFinancialSummary,
  getFinancialTransactionsForCharts,
  saveFinancialTransaction,
  updateAnnualBudget,
  type AnnualBudget,
  type FinancialEventBudget,
  type FinancialSummary,
  type FinancialTransaction,
  type FinancialTransactionPayload,
} from "./FinancialService";
import FinancialSections from "./FinancialSections";

function getCompletedEventFinancialSummary(
  summary: FinancialSummary | null,
  eventBudgets: FinancialEventBudget[],
) {
  if (!summary) {
    return null;
  }

  const completedEventBudgets = eventBudgets.filter((event) => event.status === "completed");
  const totalAllocatedBudget = completedEventBudgets.reduce(
    (sum, event) => sum + event.allocated_budget,
    0,
  );
  const totalCompletedSpending = completedEventBudgets.reduce(
    (sum, event) => sum + event.completed_spending,
    0,
  );

  return {
    ...summary,
    available_to_spend: summary.total_annual_budget - totalCompletedSpending,
    total_allocated_budget: totalAllocatedBudget,
    total_completed_spending: totalCompletedSpending,
    unallocated_budget: summary.total_annual_budget - totalAllocatedBudget,
  };
}

function getFriendlyFinancialErrorMessage(error: unknown, fallback: string) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String(error.message)
        : String(error ?? "");
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("scheduled event")) {
    return "Expenses can only be added to scheduled events.";
  }

  if (normalizedMessage.includes("selected event does not exist")) {
    return "Selected event no longer exists.";
  }

  if (normalizedMessage.includes("selected event does not belong")) {
    return "Selected event does not belong to this budget year.";
  }

  if (normalizedMessage.includes("amount must be greater")) {
    return "Amount must be greater than zero.";
  }

  if (normalizedMessage.includes("budget year")) {
    return "Create or select a valid budget year first.";
  }

  if (
    normalizedMessage.includes("duplicate key") ||
    normalizedMessage.includes("violates") ||
    normalizedMessage.includes("constraint") ||
    normalizedMessage.includes("postgresterror")
  ) {
    return "Unable to complete this action. Please check the details and try again.";
  }

  return fallback;
}

export default function Financial() {
  const { logout } = useAuth();
  const [annualBudgets, setAnnualBudgets] = useState<AnnualBudget[]>([]);
  const [budgetYearId, setBudgetYearId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [eventBudgets, setEventBudgets] = useState<FinancialEventBudget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [modalMode, setModalMode] = useState<FinancialModalMode>(null);
  const [selectedEvent, setSelectedEvent] =
    useState<FinancialEventBudget | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);

  const selectedBudget = useMemo(
    () =>
      annualBudgets.find((budget) => budget.budget_year_id === budgetYearId) ??
      null,
    [annualBudgets, budgetYearId],
  );

  const loadFinancialData = useCallback(
    async (nextBudgetYearId = budgetYearId) => {
      setErrorMessage("");
      setIsLoading(true);

      try {
        const { data: budgets, error: budgetsError } = await getAnnualBudgets();

        if (budgetsError) {
          throw budgetsError;
        }

        setAnnualBudgets(budgets);

        const activeBudgetId =
          nextBudgetYearId ??
          budgets.find((budget) => budget.fiscal_year === new Date().getFullYear())
            ?.budget_year_id ??
          budgets[0]?.budget_year_id ??
          null;

        setBudgetYearId(activeBudgetId);

        if (!activeBudgetId) {
          setEventBudgets([]);
          setSummary(null);
          setTransactions([]);
          return;
        }

        const [
          { data: summaryData, error: summaryError },
          { data: eventData, error: eventError },
          { data: transactionData, error: transactionError },
        ] = await Promise.all([
          getFinancialSummary(activeBudgetId),
          getFinancialEventBudgets(activeBudgetId),
          getFinancialTransactionsForCharts(activeBudgetId),
        ]);

        if (summaryError) {
          throw summaryError;
        }

        if (eventError) {
          throw eventError;
        }

        if (transactionError) {
          throw transactionError;
        }

        setEventBudgets(eventData ?? []);
        setSummary(getCompletedEventFinancialSummary(summaryData, eventData ?? []));
        setTransactions(transactionData ?? []);
      } catch (error) {
        setErrorMessage(
          getFriendlyFinancialErrorMessage(error, "Unable to load financial data."),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [budgetYearId],
  );

  useEffect(() => {
    void Promise.resolve().then(() => loadFinancialData());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function closeModal() {
    setModalMode(null);
    setSelectedEvent(null);
  }

  async function handleSaveAnnualBudget(amount: number) {
    setIsSaving(true);
    setErrorMessage("");

    try {
      const { error } = selectedBudget
        ? await updateAnnualBudget(selectedBudget.budget_year_id, amount)
        : await createAnnualBudget(amount);

      if (error) {
        throw error;
      }

      setSuccessMessage(selectedBudget ? "Annual budget updated." : "Annual budget created.");
      closeModal();
      await loadFinancialData(selectedBudget?.budget_year_id ?? null);
    } catch (error) {
      setErrorMessage(
        getFriendlyFinancialErrorMessage(error, "Unable to save annual budget."),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveTransaction(payload: FinancialTransactionPayload) {
    setIsSaving(true);
    setErrorMessage("");

    try {
      const { error } = await saveFinancialTransaction(payload);

      if (error) {
        throw error;
      }

      setSuccessMessage("Expense saved.");
      closeModal();
      await loadFinancialData(payload.budget_year_id);
    } catch (error) {
      setErrorMessage(
        getFriendlyFinancialErrorMessage(error, "Unable to save expense."),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleExportData() {
    try {
      const fileName = await downloadFinancialTransactionsPdf(transactions, selectedBudget?.fiscal_year);
      setSuccessMessage(`Downloaded ${transactions.length} financial record(s) to ${fileName}.`);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(getFriendlyFinancialErrorMessage(error, "Unable to export financial data."));
      setSuccessMessage("");
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900">
      <Sidebar onLogout={logout} />
      <main className="ml-[88px] flex min-h-screen flex-1 flex-col transition-[margin-left] duration-300 ease-in-out peer-hover/sidebar:ml-[300px] max-md:ml-[72px] max-md:peer-hover/sidebar:ml-[72px]">
        <FinancialHeader />

        <FinancialSections
          annualBudgets={annualBudgets}
          budgetYearId={budgetYearId}
          errorMessage={errorMessage}
          eventBudgets={eventBudgets}
          isLoading={isLoading}
          onAddExpense={() => {
            setSelectedEvent(null);
            setModalMode("add-expense");
          }}
          onBudgetYearChange={(nextBudgetYearId) => {
            setBudgetYearId(nextBudgetYearId);
            void loadFinancialData(nextBudgetYearId);
          }}
          onOpenAnnualBudget={() => setModalMode("annual-budget")}
          onExportData={handleExportData}
          onOpenEventExpense={(event) => {
            setSelectedEvent(event);
            setModalMode("event-expense");
          }}
          selectedBudget={selectedBudget}
          successMessage={successMessage}
          summary={summary}
          transactions={transactions}
        />
      </main>
      <FinancialModals
        annualBudget={selectedBudget}
        budgetYearId={budgetYearId}
        eventBudgets={eventBudgets}
        isSaving={isSaving}
        mode={modalMode}
        onClose={closeModal}
        onCreateAnnualBudget={handleSaveAnnualBudget}
        onSaveTransaction={handleSaveTransaction}
        selectedEvent={selectedEvent}
        transactions={transactions}
      />
    </div>
  );
}
