import {
  type ActivityCatalogItem,
  activityCatalog,
  calendarDays,
  pastEvents,
  scheduledEvents,
  topSurveyPicks,
} from "./activitiesData";
import {
  AlertIcon,
  ArrowRightIcon,
  CalendarIcon,
  ChevronDownIcon,
} from "../Dashboard/icons";

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
  onEditCatalogEvent: (activity: ActivityCatalogItem) => void;
  onOpenPastFeedbackQr: (eventTitle: string) => void;
  onScheduleEvent: () => void;
};

function CalendarPanel({ onScheduleEvent }: Pick<ActivitiesSectionActions, "onScheduleEvent">) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50" type="button">
          <ChevronDownIcon className="h-5 w-5 rotate-90" />
        </button>
        <h2 className="text-lg font-semibold text-slate-800">May 2024</h2>
        <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50" type="button">
          <ChevronDownIcon className="h-5 w-5 -rotate-90" />
        </button>
      </div>
      <p className="mb-3 text-sm text-slate-500">
        I-click ang petsa para mag-schedule ng activity.
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
              day.label ? "cursor-pointer hover:bg-slate-50" : "cursor-default text-slate-300",
              day.isSelected
                ? "border-[#1e3a5f] bg-[#1e3a5f]/10"
                : "border-transparent",
            ].join(" ")}
            key={`${day.label}-${index}`}
            onClick={day.label ? onScheduleEvent : undefined}
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

function DayEventsPanel({ onScheduleEvent }: Pick<ActivitiesSectionActions, "onScheduleEvent">) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-800">
          Events on May 10
        </h2>
        <button className="inline-flex min-h-9 items-center gap-2 rounded-[10px] bg-[#1e3a5f] px-3 py-2 text-sm font-medium text-white hover:bg-[#2a4a6f]" onClick={onScheduleEvent} type="button">
          <CalendarIcon className="h-4 w-4" />
          Schedule Event
        </button>
      </div>
      <div className="flex flex-col gap-4">
        {scheduledEvents.map((event) => (
          <article
            className="rounded-lg border border-slate-200 bg-slate-50 p-4"
            key={event.id}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  {event.title}
                </h3>
                <p className="text-xs font-medium text-slate-500">
                  {event.category}
                </p>
              </div>
              <span className="rounded bg-[#1e3a5f]/15 px-2 py-1 text-[0.6875rem] font-medium text-[#1e3a5f]">
                {event.status}
              </span>
            </div>
            <div className="flex flex-col gap-1.5 text-[0.8125rem] text-slate-500">
              <span className="flex items-center gap-2">
                <ClockIcon className="h-3.5 w-3.5" /> {event.time}
              </span>
              <span className="flex items-center gap-2">
                <MapPinIcon className="h-3.5 w-3.5" /> {event.location}
              </span>
              <span className="flex items-center gap-2">
                <UsersIcon className="h-3.5 w-3.5" /> {event.attendees}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function EventInsightsPanel() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-slate-800">
          Decision Support Insights
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          AI-powered recommendations based on overall event performance
        </p>
      </div>
      <article className="flex gap-3 rounded-xl border border-slate-200 bg-amber-100/40 p-4 shadow-sm">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
          <AlertIcon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            Sports activities lead demand
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Basketball and volleyball are repeatedly selected in survey picks.
          </p>
          <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#1e3a5f]">
            Use for next event plan <ArrowRightIcon className="h-3.5 w-3.5" />
          </span>
        </div>
      </article>
    </section>
  );
}

function ActivitiesListPanel({
  onAddCatalogEvent,
  onEditCatalogEvent,
  onOpenPastFeedbackQr,
}: Pick<
  ActivitiesSectionActions,
  "onAddCatalogEvent" | "onEditCatalogEvent" | "onOpenPastFeedbackQr"
>) {
  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
        <div>
          <h2 className="text-base font-semibold text-slate-800">
            Possible Activities
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Ito ang lalabas sa Kabataan survey. May allocated budget bawat
            activity.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-[#1e3a5f] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#2a4a6f]" onClick={onAddCatalogEvent} type="button">
          <PlusIcon className="h-4 w-4" />
          Add New Event
        </button>
      </div>

      <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-800">
          Top 3 Survey Picks
        </h3>
        <div className="grid gap-3 md:grid-cols-3">
          {topSurveyPicks.map((pick) => (
            <article
              className="rounded-lg border border-slate-200 bg-white p-4"
              key={pick.rank}
            >
              <span className="text-xs font-bold text-[#1e3a5f]">
                #{pick.rank}
              </span>
              <h4 className="mt-1 text-sm font-semibold text-slate-800">
                {pick.title}
              </h4>
              <p className="mt-1 text-xs text-slate-500">
                {pick.votes} vote(s)
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Allocated Budget:{" "}
                <strong className="text-slate-800">{pick.budget}</strong>
              </p>
            </article>
          ))}
        </div>
      </div>

      <ul className="flex list-none flex-col gap-3 p-0">
        {activityCatalog.map((item) => (
          <li
            className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 max-md:flex-col max-md:items-start"
            key={item.id}
          >
            <div>
              <h3 className="font-semibold text-slate-800">{item.title}</h3>
              <p className="mt-1 text-sm text-slate-500">
                {item.category} - Allocated:{" "}
                <strong className="text-slate-800">{item.budget}</strong>
              </p>
              <span className="mt-2 inline-flex rounded-full bg-[#1e3a5f]/10 px-3 py-1 text-xs font-medium text-[#1e3a5f]">
                {item.status}
              </span>
            </div>
            <div className="flex gap-2">
              <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 hover:bg-slate-50" onClick={() => onEditCatalogEvent(item)} type="button">
                Edit
              </button>
              <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-red-600 hover:bg-red-50" type="button">
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

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
                key={event.title}
                onClick={() => onOpenPastFeedbackQr(event.title)}
                type="button"
              >
                <span className="block text-sm font-semibold text-slate-800">
                  {event.title}
                </span>
                <span className="text-xs text-slate-500">{event.meta}</span>
              </button>
            ))}
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
  onAddCatalogEvent,
  onEditCatalogEvent,
  onOpenPastFeedbackQr,
  onScheduleEvent,
}: ActivitiesSectionActions) {
  return (
    <div className="flex-1 px-8 py-6">
      <div className="grid grid-cols-[minmax(0,1fr)_380px] gap-5 max-xl:grid-cols-1">
        <CalendarPanel onScheduleEvent={onScheduleEvent} />
        <div className="flex flex-col gap-5">
          <DayEventsPanel onScheduleEvent={onScheduleEvent} />
          <EventInsightsPanel />
        </div>
      </div>

      <ActivitiesListPanel
        onAddCatalogEvent={onAddCatalogEvent}
        onEditCatalogEvent={onEditCatalogEvent}
        onOpenPastFeedbackQr={onOpenPastFeedbackQr}
      />
    </div>
  );
}
