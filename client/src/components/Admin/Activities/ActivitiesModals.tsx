import AdminModal from "../shared/AdminModal";
import type { ActivityCatalogItem } from "./activitiesData";

export type ActivitiesModalMode = "catalog" | "schedule" | "feedback-qr" | null;

type ActivitiesModalsProps = {
  mode: ActivitiesModalMode;
  onClose: () => void;
  selectedActivity: ActivityCatalogItem | null;
  selectedPastEvent: string | null;
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

function RequiredMark() {
  return <span className="text-red-500">*</span>;
}

export default function ActivitiesModals({
  mode,
  onClose,
  selectedActivity,
  selectedPastEvent,
}: ActivitiesModalsProps) {
  return (
    <>
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
              className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4a6f]"
              onClick={onClose}
              type="button"
            >
              Save Event
            </button>
          </>
        }
        onClose={onClose}
        open={mode === "catalog"}
        title={selectedActivity ? "Edit Event" : "Add New Event"}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field
              label="Event Name *"
              placeholder="e.g. Volleyball Tournament"
              value={selectedActivity?.title}
            />
          </div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Category <RequiredMark />
            </span>
            <select className={inputClass} defaultValue={selectedActivity?.category}>
              <option>Select category</option>
              <option>Sports</option>
              <option>Training</option>
              <option>Community Service</option>
              <option>Health & Wellness</option>
              <option>Cultural</option>
            </select>
          </label>
          <Field
            label="Organizer"
            placeholder="Organizer name"
            value={selectedActivity ? "SK Sports Committee" : undefined}
          />
          <div className="md:col-span-2">
            <Field
              label="Allocated Budget (P) *"
              placeholder="0.00"
              value={selectedActivity?.budget?.replace(/[^\d]/g, "")}
            />
          </div>
          <p className="text-sm font-medium text-slate-400 md:col-span-2">
            Expense breakdown is now managed in the Financial page.
          </p>
          <Field
            label="Default Time"
            placeholder="09:00 AM"
            type="time"
            value={selectedActivity ? "08:00" : "09:00"}
          />
          <Field
            label="Default Location"
            placeholder="Event location"
            value={selectedActivity ? "Barangay Covered Court" : undefined}
          />
          <div className="md:col-span-2">
            <Field
              label="Expected Attendees"
              placeholder="Number of expected attendees"
              type="number"
              value={selectedActivity ? "80" : undefined}
            />
          </div>
          <label className="block md:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Description
            </span>
            <textarea
              className={`${inputClass} min-h-24 resize-none`}
              defaultValue={
                selectedActivity
                  ? "Inter-barangay youth volleyball tournament."
                  : undefined
              }
              placeholder="Event description and details"
            />
          </label>
        </div>
      </AdminModal>

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
              className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4a6f]"
              onClick={onClose}
              type="button"
            >
              Schedule on Calendar
            </button>
          </>
        }
        onClose={onClose}
        open={mode === "schedule"}
        title="Schedule Event"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <p className="text-sm font-medium text-slate-400 md:col-span-2">
            Pumili ng event para i-schedule sa July 13, 2026.
          </p>
          <div className="md:col-span-2">
            <Field label="Date" value="2026-07-13" />
          </div>
          <div className="md:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Piliin ang Event <RequiredMark />
            </span>
            <button
              className="w-full max-w-56 rounded-lg border border-[#1e3a5f]/20 bg-slate-50 p-3 text-left hover:border-[#1e3a5f]"
              type="button"
            >
              <span className="block text-sm font-semibold text-slate-800">
                Volleyball Tournament
              </span>
              <span className="block text-xs font-semibold text-[#1e3a5f]">
                P25,000
              </span>
              <span className="block text-xs text-slate-500">Sports</span>
            </button>
          </div>
          <Field label="Time *" type="time" value="09:00" />
          <Field label="Location *" placeholder="Event location" />
        </div>
      </AdminModal>

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
