import { useEffect, useState } from "react";
import AdminModal from "../shared/AdminModal";
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
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 disabled:opacity-70";

const educationalStatusOptions = [
  "Active",
  "Inactive",
  "Student",
  "Out of School Youth",
] as const;

const scholarStatusOptions = ["Scholar", "Non-Scholar"] as const;
const genderOptions = ["Male", "Female"] as const;

type FormErrors = Partial<
  Record<
    | "fullname"
    | "age"
    | "gender"
    | "address"
    | "purok"
    | "email"
    | "password"
    | "education"
    | "scholar"
    | "profileImage",
    string
  >
>;

function Field({
  error,
  label,
  placeholder,
  type = "text",
  value,
  disabled,
  onChange,
}: {
  disabled?: boolean;
  error?: string;
  label: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  value: string | number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <input
        className={[
          inputClass,
          error ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "",
        ].join(" ")}
        disabled={disabled}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
        value={value}
      />
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </label>
  );
}

function SelectField({
  error,
  label,
  options,
  placeholder,
  value,
  disabled,
  onChange,
}: {
  disabled?: boolean;
  error?: string;
  label: string;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  options: readonly string[];
  placeholder?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <select
        className={[
          inputClass,
          error ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "",
        ].join(" ")}
        disabled={disabled}
        onChange={onChange}
        value={value}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </label>
  );
}

function Detail({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-slate-800">
        {value || "-"}
      </p>
    </div>
  );
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidUrl(value: string) {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
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
  const [education, setEducation] = useState<
    YouthRecord["educational_status"] | ""
  >("");
  const [scholar, setScholar] = useState<"Scholar" | "Non-Scholar" | "">("");
  const [profileImage, setProfileImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (record) {
      setName(record.fullname ?? "");
      setAge(record.age ?? "");
      setGender(record.gender ?? "");
      setAddress(record.address_line ?? "");
      setPurok(record.purok ?? "");
      setContact(record.contact_number ?? "");
      setEmail(record.email ?? "");
      setEducation(record.educational_status ?? "");
      setScholar(record.scholar_status ?? "");
      setProfileImage(record.profile_image ?? "");
      setPassword("");
    } else {
      setName("");
      setAge("");
      setGender("");
      setAddress("");
      setPurok("");
      setContact("");
      setEmail("");
      setEducation("");
      setScholar("");
      setProfileImage("");
      setPassword("");
    }

    setErrors({});
  }, [record, mode]);

  function validateForm() {
    const nextErrors: FormErrors = {};
    const trimmedName = name.trim();
    const trimmedAddress = address.trim();
    const trimmedPurok = purok.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedName) {
      nextErrors.fullname = "Full name is required.";
    }

    if (age === "") {
      nextErrors.age = "Age is required.";
    } else if (age < 15 || age > 30) {
      nextErrors.age = "Age must be between 15 and 30.";
    }

    if (!gender) {
      nextErrors.gender = "Gender is required.";
    }

    if (!trimmedEmail) {
      nextErrors.email = "Email is required.";
    } else if (!isValidEmail(trimmedEmail)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!isEdit && trimmedPassword.length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
    }

    if (!trimmedPurok) {
      nextErrors.purok = "Purok is required.";
    }

    if (!trimmedAddress) {
      nextErrors.address = "Address is required.";
    }

    if (!education) {
      nextErrors.education = "Educational status is required.";
    }

    if (!scholar) {
      nextErrors.scholar = "Scholar status is required.";
    }

    if (!isValidUrl(profileImage.trim())) {
      nextErrors.profileImage = "Enter a valid http or https image URL.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    if (loading || !validateForm()) {
      return;
    }

    const youth: CreateYouthRecord = {
      fullname: name.trim(),
      age: age === "" ? 0 : age,
      gender: gender as "Male" | "Female",
      address_line: address.trim(),
      purok: purok.trim(),
      contact_number: contact.trim(),
      email: email.trim(),
      educational_status: education as YouthRecord["educational_status"],
      scholar_status: scholar as "Scholar" | "Non-Scholar",
      profile_image: profileImage.trim(),
      password,
    };

    try {
      setLoading(true);

      if (isEdit && record) {
        await onUpdate(record.profile_id, youth);
      } else {
        await onCreate(youth);
      }

      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An error occurred.";
      alert(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!record || loading) {
      return;
    }

    try {
      setLoading(true);
      await onDelete(record.profile_id);
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete.";
      alert(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AdminModal
        footer={
          <>
            <button
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading}
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>

            <button
              className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4a6f] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading}
              onClick={handleSubmit}
              type="button"
            >
              {loading
                ? isEdit
                  ? "Saving..."
                  : "Adding..."
                : isEdit
                  ? "Save Changes"
                  : "Add Youth"}
            </button>
          </>
        }
        maxWidthClass="max-w-3xl"
        onClose={onClose}
        open={isFormOpen}
        title={isEdit ? "Edit Youth Record" : "Add New Youth Record"}
      >
        <div className="mb-5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-[#1e3a5f]">
          Personal details here mirror the Youth profile fields shown in the
          kabataan portal.
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field
              disabled={loading}
              error={errors.fullname}
              label="Full Name"
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter full name"
              value={name}
            />
          </div>
          <Field
            disabled={loading}
            error={errors.age}
            label="Age"
            onChange={(event) =>
              setAge(event.target.value === "" ? "" : Number(event.target.value))
            }
            placeholder="Enter age"
            type="number"
            value={age}
          />
          <SelectField
            disabled={loading}
            error={errors.gender}
            label="Gender"
            onChange={(event) =>
              setGender(event.target.value as "Male" | "Female")
            }
            options={genderOptions}
            placeholder="Select gender"
            value={gender}
          />
          <Field
            disabled={loading}
            error={errors.email}
            label="Email Address"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter email"
            type="email"
            value={email}
          />
          {!isEdit ? (
            <Field
              disabled={loading}
              error={errors.password}
              label="Account Password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Assign user password"
              type="password"
              value={password}
            />
          ) : (
            <Field
              disabled={loading}
              label="Contact Number"
              onChange={(event) => setContact(event.target.value)}
              placeholder="Optional contact number"
              value={contact}
            />
          )}
          {!isEdit ? (
            <Field
              disabled={loading}
              label="Contact Number"
              onChange={(event) => setContact(event.target.value)}
              placeholder="Optional contact number"
              value={contact}
            />
          ) : null}
          <Field
            disabled={loading}
            error={errors.purok}
            label="Purok"
            onChange={(event) => setPurok(event.target.value)}
            placeholder="Enter purok"
            value={purok}
          />
          <div className="md:col-span-2">
            <Field
              disabled={loading}
              error={errors.address}
              label="Address"
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Street, village"
              value={address}
            />
          </div>
          <SelectField
            disabled={loading}
            error={errors.education}
            label="Educational Status"
            onChange={(event) =>
              setEducation(event.target.value as YouthRecord["educational_status"])
            }
            options={educationalStatusOptions}
            placeholder="Select educational status"
            value={education}
          />
          <SelectField
            disabled={loading}
            error={errors.scholar}
            label="Scholar Status"
            onChange={(event) =>
              setScholar(event.target.value as "Scholar" | "Non-Scholar")
            }
            options={scholarStatusOptions}
            placeholder="Select scholar status"
            value={scholar}
          />
          <div className="md:col-span-2">
            <Field
              disabled={loading}
              error={errors.profileImage}
              label="Profile Image URL"
              onChange={(event) => setProfileImage(event.target.value)}
              placeholder="Paste image URL"
              value={profileImage}
            />
          </div>
        </div>
      </AdminModal>

      <AdminModal
        footer={
          <button
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
            onClick={onClose}
            type="button"
          >
            Close View
          </button>
        }
        maxWidthClass="max-w-3xl"
        onClose={onClose}
        open={isView}
        title="Youth Profile Details"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Detail label="Full Name" value={name} />
          </div>
          <Detail label="Age" value={age} />
          <Detail label="Gender" value={gender} />
          <Detail label="Email" value={email} />
          <Detail label="Contact" value={contact} />
          <Detail label="Purok" value={purok} />
          <Detail label="Address" value={address} />
          <Detail label="Education" value={education} />
          <Detail label="Scholar Status" value={scholar} />
          <div className="sm:col-span-2">
            <Detail label="Profile Image URL" value={profileImage} />
          </div>
        </div>
      </AdminModal>

      <AdminModal
        footer={
          <>
            <button
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading}
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>

            <button
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading}
              onClick={handleDelete}
              type="button"
            >
              {loading ? "Deleting..." : "Confirm Delete"}
            </button>
          </>
        }
        onClose={onClose}
        open={isDeleteMode}
        title="Delete Youth Record"
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to permanently delete the profile of{" "}
          <strong className="text-slate-900">{name}</strong>? This action
          cannot be reversed.
        </p>
      </AdminModal>
    </>
  );
}
