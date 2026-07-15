import {
  Bell,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Eye,
  MessageSquare,
  PenSquare,
} from "lucide-react";
import { Link } from "react-router-dom";
import seminarImage from "../../../assets/seminar.jpg";
import type { Announcement } from "../../Admin/SurveysAnnouncements/AnnouncementsService";
import type { YouthEvent } from "../Events/EventsService";
import YouthSectionCard from "../shared/YouthSectionCard";
import type { YouthSurvey } from "../Surveys/SurveysService";
import type { StatData } from "./types";
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
        {label === "Surveys" ? (
          <ClipboardList className="h-5 w-5" />
        ) : (
          <Calendar className="h-5 w-5" />
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

function getSurveyStatus(survey: YouthSurvey): "pending" | "completed" | "urgent" {
  if (survey.survey_responses.length > 0) return "completed";
  if (survey.end_date) {
    const endsAt = new Date(survey.end_date).getTime();
    const now = Date.now();
    if (endsAt > now && endsAt - now < 1000 * 60 * 60 * 24 * 2) return "urgent";
  }
  return "pending";
}

function SurveyItem({ survey }: { survey: YouthSurvey }) {
  const status = getSurveyStatus(survey);

  return (
    <Link
      className="flex items-center justify-between rounded-lg border-b border-slate-100 px-2 py-3 transition-colors last:border-b-0 hover:bg-slate-50"
      to={`/youth/surveys/${survey.survey_id}`}
    >
      <div className="min-w-0">
        <h3 className="truncate text-sm font-medium text-slate-900">
          {survey.title}
        </h3>
        <p
          className={[
            "mt-1 flex items-center gap-1 text-xs",
            status === "completed"
              ? "text-emerald-600"
              : status === "urgent"
                ? "text-orange-500"
                : "text-slate-500",
          ].join(" ")}
        >
          {status === "completed" ? "Completed" : `Ends ${formatDate(survey.end_date)}`}
          {status === "completed" ? <CheckCircle2 size={12} /> : null}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
    </Link>
  );
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
  isLoading,
}: {
  data: YouthHomeData | null;
  errorMessage: string | null;
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
      count: data.surveys.length,
      label: "Surveys",
      subtext: `${data.surveys.filter((survey) => survey.survey_responses.length === 0).length} pending`,
    },
    {
      count: data.events.length,
      label: "Events",
      subtext: `${data.registeredEventIds.size} registered`,
    },
  ];

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-5 py-6 sm:px-6 lg:grid-cols-[1.25fr_0.75fr] lg:px-8">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {statsData.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        <YouthSectionCard
          icon={<ClipboardList className="h-5 w-5" />}
          subtitle="Answer youth surveys"
          title="Surveys"
        >
          <div>
            {data.surveys.map((survey) => (
              <SurveyItem key={survey.survey_id} survey={survey} />
            ))}
            {data.surveys.length === 0 ? (
              <p className="px-2 py-3 text-sm text-slate-500">
                No surveys available.
              </p>
            ) : null}
          </div>
          <Link
            className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-[#1e3a5f] transition-colors hover:bg-slate-50"
            to="/youth/surveys"
          >
            View all surveys
          </Link>
        </YouthSectionCard>

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
  );
}
