import { useEffect, useState } from "react";
import { useAuth } from "../../../auth/useAuth";
import ProfileHeader from "./ProfileHeader";
import ProfileModals, { type ProfileModalMode } from "./ProfileModals";
import ProfileSections from "./ProfileSections";
import {
  getYouthProfile,
  getYouthProfileStats,
  updateYouthProfile,
  type UpdateYouthProfilePayload,
  type YouthProfileRecord,
} from "./ProfileService";

export default function Profile() {
  const { logout, user } = useAuth();
  const [profile, setProfile] = useState<YouthProfileRecord | null>(null);
  const [eventsCount, setEventsCount] = useState(0);
  const [surveysCount, setSurveysCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
        errorMessage={errorMessage}
        eventsCount={eventsCount}
        isLoading={isLoading}
        onEditProfile={() => setModalMode("edit")}
        onLogout={logout}
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
