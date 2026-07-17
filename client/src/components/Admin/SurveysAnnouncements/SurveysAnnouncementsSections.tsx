import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteAnnouncement,
  getAdminAnnouncements,
  type Announcement,
} from "./AnnouncementsService";
import {
  getAdminSurveyResponseDetails,
  getPreferredActivityTypes,
  getTopSuggestedEvents,
  type AdminSurveyResponseDetail,
  type PreferredActivityType,
  type TopSuggestedEvent,
} from "./SurveyInsightsService";
import {
  getKabataanSuggestions,
  type KabataanSuggestion,
} from "./SurveysAnnouncementsService";

const activityTypeColors = ["#1a529b", "#38b6ff", "#ff9f68", "#22c55e"];

function getActivityTypeBreakdown(rows: PreferredActivityType[]) {
  return rows.map((item, index) => ({
    color: activityTypeColors[index % activityTypeColors.length],
    label: item.activity_type,
    percentage: Math.round(item.positive_interest_percentage),
    value: item.total_respondent_count,
  }));
}

function PreferredActivityPieChart({ rows }: { rows: PreferredActivityType[] }) {
  const breakdown = getActivityTypeBreakdown(rows);
  const gradientStops = breakdown.map((item, index) => {
    const start = breakdown
      .slice(0, index)
      .reduce((total, current) => total + current.percentage, 0);
    const end = start + item.percentage;
    return `${item.color} ${start}% ${end}%`;
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
        {breakdown.length > 0 ? breakdown.map((item) => (
          <div key={item.label}>
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 text-sm">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="font-medium text-slate-700">{item.label}</span>
              <span className="text-slate-500">
                {item.value} respondent(s), {item.percentage}% positive
              </span>
            </div>
            {item.value < 3 ? (
              <p className="ml-6 mt-1 text-xs text-amber-700">
                Not enough data. Needs at least 3 respondents.
              </p>
            ) : null}
          </div>
        )) : <p className="text-sm text-slate-500">No response data yet.</p>}
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
  const [responses, setResponses] = useState<AdminSurveyResponseDetail[]>([]);
  const [preferredTypes, setPreferredTypes] = useState<PreferredActivityType[]>([]);
  const [suggestedEvents, setSuggestedEvents] = useState<TopSuggestedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadResponses() {
      setIsLoading(true);
      setErrorMessage(null);
      const [responseResult, preferredResult, suggestedResult] = await Promise.all([
        getAdminSurveyResponseDetails({ search }),
        getPreferredActivityTypes(),
        getTopSuggestedEvents(),
      ]);

      if (!isMounted) return;
      const error = responseResult.error || preferredResult.error || suggestedResult.error;
      if (error) setErrorMessage(error.message);
      setResponses(responseResult.data);
      setPreferredTypes(preferredResult.data);
      setSuggestedEvents(suggestedResult.data);
      setIsLoading(false);
    }

    loadResponses();

    return () => {
      isMounted = false;
    };
  }, [search]);

  const answerRows = responses.flatMap((response) =>
    response.answers.map((answer, index) => ({
      answer:
        answer.selected_options.map((option) => option.option_text).join(", ") ||
        answer.answer_text ||
        "-",
      date: formatDate(response.submitted_at),
      id: `${response.response_id}-${index}`,
      respondent: response.fullname,
      survey: response.survey_title,
      type: answer.question_text,
    })),
  );

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
            <PreferredActivityPieChart rows={preferredTypes} />
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-500">
              Top suggested events
            </h3>
            <div className="mt-4 space-y-3">
              {suggestedEvents.slice(0, 3).map((event) => (
                <div key={event.suggested_event_name}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div>
                      <span className="font-medium text-slate-700">
                        #{event.rank} {event.suggested_event_name}
                      </span>
                      <p className="text-xs text-slate-500">
                        {event.category}
                        {event.is_already_planned ? " · Already planned" : ""}
                      </p>
                    </div>
                    <span className="text-right text-slate-500">
                      {event.average_rating}/5
                      <br />
                      <span className="text-xs">
                        {event.total_respondent_count} respondent(s)
                      </span>
                    </span>
                  </div>
                  {event.total_respondent_count < 3 ? (
                    <p className="mt-1 text-xs text-amber-700">
                      Not enough data. Needs at least 3 respondents.
                    </p>
                  ) : null}
                  <div className="mt-2 h-2 rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full bg-[#1e3a5f]"
                      style={{ width: `${Math.min(100, event.positive_interest_percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
              {suggestedEvents.length === 0 ? (
                <p className="text-sm text-slate-500">No suggested event data yet.</p>
              ) : null}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <input
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/15"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by Youth name or email"
            value={search}
          />
        </div>
        <div className="mt-4">
          {errorMessage ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{errorMessage}</div>
          ) : isLoading ? (
            <div className="rounded-[14px] border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">Loading responses...</div>
          ) : answerRows.length > 0 ? (
            <DataTable
              headers={["#", "Date", "Respondent", "Survey", "Question", "Answer"]}
              rows={answerRows.map((item, index) => [
                index + 1,
                item.date,
                item.respondent,
                item.survey,
                item.type,
                item.answer,
              ])}
            />
          ) : (
            <div className="rounded-[14px] border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">No survey responses submitted yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}

export function AnnouncementsSection({
  onCreateAnnouncement,
  onEditAnnouncement,
}: {
  onCreateAnnouncement: () => void;
  onEditAnnouncement: (announcement: Announcement) => void;
}) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function loadAnnouncements() {
    setIsLoading(true);
    setErrorMessage(null);
    const { data, error } = await getAdminAnnouncements();
    if (error) setErrorMessage(error.message);
    setAnnouncements(data);
    setIsLoading(false);
  }

  async function handleDelete(announcementId: number) {
    if (!window.confirm("Delete this announcement?")) return;
    const { error } = await deleteAnnouncement(announcementId);
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    await loadAnnouncements();
  }

  useEffect(() => {
    void Promise.resolve().then(loadAnnouncements);
  }, []);

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
          {errorMessage ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 md:col-span-2">
              {errorMessage}
            </div>
          ) : null}
          {isLoading ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500 md:col-span-2">
              Loading announcements...
            </div>
          ) : null}
          {!isLoading && announcements.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500 md:col-span-2">
              No announcements yet.
            </div>
          ) : null}
          {announcements.map((announcement) => (
            <article
              className="rounded-xl border border-slate-200 bg-slate-50 p-5"
              key={announcement.announcement_id}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-slate-400">
                  {formatDate(announcement.publish_at)}
                </p>
                <span className={[
                  "rounded-full px-2.5 py-1 text-xs font-semibold",
                  announcement.is_published
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-200 text-slate-600",
                ].join(" ")}>
                  {announcement.is_published ? "Published" : "Draft"}
                </span>
              </div>
              <h3 className="mt-1 font-semibold text-slate-800">
                {announcement.title}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {announcement.content}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 hover:bg-slate-50"
                  onClick={() => onEditAnnouncement(announcement)}
                  type="button"
                >
                  Edit
                </button>
                <button
                  className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(announcement.announcement_id)}
                  type="button"
                >
                  Delete
                </button>
              </div>
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
