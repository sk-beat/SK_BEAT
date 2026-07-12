import { useState } from "react";
import { type YouthEvent, youthEvents } from "./youthData";
import YouthModal from "./YouthModal";

export default function YouthEventsPage() {
  const [selectedEvent, setSelectedEvent] = useState<YouthEvent | null>(null);
  const [registerEvent, setRegisterEvent] = useState<YouthEvent | null>(null);

  return (
    <>
      <main className="mx-auto max-w-6xl px-6 py-14">
        <h1 className="text-3xl font-bold text-[#0b1f3b]">
          Events & Activities
        </h1>
        <p className="mt-2 text-slate-500">
          Browse upcoming SK activities for Kabataan.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {youthEvents.map((event) => (
            <article
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              key={event.title}
            >
              <button
                className="block w-full text-left"
                onClick={() => setSelectedEvent(event)}
                type="button"
              >
                <img
                  alt=""
                  className="h-52 w-full object-cover"
                  src={event.image}
                />
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {event.date}
                  </p>
                  <h2 className="mt-1 font-bold text-slate-900">
                    {event.title}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    {event.description}
                  </p>
                </div>
              </button>
              <div className="px-5 pb-5">
                <button
                  className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white"
                  onClick={() => setRegisterEvent(event)}
                  type="button"
                >
                  Register
                </button>
              </div>
            </article>
          ))}
        </div>
      </main>

      <YouthModal
        footer={
          <>
            <button
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              onClick={() => setSelectedEvent(null)}
              type="button"
            >
              Close
            </button>
            <button
              className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white"
              onClick={() => {
                setRegisterEvent(selectedEvent);
                setSelectedEvent(null);
              }}
              type="button"
            >
              Register for this event
            </button>
          </>
        }
        onClose={() => setSelectedEvent(null)}
        open={Boolean(selectedEvent)}
        title={selectedEvent?.title || "Event"}
      >
        {selectedEvent ? (
          <div>
            <img
              alt=""
              className="h-64 w-full rounded-xl object-cover"
              src={selectedEvent.image}
            />
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {selectedEvent.date}
            </p>
            <p className="mt-2 leading-7 text-slate-600">
              {selectedEvent.description}
            </p>
          </div>
        ) : null}
      </YouthModal>

      <YouthModal
        footer={
          <>
            <button
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              onClick={() => setRegisterEvent(null)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white"
              onClick={() => setRegisterEvent(null)}
              type="button"
            >
              Submit Registration
            </button>
          </>
        }
        onClose={() => setRegisterEvent(null)}
        open={Boolean(registerEvent)}
        title={registerEvent ? `Register for ${registerEvent.title}` : "Register"}
      >
        <div className="grid gap-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Full Name
            </span>
            <input className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#1e3a5f]" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Email
            </span>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#1e3a5f]"
              type="email"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Contact Number
            </span>
            <input className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#1e3a5f]" />
          </label>
        </div>
      </YouthModal>
    </>
  );
}
