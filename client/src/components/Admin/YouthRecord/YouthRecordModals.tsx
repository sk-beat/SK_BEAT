import { useCallback, useEffect, useState } from "react";
import AdminModal from "../shared/AdminModal";
import BirthdayPicker from "../../shared/BirthdayPicker";
import type { CreateYouthRecord, UpdateYouthRecord, YouthRecord } from "./youthRecordData";
import {
  buildYouthProfileImagePath,
  deleteProfileImage,
  getProfileImageUrl,
  uploadProfileImage,
  validateProfileImageFile,
} from "../../../utils/profileImages";

export type YouthRecordModalMode = "add" | "edit" | "view" | "delete" | null;

type YouthRecordModalsProps = {
  mode: YouthRecordModalMode;
  onClose: () => void;
  record: YouthRecord | null;
  onCreate: (data: CreateYouthRecord) => Promise<string | null>;
  onUpdate: (profile_id: string, data: UpdateYouthRecord) => Promise<void>;
  onDelete: (profile_id: string) => Promise<void>;
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 disabled:opacity-70";

const educationalStatusOptions = [
  "Active",
  "Inactive",
] as const;

const scholarStatusOptions = ["Scholar", "Non-Scholar"] as const;
const genderOptions = ["Male", "Female"] as const;

type FormErrors = Partial<
  Record<
    | "fullname"
    | "birthday"
    | "gender"
    | "address"
    | "purok"
    | "contact"
    | "email"
    | "education"
    | "scholar"
    | "profileImage"
    | "delete",
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
  inputMode,
  maxLength,
}: {
  disabled?: boolean;
  error?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  label: string;
  maxLength?: number;
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
        inputMode={inputMode}
        maxLength={maxLength}
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

function isValidContactNumber(value: string) {
  return /^09\d{9}$/.test(value.trim());
}

function normalizeContactNumberInput(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}

function getLockReasonLabel(record: YouthRecord | null) {
  if (!record || record.status === "active") return "Active";
  if (record.account_lock_reason === "age_limit") {
    return "Locked automatically: age limit";
  }
  if (record.account_lock_reason === "manual_admin") {
    return "Locked manually by Admin";
  }
  return "Locked";
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

function validateBirthday(value: string, enforceCreationAgeLimit = false) {
  if (!value) return "Birthday is required.";
  if (value < "1900-01-01") return "Birthday must be on or after January 1, 1900.";
  const today = new Date().toISOString().slice(0, 10);
  if (value > today) return "Birthday cannot be in the future.";
  const age = calculateAge(value);
  if (enforceCreationAgeLimit && (age === null || age < 15 || age > 30)) {
    return "Youth account creation is only allowed for ages 15 to 30.";
  }
  return null;
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
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState<"Male" | "Female" | "">("");
  const [address, setAddress] = useState("");
  const [purok, setPurok] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [education, setEducation] = useState<
    YouthRecord["educational_status"] | ""
  >("");
  const [scholar, setScholar] = useState<"Scholar" | "Non-Scholar" | "">("");
  const [profileImage, setProfileImage] = useState("");
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const calculatedAge = calculateAge(birthday);
  const isCreationAgeAllowed =
    isEdit || (calculatedAge !== null && calculatedAge >= 15 && calculatedAge <= 30);

  const clearProfileImagePreview = useCallback(() => {
    setProfileImagePreview((current) => {
      if (current) {
        URL.revokeObjectURL(current);
      }

      return null;
    });
  }, []);

  const resetFormState = useCallback((nextRecord: YouthRecord | null = null) => {
    setName(nextRecord?.fullname ?? "");
    setBirthday(nextRecord?.date_of_birth ?? "");
    setGender(nextRecord?.gender ?? "");
    setAddress(nextRecord?.address_line ?? "");
    setPurok(nextRecord?.purok ?? "");
    setContact(nextRecord?.contact_number ?? "");
    setEmail(nextRecord?.email ?? "");
    setEducation(nextRecord?.educational_status ?? "");
    setScholar(nextRecord?.scholar_status ?? "");
    setProfileImage(nextRecord?.profile_image ?? "");
    setProfileImageFile(null);
    clearProfileImagePreview();
    setErrors({});
  }, [clearProfileImagePreview]);

  useEffect(() => {
    // Reset the modal state whenever a different Youth record/mode opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    resetFormState(record);
  }, [mode, record, resetFormState]);

  const liveBirthdayError = birthday ? validateBirthday(birthday, !isEdit) : null;

  function validateForm() {
    const nextErrors: FormErrors = {};
    const trimmedName = name.trim();
    const trimmedAddress = address.trim();
    const trimmedContact = contact.trim();
    const trimmedPurok = purok.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      nextErrors.fullname = "Full name is required.";
    }

    const birthdayError = validateBirthday(birthday, !isEdit);
    if (birthdayError) nextErrors.birthday = birthdayError;

    if (!gender) {
      nextErrors.gender = "Gender is required.";
    }

    if (!isEdit && !trimmedEmail) {
      nextErrors.email = "Email is required.";
    } else if (!isEdit && !isValidEmail(trimmedEmail)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!trimmedPurok) {
      nextErrors.purok = "Purok is required.";
    }

    if (!trimmedAddress) {
      nextErrors.address = "Address is required.";
    }

    if (!trimmedContact) {
      nextErrors.contact = "Contact number is required.";
    } else if (!isValidContactNumber(trimmedContact)) {
      nextErrors.contact = "Contact number must be 11 digits and start with 09.";
    }

    if (!education) {
      nextErrors.education = "Educational status is required.";
    }

    if (!scholar) {
      nextErrors.scholar = "Scholar status is required.";
    }

    if (profileImageFile) {
      const imageError = validateProfileImageFile(profileImageFile);
      if (imageError) nextErrors.profileImage = imageError;
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
      date_of_birth: birthday,
      gender: gender as "Male" | "Female",
      address_line: address.trim(),
      purok: purok.trim(),
      contact_number: contact.trim(),
      email: email.trim(),
      educational_status: education as YouthRecord["educational_status"],
      scholar_status: scholar as "Scholar" | "Non-Scholar",
      profile_image: profileImage.trim() || "",
    };

    try {
      setLoading(true);

      if (isEdit && record) {
        let nextProfileImage = profileImage.trim();
        let uploadedPath: string | null = null;
        if (profileImageFile) {
          uploadedPath = buildYouthProfileImagePath(record.profile_id, profileImageFile);
          const { error: uploadError } = await uploadProfileImage(uploadedPath, profileImageFile);
          if (uploadError) throw uploadError;
          nextProfileImage = uploadedPath;
        }
        await onUpdate(record.profile_id, {
          address_line: youth.address_line,
          contact_number: youth.contact_number,
          date_of_birth: youth.date_of_birth,
          educational_status: youth.educational_status,
          fullname: youth.fullname,
          gender: youth.gender,
          profile_image: nextProfileImage,
          purok: youth.purok,
          scholar_status: youth.scholar_status,
        });
        if (uploadedPath && record.profile_image && record.profile_image !== uploadedPath) {
          await deleteProfileImage(record.profile_image);
        }
      } else {
        const profileId = await onCreate({ ...youth, profile_image: "" });
        if (!profileId) {
          return;
        }

        if (profileImageFile) {
          const uploadedPath = buildYouthProfileImagePath(profileId, profileImageFile);
          const { error: uploadError } = await uploadProfileImage(uploadedPath, profileImageFile);
          if (uploadError) {
            window.alert("Youth account was created, but image upload failed. You can add the image later.");
          } else {
            await onUpdate(profileId, {
              address_line: youth.address_line,
              contact_number: youth.contact_number,
              date_of_birth: youth.date_of_birth,
              educational_status: youth.educational_status,
              fullname: youth.fullname,
              gender: youth.gender,
              profile_image: uploadedPath,
              purok: youth.purok,
              scholar_status: youth.scholar_status,
            });
          }
        }
      }

      resetFormState(null);
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
      setErrors((current) => ({ ...current, delete: undefined }));
      await onDelete(record.profile_id);
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete.";
      setErrors((current) => ({ ...current, delete: message }));
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
          <BirthdayPicker
            disabled={loading}
            error={errors.birthday ?? liveBirthdayError ?? undefined}
            onChange={(value) => {
              setBirthday(value);
              setErrors((current) => ({
                ...current,
                birthday: value
                  ? validateBirthday(value, !isEdit) ?? undefined
                  : current.birthday,
              }));
            }}
            value={birthday}
          />
          <div>
            <Field
              disabled
              label="Calculated Age"
              onChange={() => undefined}
              value={calculatedAge ?? ""}
            />
            {!isEdit && birthday && calculatedAge !== null ? (
              <p
                className={[
                  "mt-1 text-xs font-medium",
                  isCreationAgeAllowed ? "text-emerald-600" : "text-red-600",
                ].join(" ")}
              >
                {isCreationAgeAllowed
                  ? "Allowed for Youth account creation."
                  : "Youth account creation is only allowed for ages 15 to 30."}
              </p>
            ) : null}
          </div>
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
            disabled={loading || isEdit}
            error={errors.email}
            label="Email Address"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter email"
            type="email"
            value={email}
          />
          {!isEdit ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-semibold">Temporary password is generated automatically</p>
              <p className="mt-1">
                The generated password is sent in the welcome email and must be changed after first login.
              </p>
            </div>
          ) : (
            <Field
              disabled={loading}
              error={errors.contact}
              inputMode="numeric"
              label="Contact Number"
              maxLength={11}
              onChange={(event) => setContact(normalizeContactNumberInput(event.target.value))}
              placeholder="09XXXXXXXXX"
              type="tel"
              value={contact}
            />
          )}
          {!isEdit ? (
            <Field
              disabled={loading}
              error={errors.contact}
              inputMode="numeric"
              label="Contact Number"
              maxLength={11}
              onChange={(event) => setContact(normalizeContactNumberInput(event.target.value))}
              placeholder="09XXXXXXXXX"
              type="tel"
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
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Profile Image (optional)
            </span>
            <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              {profileImagePreview || getProfileImageUrl(profileImage || null) ? (
                <img
                  alt="Youth profile preview"
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
                  disabled={loading}
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setProfileImageFile(file);
                    setProfileImagePreview((current) => {
                      if (current) {
                        URL.revokeObjectURL(current);
                      }

                      return file ? URL.createObjectURL(file) : null;
                    });
                  }}
                  type="file"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Optional JPG, PNG, or WebP up to 5 MB.
                </p>
                {errors.profileImage ? <p className="mt-1 text-xs text-red-600">{errors.profileImage}</p> : null}
              </div>
            </div>
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
          <Detail label="Birthday" value={birthday} />
          <Detail label="Age" value={calculateAge(birthday) ?? undefined} />
          <Detail label="Gender" value={gender} />
          <Detail label="Email" value={email} />
          <Detail label="Account Access" value={getLockReasonLabel(record)} />
          <Detail label="Locked At" value={record?.account_locked_at ?? undefined} />
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
        <div className="grid gap-3 text-sm text-slate-600">
          <p>
            Are you sure you want to permanently delete the account of{" "}
            <strong className="text-slate-900">{name}</strong>?
          </p>
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 font-medium text-red-700">
            This permanently deletes the Youth account and login access. This action cannot be undone.
          </p>
          {errors.delete ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 font-medium text-amber-800">
              {errors.delete}
            </p>
          ) : null}
        </div>
      </AdminModal>
    </>
  );
}
