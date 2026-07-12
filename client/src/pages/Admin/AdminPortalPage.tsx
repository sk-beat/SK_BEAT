import { useState } from "react";
import { Link } from "react-router-dom";
import {
  type YouthAnnouncement,
  youthAnnouncements,
  youthEvents,
  youthImages,
} from "../../utils/adminPortalData";
import AdminModal from "../../utils/AdminModal";

export default function AdminPortalPage() {
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<YouthAnnouncement | null>(null);

  return (
    <>
      <main>
        <section className="bg-[#0b1f3b] px-6 py-20 text-white">
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1fr_420px] md:items-center">
            <div>
              <h1 className="text-4xl font-bold">
                Welcome to the SK Kabataan Portal
              </h1>
              <p className="mt-4 text-white/80">
                Join activities, meet SK officials, and share your feedback for
                better youth programs.
              </p>
              <div className="mt-7 flex gap-3">
                <Link
                  className="rounded-lg bg-white px-5 py-3 font-semibold text-[#0b1f3b]"
                  to="/youth-events"
                >
                  Explore Events
                </Link>
                <Link
                  className="rounded-lg border border-white px-5 py-3 font-semibold text-white"
                  to="/youth-officials"
                >
                  Meet Our Team
                </Link>
              </div>
            </div>
            <img
              alt=""
              className="h-80 w-full rounded-xl object-cover"
              src={youthImages.galas}
            />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-2xl font-bold text-[#0b1f3b]">Announcements</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {youthAnnouncements.map((announcement) => (
              <button
                className="overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                key={announcement.title}
                onClick={() => setSelectedAnnouncement(announcement)}
                type="button"
              >
                <img
                  alt=""
                  className="h-44 w-full object-cover"
                  src={announcement.image}
                />
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {announcement.date}
                  </p>
                  <h3 className="mt-1 font-bold text-slate-900">
                    {announcement.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                    {announcement.message}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-14">
          <h2 className="text-2xl font-bold text-[#0b1f3b]">
            Featured Activities
          </h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {youthEvents.map((event) => (
              <article
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                key={event.title}
              >
                <h3 className="font-bold">{event.title}</h3>
                <p className="mt-2 text-sm text-slate-500">
                  {event.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <AdminModal
        footer={
          <button
            className="rounded-lg bg-[#0b1f3b] px-4 py-2 text-sm font-semibold text-white"
            onClick={() => setSelectedAnnouncement(null)}
            type="button"
          >
            Close
          </button>
        }
        onClose={() => setSelectedAnnouncement(null)}
        open={Boolean(selectedAnnouncement)}
        title={selectedAnnouncement?.title || "Announcement"}
      >
        {selectedAnnouncement ? (
          <div>
            <img
              alt=""
              className="h-64 w-full rounded-xl object-cover"
              src={selectedAnnouncement.image}
            />
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {selectedAnnouncement.date}
            </p>
            <p className="mt-2 leading-7 text-slate-600">
              {selectedAnnouncement.message}
            </p>
          </div>
        ) : null}
      </AdminModal>
    </>
  );
}
