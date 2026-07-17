import { useEffect, useState } from "react";
import {
  getAllPublicScheduledEvents,
  type PublicScheduledEvent,
} from "../../services/PublicEventsService";
import { youthImages } from "../../utils/adminPortalData";
import AdminModal from "../../utils/AdminModal";

function formatDate(date: string | null) {
  if (!date) return "Date to be announced";
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function formatTime(time: string | null) {
  return time || "Time to be announced";
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<PublicScheduledEvent[]>([]);
  const [selectedEvent, setSelectedEvent] =
    useState<PublicScheduledEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadEvents() {
      setIsLoading(true);
      setErrorMessage(null);
      const { data, error } = await getAllPublicScheduledEvents();

      if (!isMounted) return;
      if (error) {
        setErrorMessage(error.message);
        setEvents([]);
      } else {
        setEvents(data);
      }
      setIsLoading(false);
    }

    loadEvents();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <main className="mx-auto max-w-6xl px-6 py-14">
        <h1 className="text-3xl font-bold text-[#0b1f3b]">
          Events & Activities
        </h1>
        <p className="mt-2 text-slate-500">
          Browse upcoming scheduled SK activities for Kabataan.
        </p>

        {errorMessage ? (
          <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            {errorMessage}
          </div>
        ) : isLoading ? (
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div
                className="h-80 animate-pulse rounded-xl border border-slate-200 bg-slate-100"
                key={item}
              />
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {events.map((event) => (
              <article
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                key={event.event_id}
              >
                <button
                  className="block h-full w-full text-left"
                  onClick={() => setSelectedEvent(event)}
                  type="button"
                >
                  <img
                    alt=""
                    className="h-52 w-full object-cover"
                    src={event.cover_image || youthImages.seminar}
                  />
                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {formatDate(event.event_date)}
                    </p>
                    <h2 className="mt-1 font-bold text-slate-900">
                      {event.event_name}
                    </h2>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#1e3a5f]">
                      {event.category}
                    </p>
                    <p className="mt-2 line-clamp-3 text-sm text-slate-500">
                      {event.description || "Details will be posted soon."}
                    </p>
                  </div>
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
            No scheduled events are available right now.
          </div>
        )}
      </main>

      <AdminModal
        footer={
          <button
            className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white"
            onClick={() => setSelectedEvent(null)}
            type="button"
          >
            Close
          </button>
        }
        onClose={() => setSelectedEvent(null)}
        open={Boolean(selectedEvent)}
        title={selectedEvent?.event_name || "Event"}
      >
        {selectedEvent ? (
          <div>
            <img
              alt=""
              className="h-64 w-full rounded-xl object-cover"
              src={selectedEvent.cover_image || youthImages.seminar}
            />
            <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              <p>
                <span className="font-semibold text-slate-900">Category:</span>{" "}
                {selectedEvent.category}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Date:</span>{" "}
                {formatDate(selectedEvent.event_date)}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Time:</span>{" "}
                {formatTime(selectedEvent.event_time)}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Location:</span>{" "}
                {selectedEvent.location || "To be announced"}
              </p>
              <p>
                <span className="font-semibold text-slate-900">
                  Expected attendees:
                </span>{" "}
                {selectedEvent.expected_attendees ?? "Not specified"}
              </p>
            </div>
            <p className="mt-4 leading-7 text-slate-600">
              {selectedEvent.description || "Details will be posted soon."}
            </p>
          </div>
        ) : null}
      </AdminModal>
    </>
  );
}
