import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import skLogo from "../assets/sklogo.png";
import { getPublicSKOfficials } from "../components/Admin/SKOfficials/SKOfficialsService";
import { getPublicScheduledEvents, type PublicScheduledEvent } from "../services/PublicEventsService";
import {
  getLandingAssetUrl,
  getPublicLandingPageSettings,
} from "../services/LandingPageSettingsService";
import { youthImages } from "../utils/adminPortalData";

export default function LandingPage() {
  const [officialsCount, setOfficialsCount] = useState(0);
  const [scheduledEvents, setScheduledEvents] = useState<PublicScheduledEvent[]>([]);
  const [heroBackgroundPath, setHeroBackgroundPath] = useState<string | null>(null);
  const [isLandingDataLoading, setIsLandingDataLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadLandingData() {
      const [officials, events, settings] = await Promise.all([
        getPublicSKOfficials(),
        getPublicScheduledEvents(),
        getPublicLandingPageSettings(),
      ]);
      if (isMounted) {
        setOfficialsCount(officials.data.length);
        setScheduledEvents(events.data);
        setHeroBackgroundPath(settings.data.hero_background_path);
        setIsLandingDataLoading(false);
      }
    }

    loadLandingData().catch(() => {
      if (isMounted) setIsLandingDataLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLandingDataLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0b1f3b] px-6 text-white">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/70">
          Loading...
        </p>
      </main>
    );
  }

  const heroBackgroundUrl = getLandingAssetUrl(heroBackgroundPath) || youthImages.galas;

  return (
    <main>
      <section
        className="bg-cover bg-center px-6 py-20 text-white md:py-24"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(11,31,59,.88), rgba(11,31,59,.62)), url(${heroBackgroundUrl})`,
        }}
      >
        <div className="mx-auto flex min-h-[62vh] max-w-6xl items-center">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full bg-white/12 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur">
              <img
                alt="SK Logo"
                className="h-8 w-8 rounded-full bg-white object-contain"
                src={skLogo}
              />
              Barangay Galas Maasim Youth Portal
            </div>
            <h1 className="text-4xl font-bold leading-tight md:text-6xl">
              SK Kabataan - Barangay Galas Maasim
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/85">
              Discover youth programs, upcoming events, announcements, and
              opportunities built for the community.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="rounded-lg bg-white px-5 py-3 font-semibold text-[#0b1f3b] shadow-lg shadow-slate-950/20 transition hover:-translate-y-0.5"
                to="/login"
              >
                Login to Join
              </Link>
              <Link
                className="rounded-lg border border-white/70 px-5 py-3 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
                to="/youth-events"
              >
                View Events
              </Link>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-3 overflow-hidden rounded-2xl border border-white/15 bg-white/10 backdrop-blur">
              {[
                ["3", "Programs"],
                [String(officialsCount), "SK Officials"],
                ["24/7", "Updates"],
              ].map(([value, label]) => (
                <div className="border-r border-white/15 p-4 last:border-r-0" key={label}>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="mt-1 text-xs font-medium text-white/70">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-end justify-between gap-4 max-sm:flex-col max-sm:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#1e3a5f]">
              Get involved
            </p>
            <h2 className="mt-2 text-3xl font-bold text-[#0b1f3b]">
              Upcoming Programs
            </h2>
          </div>
          <Link
            className="text-sm font-semibold text-[#1e3a5f] hover:underline"
            to="/youth-events"
          >
            See all events
          </Link>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {scheduledEvents.map((event) => (
            <article
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              key={event.event_id}
            >
              <img
                className="h-44 w-full object-cover"
                src={event.cover_image || youthImages.seminar}
                alt=""
              />
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {new Date(event.event_date).toLocaleDateString("en-PH", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <h3 className="mt-1 font-bold text-slate-900">
                  {event.event_name}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {event.description || `${event.category}${event.location ? ` at ${event.location}` : ""}`}
                </p>
              </div>
            </article>
          ))}
          {scheduledEvents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500 md:col-span-3">
              No scheduled future events yet.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
