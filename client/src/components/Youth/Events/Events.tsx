import { useEffect, useState } from "react";
import { useAuth } from "../../../auth/useAuth";
import EventsHeader from "./EventsHeader";
import EventsSections from "./EventsSections";
import {
  cancelYouthEventRegistration,
  getYouthEvents,
  registerYouthEvent,
  type YouthEvent,
} from "./EventsService";

function formatEventDate(value: string | null) {
  if (!value) {
    return "To be announced";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-PH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function Events() {
  const { user } = useAuth();
  const [events, setEvents] = useState<YouthEvent[]>([]);
  const [confirmationEvent, setConfirmationEvent] = useState<YouthEvent | null>(
    null,
  );
  const [unregisterConfirmationEvent, setUnregisterConfirmationEvent] =
    useState<YouthEvent | null>(null);
  const [registeringEventId, setRegisteringEventId] = useState<number | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function loadEvents() {
    setIsLoading(true);
    setErrorMessage(null);

    const { data, error } = await getYouthEvents();

    if (error) {
      setErrorMessage(error.message ?? "Unable to load events.");
    }

    setEvents(data);
    setIsLoading(false);
  }

  async function handleRegister(eventId: number) {
    if (!user?.id || registeringEventId) {
      return;
    }

    const event = events.find((item) => item.event_id === eventId);
    if (event) {
      setConfirmationEvent(event);
    }
  }

  async function confirmRegistration() {
    if (!user?.id || registeringEventId || !confirmationEvent) return;

    const eventId = confirmationEvent.event_id;
    setRegisteringEventId(eventId);
    setErrorMessage(null);

    const { error } = await registerYouthEvent(eventId);

    setRegisteringEventId(null);

    if (error) {
      setConfirmationEvent(null);
      setErrorMessage(error.message);
      return;
    }

    setConfirmationEvent(null);
    await loadEvents();
  }

  async function handleCancel(eventId: number) {
    if (!user?.id || registeringEventId) return;
    const event = events.find((item) => item.event_id === eventId);
    if (event) {
      setUnregisterConfirmationEvent(event);
    }
  }

  async function confirmCancellation() {
    if (!user?.id || registeringEventId || !unregisterConfirmationEvent) return;

    const eventId = unregisterConfirmationEvent.event_id;
    setRegisteringEventId(eventId);
    setErrorMessage(null);
    const { error } = await cancelYouthEventRegistration(eventId);
    setRegisteringEventId(null);
    if (error) {
      setUnregisterConfirmationEvent(null);
      setErrorMessage(error.message);
      return;
    }
    setUnregisterConfirmationEvent(null);
    await loadEvents();
  }

  useEffect(() => {
    let isMounted = true;

    async function loadInitialEvents() {
      setIsLoading(true);
      setErrorMessage(null);

      const { data, error } = await getYouthEvents();

      if (!isMounted) {
        return;
      }

      if (error) {
        setErrorMessage(error.message ?? "Unable to load events.");
      }

      setEvents(data);
      setIsLoading(false);
    }

    loadInitialEvents();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      <EventsHeader />
      <EventsSections
        errorMessage={errorMessage}
        events={events}
        isLoading={isLoading}
        onRefresh={loadEvents}
        onCancel={handleCancel}
        onRegister={handleRegister}
        registeringEventId={registeringEventId}
      />
      {confirmationEvent ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6">
          <div className="flex w-full max-w-md flex-col items-center rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1e3a5f]/10 text-[#1e3a5f]">
              <span className="text-xl font-bold">?</span>
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              Confirm Registration
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              You are about to register for{" "}
              <strong className="font-semibold text-slate-900">
                {confirmationEvent.event_name}
              </strong>
              .
            </p>
            <div className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-600">
              <p>
                <span className="font-semibold text-slate-800">Date:</span>{" "}
                {formatEventDate(confirmationEvent.event_date)}
              </p>
              <p className="mt-1">
                <span className="font-semibold text-slate-800">Location:</span>{" "}
                {confirmationEvent.location || "To be announced"}
              </p>
            </div>
            <div className="mt-6 flex w-full justify-center gap-3">
              <button
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                disabled={registeringEventId === confirmationEvent.event_id}
                onClick={() => setConfirmationEvent(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173256] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={registeringEventId === confirmationEvent.event_id}
                onClick={() => void confirmRegistration()}
                type="button"
              >
                {registeringEventId === confirmationEvent.event_id
                  ? "Registering..."
                  : "Register"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {unregisterConfirmationEvent ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6">
          <div className="flex w-full max-w-md flex-col items-center rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
              <span className="text-xl font-bold">!</span>
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              Confirm Unregister
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              You are about to unregister from{" "}
              <strong className="font-semibold text-slate-900">
                {unregisterConfirmationEvent.event_name}
              </strong>
              .
            </p>
            <div className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-600">
              <p>
                <span className="font-semibold text-slate-800">Date:</span>{" "}
                {formatEventDate(unregisterConfirmationEvent.event_date)}
              </p>
              <p className="mt-1">
                <span className="font-semibold text-slate-800">Location:</span>{" "}
                {unregisterConfirmationEvent.location || "To be announced"}
              </p>
            </div>
            <div className="mt-6 flex w-full justify-center gap-3">
              <button
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                disabled={registeringEventId === unregisterConfirmationEvent.event_id}
                onClick={() => setUnregisterConfirmationEvent(null)}
                type="button"
              >
                Keep Registration
              </button>
              <button
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={registeringEventId === unregisterConfirmationEvent.event_id}
                onClick={() => void confirmCancellation()}
                type="button"
              >
                {registeringEventId === unregisterConfirmationEvent.event_id
                  ? "Unregistering..."
                  : "Unregister"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
