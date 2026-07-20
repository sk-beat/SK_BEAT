import { useState } from "react";
import { useAuth } from "../../../auth/useAuth";
import Sidebar from "../../Sidebar/Sidebar";
import {
  saveAnnouncement,
  type Announcement,
  type AnnouncementPayload,
} from "./AnnouncementsService";
import SurveysAnnouncementsHeader from "./SurveysAnnouncementsHeader";
import SurveysAnnouncementsModals from "./SurveysAnnouncementsModals";
import {
  AnnouncementsSection,
  KabataanSuggestionsSection,
  SurveyResponsesSection,
} from "./SurveysAnnouncementsSections";

type SurveysAnnouncementsProps = {
  view?: "suggestions" | "responses" | "announcements";
};

export default function SurveysAnnouncements({
  view = "suggestions",
}: SurveysAnnouncementsProps) {
  const { logout } = useAuth();
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);
  const [announcementRefreshKey, setAnnouncementRefreshKey] = useState(0);
  const [announcementError, setAnnouncementError] = useState<string | null>(null);

  function closeAnnouncementModal() {
    setIsAnnouncementModalOpen(false);
    setSelectedAnnouncement(null);
    setAnnouncementError(null);
  }

  async function handleSaveAnnouncement(payload: AnnouncementPayload) {
    setIsSavingAnnouncement(true);
    setAnnouncementError(null);
    const { error } = await saveAnnouncement(payload);
    setIsSavingAnnouncement(false);

    if (error) {
      setAnnouncementError(error.message);
      return;
    }

    closeAnnouncementModal();
    setAnnouncementRefreshKey((key) => key + 1);
  }

  const viewContent = {
    suggestions: <KabataanSuggestionsSection />,
    responses: <SurveyResponsesSection />,
    announcements: (
      <AnnouncementsSection
        key={announcementRefreshKey}
        onCreateAnnouncement={() => {
          setSelectedAnnouncement(null);
          setIsAnnouncementModalOpen(true);
        }}
        onEditAnnouncement={(announcement) => {
          setSelectedAnnouncement(announcement);
          setIsAnnouncementModalOpen(true);
        }}
      />
    ),
  };

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900">
      <Sidebar onLogout={logout} />
      <main className="ml-[88px] flex min-h-screen flex-1 flex-col transition-[margin-left] duration-300 ease-in-out peer-hover/sidebar:ml-[300px] max-md:ml-[72px] max-md:peer-hover/sidebar:ml-[72px]">
        <SurveysAnnouncementsHeader />
        {viewContent[view]}
      </main>
      <SurveysAnnouncementsModals
        announcement={selectedAnnouncement}
        errorMessage={announcementError}
        isSaving={isSavingAnnouncement}
        onClose={closeAnnouncementModal}
        onSaveAnnouncement={handleSaveAnnouncement}
        openCreateAnnouncement={isAnnouncementModalOpen}
      />
    </div>
  );
}
