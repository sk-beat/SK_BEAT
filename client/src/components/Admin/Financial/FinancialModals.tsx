import AdminModal from "../shared/AdminModal";
import ModernFileInput from "../shared/ModernFileInput";
import type { EventBudget } from "./financialData";

export type FinancialModalMode =
  | "add-expense"
  | "annual-budget"
  | "event-budget"
  | "event-expense"
  | null;

type FinancialModalsProps = {
  mode: FinancialModalMode;
  onClose: () => void;
  selectedEvent: EventBudget | null;
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/15";

function Field({
  label,
  placeholder,
  type = "text",
  value,
}: {
  label: string;
  placeholder?: string;
  type?: string;
  value?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <input
        className={inputClass}
        defaultValue={value}
        placeholder={placeholder}
        type={type}
      />
    </label>
  );
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

function BudgetFooter({ label, onClose }: { label: string; onClose: () => void }) {
  return (
    <>
      <button
        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        onClick={onClose}
        type="button"
      >
        Cancel
      </button>
      <button
        className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4a6f]"
        onClick={onClose}
        type="button"
      >
        {label}
      </button>
    </>
  );
}

export default function FinancialModals({
  mode,
  onClose,
  selectedEvent,
}: FinancialModalsProps) {
  return (
    <>
      <AdminModal
        footer={<BudgetFooter label="Save Expense" onClose={onClose} />}
        onClose={onClose}
        open={mode === "add-expense"}
        title="Add Expense"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Expense Title" />
          <Field label="Amount" type="number" />
          <Field label="Date" type="date" />
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Category
            </span>
            <select className={inputClass}>
              <option>Sports Programs</option>
              <option>Educational Activities</option>
              <option>Community Service</option>
              <option>Health & Wellness</option>
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Notes
            </span>
            <textarea className={`${inputClass} min-h-24 resize-none`} />
          </label>
        </div>
      </AdminModal>

      <AdminModal
        footer={
          <>
            <button
              className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4a6f]"
              onClick={onClose}
              type="button"
            >
              Save
            </button>
            <button
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
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
        title="Set Annual Budget"
      >
        <div className="grid gap-4">
          <Field label="Total Annual Budget (P)" type="number" value="460000" />
          <p className="text-sm font-medium text-slate-400">
            This amount will be used as the total annual budget reference.
          </p>
        </div>
      </AdminModal>

      <AdminModal
        footer={<BudgetFooter label="Save Event Budget" onClose={onClose} />}
        maxWidthClass="max-w-md"
        onClose={onClose}
        open={mode === "event-budget"}
        title="Event Budget"
      >
        <div className="grid gap-4">
          <Field label="Event Name" value={selectedEvent?.title} />
          <Field label="Allocated Budget" value={selectedEvent?.allocated} />
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
              <p>{selectedEvent.title} - 2026-07-17 08:00</p>
              <p className="mt-2">
                Allocated: {selectedEvent.allocated} | Spent:{" "}
                {selectedEvent.spent} | Remaining: P0
              </p>
            </div>
          ) : null}

          <section>
            <h3 className="mb-4 text-base font-semibold text-slate-800">
              Add Expense
            </h3>
            <div className="grid gap-4 md:grid-cols-[160px_1fr] md:items-start">
              <span className="pt-2 text-sm font-medium text-slate-700">
                Description <span className="text-red-500">*</span>
              </span>
              <input
                className={inputClass}
                placeholder="e.g. Venue rental, prizes"
                type="text"
              />
              <span className="pt-2 text-sm font-medium text-slate-700">
                Amount (P) <span className="text-red-500">*</span>
              </span>
              <input className={inputClass} placeholder="0.00" type="number" />
              <span className="pt-2 text-sm font-medium text-slate-700">
                Date
              </span>
              <input className={inputClass} type="date" />
              <span className="pt-2 text-sm font-medium text-slate-700">
                Notes
              </span>
              <textarea
                className={`${inputClass} min-h-20 resize-none`}
                placeholder="Where this was spent, OR details"
              />
              <span className="pt-2 text-sm font-medium text-slate-700">
                Upload receipt / photo (optional)
              </span>
              <ModernFileInput
                accept="image/*,.pdf"
                label="Upload receipt or photo"
              />
            </div>
            <button
              className="mt-4 rounded-lg bg-[#1e3a5f] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#2a4a6f]"
              onClick={onClose}
              type="button"
            >
              Add Expense
            </button>
          </section>

          <section className="border-t border-slate-200 pt-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-slate-800">
                Recorded Expenses
              </h3>
              <button
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                type="button"
              >
                <DownloadIcon className="h-4 w-4" />
                Export PDF
              </button>
            </div>
            <div className="grid gap-3">
              {[
                { amount: "P35,000", date: "2026-07-11", note: "sadas", title: "dasdas" },
                { amount: "P10,000", date: "2026-07-09", note: "dsdas", title: "dsad" },
              ].map((expense) => (
                <article
                  className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4"
                  key={expense.title}
                >
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">
                      {expense.title}
                    </h4>
                    <p className="mt-1 text-xs font-medium text-slate-400">
                      {expense.date} {expense.note}
                    </p>
                  </div>
                  <strong className="text-sm text-slate-800">
                    {expense.amount}
                  </strong>
                </article>
              ))}
            </div>
          </section>
        </div>
      </AdminModal>
    </>
  );
}
