import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../../auth/useAuth";
import Sidebar from "../../Sidebar/Sidebar";
import ActivitiesHeader from "./ActivitiesHeader";
import ActivitiesModals, { type ActivitiesModalMode } from "./ActivitiesModals";
import ActivitiesSections from "./ActivitiesSections";
import {
  createEventCategory,
  deleteActivityEvent,
  deleteEventCategory,
  getActivityDecisionData,
  getEventCategories,
  getActivityEvents,
  getCurrentBudgetYearId,
  saveActivityEvent,
  updateEventCategory,
  type ActivityRecommendation,
  type CompletedEventPerformance,
  type ActivityEvent,
  type EventCategory,
  type SaveActivityEventPayload,
} from "./ActivitiesService";

function toDateInputValue(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getEventDeleteErrorMessage(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String(error.message)
        : String(error ?? "");
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("draft")) {
    return "Only draft events can be deleted.";
  }

  if (
    normalizedMessage.includes("foreign key") ||
    normalizedMessage.includes("violates") ||
    normalizedMessage.includes("registration") ||
    normalizedMessage.includes("transaction")
  ) {
    return "This event already has related records and cannot be deleted. Cancel it instead.";
  }

  return "Unable to delete this event. Please try again.";
}

export default function Activities() {
  const { logout } = useAuth();
  const [modalMode, setModalMode] = useState<ActivitiesModalMode>(null);
  const [selectedActivity, setSelectedActivity] = useState<ActivityEvent | null>(
    null,
  );
  const [selectedPastEvent, setSelectedPastEvent] = useState<ActivityEvent | null>(null);
  const [selectedPerformanceEventId, setSelectedPerformanceEventId] = useState<number | null>(null);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [eventCategories, setEventCategories] = useState<EventCategory[]>([]);
  const [completedEventPerformance, setCompletedEventPerformance] = useState<CompletedEventPerformance[]>([]);
  const [recommendations, setRecommendations] = useState<ActivityRecommendation[]>([]);
  const [budgetYearId, setBudgetYearId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedScheduleDate, setSelectedScheduleDate] = useState(
    toDateInputValue(new Date()),
  );
  const [searchParams, setSearchParams] = useSearchParams();

  const recommendationToDraftEvent = useCallback((
    eventName: string,
    eventCategory: string,
  ): ActivityEvent => {
    const fallbackCategory = eventCategories[0]?.name ?? "";
    return {
      allocated_budget: 0,
      budget_items: [],
      budget_year_id: budgetYearId,
      category: eventCategory || fallbackCategory,
      cover_image: null,
      created_at: null,
      created_by: null,
      description: null,
      event_date: null,
      event_expenses: [],
      event_id: 0,
      event_name: eventName,
      event_time: null,
      expected_attendees: null,
      location: null,
      status: "draft",
    };
  }, [budgetYearId, eventCategories]);

  async function loadActivities() {
    setIsLoading(true);
    setErrorMessage(null);

    const [
      { data: activityData, error },
      { data: budgetData },
      decisionData,
      { data: categoryData, error: categoryError },
    ] =
      await Promise.all([
        getActivityEvents(),
        getCurrentBudgetYearId(),
        getActivityDecisionData(),
        getEventCategories(),
      ]);

    const loadError = error || categoryError;

    if (loadError) {
      setErrorMessage(loadError.message);
      setIsLoading(false);
      return;
    }

    setEvents(activityData);
    setEventCategories(categoryData);
    setCompletedEventPerformance(decisionData.error ? [] : decisionData.data.completedEventPerformance);
    setRecommendations(decisionData.error ? [] : decisionData.data.topSuggestedEvents);
    setBudgetYearId(budgetData?.budget_year_id ?? null);
    if (decisionData.error) {
      setErrorMessage(decisionData.error.message);
    }
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
    const event = events.find((item) => item.event_id === eventId);

    if (!event) {
      setErrorMessage("Event not found.");
      return;
    }

    if (event.status !== "draft") {
      setErrorMessage("Only draft events can be deleted. Cancel scheduled, ongoing, or completed events instead.");
      return;
    }

    const shouldDelete = window.confirm("Delete this event?");

    if (!shouldDelete) {
      return;
    }

    setErrorMessage(null);
    const { error } = await deleteActivityEvent(eventId);

    if (error) {
      setErrorMessage(getEventDeleteErrorMessage(error));
      return;
    }

    await loadActivities();
  }

  async function handleCreateCategory(name: string) {
    setIsSaving(true);
    setErrorMessage(null);
    const { error } = await createEventCategory(name);
    setIsSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    await loadActivities();
  }

  async function handleUpdateCategory(categoryId: number, name: string) {
    setIsSaving(true);
    setErrorMessage(null);
    const { error } = await updateEventCategory(categoryId, name);
    setIsSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    await loadActivities();
  }

  async function handleDeleteCategory(categoryId: number) {
    const category = eventCategories.find((item) => item.category_id === categoryId);
    const inUse = category
      ? events.some((event) => event.category.toLowerCase() === category.name.toLowerCase())
      : false;

    if (inUse) {
      setErrorMessage("This category is already used by an event. Rename it instead of deleting it.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    const { error } = await deleteEventCategory(categoryId);
    setIsSaving(false);

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
    setSelectedPerformanceEventId(null);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete("action");
      next.delete("category");
      next.delete("eventId");
      next.delete("name");
      next.delete("panel");
      return next;
    }, { replace: true });
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadActivities();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    void Promise.resolve().then(() => {
      const action = searchParams.get("action");
      const panel = searchParams.get("panel");
      const eventId = Number(searchParams.get("eventId"));

      if (action === "create-event") {
        const eventName = searchParams.get("name")?.trim();
        const eventCategory = searchParams.get("category")?.trim();
        if (!eventName || !eventCategory) return;
        setSelectedActivity(recommendationToDraftEvent(eventName, eventCategory));
        setModalMode("catalog");
        return;
      }

      if (!Number.isFinite(eventId) || eventId <= 0) return;
      const event = events.find((item) => item.event_id === eventId);

      if (panel === "performance") {
        setSelectedPerformanceEventId(eventId);
        setModalMode("performance");
        return;
      }

      if (!event) return;

      if (panel === "registrations") {
        setSelectedActivity(event);
        setModalMode("registrations");
        return;
      }

      if (event.status === "completed") {
        setErrorMessage("Completed events cannot be edited.");
        return;
      }

      setSelectedActivity(event);
      setModalMode("catalog");
    });
  }, [events, isLoading, recommendationToDraftEvent, searchParams]);

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900">
      <Sidebar onLogout={logout} />
      <main className="ml-[88px] flex min-h-screen flex-1 flex-col transition-[margin-left] duration-300 ease-in-out peer-hover/sidebar:ml-[300px] max-md:ml-[72px] max-md:peer-hover/sidebar:ml-[72px]">
        <ActivitiesHeader />
        <ActivitiesSections
          errorMessage={errorMessage}
          completedEventPerformance={completedEventPerformance}
          events={events}
          isLoading={isLoading}
          recommendations={recommendations}
          selectedDate={selectedScheduleDate}
          onAddCatalogEvent={() => setModalMode("catalog")}
          onManageCategories={() => setModalMode("categories")}
          onCreateFromRecommendation={(recommendation) => {
            setSelectedActivity(recommendationToDraftEvent(
              recommendation.event_name,
              recommendation.event_category === "Uncategorized"
                ? "Sports"
                : recommendation.event_category,
            ));
            setModalMode("catalog");
          }}
          onEditCatalogEvent={(activity) => {
            if (activity.status === "completed") {
              setErrorMessage("Completed events cannot be edited.");
              return;
            }

            setSelectedActivity(activity);
            setModalMode("catalog");
          }}
          onDeleteCatalogEvent={handleDeleteEvent}
          onOpenPastFeedbackQr={(event) => {
            setSelectedPastEvent(event);
            setModalMode("feedback-qr");
          }}
          onOpenPerformance={(eventId) => {
            setSelectedPerformanceEventId(eventId);
            setModalMode("performance");
          }}
          onOpenRegistrations={(event) => {
            setSelectedActivity(event);
            setModalMode("registrations");
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
        completedEventPerformance={completedEventPerformance}
        eventCategories={eventCategories}
        selectedActivity={selectedActivity}
        selectedPastEvent={selectedPastEvent}
        selectedPerformanceEventId={selectedPerformanceEventId}
        onCreateCategory={handleCreateCategory}
        onDeleteCategory={handleDeleteCategory}
        onUpdateCategory={handleUpdateCategory}
      />
    </div>
  );
}
