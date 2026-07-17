import { CalendarDays, MapPin, Send, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import {
  getPublicFeedbackEvent,
  submitPostEventFeedback,
  type PastFeedbackEvent,
} from "../components/Youth/Feedback/FeedbackService";

export default function EventFeedbackPage() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState<PastFeedbackEvent | null>(null);
  const [guestName, setGuestName] = useState("");
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadEvent() {
      const numericEventId = Number(eventId);
      if (!Number.isInteger(numericEventId)) {
        setErrorMessage("This feedback link is invalid.");
        setIsLoading(false);
        return;
      }

      const { data, error } = await getPublicFeedbackEvent(numericEventId);
      if (!isMounted) return;
      if (error) setErrorMessage(error.message);
      if (!data) setErrorMessage("This event is not available for feedback.");
      setEvent(data);
      setIsLoading(false);
    }

    loadEvent();
    return () => {
      isMounted = false;
    };
  }, [eventId]);

  async function handleSubmit() {
    if (!event) return;
    const trimmedComments = comments.trim();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (rating < 1 || rating > 5) {
      setErrorMessage("Please choose a rating from 1 to 5.");
      return;
    }

    if (!trimmedComments) {
      setErrorMessage("Please type your feedback before submitting.");
      return;
    }

    setIsSubmitting(true);
    const { error } = await submitPostEventFeedback({
      comments: trimmedComments,
      eventId: event.event_id,
      guestName: user ? null : guestName.trim(),
      rating,
    });
    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setGuestName("");
    setComments("");
    setRating(5);
    setSuccessMessage("Thank you. Your feedback was submitted.");
  }

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-8 text-slate-900">
      <div className="mx-auto max-w-2xl">
        <Link className="text-sm font-semibold text-[#1e3a5f] hover:underline" to="/">
          Back to home
        </Link>
        <section className="mt-4 rounded-[14px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h1 className="text-2xl font-bold text-slate-900">Event Feedback</h1>

          {isLoading ? <p className="mt-4 text-sm text-slate-500">Loading event...</p> : null}
          {errorMessage ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}
          {successMessage ? (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {successMessage}
            </div>
          ) : null}

          {event ? (
            <form
              className="mt-5 space-y-5"
              onSubmit={(submitEvent) => {
                submitEvent.preventDefault();
                handleSubmit();
              }}
            >
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <h2 className="font-semibold text-slate-900">{event.event_name}</h2>
                <p className="mt-1 text-sm text-slate-500">{event.category}</p>
                <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                  <CalendarDays className="h-4 w-4" />
                  {event.event_date ?? "Date unavailable"}
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="h-4 w-4" />
                  {event.location ?? "Location unavailable"}
                </p>
              </div>

              <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-[#1e3a5f]">
                {user
                  ? "You are submitting as your logged-in Youth account."
                  : "You are submitting as a guest. Guest duplicate prevention is not guaranteed."}
              </div>

              {!user ? (
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold">Guest name (optional)</span>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    maxLength={120}
                    onChange={(inputEvent) => setGuestName(inputEvent.target.value)}
                    value={guestName}
                  />
                </label>
              ) : null}

              <div>
                <p className="mb-2 text-sm font-semibold">Rating</p>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      className={[
                        "inline-flex h-11 w-11 items-center justify-center rounded-lg border text-sm font-semibold",
                        value <= rating
                          ? "border-[#1e3a5f] bg-[#1e3a5f] text-white"
                          : "border-slate-200 bg-white text-slate-500",
                      ].join(" ")}
                      disabled={isSubmitting}
                      key={value}
                      onClick={() => setRating(value)}
                      type="button"
                    >
                      <Star className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">Comments</span>
                <textarea
                  className="min-h-40 w-full resize-y rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  maxLength={2000}
                  onChange={(inputEvent) => setComments(inputEvent.target.value)}
                  placeholder="Tell us what went well and what can improve..."
                  value={comments}
                />
              </label>

              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1e3a5f] px-4 py-3 text-sm font-medium text-white hover:bg-[#173256] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                disabled={isSubmitting}
                type="submit"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </button>
            </form>
          ) : null}
        </section>
      </div>
    </main>
  );
}
