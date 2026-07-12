import AdminModal from "../shared/AdminModal";
import ModernFileInput from "../shared/ModernFileInput";
import type { YouthRecord } from "./youthRecordData";

export type YouthRecordModalMode = "add" | "edit" | "view" | "delete" | null;

type YouthRecordModalsProps = {
  mode: YouthRecordModalMode;
  onClose: () => void;
  record: YouthRecord | null;
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
  value?: string | number;
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

function SelectField({
  label,
  options,
  placeholder,
  value,
}: {
  label: string;
  options: string[];
  placeholder?: string;
  value?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <select className={inputClass} defaultValue={value || ""}>
        {placeholder ? (
          <option disabled value="">
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function Detail({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value || "-"}</p>
    </div>
  );
}

export default function YouthRecordModals({
  mode,
  onClose,
  record,
}: YouthRecordModalsProps) {
  const isFormOpen = mode === "add" || mode === "edit";
  const isEdit = mode === "edit";

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
              {isEdit ? "Save Changes" : "Add Youth"}
            </button>
          </>
        }
        onClose={onClose}
        open={isFormOpen}
        title={isEdit ? "Edit Youth Record" : "Add New"}
      >
        <div className="grid gap-4">
          <Field
            label="Full Name"
            placeholder="Enter full name"
            value={record?.name}
          />
          <Field
            label="Age"
            placeholder="15-24"
            type="number"
            value={record?.age}
          />
          <SelectField
            label="Gender"
            options={["Male", "Female"]}
            placeholder="Select"
            value={record?.gender}
          />
          <Field
            label="Address"
            placeholder="Enter address"
            value={record?.address}
          />
          <SelectField
            label="Purok"
            options={["Purok 1", "Purok 2", "Purok 3", "Purok 4"]}
            placeholder="e.g. Purok 3"
            value={record?.purok}
          />
          <Field
            label="Contact Number"
            placeholder="09XX-XXX-XXXX"
            value={record?.contact}
          />
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Youth Image
            </span>
            <ModernFileInput accept="image/*" label="Choose youth image" />
          </label>
          <Field
            label="Email"
            placeholder="example@email.com"
            type="email"
            value={record?.email}
          />
          <Field
            label="Password (new youth only)"
            placeholder="At least 6 characters"
            type="password"
          />
          <SelectField
            label="Status"
            options={["Active", "Inactive"]}
            value={record?.status}
          />
          <SelectField
            label="Scholar Status"
            options={["Scholar", "Non-Scholar"]}
            value={record?.scholar}
          />
        </div>
      </AdminModal>

      <AdminModal
        footer={
          <button
            className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4a6f]"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        }
        onClose={onClose}
        open={mode === "view"}
        title="Youth Record Details"
      >
        <div className="grid gap-3 md:grid-cols-2">
          <Detail label="Full Name" value={record?.name} />
          <Detail label="Age" value={record?.age} />
          <Detail label="Gender" value={record?.gender} />
          <Detail label="Contact" value={record?.contact} />
          <Detail label="Email" value={record?.email} />
          <Detail label="Purok" value={record?.purok} />
          <Detail label="Scholar Status" value={record?.scholar} />
          <Detail label="Status" value={record?.status} />
          <div className="md:col-span-2">
            <Detail label="Address" value={record?.address} />
          </div>
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
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              onClick={onClose}
              type="button"
            >
              Delete Record
            </button>
          </>
        }
        maxWidthClass="max-w-md"
        onClose={onClose}
        open={mode === "delete"}
        title="Delete Youth Record"
      >
        <p className="text-sm leading-6 text-slate-600">
          Are you sure you want to delete{" "}
          <strong className="font-semibold text-slate-900">
            {record?.name || "this record"}
          </strong>
          ? This is only a static action for now.
        </p>
      </AdminModal>
    </>
  );
}
