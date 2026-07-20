import { useEffect, useState } from "react";
import AdminModal from "../../Admin/shared/AdminModal";
import BirthdayPicker from "../../shared/BirthdayPicker";
import {
  buildYouthProfileImagePath,
  deleteProfileImage,
  getProfileImageUrl,
  uploadProfileImage,
  validateProfileImageFile,
} from "../../../utils/profileImages";
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

function calculateAge(dateOfBirth: string) {
  if (!dateOfBirth) return null;
  const [year, month, day] = dateOfBirth.split("-").map(Number);
  if (!year || !month || !day) return null;
  const today = new Date();
  let age = today.getFullYear() - year;
  const hasBirthdayPassed =
    today.getMonth() + 1 > month ||
    (today.getMonth() + 1 === month && today.getDate() >= day);
  if (!hasBirthdayPassed) age -= 1;
  return age;
}

export default function ProfileModals({
  isSaving,
  mode,
  onClose,
  onSave,
  profile,
}: ProfileModalsProps) {
  const [fullname, setFullname] = useState("");
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState("");
  const [purok, setPurok] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [address, setAddress] = useState("");
  const [scholarStatus, setScholarStatus] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFullname(profile?.fullname ?? "");
    setBirthday(profile?.date_of_birth ?? "");
    setGender(profile?.gender ?? "");
    setPurok(profile?.purok ?? "");
    setContactNumber(profile?.contact_number ?? "");
    setAddress(profile?.address_line ?? "");
    setScholarStatus(profile?.scholar_status ?? "");
    setProfileImage(profile?.profile_image ?? "");
    setProfileImageFile(null);
    setProfileImagePreview(null);
    setImageError(null);
  }, [profile, mode]);

  async function handleSubmit() {
    if (!profile) return;
    let nextProfileImage = profileImage || null;
    let uploadedPath: string | null = null;

    if (profileImageFile) {
      const validationError = validateProfileImageFile(profileImageFile);
      if (validationError) {
        setImageError(validationError);
        return;
      }

      uploadedPath = buildYouthProfileImagePath(profile.profile_id, profileImageFile);
      const { error: uploadError } = await uploadProfileImage(uploadedPath, profileImageFile);
      if (uploadError) {
        setImageError(uploadError.message);
        return;
      }
      nextProfileImage = uploadedPath;
    }

    await onSave({
      fullname,
      gender: gender || null,
      purok: purok || null,
      contact_number: contactNumber || null,
      address_line: address || null,
      scholar_status: scholarStatus || null,
      profile_image: nextProfileImage,
      date_of_birth: birthday || null,
    });

    if (uploadedPath && profile.profile_image && profile.profile_image !== uploadedPath) {
      await deleteProfileImage(profile.profile_image);
    }
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
        <div className="md:col-span-2">
          <Field
            disabled
            label="Email"
            onChange={() => undefined}
            type="email"
            value={profile?.email ?? ""}
          />
          <p className="mt-1.5 text-xs text-slate-500">
            This email is linked to your account and cannot be changed.
          </p>
        </div>
        <BirthdayPicker
          disabled={isSaving}
          onChange={setBirthday}
          value={birthday}
        />
        <Field
          disabled
          label="Calculated Age"
          onChange={() => undefined}
          value={calculateAge(birthday) ?? ""}
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
          label="Contact Number"
          onChange={(event) => setContactNumber(event.target.value)}
          placeholder="Optional contact number"
          value={contactNumber}
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
        <Field
          disabled
          label="Educational Status"
          onChange={() => undefined}
          value={profile?.educational_status ?? ""}
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
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Profile Image
          </span>
          <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            {profileImagePreview || getProfileImageUrl(profileImage || null) ? (
              <img
                alt="Profile preview"
                className="h-20 w-20 rounded-full object-cover"
                src={profileImagePreview || getProfileImageUrl(profileImage || null) || ""}
              />
            ) : (
              <div className="grid h-20 w-20 place-items-center rounded-full bg-white text-xs font-semibold text-slate-400">
                No image
              </div>
            )}
            <div className="min-w-0 flex-1">
              <input
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                disabled={isSaving}
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setImageError(null);
                  setProfileImageFile(file);
                  setProfileImagePreview(file ? URL.createObjectURL(file) : null);
                }}
                type="file"
              />
              <p className="mt-2 text-xs text-slate-500">
                Optional JPG, PNG, or WebP up to 5 MB.
              </p>
              {imageError ? <p className="mt-1 text-xs text-red-600">{imageError}</p> : null}
            </div>
          </div>
        </div>
      </div>
    </AdminModal>
  );
}
