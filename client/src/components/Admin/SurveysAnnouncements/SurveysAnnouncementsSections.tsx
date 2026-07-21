import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import InsightCard from "../shared/InsightCard";
import AdminModal from "../shared/AdminModal";
import {
  AlertIcon,
  BanknoteIcon,
  ClipboardIcon,
  LineChartIcon,
} from "../Dashboard/icons";
import type { InsightTone } from "../Dashboard/dashboardData";
import {
  deleteAnnouncement,
  getAdminAnnouncements,
  type Announcement,
} from "./AnnouncementsService";
import {
  getAdminSurveyResponseDetails,
  getFeedbackInsightsSummary,
  getTopSuggestedEvents,
  type AdminSurveyResponseDetail,
  type FeedbackInsightsSummary,
  type SurveyResponseAnswer,
  type TopSuggestedEvent,
} from "./SurveyInsightsService";
import {
  getAdminEventFeedbackRecords,
  type AdminEventFeedbackRecord,
} from "./SurveysAnnouncementsService";

type FeedbackInsightCard = {
  description: string;
  icon: typeof LineChartIcon;
  id: string;
  title: string;
  tone: InsightTone;
};

function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: Array<Array<ReactNode>>;
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
                <td className="border-t border-slate-200 px-5 py-4" key={`${String(row[0])}-${index}`}>{cell}</td>
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

function formatRating(value: number | null) {
  return typeof value === "number" ? value.toFixed(2).replace(/\.00$/, "") : "-";
}

function formatSurveyAnswer(answer: SurveyResponseAnswer) {
  const selectedOptions = answer.selected_options.map((option) => {
    const optionText = option.option_text.trim();
    const customText = answer.answer_text?.trim();

    return optionText.toLowerCase() === "other" && customText
      ? `Other: ${customText}`
      : option.option_text;
  });

  return selectedOptions.join(", ") || answer.answer_text || "-";
}

function normalizeFeedback(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function FeedbackCell({ value }: { value: string | null }) {
  const feedback = normalizeFeedback(value);

  if (!feedback) {
    return <span className="text-slate-400">No comment provided</span>;
  }

  return (
    <p className="max-w-sm whitespace-pre-line text-slate-700" title={feedback}>
      {feedback.length > 120 ? `${feedback.slice(0, 117)}...` : feedback}
    </p>
  );
}

function SourceBadge({ source }: { source: string }) {
  const isGuest = source.toLowerCase().includes("guest");

  return (
    <span
      className={[
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        isGuest ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-[#1e3a5f]",
      ].join(" ")}
    >
      {source}
    </span>
  );
}

function getRatingTone(value: number | null): InsightTone {
  if (typeof value !== "number") return "info";
  if (value >= 4) return "success";
  if (value >= 3) return "info";
  return "warning";
}

function getTrendLabel(trend: FeedbackInsightsSummary["recentTrend"]) {
  switch (trend) {
    case "up":
      return "Improving";
    case "down":
      return "Declining";
    case "flat":
      return "Stable";
    case "not_enough_data":
      return "Not enough data";
  }
}

function getTrendTone(trend: FeedbackInsightsSummary["recentTrend"]): InsightTone {
  if (trend === "up") return "success";
  if (trend === "down") return "warning";
  return "info";
}

function getMostReviewedEvent(events: FeedbackInsightsSummary["events"]) {
  return events.reduce<FeedbackInsightsSummary["events"][number] | null>(
    (current, event) =>
      !current || event.response_count > current.response_count ? event : current,
    null,
  );
}

function buildFeedbackInsightCards(summary: FeedbackInsightsSummary | null) {
  if (!summary || summary.totalResponses === 0) {
    return [];
  }

  const cards: FeedbackInsightCard[] = [
    {
      description: `${summary.totalResponses} completed-event feedback response(s) with an average rating of ${formatRating(summary.overallAverageRating)} out of 5.`,
      icon: LineChartIcon,
      id: "overall-rating",
      title: "Overall Rating",
      tone: getRatingTone(summary.overallAverageRating),
    },
  ];
  const highestRatedEvent = summary.highestRatedEvents[0];
  const lowestRatedEvent = summary.lowestRatedEvents[0];
  const mostReviewedEvent = getMostReviewedEvent(summary.events);

  if (highestRatedEvent && typeof highestRatedEvent.average_rating === "number") {
    cards.push({
      description: `${highestRatedEvent.event_name} has the highest average rating at ${formatRating(highestRatedEvent.average_rating)} out of 5 from ${highestRatedEvent.response_count} response(s).`,
      icon: LineChartIcon,
      id: `highest-${highestRatedEvent.event_id}`,
      title: "Highest Rated Event",
      tone: "success",
    });
  }

  if (
    lowestRatedEvent &&
    typeof lowestRatedEvent.average_rating === "number" &&
    lowestRatedEvent.event_id !== highestRatedEvent?.event_id
  ) {
    cards.push({
      description: `${lowestRatedEvent.event_name} has the lowest average rating at ${formatRating(lowestRatedEvent.average_rating)} out of 5 from ${lowestRatedEvent.response_count} response(s).`,
      icon: AlertIcon,
      id: `lowest-${lowestRatedEvent.event_id}`,
      title: "Lowest Rated Event",
      tone: getRatingTone(lowestRatedEvent.average_rating),
    });
  }

  if (mostReviewedEvent) {
    cards.push({
      description: `${mostReviewedEvent.event_name} has the most feedback with ${mostReviewedEvent.response_count} response(s).`,
      icon: ClipboardIcon,
      id: `most-reviewed-${mostReviewedEvent.event_id}`,
      title: "Most Reviewed Event",
      tone: "info",
    });
  }

  cards.push({
    description: `Recent completed-event feedback trend is ${getTrendLabel(summary.recentTrend).toLowerCase()}.`,
    icon: BanknoteIcon,
    id: "rating-trend",
    title: "Rating Trend",
    tone: getTrendTone(summary.recentTrend),
  });

  if (
    lowestRatedEvent &&
    typeof lowestRatedEvent.average_rating === "number" &&
    lowestRatedEvent.average_rating < 3.5
  ) {
    cards.push({
      description: `${lowestRatedEvent.event_name} is below the improvement threshold at ${formatRating(lowestRatedEvent.average_rating)} out of 5.`,
      icon: AlertIcon,
      id: `needs-improvement-${lowestRatedEvent.event_id}`,
      title: "Needs Improvement",
      tone: "warning",
    });
  }

  return cards;
}

export function EventFeedbackSection() {
  const [feedbackRecords, setFeedbackRecords] = useState<AdminEventFeedbackRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "guest" | "registered">("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  async function loadFeedbackRecords() {
    setIsLoading(true);
    setErrorMessage(null);

    const { data, error } = await getAdminEventFeedbackRecords();

    if (error) {
      setErrorMessage("Unable to load feedback records.");
      setFeedbackRecords([]);
    } else {
      setFeedbackRecords(data);
      console.log("[Event Feedback] Loaded", {
        totalRows: data.length,
        guestRows: data.filter((item) => item.is_guest).length,
        registeredRows: data.filter((item) => !item.is_guest).length,
      });
    }

    setIsLoading(false);
  }

  useEffect(() => {
    void Promise.resolve().then(loadFeedbackRecords);
  }, []);

  const filteredFeedbackRecords = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return feedbackRecords
      .filter(
        (item) =>
          statusFilter === "all" ||
          (statusFilter === "guest" && item.is_guest) ||
          (statusFilter === "registered" && !item.is_guest),
      )
      .filter((item) => {
        if (!normalizedSearch) return true;

        return [
          item.submitted_by,
          item.respondent_status,
          item.comment ?? "",
          item.event_name ?? "",
          item.event_id ? `event ${item.event_id}` : "",
          item.rating ? `${item.rating}` : "",
        ].some((value) => value.toLowerCase().includes(normalizedSearch));
      })
      .sort((first, second) => {
        const firstTime = first.submitted_at ? new Date(first.submitted_at).getTime() : 0;
        const secondTime = second.submitted_at ? new Date(second.submitted_at).getTime() : 0;
        return sortOrder === "newest" ? secondTime - firstTime : firstTime - secondTime;
      });
  }, [feedbackRecords, search, sortOrder, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredFeedbackRecords.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleFeedbackRecords = filteredFeedbackRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex-1 p-8">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800">
          Event Feedback
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Feedback submitted by registered users and guests after events
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <input
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/15"
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search by submitter, status, event, rating, or feedback"
            value={search}
          />
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none"
            onChange={(event) => {
              setStatusFilter(event.target.value as typeof statusFilter);
              setPage(1);
            }}
            value={statusFilter}
          >
            <option value="all">All feedback</option>
            <option value="registered">Registered users</option>
            <option value="guest">Guests</option>
          </select>
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none"
            onChange={(event) => {
              setSortOrder(event.target.value as "newest" | "oldest");
              setPage(1);
            }}
            value={sortOrder}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
        <div className="mt-4">
          {errorMessage ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {errorMessage}
            </div>
          ) : isLoading ? (
            <div className="rounded-[14px] border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
              Loading feedback records...
            </div>
          ) : filteredFeedbackRecords.length > 0 ? (
            <>
              <DataTable
                headers={["Event", "Rating", "Feedback", "Submitted By", "Status", "Date Submitted"]}
                rows={visibleFeedbackRecords.map((item) => [
                  item.event_name
                    ? `${item.event_name}${item.event_id ? ` (#${item.event_id})` : ""}`
                    : item.event_id
                      ? `Event #${item.event_id}`
                      : "Unknown event",
                  item.rating ? `${item.rating} / 5` : "-",
                  <FeedbackCell value={item.comment} />,
                  item.submitted_by,
                  <SourceBadge source={item.respondent_status} />,
                  formatDate(item.submitted_at),
                ])}
              />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                <span>
                  Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredFeedbackRecords.length)} of {filteredFeedbackRecords.length}
                </span>
                <div className="flex gap-2">
                  <button
                    className="rounded-lg border border-slate-200 px-3 py-2 font-medium disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={currentPage === 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    type="button"
                  >
                    Previous
                  </button>
                  <button
                    className="rounded-lg border border-slate-200 px-3 py-2 font-medium disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={currentPage === totalPages}
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    type="button"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-[14px] border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
              No feedback records found.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export function SurveyResponsesSection() {
  const [searchParams] = useSearchParams();
  const [responses, setResponses] = useState<AdminSurveyResponseDetail[]>([]);
  const [feedbackInsights, setFeedbackInsights] = useState<FeedbackInsightsSummary | null>(null);
  const [suggestedEvents, setSuggestedEvents] = useState<TopSuggestedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadResponses() {
      setIsLoading(true);
      setErrorMessage(null);
      const [responseResult, suggestedResult, feedbackResult] = await Promise.all([
        getAdminSurveyResponseDetails({ search }),
        getTopSuggestedEvents(),
        getFeedbackInsightsSummary(),
      ]);

      if (!isMounted) return;
      const error = responseResult.error || suggestedResult.error || feedbackResult.error;
      if (error) setErrorMessage(error.message);
      setResponses(responseResult.data);
      setSuggestedEvents(suggestedResult.data);
      setFeedbackInsights(feedbackResult.data);
      console.log("[Survey Results] Unified ranking", {
        officialCount: suggestedResult.data.filter((event) => event.source_type === "official").length,
        otherSuggestionCount: suggestedResult.data.filter((event) => event.source_type === "custom").length,
        combinedResultCount: suggestedResult.data.length,
        topThreeCount: suggestedResult.data.slice(0, 3).length,
      });
      setIsLoading(false);
    }

    loadResponses();

    return () => {
      isMounted = false;
    };
  }, [search]);

  useEffect(() => {
    const section = searchParams.get("section");
    if (!section) return;
    const element = document.getElementById(section);
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [searchParams]);

  const answerRows = responses.flatMap((response) =>
    response.answers.map((answer, index) => ({
      answer: formatSurveyAnswer(answer),
      date: formatDate(response.submitted_at),
      id: `${response.response_id}-${index}`,
      respondent: response.fullname,
      survey: response.survey_title,
      type: answer.question_text,
    })),
  );
  const feedbackInsightCards = buildFeedbackInsightCards(feedbackInsights);

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
        <div className="mt-4">
          <div
            className={[
              "scroll-mt-8 rounded-xl border bg-slate-50 p-5",
              searchParams.get("section") === "top-suggested-events"
                ? "border-[#1e3a5f] ring-2 ring-[#1e3a5f]/15"
                : "border-slate-200",
            ].join(" ")}
            id="top-suggested-events"
          >
            <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-500">
              Top 3 Suggested Events
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Based on the most selected event options and submitted custom suggestions.
            </p>
            <div className="mt-4 space-y-3">
              {suggestedEvents.slice(0, 3).map((event) => (
                <div key={event.suggested_event_name}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div>
                      <span className="font-medium text-slate-700">
                        #{event.rank} {event.suggested_event_name}
                      </span>
                      <p className="text-xs text-slate-500">
                        {event.source_type === "combined"
                          ? "Combined"
                          : event.source_type === "custom"
                            ? "Custom suggestion"
                            : "Official option"}
                        {event.is_already_planned ? " · Already planned" : ""}
                      </p>
                    </div>
                    <span className="text-right text-slate-500">
                      {event.vote_count ?? event.respondent_count} vote(s)
                      <br />
                      <span className="text-xs">
                        {Math.round(event.respondent_percentage ?? event.respondent_support_percentage ?? 0)}% of respondents
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
                      style={{ width: `${Math.min(100, event.respondent_percentage ?? event.respondent_support_percentage ?? 0)}%` }}
                    />
                  </div>
                </div>
              ))}
              {suggestedEvents.length === 0 ? (
                <p className="text-sm text-slate-500">No response data yet.</p>
              ) : null}
              {suggestedEvents.length > 0 ? (
                <p className="text-xs text-slate-500">
                  Percentages use respondent count as the denominator. Because Youth can select multiple events, totals can exceed 100%.
                </p>
              ) : null}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-500">
              Feedback insights
            </h3>
            {feedbackInsightCards.length > 0 ? (
              <div className="mt-4 grid gap-4 xl:grid-cols-3">
                {feedbackInsightCards.map((card) => (
                  <InsightCard
                    description={card.description}
                    icon={card.icon}
                    key={card.id}
                    title={card.title}
                    tone={card.tone}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-4 grid gap-4 xl:grid-cols-3">
                <InsightCard
                  description="No feedback insights available yet."
                  icon={BanknoteIcon}
                  title="Feedback insights"
                  tone="info"
                />
              </div>
            )}
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
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function loadAnnouncements() {
    setIsLoading(true);
    setErrorMessage(null);
    const { data, error } = await getAdminAnnouncements();
    if (error) setErrorMessage(error.message);
    setAnnouncements(data);
    setIsLoading(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    setIsDeleting(true);
    const { error } = await deleteAnnouncement(deleteTarget.announcement_id);
    setIsDeleting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setDeleteTarget(null);
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
              {announcement.image_path ? (
                <img
                  alt=""
                  className="mt-3 h-40 w-full rounded-xl object-cover"
                  src={announcement.image_path}
                />
              ) : null}
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
                  onClick={() => setDeleteTarget(announcement)}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
      <AdminModal
        footer={
          <>
            <button
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              disabled={isDeleting}
              onClick={() => setDeleteTarget(null)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isDeleting}
              onClick={handleDelete}
              type="button"
            >
              {isDeleting ? "Deleting..." : "Delete Announcement"}
            </button>
          </>
        }
        onClose={() => setDeleteTarget(null)}
        open={Boolean(deleteTarget)}
        title="Delete Announcement"
      >
        <p className="text-sm text-slate-600">
          Delete {deleteTarget?.title ? `"${deleteTarget.title}"` : "this announcement"}?
          This action cannot be undone.
        </p>
      </AdminModal>
    </div>
  );
}

export default function SurveysAnnouncementsSections() {
  return <EventFeedbackSection />;
}
