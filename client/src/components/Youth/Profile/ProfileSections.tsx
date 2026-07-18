import { useState, type FormEvent } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  LogOut,
  Mail,
  MapPin,
  User,
} from "lucide-react";
import AdminModal from "../../Admin/shared/AdminModal";
import type { YouthProfileRecord } from "./ProfileService";
import { getProfileImageUrl } from "../../../utils/profileImages";

export type ChangePasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type ProfileSectionsProps = {
  changePasswordError: string | null;
  changePasswordSuccess: string | null;
  errorMessage: string | null;
  eventsCount: number;
  isChangingPassword: boolean;
  isLoading: boolean;
  isPasswordChangeRequired?: boolean;
  onChangePassword: (values: ChangePasswordFormValues) => Promise<boolean>;
  onEditProfile: () => void;
  onLogout: () => void;
  profile: YouthProfileRecord | null;
  surveysCount: number;
};

function getInitials(name?: string | null) {
  if (!name) {
    return "Y";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatJoinedDate(value?: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatBirthday(value?: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function PasswordField({
  disabled,
  isVisible,
  label,
  onChange,
  onToggleVisibility,
  value,
}: {
  disabled: boolean;
  isVisible: boolean;
  label: string;
  onChange: (value: string) => void;
  onToggleVisibility: () => void;
  value: string;
}) {
  const Icon = isVisible ? EyeOff : Eye;
  const autoComplete =
    label === "Current password" ? "current-password" : "new-password";

  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <span className="relative block">
        <input
          autoComplete={autoComplete}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 pr-12 text-sm text-slate-800 outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 disabled:opacity-70"
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          type={isVisible ? "text" : "password"}
          value={value}
        />
        <button
          aria-label={isVisible ? `Hide ${label}` : `Show ${label}`}
          className="absolute right-3 top-1/2 flex -translate-y-1/2 text-slate-500 transition-colors hover:text-[#1e3a5f] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled}
          onClick={onToggleVisibility}
          type="button"
        >
          <Icon className="h-4 w-4" />
        </button>
      </span>
    </label>
  );
}

export default function ProfileSections({
  changePasswordError,
  changePasswordSuccess,
  errorMessage,
  eventsCount,
  isChangingPassword,
  isLoading,
  isPasswordChangeRequired = false,
  onChangePassword,
  onEditProfile,
  onLogout,
  profile,
  surveysCount,
}: ProfileSectionsProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [visibleFields, setVisibleFields] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const isPasswordDialogOpen = isPasswordModalOpen || isPasswordChangeRequired;
  const fullName = profile?.fullname ?? "Youth Member";
  const profileImageUrl = getProfileImageUrl(profile?.profile_image ?? null);
  const profileDetails = [
    {
      label: "Birthday",
      value: formatBirthday(profile?.date_of_birth),
      icon: CalendarDays,
    },
    {
      label: "Age",
      value: profile?.age ? `${profile.age} Years Old` : "Not set",
      icon: User,
    },
    {
      label: "Email",
      value: profile?.email ?? "Not set",
      icon: Mail,
    },
    {
      label: "Gender",
      value: profile?.gender ?? "Not set",
      icon: User,
    },
    {
      label: "Purok",
      value: profile?.purok ?? "Not set",
      icon: MapPin,
    },
    {
      label: "Address",
      value: profile?.address_line ?? "Not set",
      icon: MapPin,
    },
    {
      label: "Joined",
      value: formatJoinedDate(profile?.created_at),
      icon: CalendarDays,
    },
  ];

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const wasChanged = await onChangePassword({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (wasChanged) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setVisibleFields({
        current: false,
        new: false,
        confirm: false,
      });
      setIsPasswordModalOpen(false);
    }
  }

  function closePasswordModal() {
    if (isChangingPassword || isPasswordChangeRequired) {
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setVisibleFields({
      current: false,
      new: false,
      confirm: false,
    });
    setIsPasswordModalOpen(false);
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-5 py-6 sm:px-6 lg:px-8">
        <div className="rounded-[14px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-5 w-36 rounded bg-slate-200" />
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div className="rounded-xl bg-slate-100 p-4" key={item}>
                <div className="h-10 w-10 rounded-lg bg-slate-200" />
                <div className="mt-4 h-3 w-16 rounded bg-slate-200" />
                <div className="mt-2 h-4 w-28 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-5 py-6 sm:px-6 lg:grid-cols-[0.9fr_1.4fr] lg:px-8">
      <section className="overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-sm">
        <div className="bg-[#1e3a5f] px-6 py-8 text-white">
          <div className="flex items-center justify-between gap-4">
            {profileImageUrl ? (
              <img
                alt={fullName}
                className="h-24 w-24 rounded-full border-4 border-white/20 object-cover shadow-sm"
                src={profileImageUrl}
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/20 bg-white/10 text-3xl font-bold shadow-sm">
                {getInitials(fullName)}
              </div>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/20">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Kabataan
            </span>
          </div>

          <h2 className="mt-5 text-2xl font-bold leading-tight">
            {fullName}
          </h2>
          <p className="mt-1 text-sm text-white/75">
            {profile?.educational_status ?? "Registered Youth Member"}
          </p>
          {profile?.scholar_status ? (
            <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/85 ring-1 ring-white/15">
              <GraduationCap className="h-3.5 w-3.5" />
              {profile.scholar_status}
            </p>
          ) : null}
        </div>

        <div className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                Surveys
              </p>
              <p className="mt-1 text-2xl font-bold text-[#1e3a5f]">
                {surveysCount}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                Events
              </p>
              <p className="mt-1 text-2xl font-bold text-[#1e3a5f]">
                {eventsCount}
              </p>
            </div>
          </div>

          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1e3a5f] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#173256]"
            onClick={onEditProfile}
            type="button"
          >
            <Edit3 className="h-4 w-4" />
            Edit Profile
          </button>
        </div>
      </section>

      <div className="space-y-6">
      <section className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        {errorMessage ? (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {errorMessage}
          </div>
        ) : null}

        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Personal Information
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Your registered SK profile details.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {profileDetails.map((detail) => {
            const Icon = detail.icon;

            return (
              <div
                className="rounded-xl border border-slate-100 bg-slate-50 p-4 transition-colors hover:border-[#1e3a5f]/20 hover:bg-white"
                key={detail.label}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1e3a5f]/10 text-[#1e3a5f]">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                  {detail.label}
                </p>
                <p className="mt-1 break-words text-sm font-medium text-slate-900">
                  {detail.value}
                </p>
              </div>
            );
          })}
        </div>

        <button
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#1e3a5f]/25 bg-white px-4 py-3 text-sm font-medium text-[#1e3a5f] transition-colors hover:border-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white sm:w-auto"
          onClick={onLogout}
          type="button"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </section>
      <section className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1e3a5f]/10 text-[#1e3a5f]">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Change Password
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Update the password for your signed-in Youth account.
            </p>
          </div>
        </div>

        {changePasswordSuccess ? (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {changePasswordSuccess}
          </div>
        ) : null}

        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1e3a5f] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#173256]"
          onClick={() => setIsPasswordModalOpen(true)}
          type="button"
        >
          <Lock className="h-4 w-4" />
          Change Password
        </button>
      </section>
      </div>

      <AdminModal
        footer={
          <>
          <button
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isChangingPassword || isPasswordChangeRequired}
              onClick={closePasswordModal}
              type="button"
            >
              Cancel
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#173256] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isChangingPassword}
              form="change-youth-password-form"
              type="submit"
            >
              <Lock className="h-4 w-4" />
              {isChangingPassword ? "Changing..." : "Change Password"}
            </button>
          </>
        }
        onClose={closePasswordModal}
        open={isPasswordDialogOpen}
        title={isPasswordChangeRequired ? "Change Temporary Password" : "Change Password"}
      >
        {isPasswordChangeRequired ? (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Please change your temporary password before using the Youth portal.
          </div>
        ) : null}
        {changePasswordError ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {changePasswordError}
          </div>
        ) : null}

        <form
          className="grid gap-4"
          id="change-youth-password-form"
          onSubmit={handlePasswordSubmit}
        >
          <PasswordField
            disabled={isChangingPassword}
            isVisible={visibleFields.current}
            label="Current password"
            onChange={setCurrentPassword}
            onToggleVisibility={() =>
              setVisibleFields((current) => ({
                ...current,
                current: !current.current,
              }))
            }
            value={currentPassword}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <PasswordField
              disabled={isChangingPassword}
              isVisible={visibleFields.new}
              label="New password"
              onChange={setNewPassword}
              onToggleVisibility={() =>
                setVisibleFields((current) => ({
                  ...current,
                  new: !current.new,
                }))
              }
              value={newPassword}
            />
            <PasswordField
              disabled={isChangingPassword}
              isVisible={visibleFields.confirm}
              label="Confirm new password"
              onChange={setConfirmPassword}
              onToggleVisibility={() =>
                setVisibleFields((current) => ({
                  ...current,
                  confirm: !current.confirm,
                }))
              }
              value={confirmPassword}
            />
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
