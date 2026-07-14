import { useEffect, useState } from "react";
import { useAuth } from "../../../auth/useAuth";
import FeedbackHeader from "./FeedbackHeader";
import FeedbackSections from "./FeedbackSections";
import {
  getPastFeedbackEvents,
  getSubmittedFeedbackEventIds,
  submitPostEventFeedback,
  type PastFeedbackEvent,
} from "./FeedbackService";

export default function Feedback() {
  const { user } = useAuth();
  const [events, setEvents] = useState<PastFeedbackEvent[]>([]);
  const [submittedEventIds, setSubmittedEventIds] = useState<Set<number>>(
    new Set(),
  );
  const [selectedEventId, setSelectedEventId] = useState<number | "">("");
  const [eventSearch, setEventSearch] = useState("");
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadFeedbackEvents() {
      setIsLoading(true);
      setErrorMessage(null);

      const [{ data, error }, submittedFeedback] = await Promise.all([
        getPastFeedbackEvents(),
        user?.id
          ? getSubmittedFeedbackEventIds(user.id)
          : Promise.resolve({ data: new Set<number>(), error: null }),
      ]);

      if (!isMounted) {
        return;
      }

      if (error ?? submittedFeedback.error) {
        setErrorMessage(
          (error ?? submittedFeedback.error)?.message ??
            "Unable to load feedback events.",
        );
      }

      setEvents(data);
      setSubmittedEventIds(submittedFeedback.data);
      setIsLoading(false);
    }

    loadFeedbackEvents();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  async function handleSubmit() {
    const trimmedComments = comments.trim();

    setErrorMessage(null);
    setSuccessMessage(null);

    if (!user?.id) {
      setErrorMessage("You need to be signed in to submit feedback.");
      return;
    }

    if (!selectedEventId) {
      setErrorMessage("Please choose a past event.");
      return;
    }

    if (submittedEventIds.has(selectedEventId)) {
      setErrorMessage("You already submitted feedback for this event.");
      return;
    }

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
      eventId: selectedEventId,
      rating,
      userId: user.id,
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSubmittedEventIds((current) => new Set(current).add(selectedEventId));
    setSelectedEventId("");
    setRating(5);
    setComments("");
    setSuccessMessage("Your post-event feedback was submitted.");
  }

  const filteredEvents = events.filter((event) => {
    const searchValue = eventSearch.trim().toLowerCase();

    if (!searchValue) {
      return true;
    }

    return (
      event.event_name.toLowerCase().includes(searchValue) ||
      event.category.toLowerCase().includes(searchValue) ||
      (event.location ?? "").toLowerCase().includes(searchValue)
    );
  });

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      <FeedbackHeader />
      <FeedbackSections
        comments={comments}
        eventSearch={eventSearch}
        events={filteredEvents}
        errorMessage={errorMessage}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
        onCommentsChange={setComments}
        onEventSearchChange={setEventSearch}
        onRatingChange={setRating}
        onSelectedEventChange={setSelectedEventId}
        onSubmit={handleSubmit}
        rating={rating}
        selectedEventId={selectedEventId}
        submittedEventIds={submittedEventIds}
        successMessage={successMessage}
      />
    </div>
  );
}
