// path/to/your/YouthRecordModals.tsx
import { useEffect, useState } from "react";
import AdminModal from "../shared/AdminModal";
import ModernFileInput from "../shared/ModernFileInput";
import type { CreateYouthRecord, YouthRecord } from "./youthRecordData";

export type YouthRecordModalMode = "add" | "edit" | "view" | "delete" | null;

type YouthRecordModalsProps = {
  mode: YouthRecordModalMode;
  onClose: () => void;
  record: YouthRecord | null;
  onCreate: (data: CreateYouthRecord) => Promise<void>;
  onUpdate: (profile_id: string, data: CreateYouthRecord) => Promise<void>;
  onDelete: (profile_id: string) => Promise<void>;
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/15";

function Field({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  type?: string;
  value: string | number;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <input
        className={inputClass}
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={onChange}
      />
    </label>
  );
}

function SelectField({
  label,
  options,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  placeholder?: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <select className={inputClass} value={value} onChange={onChange}>
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
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
  onUpdate,
  onCreate,
  onDelete,
}: YouthRecordModalsProps) {
  const isFormOpen = mode === "add" || mode === "edit";
  const isEdit = mode === "edit";
  const isView = mode === "view";
  const isDeleteMode = mode === "delete";

  const [name, setName] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [gender, setGender] = useState<"Male" | "Female" | "">("");
  const [address, setAddress] = useState("");
  const [purok, setPurok] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive" | "">("");
  const [scholar, setScholar] = useState<"Scholar" | "Non-Scholar" | "">("");

  useEffect(() => {
    if (record) {
      setName(record.fullname ?? "");
      setAge(record.age ?? "");
      setGender(record.gender ?? "");
      setAddress(record.address_line ?? "");
      setPurok(record.purok ?? "");
      setContact(record.contact_number ?? "");
      setEmail(record.email ?? "");
      setStatus(record.educational_status ?? "");
      setScholar(record.scholar_status ?? "");
      setPassword(record.password ?? "");
    } else {
      setName("");
      setAge("");
      setGender("");
      setAddress("");
      setPurok("");
      setContact("");
      setEmail("");
      setStatus("");
      setScholar("");
      setPassword("");
    }
  }, [record, mode]);

  async function handleSubmit() {
    if (!gender || !status || !scholar || (!isEdit && !password)) {
      alert("Please complete all fields (including password)");
      return;
    }

    const youth: CreateYouthRecord = {
      fullname: name,
      age: age === "" ? 0 : age,
      gender,
      address_line: address,
      purok,
      contact_number: contact,
      email,
      educational_status: status,
      scholar_status: scholar,
      profile_image: record?.profile_image ?? "",
      password,
    };

    try {
      if (isEdit && record) {
        await onUpdate(record.profile_id, youth);
      } else {
        await onCreate(youth);
      }
      onClose();
    } catch (err: any) {
      alert(err.message || "An error occurred.");
    }
  }

  async function handleDelete() {
    if (!record) return;
    try {
      await onDelete(record.profile_id);
      onClose();
    } catch (err: any) {
      alert(err.message || "Failed to delete.");
    }
  }

  return (
    <>
      {/* Form / Edit Modal */}
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
              onClick={handleSubmit}
              type="button"
            >
              {isEdit ? "Save Changes" : "Add Youth"}
            </button>
          </>
        }
        onClose={onClose}
        open={isFormOpen}
        title={isEdit ? "Edit Youth Record" : "Add New Youth Record"}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field label="Full Name" placeholder="Enter full name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <Field label="Age" type="number" value={age} onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))} />
          <SelectField label="Gender" options={["Male", "Female"]} placeholder="Select" value={gender} onChange={(e) => setGender(e.target.value as "Male" | "Female")} />
          <Field label="Contact Number" placeholder="Enter contact number" value={contact} onChange={(e) => setContact(e.target.value)} />
          <Field label="Email Address" type="email" placeholder="Enter email" value={email} onChange={(e) => setEmail(e.target.value)} />
          
          {!isEdit && (
            <div className="md:col-span-2">
              <Field label="Account Password" type="password" placeholder="Assign user password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          )}

          <Field label="Address Line" placeholder="Street, village" value={address} onChange={(e) => setAddress(e.target.value)} />
          <Field label="Purok" placeholder="Enter Purok" value={purok} onChange={(e) => setPurok(e.target.value)} />
          <SelectField label="Educational Status" options={["Active", "Inactive"]} placeholder="Select Status" value={status} onChange={(e) => setStatus(e.target.value as "Active" | "Inactive")} />
          <SelectField label="Scholar Status" options={["Scholar", "Non-Scholar"]} placeholder="Select Status" value={scholar} onChange={(e) => setScholar(e.target.value as "Scholar" | "Non-Scholar")} />
        </div>
      </AdminModal>

      {/* Read / View Info Modal */}
      <AdminModal
        footer={
          <button className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900" onClick={onClose} type="button">
            Close View
          </button>
        }
        onClose={onClose}
        open={isView}
        title="Youth Profile Details"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><Detail label="Full Name" value={name} /></div>
          <Detail label="Age" value={age} />
          <Detail label="Gender" value={gender} />
          <Detail label="Contact" value={contact} />
          <Detail label="Email" value={email} />
          <Detail label="Address" value={address} />
          <Detail label="Purok" value={purok} />
          <Detail label="Education" value={status} />
          <Detail label="Scholar Status" value={scholar} />
        </div>
      </AdminModal>

      {/* Delete Confirmation Modal */}
      <AdminModal
        footer={
          <>
            <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700" onClick={handleDelete} type="button">
              Confirm Delete
            </button>
          </>
        }
        onClose={onClose}
        open={isDeleteMode}
        title="Delete Youth Record"
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to permanently delete the profile of <strong className="text-slate-900">{name}</strong>? This action cannot be reversed.
        </p>
      </AdminModal>
    </>
  );
}
