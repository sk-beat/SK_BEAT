import {
  Bell,
  Calendar,
  CheckCircle2,
  Eye,
  MessageSquare,
  Megaphone,
  PenSquare,
} from "lucide-react";
import { Link } from "react-router-dom";
import seminarImage from "../../../assets/seminar.jpg";
import type { Announcement } from "../../Admin/SurveysAnnouncements/AnnouncementsService";
import type { YouthEvent } from "../Events/EventsService";
import YouthSectionCard from "../shared/YouthSectionCard";
import type { StatData, YouthHomePastEvent } from "./types";
import type { YouthHomeData } from "./YouthHomeService";

function StatCard({ label, count, subtext }: StatData) {
  return (
    <article className="flex items-center justify-between rounded-[14px] border border-[#1e3a5f]/15 bg-white px-5 py-5 shadow-sm">
      <div>
        <p className="text-sm font-semibold text-slate-400">{label}</p>
        <p className="mt-1 text-3xl font-bold leading-tight text-[#1e3a5f]">
          {count}
        </p>
        <p className="mt-1 text-xs font-medium text-slate-400">{subtext}</p>
      </div>
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        {label === "Events" ? (
          <Calendar className="h-5 w-5" />
        ) : label === "Past Events" ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : (
          <Megaphone className="h-5 w-5" />
        )}
      </div>
    </article>
  );
}

function formatDate(value: string | null) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function EventCard({
  event,
  isRegistered,
}: {
  event: YouthEvent;
  isRegistered: boolean;
}) {
  return (
    <article className="group grid gap-4 rounded-xl border border-slate-200 bg-white p-3 transition-all hover:border-blue-300 hover:shadow-md sm:grid-cols-[112px_1fr]">
      <img
        alt={event.event_name}
        className="h-40 w-full rounded-lg object-cover transition-transform duration-300 group-hover:scale-[1.02] sm:h-28"
        src={event.cover_image || seminarImage}
      />
      <div className="flex min-w-0 flex-col justify-center">
        <h3 className="text-sm font-semibold text-slate-900">
          {event.event_name}
        </h3>
        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(event.event_date)} - {event.event_time || "TBA"}
        </p>
        <div className="mt-3">
          {isRegistered ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="h-3 w-3" />
              Registered
            </span>
          ) : (
            <Link
              className="rounded-full bg-[#1e3a5f] px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#173256]"
              to="/youth/events"
            >
              Register Now
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

function PastEventItem({ event }: { event: YouthHomePastEvent }) {
  return (
    <article className="grid gap-3 rounded-lg border-b border-slate-100 px-2 py-3 last:border-b-0 sm:grid-cols-[72px_1fr]">
      <img
        alt={event.event_name}
        className="h-24 w-full rounded-lg object-cover sm:h-16"
        src={event.cover_image || seminarImage}
      />
      <div className="min-w-0">
        <h3 className="truncate text-sm font-semibold text-slate-900">
          {event.event_name}
        </h3>
        <p className="mt-1 text-xs font-medium text-slate-500">
          {event.category} - {formatDate(event.event_date)}
        </p>
        {event.location ? (
          <p className="mt-1 line-clamp-1 text-xs text-slate-400">
            {event.location}
          </p>
        ) : null}
      </div>
    </article>
  );
}

function AnnouncementItem({ announcement }: { announcement: Announcement }) {
  return (
    <Link
      className="block rounded-lg border-b border-slate-100 px-2 py-3 transition-colors last:border-b-0 hover:bg-slate-50"
      to="/youth/announcements"
    >
      <h3 className="truncate text-sm font-medium text-slate-900">
        {announcement.title}
      </h3>
      <p className="mt-1 line-clamp-2 text-xs text-slate-500">
        {announcement.content}
      </p>
    </Link>
  );
}

export default function HomeSections({
  data,
  errorMessage,
  fullname,
  isLoading,
}: {
  data: YouthHomeData | null;
  errorMessage: string | null;
  fullname: string;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="px-8 py-6 text-sm text-slate-500">
        Loading your home page...
      </div>
    );
  }

  if (errorMessage || !data) {
    return (
      <div className="px-8 py-6 text-sm text-amber-700">
        {errorMessage || "Unable to load home page."}
      </div>
    );
  }

  const statsData: StatData[] = [
    {
      count: data.events.length,
      label: "Events",
      subtext: `${data.registeredEventIds.size} registered`,
    },
    {
      count: data.pastEvents.length,
      label: "Past Events",
      subtext: "completed programs",
    },
    {
      count: data.announcements.length,
      label: "Announcements",
      subtext: "latest SK updates",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-6 sm:px-6 lg:px-8">
      <section
        className="relative mb-6 overflow-hidden rounded-2xl bg-[#0b1f3b] px-6 py-12 text-white shadow-sm sm:px-8"
        style={
          data.heroBackgroundUrl
            ? { backgroundImage: `url(${data.heroBackgroundUrl})`, backgroundPosition: "center", backgroundSize: "cover" }
            : undefined
        }
      >
        <div className="absolute inset-0 bg-[#0b1f3b]/70" />
        <div className="relative max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-white/70">
            Youth Home
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
            Welcome back, {fullname}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/80">
            See upcoming SK programs, completed activities, and official announcements from your barangay.
          </p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {statsData.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        <YouthSectionCard
          icon={<Bell className="h-5 w-5" />}
          subtitle="Latest SK updates"
          title="Announcements"
          tone="orange"
        >
          <div>
            {data.announcements.map((announcement) => (
              <AnnouncementItem
                announcement={announcement}
                key={announcement.announcement_id}
              />
            ))}
            {data.announcements.length === 0 ? (
              <p className="px-2 py-3 text-sm text-slate-500">
                No announcements yet.
              </p>
            ) : null}
          </div>
          <Link
            className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-[#1e3a5f] transition-colors hover:bg-slate-50"
            to="/youth/announcements"
          >
            View all announcements
          </Link>
        </YouthSectionCard>

        <YouthSectionCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          subtitle="Completed SK programs"
          title="Past Events"
          tone="emerald"
        >
          <div>
            {data.pastEvents.map((event) => (
              <PastEventItem event={event} key={event.event_id} />
            ))}
            {data.pastEvents.length === 0 ? (
              <p className="px-2 py-3 text-sm text-slate-500">
                No completed past events yet.
              </p>
            ) : null}
          </div>
        </YouthSectionCard>
      </div>

      <div className="space-y-6">
        <YouthSectionCard
          icon={<Calendar className="h-5 w-5" />}
          subtitle="Register and attend"
          title="Events"
          tone="emerald"
        >
          <div className="space-y-4">
            {data.events.map((event) => (
              <EventCard
                event={event}
                isRegistered={data.registeredEventIds.has(event.event_id)}
                key={event.event_id}
              />
            ))}
            {data.events.length === 0 ? (
              <p className="text-sm text-slate-500">No scheduled events yet.</p>
            ) : null}
          </div>
          <Link
            className="mt-5 inline-flex w-full items-center justify-center rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-[#1e3a5f] transition-colors hover:bg-slate-50"
            to="/youth/events"
          >
            View all events
          </Link>
        </YouthSectionCard>

        <YouthSectionCard
          icon={<MessageSquare className="h-5 w-5" />}
          subtitle="Share your thoughts"
          title="Feedback"
          tone="orange"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1e3a5f] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#173256]"
              to="/youth/feedback"
            >
              <PenSquare className="h-4 w-4" />
              Create
            </Link>
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              to="/youth/feedback"
            >
              <Eye className="h-4 w-4" />
              View
            </Link>
          </div>
        </YouthSectionCard>
      </div>
      </div>
    </div>
  );
}
