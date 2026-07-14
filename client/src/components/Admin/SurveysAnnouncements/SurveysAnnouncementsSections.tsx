import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { announcements, surveyResponses } from "./surveysAnnouncementsData";
import {
  getKabataanSuggestions,
  type KabataanSuggestion,
} from "./SurveysAnnouncementsService";

const activityTypeColors = ["#1a529b", "#38b6ff", "#ff9f68", "#22c55e"];

function getActivityTypeBreakdown() {
  const counts = surveyResponses.reduce<Record<string, number>>((acc, item) => {
    acc[item.type] = (acc[item.type] ?? 0) + 1;
    return acc;
  }, {});

  const total = surveyResponses.length || 1;

  return Object.entries(counts).map(([label, value], index) => ({
    color: activityTypeColors[index % activityTypeColors.length],
    label,
    percentage: Math.round((value / total) * 100),
    value,
  }));
}

function PreferredActivityPieChart() {
  const breakdown = getActivityTypeBreakdown();
  let currentPercentage = 0;
  const gradientStops = breakdown.map((item) => {
    const start = currentPercentage;
    currentPercentage += item.percentage;
    return `${item.color} ${start}% ${currentPercentage}%`;
  });

  return (
    <div className="mt-5 grid min-h-52 items-center gap-6 sm:grid-cols-[220px_1fr]">
      <div className="mx-auto flex aspect-square w-full max-w-55 items-center justify-center rounded-full bg-slate-100 p-3">
        <div
          aria-label="Preferred activity types pie chart"
          className="h-full w-full rounded-full shadow-sm ring-1 ring-slate-200"
          role="img"
          style={{
            background: `conic-gradient(${gradientStops.join(", ")})`,
          }}
        />
      </div>

      <div className="space-y-3">
        {breakdown.map((item) => (
          <div
            className="grid grid-cols-[auto_1fr_auto] items-center gap-3 text-sm"
            key={item.label}
          >
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="font-medium text-slate-700">{item.label}</span>
            <span className="text-slate-500">
              {item.value} ({item.percentage}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: Array<Array<string | number>>;
}) {
  return (
    <div className="overflow-hidden overflow-x-auto rounded-[14px] border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr>
            {headers.map((header) => (
              <th className="bg-[#1e3a5f] px-5 py-4 text-center text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-white" key={header}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr className="hover:bg-slate-50" key={String(row[0])}>
              {row.map((cell, index) => (
                <td className="border-t border-slate-200 px-5 py-4" key={`${cell}-${index}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function KabataanSuggestionsSection() {
  const [suggestions, setSuggestions] = useState<KabataanSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSuggestions() {
      setIsLoading(true);
      setErrorMessage(null);

      const { data, error } = await getKabataanSuggestions();

      if (!isMounted) {
        return;
      }

      if (error) {
        setErrorMessage(error.message);
      }

      setSuggestions(data);
      setIsLoading(false);
    }

    loadSuggestions();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex-1 p-8">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800">
          Kabataan Suggestions
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Free-form feedback submitted by Kabataan
        </p>
        <div className="mt-4">
          {errorMessage ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {errorMessage}
            </div>
          ) : isLoading ? (
            <div className="rounded-[14px] border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
              Loading suggestions...
            </div>
          ) : suggestions.length > 0 ? (
            <DataTable
              headers={["#", "Date", "Submitted By", "Feedback"]}
              rows={suggestions.map((item) => [
                item.suggestion_id,
                formatDate(item.submitted_at),
                item.submitted_by,
                item.message,
              ])}
            />
          ) : (
            <div className="rounded-[14px] border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
              No suggestions submitted yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export function SurveyResponsesSection() {
  return (
    <div className="flex-1 p-8">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
          <div>
            <h2 className="text-base font-semibold text-slate-800">
              Survey Responses
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Answers from Kabataan to the activity survey
            </p>
          </div>
          <Link
            className="rounded-lg bg-[#1e3a5f] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#2a4a6f]"
            to="/survey-builder"
          >
            Add Survey
          </Link>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-500">
              Preferred activity types
            </h3>
            <PreferredActivityPieChart />
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-500">
              Top suggested events
            </h3>
            <div className="mt-4 flex h-36 items-end gap-4 border-b border-slate-200">
              {[80, 55, 42].map((height) => (
                <div
                  className="flex-1 rounded-t bg-[#1e3a5f]"
                  style={{ height: `${height}%` }}
                  key={height}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <DataTable
            headers={["#", "Date", "Activity Type", "Suggested Event"]}
            rows={surveyResponses.map((item) => [
              item.id,
              item.date,
              item.type,
              item.event,
            ])}
          />
        </div>
      </section>
    </div>
  );
}

export function AnnouncementsSection({
  onCreateAnnouncement,
}: {
  onCreateAnnouncement: () => void;
}) {
  return (
    <div className="flex-1 p-8">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
          <div>
            <h2 className="text-base font-semibold text-slate-800">
              Announcements
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Messages that can be shared with Kabataan
            </p>
          </div>
          <button
            className="rounded-lg bg-[#1e3a5f] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#2a4a6f]"
            onClick={onCreateAnnouncement}
            type="button"
          >
            Create Announcement
          </button>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {announcements.map((announcement) => (
            <article
              className="rounded-xl border border-slate-200 bg-slate-50 p-5"
              key={announcement.title}
            >
              <p className="text-xs font-semibold text-slate-400">
                {announcement.date}
              </p>
              <h3 className="mt-1 font-semibold text-slate-800">
                {announcement.title}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {announcement.body}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function SurveysAnnouncementsSections() {
  return <KabataanSuggestionsSection />;
}
