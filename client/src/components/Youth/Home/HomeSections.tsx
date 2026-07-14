import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Eye,
  MessageSquare,
  PenSquare,
} from "lucide-react";
import { Link } from "react-router-dom";
import YouthSectionCard from "../shared/YouthSectionCard";
import { eventsData, statsData, surveysData } from "./homeData";
import type { EventData, StatData, SurveyData } from "./types";

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

function SurveyItem({ meta, status, title }: Omit<SurveyData, "id">) {
  return (
    <Link
      className="flex items-center justify-between rounded-lg border-b border-slate-100 px-2 py-3 transition-colors last:border-b-0 hover:bg-slate-50"
      to="/youth/surveys/1"
    >
      <div className="min-w-0">
        <h3 className="truncate text-sm font-medium text-slate-900">{title}</h3>
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
          {status === "completed" ? "Completed" : meta}
          {status === "completed" ? <CheckCircle2 size={12} /> : null}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
    </Link>
  );
}

function EventCard({ date, image, status, title }: Omit<EventData, "id">) {
  return (
    <article className="group grid gap-4 rounded-xl border border-slate-200 bg-white p-3 transition-all hover:border-blue-300 hover:shadow-md sm:grid-cols-[112px_1fr]">
      <img
        alt={title}
        className="h-40 w-full rounded-lg object-cover transition-transform duration-300 group-hover:scale-[1.02] sm:h-28"
        src={image}
      />
      <div className="flex min-w-0 flex-col justify-center">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
          <Calendar className="h-3.5 w-3.5" />
          {date}
        </p>
        <div className="mt-3">
          {status === "registered" ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="h-3 w-3" />
              Registered
            </span>
          ) : (
            <button
              className="rounded-full bg-[#1e3a5f] px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#173256]"
              type="button"
            >
              Register Now
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function HomeSections() {
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
            {surveysData.map((survey) => (
              <SurveyItem key={survey.id} {...survey} />
            ))}
          </div>
          <Link
            className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-[#1e3a5f] transition-colors hover:bg-slate-50"
            to="/youth/surveys"
          >
            View all surveys
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
            {eventsData.map((event) => (
              <EventCard key={event.id} {...event} />
            ))}
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
