import { useEffect, useMemo, useState } from "react";
import { getProfileImageUrl } from "../../../utils/profileImages";
import ImageUploadField from "../../shared/ImageUploadField";
import AdminModal from "../shared/AdminModal";
import type {
  AdminEventRegistration,
  ActivityCalculationType,
  ActivityEvent,
  ActivityEventStatus,
  CompletedEventPerformance,
  ActivityExpense,
  EventCategory,
  SaveActivityEventPayload,
} from "./ActivitiesService";
import { getAdminEventRegistrations } from "./ActivitiesService";

export type ActivitiesModalMode = "catalog" | "schedule" | "categories" | "feedback-qr" | "registrations" | "performance" | null;

type ActivitiesModalsProps = {
  budgetYearId: number | null;
  events: ActivityEvent[];
  isSaving: boolean;
  mode: ActivitiesModalMode;
  onClose: () => void;
  onSave: (payload: SaveActivityEventPayload) => Promise<void>;
  scheduleDate: string;
  completedEventPerformance: CompletedEventPerformance[];
  eventCategories: EventCategory[];
  onCreateCategory: (name: string) => Promise<void>;
  onDeleteCategory: (categoryId: number) => Promise<void>;
  onUpdateCategory: (categoryId: number, name: string) => Promise<void>;
  selectedPerformanceEventId: number | null;
  selectedActivity: ActivityEvent | null;
  selectedPastEvent: ActivityEvent | null;
};

type BudgetRow = {
  id: number;
  expense_type: string;
  calculation_type: ActivityCalculationType;
  unit_cost: string;
  quantity: string;
  description: string;
};

type SuggestedBudgetItem = {
  expense_type: string;
  calculation_type: ActivityCalculationType;
  unit_cost: number;
  description?: string;
};

type EventFormState = {
  event_id: number | null;
  event_name: string;
  category: string;
  status: ActivityEventStatus;
  event_date: string;
  event_time: string;
  location: string;
  expected_attendees: string;
  cover_image: string;
  description: string;
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/15";

const emptyBudgetRow = {
  calculation_type: "fixed" as ActivityCalculationType,
  description: "",
  expense_type: "",
  id: 1,
  quantity: "1",
  unit_cost: "",
};

const suggestedBudgetItems: Record<string, SuggestedBudgetItem[]> = {
  basketball: [
    { expense_type: "Ball", calculation_type: "fixed", unit_cost: 1800 },
    { expense_type: "Net", calculation_type: "fixed", unit_cost: 1200 },
    { expense_type: "Referee Fee", calculation_type: "fixed", unit_cost: 5000 },
    { expense_type: "Jersey", calculation_type: "per_attendee", unit_cost: 350 },
    { expense_type: "Food", calculation_type: "per_attendee", unit_cost: 120 },
    { expense_type: "Water", calculation_type: "per_attendee", unit_cost: 35 },
  ],
  sports: [
    { expense_type: "Referee Fee", calculation_type: "fixed", unit_cost: 4500 },
    { expense_type: "Sports Equipment", calculation_type: "fixed", unit_cost: 3500 },
    { expense_type: "Awards", calculation_type: "fixed", unit_cost: 3000 },
    { expense_type: "Food", calculation_type: "per_attendee", unit_cost: 120 },
    { expense_type: "Water", calculation_type: "per_attendee", unit_cost: 35 },
  ],
  training: [
    { expense_type: "Speaker Honorarium", calculation_type: "fixed", unit_cost: 7000 },
    { expense_type: "Training Materials", calculation_type: "per_attendee", unit_cost: 95 },
    { expense_type: "Food", calculation_type: "per_attendee", unit_cost: 150 },
  ],
  "health & wellness": [
    { expense_type: "Facilitator Honorarium", calculation_type: "fixed", unit_cost: 8000 },
    { expense_type: "IEC Materials", calculation_type: "per_attendee", unit_cost: 60 },
    { expense_type: "Food", calculation_type: "per_attendee", unit_cost: 130 },
  ],
  "community service": [
    { expense_type: "Gloves and Sacks", calculation_type: "fixed", unit_cost: 3000 },
    { expense_type: "Transport Support", calculation_type: "fixed", unit_cost: 2500 },
    { expense_type: "Food", calculation_type: "per_attendee", unit_cost: 100 },
    { expense_type: "Water", calculation_type: "per_attendee", unit_cost: 30 },
  ],
  cultural: [
    { expense_type: "Costume Rental", calculation_type: "fixed", unit_cost: 5000 },
    { expense_type: "Stage Materials", calculation_type: "fixed", unit_cost: 4200 },
    { expense_type: "Food", calculation_type: "per_attendee", unit_cost: 120 },
  ],
};

function PlusIcon({ className }: { className?: string }) {
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
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
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
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  );
}

function formatPeso(amount: number) {
  return `P${amount.toLocaleString("en-PH")}`;
}

function parseMoney(value: string | number) {
  const numericValue =
    typeof value === "number" ? value : Number(value.replace(/[^\d.]/g, ""));

  return Number.isFinite(numericValue) ? numericValue : 0;
}

function getExpectedAttendees(value: string) {
  return Math.max(0, Number(value) || 0);
}

function getBudgetRowQuantity(row: BudgetRow, expectedAttendees: number) {
  if (row.calculation_type === "per_attendee") {
    return expectedAttendees;
  }

  if (row.quantity.trim() === "") {
    return 0;
  }

  return parseMoney(row.quantity);
}

function getBudgetRowTotal(row: BudgetRow, expectedAttendees: number) {
  return parseMoney(row.unit_cost) * getBudgetRowQuantity(row, expectedAttendees);
}

function getSuggestedItems(eventName: string, category: string) {
  const eventKey = eventName.toLowerCase();

  if (eventKey.includes("basketball")) {
    return suggestedBudgetItems.basketball;
  }

  return suggestedBudgetItems[category.toLowerCase()] ?? [];
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  return hours * 60 + minutes;
}

function minutesToTime(minutes: number) {
  const normalizedMinutes = Math.min(Math.max(minutes, 0), 23 * 60 + 59);
  const hours = Math.floor(normalizedMinutes / 60);
  const remainingMinutes = normalizedMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(remainingMinutes).padStart(2, "0")}`;
}

function getEventTimeRange(time: string | null) {
  if (!time) {
    return { endTime: "11:00", startTime: "09:00" };
  }

  const [startTime, endTime] = time.split("-").map((timePart) => timePart.trim());
  const startMinutes = timeToMinutes(startTime);

  return {
    endTime:
      endTime ||
      (startMinutes === null ? "11:00" : minutesToTime(startMinutes + 120)),
    startTime: startTime || "09:00",
  };
}

function rangesOverlap(
  firstStart: string,
  firstEnd: string,
  secondStart: string,
  secondEnd: string,
) {
  const firstStartMinutes = timeToMinutes(firstStart);
  const firstEndMinutes = timeToMinutes(firstEnd);
  const secondStartMinutes = timeToMinutes(secondStart);
  const secondEndMinutes = timeToMinutes(secondEnd);

  if (
    firstStartMinutes === null ||
    firstEndMinutes === null ||
    secondStartMinutes === null ||
    secondEndMinutes === null
  ) {
    return false;
  }

  return firstStartMinutes < secondEndMinutes && secondStartMinutes < firstEndMinutes;
}

function eventToForm(event: ActivityEvent | null): EventFormState {
  return {
    category: event?.category ?? "",
    description: event?.description ?? "",
    event_date: event?.event_date ?? "",
    event_id: event?.event_id || null,
    event_name: event?.event_name ?? "",
    event_time: event?.event_time ?? "09:00",
    expected_attendees: String(event?.expected_attendees ?? ""),
    cover_image: event?.cover_image ?? "",
    location: event?.location ?? "",
    status: event?.status ?? "draft",
  };
}

function eventToBudgetRows(event: ActivityEvent | null): BudgetRow[] {
  if (!event || event.event_expenses.length === 0) {
    return [emptyBudgetRow];
  }

  return event.event_expenses.map((expense, index) => ({
    calculation_type: expense.calculation_type ?? "fixed",
    description: expense.description ?? "",
    expense_type: expense.expense_type,
    id: expense.expense_id ?? index + 1,
    quantity: String(expense.quantity ?? 1),
    unit_cost: String(expense.unit_cost ?? expense.amount),
  }));
}

function getEventTemplateKey(event: Pick<ActivityEvent, "category" | "event_name">) {
  return `${event.event_name.trim().toLowerCase()}::${event.category.trim().toLowerCase()}`;
}

function compareEventRecency(first: ActivityEvent, second: ActivityEvent) {
  const firstDate = first.event_date ? new Date(`${first.event_date}T00:00:00`).getTime() : 0;
  const secondDate = second.event_date ? new Date(`${second.event_date}T00:00:00`).getTime() : 0;

  if (firstDate !== secondDate) {
    return secondDate - firstDate;
  }

  const firstCreated = first.created_at ? new Date(first.created_at).getTime() : 0;
  const secondCreated = second.created_at ? new Date(second.created_at).getTime() : 0;

  if (firstCreated !== secondCreated) {
    return secondCreated - firstCreated;
  }

  return second.event_id - first.event_id;
}

function getLatestCompletedIdenticalEvent(
  events: ActivityEvent[],
  referenceEvent: ActivityEvent | null,
) {
  if (!referenceEvent) {
    return null;
  }

  const referenceKey = getEventTemplateKey(referenceEvent);

  return [...events]
    .filter(
      (event) =>
        event.status === "completed" &&
        getEventTemplateKey(event) === referenceKey,
    )
    .sort(compareEventRecency)[0] ?? null;
}

function Field({
  label,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <input
        className={inputClass}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}

function RequiredMark() {
  return <span className="text-red-500">*</span>;
}

function CatalogEventModal({
  budgetYearId,
  completedEventPerformance,
  eventCategories,
  events,
  isSaving,
  onClose,
  onSave,
  selectedActivity,
}: Pick<
  ActivitiesModalsProps,
  "budgetYearId" | "completedEventPerformance" | "eventCategories" | "events" | "isSaving" | "onClose" | "onSave" | "selectedActivity"
>) {
  const [eventChoice, setEventChoice] = useState<"new" | "existing">(
    selectedActivity?.event_id ? "existing" : "new",
  );
  const [selectedExistingId, setSelectedExistingId] = useState(
    selectedActivity?.event_id ? String(selectedActivity.event_id) : "",
  );
  const [form, setForm] = useState<EventFormState>(eventToForm(selectedActivity));
  const [budgetRows, setBudgetRows] = useState<BudgetRow[]>(
    eventToBudgetRows(selectedActivity),
  );
  const isEditingExistingActivity = Boolean(selectedActivity?.event_id);
  const expectedAttendees = getExpectedAttendees(form.expected_attendees);
  const suggestedItems = getSuggestedItems(form.event_name, form.category);
  const existingEventOptions = Array.from(
    events
      .reduce<Map<string, ActivityEvent>>((options, event) => {
        const key = getEventTemplateKey(event);
        const current = options.get(key);

        if (!current || compareEventRecency(event, current) < 0) {
          options.set(key, event);
        }

        return options;
      }, new Map())
      .values(),
  ).sort((first, second) => first.event_name.localeCompare(second.event_name));
  const selectedExistingEvent = events.find((item) => String(item.event_id) === selectedExistingId) ?? null;
  const latestCompletedTemplateEvent = getLatestCompletedIdenticalEvent(events, selectedExistingEvent);
  const recentIdenticalEvent = latestCompletedTemplateEvent
    ? completedEventPerformance.find((event) => event.event_id === latestCompletedTemplateEvent.event_id) ?? null
    : null;
  const recentExpenseTotal = recentIdenticalEvent?.completed_spending ?? 0;

  const allocatedBudget = useMemo(
    () =>
      budgetRows.reduce(
        (total, row) => total + getBudgetRowTotal(row, expectedAttendees),
        0,
      ),
    [budgetRows, expectedAttendees],
  );
  const budgetAdjustment = recentIdenticalEvent ? recentExpenseTotal - recentIdenticalEvent.allocated_budget : 0;
  const adjustedReferenceBudget = recentIdenticalEvent
    ? recentIdenticalEvent.allocated_budget + budgetAdjustment
    : allocatedBudget;

  function updateForm(field: keyof EventFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function selectExistingEvent(eventId: string) {
    const event = events.find((item) => String(item.event_id) === eventId) ?? null;
    const sourceEvent = getLatestCompletedIdenticalEvent(events, event) ?? event;

    setSelectedExistingId(eventId);
    setForm({
      ...eventToForm(sourceEvent),
      event_date: event?.event_date ?? "",
      event_time: event?.event_time ?? "09:00",
      status: "draft",
    });
    setBudgetRows(eventToBudgetRows(sourceEvent));
  }

  async function handleSave() {
    if (!form.event_name.trim() || !form.category.trim()) {
      return;
    }

    const expenses: ActivityExpense[] = budgetRows
      .filter((row) => row.expense_type.trim() !== "")
      .map((row) => ({
        amount: getBudgetRowTotal(row, expectedAttendees),
        calculation_type: row.calculation_type,
        description: row.description.trim() || null,
        expense_type: row.expense_type.trim(),
        quantity: getBudgetRowQuantity(row, expectedAttendees),
        unit_cost: parseMoney(row.unit_cost),
      }));

    await onSave({
      budget_year_id: budgetYearId,
      category: form.category.trim(),
      description: form.description.trim() || null,
      event_date: form.event_date || null,
      event_id: isEditingExistingActivity ? form.event_id : null,
      event_name: form.event_name.trim(),
      event_time: form.event_time || null,
      expected_attendees: Number(form.expected_attendees) || 0,
      cover_image: form.cover_image || null,
      expenses,
      location: form.location.trim() || null,
      status: form.status,
    });
  }

  return (
    <AdminModal
      footer={
        <>
          <button
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4a6f] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving || form.event_name.trim() === "" || form.category.trim() === ""}
            onClick={handleSave}
            type="button"
          >
            {isSaving ? "Saving..." : "Save Event"}
          </button>
        </>
      }
      onClose={onClose}
      open
      maxWidthClass="max-w-6xl"
      title={selectedActivity?.event_id ? "Edit Event" : "Add New Event"}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Event Type <RequiredMark />
          </span>
          <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1 sm:grid-cols-2">
            {[
              { label: "New Event", value: "new" },
              { label: "Existing Event", value: "existing" },
            ].map((choice) => (
              <button
                className={[
                  "rounded-lg px-3 py-2 text-sm font-semibold transition",
                  eventChoice === choice.value
                    ? "bg-[#1e3a5f] text-white shadow-sm"
                    : "text-slate-600 hover:bg-white",
                ].join(" ")}
                key={choice.value}
                onClick={() => {
                  const nextChoice = choice.value as "new" | "existing";
                  setEventChoice(nextChoice);

                  if (nextChoice === "new") {
                    setSelectedExistingId("");
                    setForm(eventToForm(null));
                    setBudgetRows([emptyBudgetRow]);
                  }
                }}
                type="button"
              >
                {choice.label}
              </button>
            ))}
          </div>
        </div>

        {eventChoice === "existing" ? (
          <label className="block md:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Select Existing Event <RequiredMark />
            </span>
            <select
              className={inputClass}
              onChange={(event) => selectExistingEvent(event.target.value)}
              value={selectedExistingId}
            >
              <option value="">Select event</option>
              {existingEventOptions.map((event) => (
                <option key={event.event_id} value={event.event_id}>
                  {event.event_name} - {event.category}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-slate-400">
              If a completed identical event exists, its latest budget breakdown will be copied.
            </span>
          </label>
        ) : null}

        <div className="md:col-span-2">
          <Field
            label="Event Name *"
            onChange={(value) => updateForm("event_name", value)}
            placeholder="e.g. Basketball"
            value={form.event_name}
          />
        </div>

        <div className="md:col-span-2">
          <ImageUploadField
            disabled={isSaving}
            folder="events"
            label="Event Image"
            onChange={(value) => updateForm("cover_image", value ?? "")}
            value={form.cover_image || null}
          />
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Event Category <RequiredMark />
          </span>
          <select
            className={inputClass}
            onChange={(event) => updateForm("category", event.target.value)}
            value={form.category}
          >
            <option value="" disabled>Select event category</option>
            {eventCategories
              .filter((category) => category.is_active || category.name === form.category)
              .map((category) => (
                <option key={category.category_id} value={category.name}>
                  {category.name}
                </option>
              ))}
            {form.category &&
            !eventCategories.some((category) => category.name === form.category) ? (
              <option value={form.category}>{form.category}</option>
            ) : null}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Status
          </span>
          <select
            className={inputClass}
            onChange={(event) =>
              updateForm("status", event.target.value as ActivityEventStatus)
            }
            value={form.status}
          >
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>

        <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-start justify-between gap-3 max-sm:flex-col">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                Budget Breakdown
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Allocated budget is computed from the rows below.
              </p>
            </div>
            <div className="rounded-lg border border-[#1e3a5f]/15 bg-white px-3 py-2 text-right">
              <span className="block text-[0.68rem] font-bold uppercase text-slate-400">
                Allocated Budget
              </span>
              <strong className="text-sm text-[#1e3a5f]">
                {formatPeso(allocatedBudget)}
              </strong>
            </div>
          </div>

          {selectedExistingEvent ? (
            <div className="mb-3 rounded-lg border border-[#1e3a5f]/10 bg-white px-4 py-3 text-sm text-slate-600">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>
                  Recent identical event expenses:{" "}
                  <strong className="text-slate-800">{formatPeso(recentExpenseTotal)}</strong>
                </span>
                <span>
                  Completed event allocation:{" "}
                  <strong className="text-slate-800">{recentIdenticalEvent ? formatPeso(recentIdenticalEvent.allocated_budget) : "No completed match"}</strong>
                </span>
              </div>
              {!recentIdenticalEvent ? (
                <p className="mt-2 text-xs font-medium text-slate-500">
                  No completed identical event was found, so no recent-expense adjustment is applied.
                </p>
              ) : budgetAdjustment === 0 ? (
                <p className="mt-2 text-xs font-medium text-emerald-600">
                  Recent expense matches the saved allocation. No budget adjustment needed.
                </p>
              ) : (
                <p className={["mt-2 text-xs font-medium", budgetAdjustment > 0 ? "text-red-600" : "text-emerald-600"].join(" ")}>
                  {budgetAdjustment > 0
                    ? `Recent expenses exceeded the completed event allocation. Suggested adjustment: +${formatPeso(budgetAdjustment)} (${formatPeso(recentIdenticalEvent.allocated_budget)} + ${formatPeso(budgetAdjustment)} = ${formatPeso(adjustedReferenceBudget)}).`
                    : `Recent expenses did not use the full completed event allocation. Suggested adjustment: -${formatPeso(Math.abs(budgetAdjustment))} (${formatPeso(recentIdenticalEvent.allocated_budget)} - ${formatPeso(Math.abs(budgetAdjustment))} = ${formatPeso(adjustedReferenceBudget)}).`}
                </p>
              )}
            </div>
          ) : null}

          <div className="space-y-2">
            {budgetRows.map((row, index) => {
              const rowQuantity = getBudgetRowQuantity(row, expectedAttendees);
              const rowTotal = getBudgetRowTotal(row, expectedAttendees);

              return (
                <div
                  className="rounded-lg border border-slate-200 bg-white p-4"
                  key={row.id}
                >
                  <div className="grid gap-3 xl:grid-cols-[minmax(190px,1.4fr)_150px_130px_120px_150px_40px]">
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-slate-500">
                        Suggested Item
                      </span>
                      <select
                        className={inputClass}
                        onChange={(event) => {
                          const suggestedItem = suggestedItems.find(
                            (item) => item.expense_type === event.target.value,
                          );

                          if (!suggestedItem) {
                            return;
                          }

                          const nextRows = [...budgetRows];
                          nextRows[index] = {
                            ...nextRows[index],
                            calculation_type: suggestedItem.calculation_type,
                            description: suggestedItem.description ?? "",
                            expense_type: suggestedItem.expense_type,
                            quantity:
                              suggestedItem.calculation_type === "fixed"
                                ? "1"
                                : String(expectedAttendees),
                            unit_cost: String(suggestedItem.unit_cost),
                          };
                          setBudgetRows(nextRows);
                        }}
                        value={
                          suggestedItems.some(
                            (item) => item.expense_type === row.expense_type,
                          )
                            ? row.expense_type
                            : ""
                        }
                      >
                        <option value="">Manual row</option>
                        {suggestedItems.map((item) => (
                          <option key={item.expense_type} value={item.expense_type}>
                            {item.expense_type}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block min-w-0">
                      <span className="mb-1 block text-xs font-semibold text-slate-500">
                        Item Name
                      </span>
                      <input
                        className={inputClass}
                        onChange={(event) => {
                          const nextRows = [...budgetRows];
                          nextRows[index] = {
                            ...nextRows[index],
                            expense_type: event.target.value,
                          };
                          setBudgetRows(nextRows);
                        }}
                        placeholder="e.g. Referee"
                        value={row.expense_type}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-slate-500">
                        Type
                      </span>
                      <select
                        className={inputClass}
                        onChange={(event) => {
                          const calculationType = event.target
                            .value as ActivityCalculationType;
                          const nextRows = [...budgetRows];
                          nextRows[index] = {
                            ...nextRows[index],
                            calculation_type: calculationType,
                            quantity:
                              calculationType === "per_attendee"
                                ? String(expectedAttendees)
                                : row.quantity || "1",
                          };
                          setBudgetRows(nextRows);
                        }}
                        value={row.calculation_type}
                      >
                        <option value="fixed">Fixed</option>
                        <option value="per_attendee">Per Attendee</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-slate-500">
                        Unit Cost
                      </span>
                      <input
                        className={inputClass}
                        inputMode="numeric"
                        onChange={(event) => {
                          const nextRows = [...budgetRows];
                          nextRows[index] = {
                            ...nextRows[index],
                            unit_cost: event.target.value,
                          };
                          setBudgetRows(nextRows);
                        }}
                        placeholder="0"
                        value={row.unit_cost}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-slate-500">
                        Quantity
                      </span>
                      <input
                        className={inputClass}
                        disabled={row.calculation_type === "per_attendee"}
                        inputMode="numeric"
                        onBlur={() => {
                          if (
                            row.calculation_type === "fixed" &&
                            row.quantity.trim() === ""
                          ) {
                            const nextRows = [...budgetRows];
                            nextRows[index] = {
                              ...nextRows[index],
                              quantity: "1",
                            };
                            setBudgetRows(nextRows);
                          }
                        }}
                        onChange={(event) => {
                          const nextRows = [...budgetRows];
                          nextRows[index] = {
                            ...nextRows[index],
                            quantity: event.target.value,
                          };
                          setBudgetRows(nextRows);
                        }}
                        value={
                          row.calculation_type === "per_attendee"
                            ? String(rowQuantity)
                            : row.quantity
                        }
                      />
                    </label>
                    <button
                      aria-label="Remove budget row"
                      className="mt-5 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={budgetRows.length === 1}
                      onClick={() =>
                        setBudgetRows((rows) =>
                          rows.filter((budgetRow) => budgetRow.id !== row.id),
                        )
                      }
                      type="button"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_280px]">
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-slate-500">
                        Description
                      </span>
                      <input
                        className={inputClass}
                        onChange={(event) => {
                          const nextRows = [...budgetRows];
                          nextRows[index] = {
                            ...nextRows[index],
                            description: event.target.value,
                          };
                          setBudgetRows(nextRows);
                        }}
                        placeholder="Optional note"
                        value={row.description}
                      />
                    </label>
                    <div className="min-w-0 rounded-lg border border-[#1e3a5f]/10 bg-[#1e3a5f]/5 px-3 py-2">
                      <span className="block text-xs font-semibold text-slate-500">
                        Computed Total
                      </span>
                      <strong className="block break-words text-sm text-[#1e3a5f]">
                        {row.expense_type || "Item"} - {formatPeso(parseMoney(row.unit_cost))} x{" "}
                        {rowQuantity} = {formatPeso(rowTotal)}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#1e3a5f]/20 bg-white px-3 py-2 text-sm font-semibold text-[#1e3a5f] hover:bg-[#1e3a5f]/5"
            onClick={() =>
              setBudgetRows((rows) => [
                ...rows,
                {
                  calculation_type: "fixed",
                  description: "",
                  expense_type: "",
                  id: Date.now(),
                  quantity: "1",
                  unit_cost: "",
                },
              ])
            }
            type="button"
          >
            <PlusIcon className="h-4 w-4" />
            Add Row
          </button>
        </div>

        <Field
          label="Default Date"
          onChange={(value) => updateForm("event_date", value)}
          type="date"
          value={form.event_date}
        />
        <Field
          label="Default Time"
          onChange={(value) => updateForm("event_time", value)}
          type="time"
          value={form.event_time}
        />
        <Field
          label="Default Location"
          onChange={(value) => updateForm("location", value)}
          placeholder="Event location"
          value={form.location}
        />
        <Field
          label="Expected Attendees"
          onChange={(value) => updateForm("expected_attendees", value)}
          placeholder="Number of expected attendees"
          type="number"
          value={form.expected_attendees}
        />
        <label className="block md:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Description
          </span>
          <textarea
            className={`${inputClass} min-h-24 resize-none`}
            onChange={(event) => updateForm("description", event.target.value)}
            placeholder="Event description and details"
            value={form.description}
          />
        </label>
      </div>
    </AdminModal>
  );
}

function ScheduleEventModal({
  budgetYearId,
  events,
  isSaving,
  onClose,
  onSave,
  scheduleDate,
}: Pick<
  ActivitiesModalsProps,
  "budgetYearId" | "events" | "isSaving" | "onClose" | "onSave" | "scheduleDate"
>) {
  const schedulableEvents = events.filter(
    (event) =>
      event.status === "draft" ||
      (!event.event_date && event.status !== "completed" && event.status !== "cancelled"),
  );
  const firstSchedulableEvent = schedulableEvents[0] ?? null;
  const [selectedEventId, setSelectedEventId] = useState(
    firstSchedulableEvent ? String(firstSchedulableEvent.event_id) : "",
  );
  const selectedEvent =
    schedulableEvents.find((event) => String(event.event_id) === selectedEventId) ??
    firstSchedulableEvent;
  const initialTimeRange = getEventTimeRange(selectedEvent?.event_time ?? null);
  const [date, setDate] = useState(
    selectedEvent?.event_date || scheduleDate || "",
  );
  const [startTime, setStartTime] = useState(initialTimeRange.startTime);
  const [endTime, setEndTime] = useState(initialTimeRange.endTime);
  const [location, setLocation] = useState(selectedEvent?.location || "");

  const conflictingEvent = events.find((event) => {
    if (
      !selectedEvent ||
      event.event_id === selectedEvent.event_id ||
      event.event_date !== date ||
      event.status === "draft" ||
      event.status === "cancelled"
    ) {
      return false;
    }

    const eventRange = getEventTimeRange(event.event_time);
    return rangesOverlap(
      startTime,
      endTime,
      eventRange.startTime,
      eventRange.endTime,
    );
  });
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const hasInvalidTimeRange =
    startMinutes !== null && endMinutes !== null && startMinutes >= endMinutes;

  function selectEvent(eventId: string) {
    const event = schedulableEvents.find((item) => String(item.event_id) === eventId);
    const eventRange = getEventTimeRange(event?.event_time ?? null);

    setSelectedEventId(eventId);
    setDate(event?.event_date || scheduleDate || "");
    setStartTime(eventRange.startTime);
    setEndTime(eventRange.endTime);
    setLocation(event?.location || "");
  }

  async function handleSchedule() {
    if (!selectedEvent || conflictingEvent || hasInvalidTimeRange) {
      return;
    }

    await onSave({
      budget_year_id: selectedEvent.budget_year_id ?? budgetYearId,
      category: selectedEvent.category,
      description: selectedEvent.description,
      event_date: date || null,
      event_id: null,
      event_name: selectedEvent.event_name,
      event_time: `${startTime}-${endTime}`,
      expected_attendees: selectedEvent.expected_attendees ?? 0,
      cover_image: selectedEvent.cover_image,
      expenses: selectedEvent.event_expenses,
      location: location.trim() || null,
      status: "scheduled",
    });
  }

  return (
    <AdminModal
      footer={
        <>
          <button
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4a6f] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={
              isSaving ||
              !selectedEvent ||
              !date ||
              !startTime ||
              !endTime ||
              !location.trim() ||
              hasInvalidTimeRange ||
              Boolean(conflictingEvent)
            }
            onClick={handleSchedule}
            type="button"
          >
            {isSaving ? "Scheduling..." : "Schedule on Calendar"}
          </button>
        </>
      }
      onClose={onClose}
      open
      title="Schedule Event"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <p className="text-sm font-medium text-slate-400 md:col-span-2">
          Pumili ng event para i-schedule.
        </p>
        <div className="md:col-span-2">
          <Field label="Date" onChange={setDate} type="date" value={date} />
        </div>
        <div className="md:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Piliin ang Event <RequiredMark />
          </span>
          {schedulableEvents.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {schedulableEvents.map((event) => (
                <button
                  className={[
                    "rounded-lg border p-3 text-left hover:border-[#1e3a5f]",
                    String(event.event_id) === selectedEventId
                      ? "border-[#1e3a5f] bg-[#1e3a5f]/5"
                      : "border-slate-200 bg-slate-50",
                  ].join(" ")}
                  key={event.event_id}
                  onClick={() => selectEvent(String(event.event_id))}
                  type="button"
                >
                  <span className="block text-sm font-semibold text-slate-800">
                    {event.event_name}
                  </span>
                  <span className="block text-xs font-semibold text-[#1e3a5f]">
                    {formatPeso(event.allocated_budget)}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {event.category}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
              No draft or unscheduled events available.
            </p>
          )}
        </div>
        <Field
          label="Start Time *"
          onChange={setStartTime}
          type="time"
          value={startTime}
        />
        <Field
          label="End Time *"
          onChange={setEndTime}
          type="time"
          value={endTime}
        />
        <Field
          label="Location *"
          onChange={setLocation}
          placeholder="Event location"
          value={location}
        />
        {(conflictingEvent || hasInvalidTimeRange) && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 md:col-span-2">
            {hasInvalidTimeRange
              ? "End time must be later than start time."
              : `${conflictingEvent?.event_name} already occupies that time slot.`}
          </p>
        )}
      </div>
    </AdminModal>
  );
}

function EventCategoriesModal({
  eventCategories,
  isSaving,
  onClose,
  onCreateCategory,
  onDeleteCategory,
  onUpdateCategory,
}: Pick<
  ActivitiesModalsProps,
  | "eventCategories"
  | "isSaving"
  | "onClose"
  | "onCreateCategory"
  | "onDeleteCategory"
  | "onUpdateCategory"
>) {
  const [newCategory, setNewCategory] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function addCategory() {
    const name = newCategory.trim();
    if (!name) {
      setErrorMessage("Category name is required.");
      return;
    }

    await onCreateCategory(name);
    setNewCategory("");
    setErrorMessage("");
  }

  async function saveEdit() {
    const name = editingName.trim();
    if (!editingId || !name) {
      setErrorMessage("Category name is required.");
      return;
    }

    await onUpdateCategory(editingId, name);
    setEditingId(null);
    setEditingName("");
    setErrorMessage("");
  }

  return (
    <AdminModal
      footer={
        <button
          className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4a6f]"
          onClick={onClose}
          type="button"
        >
          Done
        </button>
      }
      maxWidthClass="max-w-2xl"
      onClose={onClose}
      open
      title="Event Categories"
    >
      <div className="grid gap-4">
        {errorMessage ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </p>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            className={inputClass}
            disabled={isSaving}
            onChange={(event) => setNewCategory(event.target.value)}
            placeholder="New event category"
            value={newCategory}
          />
          <button
            className="rounded-lg bg-[#1e3a5f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2a4a6f] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving}
            onClick={addCategory}
            type="button"
          >
            Add Category
          </button>
        </div>

        <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
          {eventCategories.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">No categories yet.</p>
          ) : null}
          {eventCategories.map((category) => (
            <div className="grid gap-3 p-4 sm:grid-cols-[1fr_auto]" key={category.category_id}>
              {editingId === category.category_id ? (
                <input
                  className={inputClass}
                  disabled={isSaving}
                  onChange={(event) => setEditingName(event.target.value)}
                  value={editingName}
                />
              ) : (
                <div>
                  <p className="font-semibold text-slate-800">{category.name}</p>
                  <p className="text-xs text-slate-400">
                    {category.is_active ? "Active" : "Inactive"}
                  </p>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {editingId === category.category_id ? (
                  <>
                    <button
                      className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-sm font-medium text-white"
                      disabled={isSaving}
                      onClick={saveEdit}
                      type="button"
                    >
                      Save
                    </button>
                    <button
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
                      disabled={isSaving}
                      onClick={() => {
                        setEditingId(null);
                        setEditingName("");
                      }}
                      type="button"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      disabled={isSaving}
                      onClick={() => {
                        setEditingId(category.category_id);
                        setEditingName(category.name);
                      }}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                      disabled={isSaving}
                      onClick={() => onDeleteCategory(category.category_id)}
                      type="button"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminModal>
  );
}

function RegistrationsModal({
  onClose,
  selectedActivity,
}: Pick<ActivitiesModalsProps, "onClose" | "selectedActivity">) {
  const [rows, setRows] = useState<AdminEventRegistration[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | "registered" | "attended" | "absent">("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const summary = rows[0];

  useEffect(() => {
    let isMounted = true;

    async function loadRows() {
      if (!selectedActivity) return;
      setIsLoading(true);
      setErrorMessage("");
      const { data, error } = await getAdminEventRegistrations({
        attendanceStatus: status || null,
        eventId: selectedActivity.event_id,
        search,
      });
      if (!isMounted) return;
      if (error) setErrorMessage(error.message);
      setRows(data);
      setIsLoading(false);
    }

    loadRows();

    return () => {
      isMounted = false;
    };
  }, [search, selectedActivity, status]);

  return (
    <AdminModal
      footer={
        <button
          className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4a6f]"
          onClick={onClose}
          type="button"
        >
          Done
        </button>
      }
      maxWidthClass="max-w-5xl"
      onClose={onClose}
      open
      title={`Registrations${selectedActivity ? ` - ${selectedActivity.event_name}` : ""}`}
    >
      <div className="grid gap-3 md:grid-cols-4">
        {[
          ["Total", summary?.total_registrations ?? 0],
          ["Registered", summary?.registered_count ?? 0],
          ["Attended", summary?.attended_count ?? 0],
          ["Remaining", summary?.remaining_slots ?? "No limit"],
        ].map(([label, value]) => (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3" key={label}>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">{label}</p>
            <p className="mt-1 text-xl font-bold text-[#1e3a5f]">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_220px]">
        <input
          className={inputClass}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name or email"
          value={search}
        />
        <select
          className={inputClass}
          onChange={(event) => setStatus(event.target.value as typeof status)}
          value={status}
        >
          <option value="">All statuses</option>
          <option value="registered">Registered</option>
          <option value="attended">Attended</option>
          <option value="absent">Absent</option>
        </select>
      </div>

      {errorMessage ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
        {isLoading ? (
          <div className="p-5 text-sm text-slate-500">Loading registrations...</div>
        ) : rows.length === 0 ? (
          <div className="p-5 text-sm text-slate-500">No registrations found.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {rows.map((row) => (
              <article className="grid gap-3 p-4 md:grid-cols-[auto_1fr_auto] md:items-center" key={row.registration_id}>
                {getProfileImageUrl(row.profile_image) ? (
                  <img
                    alt={row.fullname}
                    className="h-11 w-11 rounded-full object-cover"
                    src={getProfileImageUrl(row.profile_image) || ""}
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1e3a5f] text-sm font-bold text-white">
                    {row.fullname.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{row.fullname}</h3>
                  <p className="text-xs text-slate-500">{row.email} {row.purok ? `- ${row.purok}` : ""}</p>
                  <p className="text-xs text-slate-400">
                    Registered {row.registration_date ? new Date(row.registration_date).toLocaleString("en-PH") : "date unavailable"}
                  </p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold capitalize text-blue-700">
                  {row.attendance_status ?? "registered"}
                </span>
              </article>
            ))}
          </div>
        )}
      </div>
    </AdminModal>
  );
}

function EventPerformanceDialog({
  completedEventPerformance,
  onClose,
  selectedPerformanceEventId,
}: Pick<
  ActivitiesModalsProps,
  "completedEventPerformance" | "onClose" | "selectedPerformanceEventId"
>) {
  const performance = completedEventPerformance.find(
    (event) => event.event_id === selectedPerformanceEventId,
  );
  const costPerAttendee =
    performance && performance.attendance_count > 0
      ? performance.completed_spending / performance.attendance_count
      : null;

  return (
    <AdminModal
      footer={
        <button
          className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4a6f]"
          onClick={onClose}
          type="button"
        >
          Done
        </button>
      }
      maxWidthClass="max-w-4xl"
      onClose={onClose}
      open
      title={performance ? `Performance - ${performance.event_name}` : "Event Performance"}
    >
      {!performance ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
          Performance record was not found for this event.
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-900">
              {performance.event_name}
            </h3>
            <p className="text-sm text-slate-500">
              {performance.category} - {performance.event_date || "No date"}
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              ["Expected Attendees", performance.expected_attendees ?? "Not set"],
              ["Registrations", performance.registration_count],
              ["Attendance Count", performance.attendance_count],
              ["Attendance Rate", performance.attendance_rate === null ? "Not available" : `${performance.attendance_rate}%`],
              ["Registration Fill", performance.registration_fill_rate === null ? "Not available" : `${performance.registration_fill_rate}%`],
              ["Feedback Count", performance.feedback_count],
              ["Average Feedback", performance.average_feedback_rating === null ? "Not available" : `${performance.average_feedback_rating}/5`],
              ["Allocated Budget", formatPeso(performance.allocated_budget)],
              ["Completed Spending", formatPeso(performance.completed_spending)],
              ["Budget Utilization", performance.budget_utilization_percentage === null ? "Not available" : `${performance.budget_utilization_percentage}%`],
              ["Cost per Attendee", costPerAttendee === null ? "Not available" : formatPeso(costPerAttendee)],
            ].map(([label, value]) => (
              <div
                className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                key={label}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                  {label}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminModal>
  );
}

export default function ActivitiesModals({
  budgetYearId,
  events,
  isSaving,
  mode,
  onClose,
  onSave,
  scheduleDate,
  completedEventPerformance,
  selectedPerformanceEventId,
  selectedActivity,
  selectedPastEvent,
  eventCategories,
  onCreateCategory,
  onDeleteCategory,
  onUpdateCategory,
}: ActivitiesModalsProps) {
  const feedbackUrl = selectedPastEvent
    ? `${window.location.origin}/event-feedback/${selectedPastEvent.event_id}`
    : "";
  const qrImageUrl = feedbackUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(feedbackUrl)}`
    : "";

  return (
    <>
      {mode === "catalog" ? (
        <CatalogEventModal
          budgetYearId={budgetYearId}
          completedEventPerformance={completedEventPerformance}
          eventCategories={eventCategories}
          events={events}
          isSaving={isSaving}
          onClose={onClose}
          onSave={onSave}
          selectedActivity={selectedActivity}
        />
      ) : null}

      {mode === "categories" ? (
        <EventCategoriesModal
          eventCategories={eventCategories}
          isSaving={isSaving}
          onClose={onClose}
          onCreateCategory={onCreateCategory}
          onDeleteCategory={onDeleteCategory}
          onUpdateCategory={onUpdateCategory}
        />
      ) : null}

      {mode === "schedule" ? (
        <ScheduleEventModal
          budgetYearId={budgetYearId}
          events={events}
          isSaving={isSaving}
          onClose={onClose}
          onSave={onSave}
          scheduleDate={scheduleDate}
        />
      ) : null}

      {mode === "registrations" ? (
        <RegistrationsModal
          onClose={onClose}
          selectedActivity={selectedActivity}
        />
      ) : null}

      {mode === "performance" ? (
        <EventPerformanceDialog
          completedEventPerformance={completedEventPerformance}
          onClose={onClose}
          selectedPerformanceEventId={selectedPerformanceEventId}
        />
      ) : null}

      <AdminModal
        footer={
          <button
            className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4a6f]"
            onClick={onClose}
            type="button"
          >
            Done
          </button>
        }
        maxWidthClass="max-w-md"
        onClose={onClose}
        open={mode === "feedback-qr"}
        title="Feedback QR"
      >
        <div className="text-center">
          <p className="text-sm font-medium text-slate-800">
            {selectedPastEvent?.event_name || "Past Event"}
          </p>
          {qrImageUrl ? (
            <img
              alt={`Feedback QR for ${selectedPastEvent?.event_name ?? "event"}`}
              className="mx-auto mt-5 h-56 w-56 rounded-2xl border-4 border-[#1e3a5f] bg-white p-3"
              src={qrImageUrl}
            />
          ) : null}
          <p className="mt-4 break-all rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            {feedbackUrl || "No feedback URL available."}
          </p>
          <p className="mt-4 text-sm text-slate-500">
            Scan to open this completed event's feedback form.
          </p>
        </div>
      </AdminModal>
    </>
  );
}
