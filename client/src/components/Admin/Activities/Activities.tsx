import { useState } from "react";
import { useAuth } from "../../../auth/useAuth";
import Sidebar from "../../Sidebar/Sidebar";
import ActivitiesHeader from "./ActivitiesHeader";
import ActivitiesModals, { type ActivitiesModalMode } from "./ActivitiesModals";
import ActivitiesSections from "./ActivitiesSections";
import type { ActivityCatalogItem } from "./activitiesData";

export default function Activities() {
  const { logout } = useAuth();
  const [modalMode, setModalMode] = useState<ActivitiesModalMode>(null);
  const [selectedActivity, setSelectedActivity] =
    useState<ActivityCatalogItem | null>(null);
  const [selectedPastEvent, setSelectedPastEvent] = useState<string | null>(null);

  function closeModal() {
    setModalMode(null);
    setSelectedActivity(null);
    setSelectedPastEvent(null);
  }

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900">
      <Sidebar onLogout={logout} />
      <main className="ml-[88px] flex min-h-screen flex-1 flex-col transition-[margin-left] duration-300 ease-in-out peer-hover/sidebar:ml-[300px] max-md:ml-[72px] max-md:peer-hover/sidebar:ml-[72px]">
        <ActivitiesHeader />
        <ActivitiesSections
          onAddCatalogEvent={() => setModalMode("catalog")}
          onEditCatalogEvent={(activity) => {
            setSelectedActivity(activity);
            setModalMode("catalog");
          }}
          onOpenPastFeedbackQr={(eventTitle) => {
            setSelectedPastEvent(eventTitle);
            setModalMode("feedback-qr");
          }}
          onScheduleEvent={() => setModalMode("schedule")}
        />
      </main>
      <ActivitiesModals
        mode={modalMode}
        onClose={closeModal}
        selectedActivity={selectedActivity}
        selectedPastEvent={selectedPastEvent}
      />
    </div>
  );
}
