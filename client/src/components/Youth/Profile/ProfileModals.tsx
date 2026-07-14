import { useEffect, useState } from "react";
import AdminModal from "../../Admin/shared/AdminModal";
import type {
  UpdateYouthProfilePayload,
  YouthProfileRecord,
} from "./ProfileService";

export type ProfileModalMode = "edit" | null;

type ProfileModalsProps = {
  isSaving: boolean;
  mode: ProfileModalMode;
  onClose: () => void;
  onSave: (payload: UpdateYouthProfilePayload) => Promise<void>;
  profile: YouthProfileRecord | null;
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 disabled:opacity-70";

function Field({
  label,
  placeholder,
  type = "text",
  value,
  disabled,
  onChange,
}: {
  disabled?: boolean;
  label: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  value: number | string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <input
        className={inputClass}
        disabled={disabled}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}

function SelectField({
  label,
  options,
  placeholder,
  value,
  disabled,
  onChange,
}: {
  disabled?: boolean;
  label: string;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
  placeholder?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <select
        className={inputClass}
        disabled={disabled}
        onChange={onChange}
        value={value}
      >
        {placeholder ? (
          <option value="">{placeholder}</option>
        ) : null}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function ProfileModals({
  isSaving,
  mode,
  onClose,
  onSave,
  profile,
}: ProfileModalsProps) {
  const [fullname, setFullname] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [gender, setGender] = useState("");
  const [purok, setPurok] = useState("");
  const [address, setAddress] = useState("");
  const [educationalStatus, setEducationalStatus] = useState("");
  const [scholarStatus, setScholarStatus] = useState("");
  const [profileImage, setProfileImage] = useState("");

  useEffect(() => {
    setFullname(profile?.fullname ?? "");
    setAge(profile?.age ?? "");
    setGender(profile?.gender ?? "");
    setPurok(profile?.purok ?? "");
    setAddress(profile?.address_line ?? "");
    setEducationalStatus(profile?.educational_status ?? "");
    setScholarStatus(profile?.scholar_status ?? "");
    setProfileImage(profile?.profile_image ?? "");
  }, [profile, mode]);

  async function handleSubmit() {
    await onSave({
      fullname,
      age: age === "" ? null : age,
      gender: gender || null,
      purok: purok || null,
      address_line: address || null,
      scholar_status: scholarStatus || null,
      educational_status: educationalStatus || null,
      profile_image: profileImage || null,
    });
  }

  return (
    <AdminModal
      footer={
        <>
          <button
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSaving}
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4a6f] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSaving}
            onClick={handleSubmit}
            type="button"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </>
      }
      maxWidthClass="max-w-3xl"
      onClose={onClose}
      open={mode === "edit"}
      title="Edit Youth Profile"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Field
            disabled={isSaving}
            label="Full Name"
            onChange={(event) => setFullname(event.target.value)}
            placeholder="Enter full name"
            value={fullname}
          />
        </div>
        <Field
          disabled={isSaving}
          label="Age"
          onChange={(event) =>
            setAge(event.target.value === "" ? "" : Number(event.target.value))
          }
          placeholder="Enter age"
          type="number"
          value={age}
        />
        <SelectField
          disabled={isSaving}
          label="Gender"
          onChange={(event) => setGender(event.target.value)}
          options={["Male", "Female"]}
          placeholder="Select gender"
          value={gender}
        />
        <Field
          disabled={isSaving}
          label="Purok"
          onChange={(event) => setPurok(event.target.value)}
          placeholder="Enter purok"
          value={purok}
        />
        <Field
          disabled={isSaving}
          label="Address"
          onChange={(event) => setAddress(event.target.value)}
          placeholder="Street, village"
          value={address}
        />
        <SelectField
          disabled={isSaving}
          label="Educational Status"
          onChange={(event) => setEducationalStatus(event.target.value)}
          options={["Active", "Inactive", "Student", "Out of School Youth"]}
          placeholder="Select educational status"
          value={educationalStatus}
        />
        <SelectField
          disabled={isSaving}
          label="Scholar Status"
          onChange={(event) => setScholarStatus(event.target.value)}
          options={["Scholar", "Non-Scholar"]}
          placeholder="Select scholar status"
          value={scholarStatus}
        />
        <div className="md:col-span-2">
          <Field
            disabled={isSaving}
            label="Profile Image URL"
            onChange={(event) => setProfileImage(event.target.value)}
            placeholder="Paste image URL"
            value={profileImage}
          />
        </div>
      </div>
    </AdminModal>
  );
}
