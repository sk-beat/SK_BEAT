import { useState } from "react";
import { useAuth } from "../../../auth/useAuth";
import Sidebar from "../../Sidebar/Sidebar";
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

  const viewContent = {
    suggestions: <KabataanSuggestionsSection />,
    responses: <SurveyResponsesSection />,
    announcements: (
      <AnnouncementsSection
        onCreateAnnouncement={() => setIsAnnouncementModalOpen(true)}
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
        onClose={() => setIsAnnouncementModalOpen(false)}
        openCreateAnnouncement={isAnnouncementModalOpen}
      />
    </div>
  );
}
