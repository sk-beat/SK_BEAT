import { useState } from "react";
import {
  AlertIcon,
  ArrowRightIcon,
  CalendarIcon,
  ChevronDownIcon,
} from "../Dashboard/icons";
import type {
  ActivityEvent,
  ActivityEventStatus,
  ActivityRecommendation,
  CompletedEventPerformance,
} from "./ActivitiesService";
import { useDecisionInsightActions } from "../../../hooks/useDecisionInsightActions";
import {
  canRunDecisionInsightAction,
} from "../../../hooks/useDecisionInsightActions";
import type { DecisionInsight } from "../../../services/DecisionInsightsService";

const pageSize = 6;

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    </svg>
  );
}

type ActivitiesSectionActions = {
  onAddCatalogEvent: () => void;
  onDeleteCatalogEvent: (eventId: number) => void;
  onEditCatalogEvent: (activity: ActivityEvent) => void;
  onCreateFromRecommendation: (recommendation: ActivityRecommendation) => void;
  onManageCategories: () => void;
  onOpenPastFeedbackQr: (event: ActivityEvent) => void;
  onOpenPerformance: (eventId: number) => void;
  onOpenRegistrations: (event: ActivityEvent) => void;
  onSelectDate: (date: string) => void;
  onScheduleEvent: (date?: string) => void;
};

type ActivitiesSectionsProps = ActivitiesSectionActions & {
  errorMessage: string | null;
  completedEventPerformance: CompletedEventPerformance[];
  events: ActivityEvent[];
  isLoading: boolean;
  recommendations: ActivityRecommendation[];
  selectedDate: string;
};

function formatPeso(amount: number) {
  return `P${amount.toLocaleString("en-PH")}`;
}

function formatRatingValue(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value)
    ? `${value}/5`
    : "No rating yet";
}

function getStatusClass(status: ActivityEventStatus) {
  switch (status) {
    case "draft":
      return "bg-slate-100 text-slate-700 ring-slate-200";
    case "scheduled":
      return "bg-sky-100 text-sky-700 ring-sky-200";
    case "ongoing":
      return "bg-emerald-100 text-emerald-700 ring-emerald-200";
    case "completed":
      return "bg-violet-100 text-violet-700 ring-violet-200";
    case "cancelled":
      return "bg-red-100 text-red-700 ring-red-200";
  }
}

function StatusBadge({ status }: { status: ActivityEventStatus }) {
  return (
    <span
      className={[
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1",
        getStatusClass(status),
      ].join(" ")}
    >
      {status}
    </span>
  );
}

function getInsightToneClasses(severity: DecisionInsight["severity"]) {
  if (severity === "critical") {
    return {
      card: "border-red-200 bg-red-50/80",
      icon: "bg-red-100 text-red-700",
    };
  }

  if (severity === "opportunity") {
    return {
      card: "border-emerald-200 bg-emerald-50/80",
      icon: "bg-emerald-100 text-emerald-700",
    };
  }

  if (severity === "info") {
    return {
      card: "border-blue-200 bg-blue-50/80",
      icon: "bg-blue-100 text-blue-700",
    };
  }

  return {
    card: "border-amber-200 bg-amber-50/80",
    icon: "bg-amber-100 text-amber-700",
  };
}

function formatTime(time: string | null): string {
  if (!time) {
    return "No time set";
  }

  if (time.includes("-")) {
    return time
      .split("-")
      .map((timePart) => formatTime(timePart.trim()))
      .join(" - ");
  }

  const [hours, minutes] = time.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  return date.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function toDateInputValue(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function parseDateInputValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDateHeading(value: string) {
  return parseDateInputValue(value).toLocaleDateString("en-PH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getMonthCalendarDays(events: ActivityEvent[], monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((firstDay.getDay() + daysInMonth) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const day = index - firstDay.getDay() + 1;
    const date = new Date(year, month, day);
    const dateValue = toDateInputValue(date);
    const isInMonth = day > 0 && day <= daysInMonth;

    return {
      dateValue,
      isInMonth,
      label: isInMonth ? String(day) : "",
      hasEvent:
        isInMonth &&
        events.some(
          (event) =>
            event.event_date === dateValue &&
            event.status !== "draft" &&
            event.status !== "cancelled",
        ),
    };
  });
}

function CalendarPanel({
  events,
  selectedDate,
  onSelectDate,
}: Pick<
  ActivitiesSectionsProps,
  "events" | "selectedDate" | "onSelectDate"
>) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const selected = parseDateInputValue(selectedDate);
    return new Date(selected.getFullYear(), selected.getMonth(), 1);
  });
  const calendarDays = getMonthCalendarDays(events, visibleMonth);
  const monthLabel = visibleMonth.toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
  });

  function moveMonth(direction: -1 | 1) {
    setVisibleMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + direction, 1),
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50" onClick={() => moveMonth(-1)} type="button">
          <ChevronDownIcon className="h-5 w-5 rotate-90" />
        </button>
        <h2 className="text-lg font-semibold text-slate-800">{monthLabel}</h2>
        <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50" onClick={() => moveMonth(1)} type="button">
          <ChevronDownIcon className="h-5 w-5 -rotate-90" />
        </button>
      </div>
      <p className="mb-3 text-sm text-slate-500">
        I-click ang petsa para makita ang scheduled activities.
      </p>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <span className="py-2" key={day}>
            {day}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => (
          <button
            className={[
              "flex aspect-square min-h-12 flex-col items-center justify-center rounded-lg border p-1 text-sm",
              day.isInMonth ? "cursor-pointer hover:bg-slate-50" : "cursor-default text-slate-300",
              day.dateValue === selectedDate
                ? "border-[#1e3a5f] bg-[#1e3a5f]/10"
                : "border-transparent",
            ].join(" ")}
            key={`${day.dateValue}-${index}`}
            onClick={day.isInMonth ? () => onSelectDate(day.dateValue) : undefined}
            type="button"
          >
            {day.label}
            {day.hasEvent ? (
              <span className="mt-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[0.62rem] font-medium text-emerald-600">
                event
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </section>
  );
}

function DayEventsPanel({
  events,
  selectedDate,
  onScheduleEvent,
}: Pick<ActivitiesSectionsProps, "events" | "selectedDate" | "onScheduleEvent">) {
  const visibleEvents = events
    .filter(
      (event) =>
        event.event_date === selectedDate &&
        event.status !== "draft" &&
        event.status !== "cancelled",
    )
    .slice(0, 3);
  const scheduleButtonLabel =
    visibleEvents.length > 0 ? "Add Event" : "Schedule Event";

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-800">
          Events on {formatDateHeading(selectedDate)}
        </h2>
        <button className="inline-grid min-h-12 w-36 grid-cols-[18px_minmax(0,1fr)] items-center gap-2 rounded-[10px] bg-[#1e3a5f] px-3 py-2 text-sm font-semibold leading-tight text-white hover:bg-[#2a4a6f]" onClick={() => onScheduleEvent(selectedDate)} type="button">
          <CalendarIcon className="h-4 w-4" />
          <span className="text-center">{scheduleButtonLabel}</span>
        </button>
      </div>
      <div className="flex flex-col gap-4">
        {visibleEvents.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
            No scheduled events yet.
          </div>
        ) : null}
        {visibleEvents.map((event) => (
          <article
            className="rounded-lg border border-slate-200 bg-slate-50 p-4"
            key={event.event_id}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  {event.event_name}
                </h3>
                <p className="text-xs font-medium text-slate-500">
                  {event.category}
                </p>
              </div>
              <StatusBadge status={event.status} />
            </div>
            <div className="flex flex-col gap-1.5 text-[0.8125rem] text-slate-500">
              <span className="flex items-center gap-2">
                <ClockIcon className="h-3.5 w-3.5" /> {formatTime(event.event_time)}
              </span>
              <span className="flex items-center gap-2">
                <MapPinIcon className="h-3.5 w-3.5" /> {event.location || "No location set"}
              </span>
              <span className="flex items-center gap-2">
                <UsersIcon className="h-3.5 w-3.5" />{" "}
                {event.expected_attendees ?? 0} expected attendees
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function EventInsightsPanel({
  completedEventPerformance,
  events,
  onCreateFromRecommendation,
  onEditCatalogEvent,
  onOpenRegistrations,
  onOpenPerformance,
  recommendations,
}: Pick<
  ActivitiesSectionsProps,
  | "completedEventPerformance"
  | "events"
  | "onCreateFromRecommendation"
  | "onEditCatalogEvent"
  | "onOpenPerformance"
  | "onOpenRegistrations"
  | "recommendations"
>) {
  const { runInsightAction } = useDecisionInsightActions({
    findEvent: (eventId) => events.find((event) => event.event_id === eventId) ?? null,
    onCreateEvent: onCreateFromRecommendation,
    onOpenEvent: onEditCatalogEvent,
    onOpenPerformance,
    onOpenRegistrations,
  });
  const topRecommendation = recommendations.find(
    (recommendation) => !recommendation.is_already_planned && recommendation.response_count >= 3,
  );
  const lowRegistrationEvent = events
    .filter((event) => {
      if (event.status !== "scheduled" || !event.expected_attendees) return false;
      return ((event.event_registrations?.length ?? 0) / event.expected_attendees) * 100 < 30;
    })
    .sort(
      (first, second) =>
        ((first.event_registrations?.length ?? 0) / Math.max(first.expected_attendees ?? 1, 1)) -
        ((second.event_registrations?.length ?? 0) / Math.max(second.expected_attendees ?? 1, 1)),
    )[0];
  const strongCompletedEvent = completedEventPerformance.find(
    (event) =>
      event.registration_count >= 3 &&
      (event.attendance_rate ?? 0) >= 70 &&
      event.feedback_count >= 3 &&
      (event.average_feedback_rating ?? 0) >= 4,
  );
  const overBudgetEvent = completedEventPerformance.find(
    (event) => (event.budget_utilization_percentage ?? 0) > 100,
  );
  const insights: DecisionInsight[] = [
    topRecommendation
      ? {
          actionLabel: "Create Event",
          actionType: "create_event",
          category: "survey",
          dataSource: "Survey event preference results",
          description: `${topRecommendation.event_name} has ${formatRatingValue(topRecommendation.average_rating)} from ${topRecommendation.total_respondent_count ?? topRecommendation.response_count} respondent(s): ${topRecommendation.authenticated_respondent_count ?? 0} registered Youth and ${topRecommendation.guest_respondent_count ?? 0} guest(s).`,
          id: `activity-top-recommendation-${topRecommendation.event_name}`,
          priority: 6,
          recommendedAction: "Create a draft event for admin review.",
          recommendedEventCategory: topRecommendation.event_category,
          recommendedEventName: topRecommendation.event_name,
          severity: "opportunity",
          supportingValue: formatRatingValue(topRecommendation.average_rating),
          title: "Highest-rated unscheduled recommendation",
          type: "unscheduled_recommendation",
        }
      : {
          actionType: "none",
          category: "survey",
          dataSource: "Survey event preference results",
          description: "Not enough data. At least 3 distinct Youth respondents are needed for a recommendation.",
          id: "activity-survey-insufficient-data",
          priority: 99,
          severity: "info",
          supportingValue: "Minimum 3 respondents required",
          title: "Survey recommendation",
          type: "insufficient_survey_data",
        },
    lowRegistrationEvent
      ? {
          actionLabel: "View Registrations",
          actionType: "view_event_registrations",
          category: "registration",
          dataSource: "Events and event registrations",
          description: `${lowRegistrationEvent.event_name} has ${lowRegistrationEvent.event_registrations?.length ?? 0} registration(s) out of ${lowRegistrationEvent.expected_attendees ?? 0} expected attendee(s).`,
          eventId: lowRegistrationEvent.event_id,
          id: `activity-low-registration-${lowRegistrationEvent.event_id}`,
          priority: 3,
          recommendedAction: "Review registered Youth and outreach needs.",
          severity: "warning",
          supportingValue: `${lowRegistrationEvent.event_registrations?.length ?? 0} registered`,
          title: "Scheduled event with low registration",
          type: "low_registration",
        }
      : {
          actionType: "none",
          category: "registration",
          dataSource: "Events and event registrations",
          description: "Not enough data or no scheduled event is below the 30% registration-fill threshold.",
          id: "activity-registration-attention-none",
          priority: 99,
          severity: "info",
          title: "Registration attention",
          type: "registration_attention",
        },
    strongCompletedEvent
      ? {
          actionLabel: "View Performance",
          actionType: "view_event_performance",
          category: "event",
          dataSource: "Completed event performance",
          description: `${strongCompletedEvent.event_name} had ${strongCompletedEvent.attendance_count} attended out of ${strongCompletedEvent.registration_count} registration(s) and ${strongCompletedEvent.average_feedback_rating}/5 feedback.`,
          eventId: strongCompletedEvent.event_id,
          id: `activity-strong-performance-${strongCompletedEvent.event_id}`,
          priority: 7,
          recommendedAction: "Use this as a reference for future planning.",
          severity: "opportunity",
          supportingValue: `${strongCompletedEvent.attendance_rate}% attendance`,
          title: "Strong completed event performance",
          type: "strong_completed_event_performance",
        }
      : overBudgetEvent
        ? {
            actionLabel: "View Financial Records",
            actionType: "view_transactions",
            category: "budget",
            dataSource: "Completed event performance and financial transactions",
            description: `${overBudgetEvent.event_name} used ${overBudgetEvent.budget_utilization_percentage}% of allocation based on completed transactions only.`,
            eventId: overBudgetEvent.event_id,
            id: `activity-over-budget-${overBudgetEvent.event_id}`,
            priority: 2,
            recommendedAction: "Review completed financial records for this event.",
            severity: "critical",
            supportingValue: `${overBudgetEvent.budget_utilization_percentage}% utilization`,
            title: "Event exceeded allocation",
            type: "completed_event_over_budget",
          }
        : {
            actionType: "none",
            category: "feedback",
            dataSource: "Completed event performance",
            description: "Not enough data. Attendance comparisons need at least 3 registrations and feedback conclusions need 3 responses.",
            id: "activity-completed-performance-insufficient-data",
            priority: 99,
            severity: "info",
            title: "Completed event performance",
            type: "insufficient_performance_data",
          },
  ];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-slate-800">
          Decision Support Insights
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Survey-based signals from Youth responses and live event registrations
        </p>
      </div>
      <div className="flex max-h-[390px] flex-col gap-3 overflow-y-auto pr-1">
        {insights.slice(0, 3).map((insight) => {
          const toneClasses = getInsightToneClasses(insight.severity);

          return (
            <article className={`flex gap-3 rounded-xl border p-4 shadow-sm ${toneClasses.card}`} key={insight.id}>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${toneClasses.icon}`}>
                <AlertIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">{insight.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{insight.description}</p>
                {canRunDecisionInsightAction(insight) ? (
                  <button
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#1e3a5f] hover:underline"
                    onClick={() => runInsightAction(insight)}
                    type="button"
                  >
                    {insight.actionLabel} <ArrowRightIcon className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function UpcomingEventsPanel({ events }: Pick<ActivitiesSectionsProps, "events">) {
  const today = new Date().toISOString().slice(0, 10);
  const upcomingEvents = events
    .filter(
      (event) =>
        (event.status === "scheduled" || event.status === "ongoing") &&
        (!event.event_date || event.event_date >= today),
    )
    .sort((first, second) => {
      const firstDate = first.event_date ?? "9999-12-31";
      const secondDate = second.event_date ?? "9999-12-31";
      return firstDate.localeCompare(secondDate);
    });

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-slate-800">
          Upcoming Events
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Scheduled and ongoing activities from live event records
        </p>
      </div>
      <div className="flex max-h-[300px] flex-col gap-3 overflow-y-auto pr-1">
        {upcomingEvents.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
            No upcoming scheduled or ongoing events yet.
          </div>
        ) : null}
        {upcomingEvents.map((event) => (
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-4" key={event.event_id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  {event.event_name}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {event.category} - {event.event_date ?? "Date TBA"}
                </p>
              </div>
              <StatusBadge status={event.status} />
            </div>
            <div className="mt-3 flex flex-col gap-1.5 text-xs text-slate-500">
              <span className="flex items-center gap-2">
                <ClockIcon className="h-3.5 w-3.5" /> {formatTime(event.event_time)}
              </span>
              <span className="flex items-center gap-2">
                <MapPinIcon className="h-3.5 w-3.5" /> {event.location || "No location set"}
              </span>
              <span className="flex items-center gap-2">
                <UsersIcon className="h-3.5 w-3.5" />{" "}
                {event.event_registrations?.length ?? 0} registered / {event.expected_attendees ?? 0} expected
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ActivitiesListPanel({
  errorMessage,
  events,
  isLoading,
  onAddCatalogEvent,
  onDeleteCatalogEvent,
  onEditCatalogEvent,
  onManageCategories,
  onOpenPastFeedbackQr,
  onOpenRegistrations,
  onCreateFromRecommendation,
  recommendations,
}: Pick<
  ActivitiesSectionsProps,
  | "errorMessage"
  | "events"
  | "isLoading"
  | "onAddCatalogEvent"
  | "onDeleteCatalogEvent"
  | "onEditCatalogEvent"
  | "onOpenPastFeedbackQr"
  | "onOpenRegistrations"
  | "onCreateFromRecommendation"
  | "onManageCategories"
  | "recommendations"
>) {
  const [currentPage, setCurrentPage] = useState(1);
  const topRecommendations = [
    ...recommendations.filter((item) => !item.is_already_planned),
    ...recommendations.filter((item) => item.is_already_planned),
  ].slice(0, 3);
  const pastEvents = events.filter((event) => event.status === "completed");
  const totalPages = Math.max(1, Math.ceil(events.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedEvents = events.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize,
  );

  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
        <div>
          <h2 className="text-base font-semibold text-slate-800">
            Possible Activities
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Top 3 recommendations ranked by distinct Youth survey support.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-[#1e3a5f] hover:bg-blue-50" onClick={onManageCategories} type="button">
            Categories
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-[#1e3a5f] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#2a4a6f]" onClick={onAddCatalogEvent} type="button">
            <PlusIcon className="h-4 w-4" />
            Add New Event
          </button>
        </div>
      </div>

      <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-800">
          Top Survey-Based Recommendations
        </h3>
        <div className="grid gap-3 md:grid-cols-3">
          {topRecommendations.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500 md:col-span-3">
              No survey-based recommendations yet.
            </div>
          ) : null}
          {topRecommendations.map((event, index) => (
            <article
              className="rounded-lg border border-slate-200 bg-white p-4"
              key={event.event_name}
            >
              <span className="text-xs font-bold text-[#1e3a5f]">
                #{index + 1}
              </span>
              <h4 className="mt-1 text-sm font-semibold text-slate-800">
                {event.event_name}
              </h4>
              <p className="mt-1 text-xs text-slate-500">
                {event.event_category}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                {formatRatingValue(event.average_rating)} average -{" "}
                {event.positive_interest_percentage}% positive
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {event.authenticated_respondent_count ?? 0} Youth / {event.guest_respondent_count ?? 0} guest(s)
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {event.source_surveys.join(", ")}
              </p>
              {event.is_already_planned ? (
                <span className="mt-3 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  Already planned
                </span>
              ) : (
                <button
                  className="mt-3 rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-semibold text-white hover:bg-[#2a4a6f]"
                  onClick={() => onCreateFromRecommendation(event)}
                  type="button"
                >
                  Create Event
                </button>
              )}
            </article>
          ))}
        </div>
      </div>

      {errorMessage ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <ul className="flex list-none flex-col gap-3 p-0">
        {isLoading ? (
          <li className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
            Loading events...
          </li>
        ) : null}
        {!isLoading && events.length === 0 ? (
          <li className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
            No activities yet. Add a new event to get started.
          </li>
        ) : null}
        {paginatedEvents.map((item) => (
          <li
            className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 max-md:flex-col max-md:items-start"
            key={item.event_id}
          >
            <div>
              <h3 className="font-semibold text-slate-800">{item.event_name}</h3>
              <p className="mt-1 text-sm text-slate-500">
                {item.category} - Allocated:{" "}
                <strong className="text-slate-800">
                  {formatPeso(item.allocated_budget)}
                </strong>
              </p>
              <span className="mt-2 inline-flex">
                <StatusBadge status={item.status} />
              </span>
            </div>
            <div className="flex gap-2">
              <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 hover:bg-slate-50" onClick={() => onEditCatalogEvent(item)} type="button">
                Edit
              </button>
              <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 hover:bg-slate-50" onClick={() => onOpenRegistrations(item)} type="button">
                Registrations
              </button>
              <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-red-600 hover:bg-red-50" onClick={() => onDeleteCatalogEvent(item.event_id)} type="button">
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {events.length > pageSize ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <p className="text-sm text-slate-500">
            Showing {(safeCurrentPage - 1) * pageSize + 1}-
            {Math.min(safeCurrentPage * pageSize, events.length)} of{" "}
            {events.length} activities
          </p>
          <div className="flex items-center gap-2">
            <button
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              type="button"
            >
              Previous
            </button>
            <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
              {safeCurrentPage} / {totalPages}
            </span>
            <button
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={safeCurrentPage === totalPages}
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              type="button"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-sm font-semibold text-slate-800">Past Events</h3>
        <p className="mt-1 text-xs text-slate-500">
          Mga natapos nang event - para sa post-survey feedback at QR.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-[280px_minmax(0,1fr)]">
          <div className="flex flex-col gap-2">
            {pastEvents.map((event) => (
              <button
                className="rounded-lg border border-slate-200 bg-white p-3 text-left hover:border-[#1e3a5f]"
                key={event.event_id}
                onClick={() => onOpenPastFeedbackQr(event)}
                type="button"
              >
                <span className="block text-sm font-semibold text-slate-800">
                  {event.event_name}
                </span>
                <span className="text-xs text-slate-500">
                  {event.event_date || "No date"} - {formatPeso(event.allocated_budget)}
                </span>
              </button>
            ))}
            {pastEvents.length === 0 ? (
              <span className="rounded-lg border border-dashed border-slate-300 bg-white p-3 text-sm text-slate-500">
                No completed events yet.
              </span>
            ) : null}
          </div>
          <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-4 text-center text-sm text-slate-500">
            Select a past event to view info and generate QR.
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ActivitiesSections({
  errorMessage,
  completedEventPerformance,
  events,
  isLoading,
  selectedDate,
  onAddCatalogEvent,
  onDeleteCatalogEvent,
  onEditCatalogEvent,
  onCreateFromRecommendation,
  onManageCategories,
  onOpenPastFeedbackQr,
  onOpenPerformance,
  onOpenRegistrations,
  onSelectDate,
  onScheduleEvent,
  recommendations,
}: ActivitiesSectionsProps) {
  return (
    <div className="flex-1 px-8 py-6">
      <div className="grid grid-cols-[minmax(0,1fr)_380px] gap-5 max-xl:grid-cols-1">
        <CalendarPanel
          events={events}
          onSelectDate={onSelectDate}
          selectedDate={selectedDate}
        />
        <div className="flex flex-col gap-5">
          <DayEventsPanel
            events={events}
            onScheduleEvent={onScheduleEvent}
            selectedDate={selectedDate}
          />
          <EventInsightsPanel
            completedEventPerformance={completedEventPerformance}
            events={events}
            onCreateFromRecommendation={onCreateFromRecommendation}
            onEditCatalogEvent={onEditCatalogEvent}
            onOpenPerformance={onOpenPerformance}
            onOpenRegistrations={onOpenRegistrations}
            recommendations={recommendations}
          />
          <UpcomingEventsPanel events={events} />
        </div>
      </div>

      <ActivitiesListPanel
        errorMessage={errorMessage}
        events={events}
        isLoading={isLoading}
        onAddCatalogEvent={onAddCatalogEvent}
        onDeleteCatalogEvent={onDeleteCatalogEvent}
        onEditCatalogEvent={onEditCatalogEvent}
        onCreateFromRecommendation={onCreateFromRecommendation}
        onManageCategories={onManageCategories}
        onOpenPastFeedbackQr={onOpenPastFeedbackQr}
        onOpenRegistrations={onOpenRegistrations}
        recommendations={recommendations}
      />
    </div>
  );
}
