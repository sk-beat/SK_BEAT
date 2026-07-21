import { useEffect, useMemo, useState } from "react";
import AdminModal from "../shared/AdminModal";
import ModernFileInput from "../shared/ModernFileInput";
import {
  type AnnualBudget,
  downloadEventExpensePdf,
  type FinancialEventBudget,
  type FinancialTransaction,
  type FinancialTransactionPayload,
} from "./FinancialService";

export type FinancialModalMode =
  | "add-expense"
  | "annual-budget"
  | "event-expense"
  | null;

type FinancialModalsProps = {
  annualBudget: AnnualBudget | null;
  budgetYearId: number | null;
  eventBudgets: FinancialEventBudget[];
  isSaving: boolean;
  mode: FinancialModalMode;
  onClose: () => void;
  onCreateAnnualBudget: (amount: number) => Promise<void>;
  onSaveTransaction: (payload: FinancialTransactionPayload) => Promise<void>;
  selectedEvent: FinancialEventBudget | null;
  transactions: FinancialTransaction[];
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/15";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatPeso(value: number) {
  return new Intl.NumberFormat("en-PH", {
    currency: "PHP",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function labelize(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function DownloadIcon({ className }: { className?: string }) {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  );
}

export default function FinancialModals({
  annualBudget,
  budgetYearId,
  eventBudgets,
  isSaving,
  mode,
  onClose,
  onCreateAnnualBudget,
  onSaveTransaction,
  selectedEvent,
  transactions,
}: FinancialModalsProps) {
  const [amount, setAmount] = useState("");
  const [budgetInput, setBudgetInput] = useState<number | "">("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(today());
  const [description, setDescription] = useState("");
  const [eventId, setEventId] = useState<number | "">("");
  const [formError, setFormError] = useState("");
  const [notes, setNotes] = useState("");
  const [receiptPath, setReceiptPath] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");

  const eventRecords = useMemo(
    () =>
      selectedEvent
        ? transactions.filter(
            (transaction) => transaction.event_id === selectedEvent.event_id,
          )
        : [],
    [selectedEvent, transactions],
  );

  useEffect(() => {
    if (mode !== "add-expense" && mode !== "event-expense") {
      return;
    }

    const timeout = window.setTimeout(() => {
      setAmount("");
      setCategory(selectedEvent?.category ?? "");
      setDate(today());
      setDescription("");
      setEventId(selectedEvent?.event_id ?? "");
      setFormError("");
      setNotes("");
      setReceiptPath("");
      setReferenceNumber("");
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [mode, selectedEvent]);

  useEffect(() => {
    if (mode !== "annual-budget") {
      return;
    }

    const timeout = window.setTimeout(() => {
      setBudgetInput(annualBudget?.total_allocation ?? "");
      setFormError("");
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [annualBudget, mode]);

  async function saveExpense() {
    const numericAmount = Number(amount);

    if (!budgetYearId) {
      setFormError("Create or select a budget year first.");
      return;
    }

    if (!category.trim()) {
      setFormError("Category is required.");
      return;
    }

    if (!description.trim()) {
      setFormError("Description is required.");
      return;
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setFormError("Amount must be greater than zero.");
      return;
    }

    const selectedEventOption = eventId
      ? eventBudgets.find((event) => event.event_id === Number(eventId))
      : null;

    if (
      selectedEventOption &&
      selectedEventOption.budget_year_id !== budgetYearId
    ) {
      setFormError("Selected event does not belong to this budget year.");
      return;
    }

    await onSaveTransaction({
      amount: numericAmount,
      budget_year_id: budgetYearId,
      category: category.trim(),
      description: notes.trim()
        ? `${description.trim()} - ${notes.trim()}`
        : description.trim(),
      event_id: eventId === "" ? null : Number(eventId),
      payment_method: null,
      receipt_path: receiptPath.trim() || null,
      reference_number: referenceNumber.trim() || null,
      status: "completed",
      transaction_date: date,
      transaction_id: null,
      transaction_type: "expense",
    });
  }

  async function exportEventExpenses() {
    if (!selectedEvent) {
      setFormError("Select an event before exporting expenses.");
      return;
    }

    try {
      await downloadEventExpensePdf(selectedEvent, eventRecords);
      setFormError("");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to export event expenses.");
    }
  }

  return (
    <>
      <AdminModal
        footer={
          <>
            <button
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              disabled={isSaving}
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4a6f] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSaving}
              onClick={saveExpense}
              type="button"
            >
              {isSaving ? "Saving..." : "Save Expense"}
            </button>
          </>
        }
        onClose={onClose}
        open={mode === "add-expense"}
        title="Add Expense"
      >
        <div className="grid gap-4 md:grid-cols-2">
          {formError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 md:col-span-2">
              {formError}
            </div>
          ) : null}

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Expense Title
            </span>
            <input
              className={inputClass}
              onChange={(event) => setDescription(event.target.value)}
              value={description}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Amount
            </span>
            <input
              className={inputClass}
              min="0.01"
              onChange={(event) => setAmount(event.target.value)}
              step="0.01"
              type="number"
              value={amount}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Date
            </span>
            <input
              className={inputClass}
              onChange={(event) => setDate(event.target.value)}
              type="date"
              value={date}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Category
            </span>
            <input
              className={inputClass}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="Sports, Training, Supplies"
              value={category}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Related Event
            </span>
            <select
              className={inputClass}
              onChange={(event) =>
                setEventId(event.target.value === "" ? "" : Number(event.target.value))
              }
              value={eventId}
            >
              <option value="">General expense</option>
              {eventBudgets
                .filter((event) => event.status !== "cancelled")
                .map((event) => (
                  <option key={event.event_id} value={event.event_id}>
                    {event.event_name}
                  </option>
                ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Reference Number
            </span>
            <input
              className={inputClass}
              onChange={(event) => setReferenceNumber(event.target.value)}
              value={referenceNumber}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Receipt Path
            </span>
            <input
              className={inputClass}
              onChange={(event) => setReceiptPath(event.target.value)}
              value={receiptPath}
            />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Notes
            </span>
            <textarea
              className={`${inputClass} min-h-24 resize-none`}
              onChange={(event) => setNotes(event.target.value)}
              value={notes}
            />
          </label>
        </div>
      </AdminModal>

      <AdminModal
        footer={
          <>
            <button
              className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4a6f] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSaving}
              onClick={async () => {
                if (budgetInput === "" || budgetInput <= 0) {
                  setFormError("Annual budget must be greater than zero.");
                  return;
                }

                await onCreateAnnualBudget(budgetInput);
                setBudgetInput("");
              }}
              type="button"
            >
              {isSaving ? "Saving..." : annualBudget ? "Update Budget" : "Save"}
            </button>
            <button
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              disabled={isSaving}
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
          </>
        }
        maxWidthClass="max-w-md"
        onClose={onClose}
        open={mode === "annual-budget"}
        title={annualBudget ? "Update Annual Budget" : "Set Annual Budget"}
      >
        <div className="grid gap-4">
          {annualBudget ? (
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-[#1e3a5f]">
              Updating this amount refreshes the financial summary, available-to-spend, and utilization values for the selected budget year.
            </div>
          ) : null}
          {formError ? (
            <p className="text-sm font-medium text-red-600">{formError}</p>
          ) : null}
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Total Annual Budget (PHP)
            </span>
            <input
              className={inputClass}
              min="0.01"
              onChange={(event) =>
                setBudgetInput(
                  event.target.value === "" ? "" : Number(event.target.value),
                )
              }
              type="number"
              value={budgetInput.toString()}
            />
          </label>
          <p className="text-sm font-medium text-slate-400">
            This amount will be used as the total annual budget reference.
          </p>
        </div>
      </AdminModal>

      <AdminModal
        footer={null}
        onClose={onClose}
        open={mode === "event-expense"}
        title="Event Expense"
      >
        <div className="grid gap-6">
          {selectedEvent ? (
            <div className="text-sm font-medium text-slate-400">
              <p>
                {selectedEvent.event_name} - {selectedEvent.event_date ?? "No date"}
              </p>
              <p className="mt-2">
                Allocated: {formatPeso(selectedEvent.allocated_budget)} | Used:{" "}
                {formatPeso(selectedEvent.completed_spending)} | Remaining:{" "}
                <span
                  className={
                    selectedEvent.remaining_event_budget < 0
                      ? "text-red-600"
                      : undefined
                  }
                >
                  {formatPeso(selectedEvent.remaining_event_budget)}
                </span>
              </p>
            </div>
          ) : null}

          <section>
            <h3 className="mb-4 text-base font-semibold text-slate-800">
              Add Expense
            </h3>
            {formError ? (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {formError}
              </div>
            ) : null}
            <div className="grid gap-4 md:grid-cols-[160px_1fr] md:items-start">
              <span className="pt-2 text-sm font-medium text-slate-700">
                Description <span className="text-red-500">*</span>
              </span>
              <input
                className={inputClass}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="e.g. Venue rental, prizes"
                type="text"
                value={description}
              />
              <span className="pt-2 text-sm font-medium text-slate-700">
                Amount (PHP) <span className="text-red-500">*</span>
              </span>
              <input
                className={inputClass}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                type="number"
                value={amount}
              />
              <span className="pt-2 text-sm font-medium text-slate-700">
                Date
              </span>
              <input
                className={inputClass}
                onChange={(event) => setDate(event.target.value)}
                type="date"
                value={date}
              />
              <span className="pt-2 text-sm font-medium text-slate-700">
                Notes
              </span>
              <textarea
                className={`${inputClass} min-h-20 resize-none`}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Where this was spent, OR details"
                value={notes}
              />
              <span className="pt-2 text-sm font-medium text-slate-700">
                Upload receipt / photo (optional)
              </span>
              <ModernFileInput accept="image/*,.pdf" label="Upload receipt or photo" />
            </div>
            <button
              className="mt-4 rounded-lg bg-[#1e3a5f] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#2a4a6f] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSaving}
              onClick={saveExpense}
              type="button"
            >
              {isSaving ? "Saving..." : "Add Expense"}
            </button>
          </section>

          <section className="border-t border-slate-200 pt-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-slate-800">
                Recorded Expenses
              </h3>
              <button
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={exportEventExpenses}
                type="button"
              >
                <DownloadIcon className="h-4 w-4" />
                Export PDF
              </button>
            </div>
            <div className="grid gap-3">
              {eventRecords.length === 0 ? (
                <p className="rounded-lg bg-slate-50 p-4 text-center text-sm text-slate-400">
                  No recorded expenses yet.
                </p>
              ) : (
                eventRecords.map((expense) => (
                  <article
                    className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4"
                    key={expense.transaction_id}
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">
                        {expense.description ?? expense.category}
                      </h4>
                      <p className="mt-1 text-xs font-medium text-slate-400">
                        {expense.transaction_date} - {labelize(expense.status)}
                      </p>
                    </div>
                    <strong className="text-sm text-slate-800">
                      {formatPeso(expense.amount)}
                    </strong>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </AdminModal>
    </>
  );
}
