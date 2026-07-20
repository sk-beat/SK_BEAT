import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../auth/useAuth";
import ProfileHeader from "./ProfileHeader";
import ProfileModals, { type ProfileModalMode } from "./ProfileModals";
import ProfileSections, {
  type ChangePasswordFormValues,
} from "./ProfileSections";
import { validatePasswordChange } from "../../../utils/passwordValidation";
import {
  changeYouthPassword,
  completeYouthFirstPasswordChange,
  getYouthProfile,
  getYouthProfileStats,
  updateYouthProfile,
  type UpdateYouthProfilePayload,
  type YouthProfileRecord,
} from "./ProfileService";

export default function Profile() {
  const { logout, refreshUser, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState<YouthProfileRecord | null>(null);
  const [eventsCount, setEventsCount] = useState(0);
  const [surveysCount, setSurveysCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [changePasswordError, setChangePasswordError] = useState<string | null>(
    null,
  );
  const [changePasswordSuccess, setChangePasswordSuccess] = useState<
    string | null
  >(null);
  const [modalMode, setModalMode] = useState<ProfileModalMode>(null);

  async function loadProfile() {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const [{ data, error }, stats] = await Promise.all([
      getYouthProfile(user.id),
      getYouthProfileStats(user.id),
    ]);

    if (error ?? stats.error) {
      setErrorMessage(
        (error ?? stats.error)?.message ?? "Unable to load profile.",
      );
    }

    setProfile(data ?? null);
    setEventsCount(stats.eventsCount);
    setSurveysCount(stats.surveysCount);
    setIsLoading(false);
  }

  async function handleSaveProfile(payload: UpdateYouthProfilePayload) {
    if (!user?.id || isSaving) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const { error } = await updateYouthProfile(user.id, payload);

    setIsSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setModalMode(null);
    await loadProfile();
  }

  function validatePasswordForm({
    currentPassword,
    newPassword,
    confirmPassword,
  }: ChangePasswordFormValues) {
    return validatePasswordChange({
      confirmPassword,
      currentPassword,
      newPassword,
    });
  }

  async function handleChangePassword(values: ChangePasswordFormValues) {
    if (!user?.id || isChangingPassword) {
      setChangePasswordError("You need to be signed in to change password.");
      setChangePasswordSuccess(null);
      return false;
    }

    const validationMessage = validatePasswordForm(values);

    if (validationMessage) {
      setChangePasswordError(validationMessage);
      setChangePasswordSuccess(null);
      return false;
    }

    setIsChangingPassword(true);
    setChangePasswordError(null);
    setChangePasswordSuccess(null);

    const isFirstPasswordChange = Boolean(user.mustChangePassword);
    const result = isFirstPasswordChange
      ? await completeYouthFirstPasswordChange({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        })
      : await changeYouthPassword({
          profileId: user.id,
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        });

    setIsChangingPassword(false);

    if (result.error) {
      setChangePasswordError(result.error);
      return false;
    }

    if (!result.sessionValid) {
      setChangePasswordSuccess(
        "Password updated. Please sign in again to continue.",
      );
      await new Promise((resolve) => {
        window.setTimeout(resolve, 1800);
      });
      await logout();
      navigate("/login", { replace: true });
      return true;
    }

    setChangePasswordSuccess("Password updated successfully.");
    if (isFirstPasswordChange) {
      await refreshUser();
      await loadProfile();
      navigate("/youth", { replace: true });
    }
    return true;
  }

  useEffect(() => {
    let isMounted = true;

    async function loadInitialProfile() {
      if (!user?.id) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      const [{ data, error }, stats] = await Promise.all([
        getYouthProfile(user.id),
        getYouthProfileStats(user.id),
      ]);

      if (!isMounted) {
        return;
      }

      if (error ?? stats.error) {
        setErrorMessage(
          (error ?? stats.error)?.message ?? "Unable to load profile.",
        );
      }

      setProfile(data ?? null);
      setEventsCount(stats.eventsCount);
      setSurveysCount(stats.surveysCount);
      setIsLoading(false);
    }

    loadInitialProfile();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      <ProfileHeader />
      <ProfileSections
        changePasswordError={changePasswordError}
        changePasswordSuccess={changePasswordSuccess}
        errorMessage={errorMessage}
        eventsCount={eventsCount}
        isChangingPassword={isChangingPassword}
        isLoading={isLoading}
        isPasswordChangeRequired={
          Boolean(user?.mustChangePassword) ||
          searchParams.get("changePassword") === "1"
        }
        onChangePassword={handleChangePassword}
        onEditProfile={() => setModalMode("edit")}
        profile={profile}
        surveysCount={surveysCount}
      />
      <ProfileModals
        isSaving={isSaving}
        mode={modalMode}
        onClose={() => setModalMode(null)}
        onSave={handleSaveProfile}
        profile={profile}
      />
    </div>
  );
}
