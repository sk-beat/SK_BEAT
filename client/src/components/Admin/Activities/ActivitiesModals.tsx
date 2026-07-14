import { useMemo, useState } from "react";
import AdminModal from "../shared/AdminModal";
import type {
  ActivityEvent,
  ActivityEventStatus,
  ActivityExpense,
  SaveActivityEventPayload,
} from "./ActivitiesService";

export type ActivitiesModalMode = "catalog" | "schedule" | "feedback-qr" | null;

type ActivitiesModalsProps = {
  budgetYearId: number | null;
  events: ActivityEvent[];
  isSaving: boolean;
  mode: ActivitiesModalMode;
  onClose: () => void;
  onSave: (payload: SaveActivityEventPayload) => Promise<void>;
  scheduleDate: string;
  selectedActivity: ActivityEvent | null;
  selectedPastEvent: string | null;
};

type BudgetRow = {
  id: number;
  expense_type: string;
  amount: string;
  description: string;
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
  description: string;
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/15";

const emptyBudgetRow = {
  amount: "",
  description: "",
  expense_type: "",
  id: 1,
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
    category: event?.category ?? "Sports",
    description: event?.description ?? "",
    event_date: event?.event_date ?? "",
    event_id: event?.event_id ?? null,
    event_name: event?.event_name ?? "",
    event_time: event?.event_time ?? "09:00",
    expected_attendees: String(event?.expected_attendees ?? ""),
    location: event?.location ?? "",
    status: event?.status ?? "draft",
  };
}

function eventToBudgetRows(event: ActivityEvent | null): BudgetRow[] {
  if (!event || event.event_expenses.length === 0) {
    return [emptyBudgetRow];
  }

  return event.event_expenses.map((expense, index) => ({
    amount: String(expense.amount),
    description: expense.description ?? "",
    expense_type: expense.expense_type,
    id: expense.expense_id ?? index + 1,
  }));
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
  events,
  isSaving,
  onClose,
  onSave,
  selectedActivity,
}: Pick<
  ActivitiesModalsProps,
  "budgetYearId" | "events" | "isSaving" | "onClose" | "onSave" | "selectedActivity"
>) {
  const [eventChoice, setEventChoice] = useState<"new" | "existing">(
    selectedActivity ? "existing" : "new",
  );
  const [selectedExistingId, setSelectedExistingId] = useState(
    selectedActivity?.event_id ? String(selectedActivity.event_id) : "",
  );
  const [form, setForm] = useState<EventFormState>(eventToForm(selectedActivity));
  const [budgetRows, setBudgetRows] = useState<BudgetRow[]>(
    eventToBudgetRows(selectedActivity),
  );

  const allocatedBudget = useMemo(
    () =>
      budgetRows.reduce((total, row) => {
        const numericCost = Number(row.amount.replace(/[^\d.]/g, ""));
        return total + (Number.isFinite(numericCost) ? numericCost : 0);
      }, 0),
    [budgetRows],
  );

  function updateForm(field: keyof EventFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function selectExistingEvent(eventId: string) {
    const event = events.find((item) => String(item.event_id) === eventId) ?? null;

    setSelectedExistingId(eventId);
    setForm(eventToForm(event));
    setBudgetRows(eventToBudgetRows(event));
  }

  async function handleSave() {
    const expenses: ActivityExpense[] = budgetRows
      .filter((row) => row.expense_type.trim() !== "")
      .map((row) => ({
        amount: Number(row.amount) || 0,
        description: row.description.trim() || null,
        expense_type: row.expense_type.trim(),
      }));

    await onSave({
      budget_year_id: budgetYearId,
      category: form.category,
      description: form.description.trim() || null,
      event_date: form.event_date || null,
      event_id: eventChoice === "existing" ? form.event_id : null,
      event_name: form.event_name.trim(),
      event_time: form.event_time || null,
      expected_attendees: Number(form.expected_attendees) || 0,
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
            disabled={isSaving || form.event_name.trim() === ""}
            onClick={handleSave}
            type="button"
          >
            {isSaving ? "Saving..." : "Save Event"}
          </button>
        </>
      }
      onClose={onClose}
      open
      title={selectedActivity ? "Edit Event" : "Add New Event"}
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
              {events.map((event) => (
                <option key={event.event_id} value={event.event_id}>
                  {event.event_name}
                </option>
              ))}
            </select>
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

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Category <RequiredMark />
          </span>
          <select
            className={inputClass}
            onChange={(event) => updateForm("category", event.target.value)}
            value={form.category}
          >
            <option>Sports</option>
            <option>Training</option>
            <option>Community Service</option>
            <option>Health & Wellness</option>
            <option>Cultural</option>
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

          <div className="space-y-2">
            {budgetRows.map((row, index) => (
              <div
                className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-[minmax(0,1fr)_140px_40px]"
                key={row.id}
              >
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-500">
                    Item
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
                    Cost (P)
                  </span>
                  <input
                    className={inputClass}
                    inputMode="numeric"
                    onChange={(event) => {
                      const nextRows = [...budgetRows];
                      nextRows[index] = {
                        ...nextRows[index],
                        amount: event.target.value,
                      };
                      setBudgetRows(nextRows);
                    }}
                    placeholder="0"
                    value={row.amount}
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
            ))}
          </div>

          <button
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#1e3a5f]/20 bg-white px-3 py-2 text-sm font-semibold text-[#1e3a5f] hover:bg-[#1e3a5f]/5"
            onClick={() =>
              setBudgetRows((rows) => [
                ...rows,
                {
                  amount: "",
                  description: "",
                  expense_type: "",
                  id: Date.now(),
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
      event_id: selectedEvent.event_id,
      event_name: selectedEvent.event_name,
      event_time: `${startTime}-${endTime}`,
      expected_attendees: selectedEvent.expected_attendees ?? 0,
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

export default function ActivitiesModals({
  budgetYearId,
  events,
  isSaving,
  mode,
  onClose,
  onSave,
  scheduleDate,
  selectedActivity,
  selectedPastEvent,
}: ActivitiesModalsProps) {
  return (
    <>
      {mode === "catalog" ? (
        <CatalogEventModal
          budgetYearId={budgetYearId}
          events={events}
          isSaving={isSaving}
          onClose={onClose}
          onSave={onSave}
          selectedActivity={selectedActivity}
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
            {selectedPastEvent || "Past Event"}
          </p>
          <div className="mx-auto mt-5 grid h-44 w-44 place-items-center rounded-2xl border-4 border-[#1e3a5f] bg-white text-xs font-semibold uppercase tracking-[0.12em] text-[#1e3a5f]">
            QR Code
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Static preview for post-event feedback survey sharing.
          </p>
        </div>
      </AdminModal>
    </>
  );
}
