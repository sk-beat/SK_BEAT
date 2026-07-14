import { useEffect, useState } from "react";
import { useAuth } from "../../../auth/useAuth";
import Sidebar from "../../Sidebar/Sidebar";
import ActivitiesHeader from "./ActivitiesHeader";
import ActivitiesModals, { type ActivitiesModalMode } from "./ActivitiesModals";
import ActivitiesSections from "./ActivitiesSections";
import {
  deleteActivityEvent,
  getActivityEvents,
  getCurrentBudgetYearId,
  saveActivityEvent,
  type ActivityEvent,
  type SaveActivityEventPayload,
} from "./ActivitiesService";

function toDateInputValue(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export default function Activities() {
  const { logout } = useAuth();
  const [modalMode, setModalMode] = useState<ActivitiesModalMode>(null);
  const [selectedActivity, setSelectedActivity] = useState<ActivityEvent | null>(
    null,
  );
  const [selectedPastEvent, setSelectedPastEvent] = useState<string | null>(null);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [budgetYearId, setBudgetYearId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedScheduleDate, setSelectedScheduleDate] = useState(
    toDateInputValue(new Date()),
  );

  async function loadActivities() {
    setIsLoading(true);
    setErrorMessage(null);

    const [{ data: activityData, error }, { data: budgetData }] =
      await Promise.all([getActivityEvents(), getCurrentBudgetYearId()]);

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    setEvents(activityData);
    setBudgetYearId(budgetData?.budget_year_id ?? null);
    setIsLoading(false);
  }

  async function handleSaveEvent(payload: SaveActivityEventPayload) {
    setIsSaving(true);
    setErrorMessage(null);

    const { error } = await saveActivityEvent({
      ...payload,
      budget_year_id: payload.budget_year_id ?? budgetYearId,
    });

    setIsSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    closeModal();
    await loadActivities();
  }

  async function handleDeleteEvent(eventId: number) {
    const shouldDelete = window.confirm("Delete this event?");

    if (!shouldDelete) {
      return;
    }

    setErrorMessage(null);
    const { error } = await deleteActivityEvent(eventId);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    await loadActivities();
  }

  function closeModal() {
    setModalMode(null);
    setSelectedActivity(null);
    setSelectedPastEvent(null);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadActivities();
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900">
      <Sidebar onLogout={logout} />
      <main className="ml-[88px] flex min-h-screen flex-1 flex-col transition-[margin-left] duration-300 ease-in-out peer-hover/sidebar:ml-[300px] max-md:ml-[72px] max-md:peer-hover/sidebar:ml-[72px]">
        <ActivitiesHeader />
        <ActivitiesSections
          errorMessage={errorMessage}
          events={events}
          isLoading={isLoading}
          selectedDate={selectedScheduleDate}
          onAddCatalogEvent={() => setModalMode("catalog")}
          onEditCatalogEvent={(activity) => {
            setSelectedActivity(activity);
            setModalMode("catalog");
          }}
          onDeleteCatalogEvent={handleDeleteEvent}
          onOpenPastFeedbackQr={(eventTitle) => {
            setSelectedPastEvent(eventTitle);
            setModalMode("feedback-qr");
          }}
          onSelectDate={setSelectedScheduleDate}
          onScheduleEvent={(date) => {
            if (date) {
              setSelectedScheduleDate(date);
            }

            setModalMode("schedule");
          }}
        />
      </main>
      <ActivitiesModals
        mode={modalMode}
        onClose={closeModal}
        onSave={handleSaveEvent}
        events={events}
        budgetYearId={budgetYearId}
        isSaving={isSaving}
        scheduleDate={selectedScheduleDate}
        selectedActivity={selectedActivity}
        selectedPastEvent={selectedPastEvent}
      />
    </div>
  );
}
