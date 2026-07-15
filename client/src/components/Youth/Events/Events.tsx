import { useEffect, useState } from "react";
import { useAuth } from "../../../auth/useAuth";
import EventsHeader from "./EventsHeader";
import EventsSections from "./EventsSections";
import {
  getYouthEventRegistrations,
  getYouthEvents,
  registerYouthEvent,
  type YouthEvent,
} from "./EventsService";

export default function Events() {
  const { user } = useAuth();
  const [events, setEvents] = useState<YouthEvent[]>([]);
  const [registeredEventIds, setRegisteredEventIds] = useState<Set<number>>(
    new Set(),
  );
  const [registeringEventId, setRegisteringEventId] = useState<number | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function loadEvents() {
    setIsLoading(true);
    setErrorMessage(null);

    const [{ data, error }, registrations] = await Promise.all([
      getYouthEvents(),
      user?.id
        ? getYouthEventRegistrations(user.id)
        : Promise.resolve({ data: new Set<number>(), error: null }),
    ]);

    if (error ?? registrations.error) {
      setErrorMessage(
        (error ?? registrations.error)?.message ?? "Unable to load events.",
      );
    }

    setEvents(data);
    setRegisteredEventIds(registrations.data);
    setIsLoading(false);
  }

  async function handleRegister(eventId: number) {
    if (!user?.id || registeringEventId) {
      return;
    }

    setRegisteringEventId(eventId);
    setErrorMessage(null);

    const { error } = await registerYouthEvent(eventId);

    setRegisteringEventId(null);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setRegisteredEventIds((current) => new Set(current).add(eventId));
  }

  useEffect(() => {
    let isMounted = true;

    async function loadInitialEvents() {
      setIsLoading(true);
      setErrorMessage(null);

      const [{ data, error }, registrations] = await Promise.all([
        getYouthEvents(),
        user?.id
          ? getYouthEventRegistrations(user.id)
          : Promise.resolve({ data: new Set<number>(), error: null }),
      ]);

      if (!isMounted) {
        return;
      }

      if (error ?? registrations.error) {
        setErrorMessage(
          (error ?? registrations.error)?.message ?? "Unable to load events.",
        );
      }

      setEvents(data);
      setRegisteredEventIds(registrations.data);
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
        onRegister={handleRegister}
        registeredEventIds={registeredEventIds}
        registeringEventId={registeringEventId}
      />
    </div>
  );
}
