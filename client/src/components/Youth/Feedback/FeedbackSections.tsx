import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  MapPin,
  MessageSquare,
  Search,
  Send,
  Star,
} from "lucide-react";
import { useState } from "react";
import type { PastFeedbackEvent } from "./FeedbackService";

type FeedbackSectionsProps = {
  comments: string;
  eventSearch: string;
  events: PastFeedbackEvent[];
  errorMessage: string | null;
  isLoading: boolean;
  isSubmitting: boolean;
  onCommentsChange: (value: string) => void;
  onEventSearchChange: (value: string) => void;
  onRatingChange: (value: number) => void;
  onSelectedEventChange: (value: number | "") => void;
  onSubmit: () => void;
  rating: number;
  selectedEventId: number | "";
  submittedEventIds: Set<number>;
  successMessage: string | null;
};

export default function FeedbackSections({
  comments,
  eventSearch,
  events,
  errorMessage,
  isLoading,
  isSubmitting,
  onCommentsChange,
  onEventSearchChange,
  onRatingChange,
  onSelectedEventChange,
  onSubmit,
  rating,
  selectedEventId,
  submittedEventIds,
  successMessage,
}: FeedbackSectionsProps) {
  const selectedEvent = events.find((event) => event.event_id === selectedEventId);
  const [isEventListOpen, setIsEventListOpen] = useState(false);

  function handleSelectEvent(eventId: number) {
    onSelectedEventChange(eventId);
    setIsEventListOpen(false);
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-5 py-6 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
      <aside className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
          <MessageSquare className="h-5 w-5" />
        </div>
        <h2 className="mt-4 text-base font-semibold text-slate-900">
          Post-Event Feedback
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Choose a completed SK activity, rate your experience, and send your
          comments to the council.
        </p>
        {selectedEvent ? (
          <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">
              {selectedEvent.event_name}
            </p>
            <p className="mt-2 flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {selectedEvent.event_date ?? "Date unavailable"}
            </p>
            <p className="mt-1 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {selectedEvent.location ?? "Location unavailable"}
            </p>
          </div>
        ) : null}
      </aside>

      <form
        className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        {successMessage ? (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="relative">
          <span className="mb-1.5 block text-sm font-semibold text-slate-900">
            Search Past Event
          </span>
          <span className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 transition focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              className="min-w-0 flex-1 border-none bg-transparent text-sm outline-none placeholder:text-slate-400"
              disabled={isLoading || isSubmitting}
              onChange={(event) => onEventSearchChange(event.target.value)}
              onFocus={() => setIsEventListOpen(true)}
              placeholder="Search by event, category, or location..."
              type="search"
              value={eventSearch}
            />
            <button
              aria-label="Toggle event matches"
              className="text-slate-400 hover:text-slate-700"
              disabled={isLoading || isSubmitting}
              onClick={() => setIsEventListOpen((open) => !open)}
              type="button"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </span>

          {isEventListOpen && !isLoading ? (
            <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-[0_18px_45px_rgba(15,23,42,0.16)]">
              {events.length > 0 ? (
                events.map((event) => {
                  const isSubmitted = submittedEventIds.has(event.event_id);
                  const isSelected = selectedEventId === event.event_id;

                  return (
                    <button
                      className={[
                        "w-full rounded-lg px-3 py-3 text-left transition-colors",
                        isSelected
                          ? "bg-[#1e3a5f] text-white"
                          : "text-slate-700 hover:bg-slate-50",
                        isSubmitted ? "cursor-not-allowed opacity-60" : "",
                      ].join(" ")}
                      disabled={isSubmitted}
                      key={event.event_id}
                      onClick={() => handleSelectEvent(event.event_id)}
                      type="button"
                    >
                      <span className="block text-sm font-semibold">
                        {event.event_name}
                      </span>
                      <span
                        className={[
                          "mt-1 block text-xs",
                          isSelected ? "text-white/75" : "text-slate-500",
                        ].join(" ")}
                      >
                        {event.category}
                        {event.location ? ` - ${event.location}` : ""}
                        {isSubmitted ? " - already submitted" : ""}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-4 text-sm text-slate-500">
                  {eventSearch
                    ? "No matching past events found."
                    : "No completed events available."}
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="mt-5">
          <p className="mb-1.5 text-sm font-semibold text-slate-900">
            Selected Event
          </p>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
            {selectedEvent ? selectedEvent.event_name : "No event selected"}
          </div>
        </div>

        {!isLoading && events.length === 0 ? (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            No completed events are available for feedback yet.
          </div>
        ) : null}

        <div className="mt-5">
          <p className="mb-2 text-sm font-semibold text-slate-900">Rating</p>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                className={[
                  "inline-flex h-11 w-11 items-center justify-center rounded-lg border text-sm font-semibold transition-colors",
                  value <= rating
                    ? "border-[#1e3a5f] bg-[#1e3a5f] text-white"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                ].join(" ")}
                disabled={isSubmitting}
                key={value}
                onClick={() => onRatingChange(value)}
                type="button"
              >
                <Star className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>

        <label className="mt-5 block text-sm font-semibold text-slate-900">
          Comments
        </label>

        <textarea
          className="mt-2 min-h-48 w-full resize-y rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          disabled={isSubmitting}
          onChange={(event) => onCommentsChange(event.target.value)}
          placeholder="Tell us what went well and what can improve..."
          value={comments}
        />

        <button
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1e3a5f] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#173256] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          disabled={isSubmitting}
          type="submit"
        >
          <Send className="h-4 w-4" />
          {isSubmitting ? "Submitting..." : "Submit Feedback"}
        </button>
        {selectedEventId && submittedEventIds.has(selectedEventId) ? (
          <p className="mt-3 inline-flex items-center gap-2 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            You already submitted feedback for this event.
          </p>
        ) : null}
      </form>
    </div>
  );
}
