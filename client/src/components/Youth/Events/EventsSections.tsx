import {
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  RefreshCw,
  Users,
} from "lucide-react";
import seminarImage from "../../../assets/seminar.jpg";
import type { YouthEvent } from "./EventsService";

type EventsSectionsProps = {
  errorMessage: string | null;
  events: YouthEvent[];
  isLoading: boolean;
  onCancel: (eventId: number) => void;
  onRefresh: () => void;
  onRegister: (eventId: number) => void;
  registeringEventId: number | null;
};

function formatEventDate(value: string | null) {
  if (!value) {
    return "Date to be announced";
  }

  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function statusClass(status: YouthEvent["status"]) {
  if (status === "ongoing") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  return "bg-blue-50 text-blue-700 ring-blue-200";
}

function EventCardItem({
  event,
  isRegistering,
  onCancel,
  onRegister,
}: {
  event: YouthEvent;
  isRegistering: boolean;
  onCancel: (eventId: number) => void;
  onRegister: (eventId: number) => void;
}) {
  const isRegistered = event.is_registered;
  const isFull = event.remaining_slots !== null && event.remaining_slots <= 0 && !isRegistered;

  return (
    <article className="overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-sm">
      <div className="relative">
        <img
          alt={event.event_name}
          className="h-52 w-full object-cover"
          src={event.cover_image || seminarImage}
        />
        <span
          className={[
            "absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1",
            statusClass(event.status),
          ].join(" ")}
        >
          {event.status}
        </span>
      </div>

      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
          {event.category}
        </p>
        <h2 className="mt-1 text-lg font-semibold leading-snug text-slate-900">
          {event.event_name}
        </h2>

        {event.description ? (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500">
            {event.description}
          </p>
        ) : null}

        <div className="mt-4 space-y-2 text-sm text-slate-500">
          <p className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            {formatEventDate(event.event_date)}
          </p>
          <p className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {event.event_time || "Time to be announced"}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {event.location || "Location to be announced"}
          </p>
          <p className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {event.registration_count} registered / {event.expected_attendees ?? 0} expected
          </p>
          <p className="text-xs font-medium text-slate-400">
            {event.remaining_slots === null ? "No capacity limit set" : `${event.remaining_slots} slot(s) remaining`}
          </p>
        </div>

        <button
          className={[
            "mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-70",
            isRegistered
              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
              : "bg-[#1e3a5f] text-white hover:bg-[#173256]",
          ].join(" ")}
          disabled={isRegistering || isFull}
          onClick={() => (isRegistered ? onCancel(event.event_id) : onRegister(event.event_id))}
          type="button"
        >
          {isRegistered ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              {isRegistering ? "Cancelling..." : "Cancel Registration"}
            </>
          ) : isRegistering ? (
            "Registering..."
          ) : isFull ? (
            "Full"
          ) : (
            "Register"
          )}
        </button>
      </div>
    </article>
  );
}

function EventSkeleton() {
  return (
    <article className="overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-sm">
      <div className="h-52 bg-slate-200" />
      <div className="space-y-3 p-5">
        <div className="h-3 w-24 rounded bg-slate-200" />
        <div className="h-5 w-3/4 rounded bg-slate-200" />
        <div className="h-4 w-full rounded bg-slate-100" />
        <div className="h-4 w-2/3 rounded bg-slate-100" />
        <div className="h-11 w-full rounded-lg bg-slate-200" />
      </div>
    </article>
  );
}

export default function EventsSections({
  errorMessage,
  events,
  isLoading,
  onCancel,
  onRefresh,
  onRegister,
  registeringEventId,
}: EventsSectionsProps) {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-6 sm:px-6 lg:px-8">
      {errorMessage ? (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span>{errorMessage}</span>
          <button
            className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-1.5 font-medium text-amber-900 ring-1 ring-amber-200 hover:bg-amber-100"
            onClick={onRefresh}
            type="button"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <EventSkeleton key={item} />
          ))}
        </div>
      ) : events.length > 0 ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {events.map((event) => (
            <EventCardItem
              event={event}
              isRegistering={registeringEventId === event.event_id}
              key={event.event_id}
              onCancel={onCancel}
              onRegister={onRegister}
            />
          ))}
        </div>
      ) : (
        <section className="rounded-[14px] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            No active events yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
            Scheduled and ongoing events from the SK admin dashboard will appear
            here once they are published.
          </p>
        </section>
      )}
    </div>
  );
}
