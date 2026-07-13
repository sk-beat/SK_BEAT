import { CalendarDays, MapPin } from "lucide-react";

const YouthEvents = () => {
  return (
    <main className="max-w-md mx-auto p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Events</h1>
        <p className="text-sm text-slate-500">
          Register for upcoming activities.
        </p>
      </div>

      {[1, 2].map((event) => (
        <div
          key={event}
          className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="h-40 bg-slate-200" />

          <div className="p-4">
            <h2 className="font-semibold text-lg">
              Youth Leadership Seminar
            </h2>

            <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
              <CalendarDays size={15} />
              July 20, 2026
            </div>

            <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
              <MapPin size={15} />
              Barangay Covered Court
            </div>

            <button className="mt-4 w-full bg-emerald-600 text-white py-2 rounded-lg">
              Register
            </button>
          </div>
        </div>
      ))}
    </main>
  );
};

export default YouthEvents;