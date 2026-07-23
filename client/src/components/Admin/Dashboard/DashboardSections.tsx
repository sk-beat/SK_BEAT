import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  iconToneClasses,
  type SummaryCard,
} from "./dashboardData";
import { AlertIcon, ArrowRightIcon, BanknoteIcon, CalendarIcon, ClipboardIcon, DollarIcon, LineChartIcon, TrendingIcon, UserRoundIcon, UsersIcon } from "./icons";
import {
  getDashboardData,
  getDashboardSurveyFilters,
  getSurveyAnswerChart,
  type DashboardData,
  type DashboardSurveyFilter,
  type SurveyAnswerChartEntry,
} from "./DashboardService";
import { canRunDecisionInsightAction } from "../../../hooks/useDecisionInsightActions";
import InsightCard from "../shared/InsightCard";

function SummaryCardItem({ card }: { card: SummaryCard }) {
  const Icon = card.icon;

  return (
    <article className="flex items-center justify-between rounded-[14px] border border-[#1e3a5f]/15 bg-white px-6 py-5 shadow-sm">
      <div className="flex min-w-0 flex-col gap-1.5">
        <span className="text-sm font-semibold tracking-[0.02em] text-slate-400">
          {card.title}
        </span>
        <span className="text-3xl font-bold leading-tight tracking-tight text-[#1e3a5f]">
          {card.value}
        </span>
        <span
          className={[
            "flex items-center gap-1 text-[0.8125rem] font-medium",
            card.noteTone === "positive" ? "text-emerald-500" : "text-slate-400",
          ].join(" ")}
        >
          {card.noteTone === "positive" ? (
            <TrendingIcon className="h-4 w-4" />
          ) : null}
          {card.note}
        </span>
      </div>
      <div
        className={[
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
          iconToneClasses[card.tone],
        ].join(" ")}
      >
        <Icon className="h-6 w-6" />
      </div>
    </article>
  );
}

function formatPeso(amount: number) {
  return `P${amount.toLocaleString("en-PH")}`;
}

function PopulationCard({ data }: { data: DashboardData }) {
  const [groupMode, setGroupMode] = useState<"gender" | "purok">("gender");
  const groups = groupMode === "gender" ? data.genderGroups : data.purokGroups;
  const colors = ["#1a529b", "#38b6ff", "#26ba9a", "#ff9f68", "#312e81", "#64748b"];
  let runningPercentage = 0;
  const conicStops =
    groups.length > 0
      ? groups
          .map((group, index) => {
            const percentage = data.totalYouth > 0 ? (group.count / data.totalYouth) * 100 : 0;
            const start = runningPercentage;
            runningPercentage += percentage;
            return `${colors[index % colors.length]} ${start}% ${runningPercentage}%`;
          })
          .join(",")
      : "#e2e8f0 0 100%";

  return (
    <section className="flex h-full flex-col gap-5 rounded-[14px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="m-0 text-sm font-semibold uppercase tracking-[0.1em] text-slate-400">
            Youth population overview
          </h2>
          <p className="mt-1 text-[0.8125rem] text-slate-400">
            Registered youth by gender or purok
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none"
            aria-label="Sort population overview"
            onChange={(event) => setGroupMode(event.target.value as "gender" | "purok")}
            value={groupMode}
          >
            <option value="gender">By Gender</option>
            <option value="purok">By Purok</option>
          </select>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1e3a5f]/6 text-[#1e3a5f]">
            <UserRoundIcon className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        <h3 className="text-[0.8rem] font-semibold text-slate-400">
          {groupMode === "gender" ? "By Gender" : "By Purok"}
        </h3>
        <div className="flex flex-wrap items-center gap-6">
          <div
            className="relative h-[200px] w-[200px] shrink-0 rounded-full"
            style={{ background: `conic-gradient(${conicStops})` }}
          >
            <div className="absolute inset-[24px] rounded-full bg-white" />
            <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-slate-900">
              {data.totalYouth}
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2 text-sm">
            {groups.length === 0 ? (
              <p className="text-sm text-slate-500">No registered Youth profiles yet.</p>
            ) : null}
            {groups.map((group, index) => (
              <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2" key={group.label}>
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="text-slate-800">{group.label}</span>
                <span className="text-slate-500">{group.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SurveyAnswerResultsCard() {
  const [surveys, setSurveys] = useState<DashboardSurveyFilter[]>([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState<number | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [chartData, setChartData] = useState<SurveyAnswerChartEntry[]>([]);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadFilters() {
      setIsLoadingFilters(true);
      const { data, error } = await getDashboardSurveyFilters();
      if (!isMounted) return;

      if (error) {
        setErrorMessage(error.message);
        setIsLoadingFilters(false);
        return;
      }

      setSurveys(data);

      const defaultSurvey = data.find((survey) => survey.status === "published" && survey.responseCount > 0)
        ?? data.find((survey) => survey.responseCount > 0)
        ?? data[0]
        ?? null;

      setSelectedSurveyId(defaultSurvey?.survey_id ?? null);
      setSelectedQuestionId(defaultSurvey?.questions[0]?.question_id ?? null);
      setIsLoadingFilters(false);
    }

    loadFilters();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedSurvey = surveys.find((survey) => survey.survey_id === selectedSurveyId) ?? null;

  useEffect(() => {
    const surveyId = selectedSurvey?.survey_id ?? null;
    const questionId = selectedQuestionId;

    if (!surveyId || !questionId) {
      return;
    }

    let isMounted = true;
    const chartSurveyId = surveyId;
    const chartQuestionId = questionId;

    async function loadChart() {
      setIsLoadingChart(true);
      setErrorMessage(null);
      const { data, error } = await getSurveyAnswerChart({
        questionId: chartQuestionId,
        surveyId: chartSurveyId,
      });
      if (!isMounted) return;

      if (error) {
        setErrorMessage(error.message);
        setChartData([]);
      } else {
        setChartData(data);
        console.log("[Survey Answer Results] Aggregation", {
          surveyId: chartSurveyId,
          questionId: chartQuestionId,
          officialOptionCount: data.filter((entry) => entry.answer_type !== "other").length,
          otherCount: data.find((entry) => entry.answer_type === "other")?.count ?? 0,
          totalRows: data.length,
        });
      }

      setIsLoadingChart(false);
    }

    loadChart();

    return () => {
      isMounted = false;
    };
  }, [selectedQuestionId, selectedSurvey]);

  const maxValue = Math.max(...chartData.map((item) => item.count), 1);
  const selectedQuestionType = chartData[0]?.question_type
    ?? selectedSurvey?.questions.find((question) => question.question_id === selectedQuestionId)?.question_type
    ?? "";
  const allowsMultipleSelections = selectedQuestionType === "multiple_choice";

  return (
    <section className="rounded-[14px] border border-[#1e3a5f]/20 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="m-0 text-sm font-semibold uppercase tracking-[0.1em] text-slate-400">
            Survey Answer Results
          </h2>
          <p className="mt-1 text-[0.8125rem] text-slate-400">
            Response distribution for the selected survey.
          </p>
        </div>
        <select
          className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none"
          aria-label="Select survey"
          disabled={isLoadingFilters || surveys.length === 0}
          onChange={(event) => {
            const surveyId = Number(event.target.value);
            const nextSurvey = surveys.find((survey) => survey.survey_id === surveyId) ?? null;
            setSelectedSurveyId(nextSurvey?.survey_id ?? null);
            setSelectedQuestionId(nextSurvey?.questions[0]?.question_id ?? null);
          }}
          value={selectedSurveyId ?? ""}
        >
          {surveys.length === 0 ? <option value="">No surveys</option> : null}
          {surveys.map((survey) => (
            <option key={survey.survey_id} value={survey.survey_id}>
              {survey.title}
            </option>
          ))}
        </select>
      </div>

      {selectedSurvey && selectedSurvey.questions.length > 1 ? (
        <select
          aria-label="Select survey question"
          className="mb-4 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none"
          onChange={(event) => setSelectedQuestionId(Number(event.target.value))}
          value={selectedQuestionId ?? ""}
        >
          {selectedSurvey.questions.map((question) => (
            <option key={question.question_id} value={question.question_id}>
              {question.question_text}
            </option>
          ))}
        </select>
      ) : null}

      {isLoadingFilters || isLoadingChart ? (
        <div className="grid h-[220px] place-items-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-500">
          Loading survey results...
        </div>
      ) : errorMessage ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          {errorMessage}
        </div>
      ) : !selectedSurvey ? (
        <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">
          No surveys are available.
        </div>
      ) : chartData.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">
          No survey responses are available for this survey.
        </div>
      ) : (
        <div className="space-y-3">
          {chartData.map((entry) => (
            <div className="grid grid-cols-[minmax(110px,1fr)_minmax(0,2fr)_auto] items-center gap-3 text-sm" key={entry.label}>
              <span className="min-w-0 truncate font-medium text-slate-700" title={entry.label}>
                {entry.label}
              </span>
              <div className="h-8 overflow-hidden rounded-md bg-slate-100" title={`${entry.label}: ${entry.count} selections, ${entry.percentage}% of respondents`}>
                <div
                  className="h-full rounded-md bg-[#1e3a5f]"
                  style={{ width: `${Math.max(4, (entry.count / maxValue) * 100)}%` }}
                />
              </div>
              <span className="text-right text-xs font-semibold text-slate-500">
                {entry.count} ({entry.percentage}%)
              </span>
            </div>
          ))}
        </div>
      )}

      {allowsMultipleSelections && chartData.length > 0 ? (
        <p className="mt-3 text-xs text-slate-400">
          Respondents may select multiple options, so percentages may total more than 100%.
        </p>
      ) : null}
      {chartData.length > 0 ? (
        <p className="mt-2 text-xs text-slate-400">
          Based on {chartData[0]?.respondent_count ?? 0} respondent(s).
        </p>
      ) : null}
    </section>
  );
}

function ParticipationTrendCard({ data }: { data: DashboardData }) {
  const rows = data.participationTrendByCategory;
  const years = Array.from(new Set(rows.map((row) => row.year))).sort((first, second) => second - first);
  const [selectedYear, setSelectedYear] = useState(years[0] ?? new Date().getFullYear());
  const activeYear = years.includes(selectedYear) ? selectedYear : years[0] ?? new Date().getFullYear();
  const yearRows = rows.filter((row) => row.year === activeYear);
  const categories = Array.from(new Set(yearRows.map((row) => row.category)));
  const colors = ["#1e3a5f", "#26ba9a", "#dc2626", "#7c3aed", "#f59e0b", "#0284c7", "#be185d", "#16a34a"];
  const chartWidth = 760;
  const chartHeight = 200;
  const padding = {
  top: 40,
  bottom: 60,
  left: 42,
  right: 18,
  };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const maxRegistered = Math.max(...yearRows.map((row) => row.registered_count), 1);
  const monthRows = Array.from({ length: 12 }, (_, index) => rows.find((row) => row.month === index + 1)?.month_label ?? "");
  const lineSeries = categories.map((category, index) => {
    const monthlyRows = Array.from({ length: 12 }, (_, monthIndex) =>
      yearRows.find((row) => row.category === category && row.month === monthIndex + 1) ?? null,
    );
    const points = monthlyRows.map((row, monthIndex) => {
      const x = padding.left + (monthIndex / 11) * plotWidth;
      const y = padding.top + plotHeight - ((row?.registered_count ?? 0) / maxRegistered) * plotHeight;
      return {
        label: monthRows[monthIndex] ?? "",
        registered: row?.registered_count ?? 0,
        x,
        y,
      };
    });

    return {
      category,
      color: colors[index % colors.length],
      points,
    };
  });

  return (
    <section className="mb-8 rounded-[14px] border border-[#1e3a5f]/20 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="m-0 text-sm font-semibold uppercase tracking-[0.1em] text-slate-400">
            Participation Trend by Event Category
          </h2>
          <p className="mt-1 text-[0.8125rem] text-slate-400">
            Monthly registration trend from January to December, grouped by event category.
          </p>
        </div>
        <select
          aria-label="Filter participation trend by year"
          className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none"
          disabled={years.length === 0}
          onChange={(event) => setSelectedYear(Number(event.target.value))}
          value={activeYear}
        >
          {years.length === 0 ? <option value={activeYear}>No event years</option> : null}
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">
          No participation data is available yet.
        </div>
      ) : (
        <div>
          <div className="overflow-x-auto">
            <svg
              aria-label={`Participation trend line graph for ${activeYear}`}
              className="min-w-[720px]"
              role="img"
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            >
              {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
                const y = padding.top + plotHeight - tick * plotHeight;
                return (
                  <g key={tick}>
                    <line
                      stroke="#e2e8f0"
                      strokeDasharray={tick === 0 ? undefined : "4 4"}
                      x1={padding.left}
                      x2={chartWidth - padding.right}
                      y1={y}
                      y2={y}
                    />
                    <text fill="#64748b" fontSize="10" textAnchor="end" x={padding.left - 8} y={y + 3}>
                      {Math.round(maxRegistered * tick)}
                    </text>
                  </g>
                );
              })}
              {monthRows.map((month, index) => {
                const x = padding.left + (index / 11) * plotWidth;
                return (
                  <text fill="#64748b" fontSize="10" key={month} textAnchor="middle" x={x} y={chartHeight - 12}>
                    {month}
                  </text>
                );
              })}
              {lineSeries.map((series) => (
                <g key={series.category}>
                  <polyline
                    fill="none"
                    points={series.points.map((point) => `${point.x},${point.y}`).join(" ")}
                    stroke={series.color}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                  />
                  {series.points.map((point) => (
                    <circle
                      cx={point.x}
                      cy={point.y}
                      fill="white"
                      key={`${series.category}-${point.label}`}
                      r="3.5"
                      stroke={series.color}
                      strokeWidth="2"
                    >
                      <title>{`${series.category} ${point.label}: ${point.registered} registered`}</title>
                    </circle>
                  ))}
                </g>
              ))}
            </svg>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {lineSeries.map((series) => (
              <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-600" key={series.category}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: series.color }} />
                {series.category}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function InsightsPanel({ data }: { data: DashboardData }) {
  const insights = data.decisionInsights.length
    ? data.decisionInsights.map((insight) => ({
        actionLabel: insight.actionLabel,
        actionType: insight.actionType,
        categoryName: insight.categoryName,
        description: insight.description,
        eventId: insight.eventId,
        icon: insight.severity === "warning" || insight.severity === "critical" ? AlertIcon : insight.severity === "opportunity" ? LineChartIcon : BanknoteIcon,
        insight,
        matchingEventId: insight.matchingEventId,
        recommendedEventCategory: insight.recommendedEventCategory,
        recommendedEventName: insight.recommendedEventName,
        title: insight.title,
        tone: (insight.severity === "critical"
          ? "critical"
          : insight.severity === "opportunity"
            ? "success"
            : insight.severity) as "critical" | "warning" | "success" | "info",
      }))
    : [
        {
          actionLabel: undefined,
          actionType: "none",
          description: "Not enough data. Publish event-interest surveys, collect registrations, and record completed-event feedback to show decision-support insights.",
          icon: AlertIcon,
          title: "Decision support",
          tone: "info" as const,
        },
      ];
  const visibleInsights = insights.slice(0, 3);

  return (
    <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm" id="insights">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="m-0 text-base font-semibold text-slate-800">
            Decision Support Insights
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Survey-based and live operational signals
          </p>
        </div>
        <Link
          className="inline-flex items-center gap-1 text-sm font-medium text-[#1e3a5f] hover:underline"
          to="/insights"
        >
          View All Insights{" "}
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {visibleInsights.map((insight, index) => (
          <InsightCard
            action={
              "insight" in insight && canRunDecisionInsightAction(insight.insight) ? (
                <Link
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#1e3a5f] hover:underline"
                  to={getInsightPath(insight.insight)}
                >
                  {insight.actionLabel} <ArrowRightIcon className="h-3.5 w-3.5" />
                </Link>
              ) : null
            }
            description={insight.description}
            icon={insight.icon}
            key={"insight" in insight ? insight.insight.id : `${insight.title}-${index}`}
            title={insight.title}
            tone={insight.tone}
          />
        ))}
      </div>
    </section>
  );
}

function UpcomingEvents({ data }: { data: DashboardData }) {
  function ClockIcon({ className }: { className?: string }) {
    return (
      <svg
        aria-hidden="true"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    );
  }

  function MapPinIcon({ className }: { className?: string }) {
    return (
      <svg
        aria-hidden="true"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    );
  }

  function UsersMiniIcon({ className }: { className?: string }) {
    return (
      <svg
        aria-hidden="true"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      </svg>
    );
  }

  return (
    <section className="mt-8">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800">
          Upcoming Events
        </h2>
        <a
          className="inline-flex items-center gap-1 text-sm text-[#1e3a5f] hover:underline"
          href="#events"
        >
          View All <ArrowRightIcon className="h-4 w-4" />
        </a>
      </div>

      <div className="flex flex-col gap-4">
        {data.recentEvents.map((event) => {
          const eventDate = event.event_date ? new Date(event.event_date) : null;
          return (
          <article
            className="flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm max-sm:flex-col"
            key={event.event_id}
          >
            <div className="flex w-24 min-w-24 flex-col items-center justify-center bg-[#1e3a5f] p-4 text-white max-sm:w-full max-sm:flex-row max-sm:gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide">
                {eventDate ? eventDate.toLocaleDateString("en", { month: "short" }) : "TBA"}
              </span>
              <span className="text-3xl font-bold leading-tight">
                {eventDate ? eventDate.getDate() : "--"}
              </span>
            </div>
            <div className="flex-1 px-6 py-5">
              <h3 className="text-lg font-semibold text-slate-800">
                {event.event_name}
              </h3>
              <div className="mt-3 flex flex-col gap-2 text-sm font-medium text-slate-400">
                <span className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4" />
                  {event.event_time || "Time to be announced"}
                </span>
                <span className="flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4" />
                  {event.location || "Location to be announced"}
                </span>
                <span className="flex items-center gap-2">
                  <UsersMiniIcon className="h-4 w-4" />
                  Registered: {event.registered_count}
                </span>
              </div>
            </div>
          </article>
        )})}
        {data.recentEvents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
            No scheduled or ongoing events yet.
          </div>
        ) : null}
      </div>
    </section>
  );
}

function getInsightPath(insight: DashboardData["decisionInsights"][number]) {
  switch (insight.actionType) {
    case "create_event": {
      const params = new URLSearchParams({
        action: "create-event",
        category: insight.recommendedEventCategory || "",
        name: insight.recommendedEventName || "",
      });
      return `/activities?${params.toString()}`;
    }
    case "view_event":
      return `/activities?eventId=${insight.eventId ?? insight.matchingEventId}`;
    case "view_event_registrations":
      return `/activities?eventId=${insight.eventId}&panel=registrations`;
    case "view_event_performance":
    case "view_event_feedback":
      return `/activities?eventId=${insight.eventId}&panel=performance`;
    case "view_survey_results": {
      const params = new URLSearchParams();
      if (insight.categoryName) params.set("section", insight.categoryName);
      if (insight.surveyId) params.set("surveyId", String(insight.surveyId));
      return `/survey-responses?${params.toString()}`;
    }
    case "view_budget":
      return insight.budgetYearId ? `/financial?budgetYearId=${insight.budgetYearId}` : "/financial";
    case "view_transactions":
      return insight.eventId ? `/financial?eventId=${insight.eventId}` : "/financial";
    case "view_notifications":
    case "none":
      return "/insights";
  }
}

export default function DashboardSections() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setIsLoading(true);
      const { data: dashboardData, error } = await getDashboardData();
      if (!isMounted) return;
      if (error) setErrorMessage(error.message);
      setData(dashboardData);
      setIsLoading(false);
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <div className="flex-1 p-8 text-sm text-slate-500">Loading dashboard...</div>;
  }

  if (errorMessage || !data) {
    return <div className="flex-1 p-8 text-sm text-amber-700">{errorMessage || "Unable to load dashboard."}</div>;
  }

  const summaryCards: SummaryCard[] = [
    {
      icon: UsersIcon,
      note: `${data.genderGroups.length} gender group(s)`,
      noteTone: "positive",
      title: "Total Youth",
      tone: "blue",
      value: String(data.totalYouth),
    },
    {
      icon: ClipboardIcon,
      note: `${data.completedEventsCount} completed in FY ${data.fiscalYear ?? "current"}`,
      noteTone: "positive",
      title: "Active Programs",
      tone: "green",
      value: String(data.upcomingEventsCount + data.ongoingEventsCount),
    },
    {
      icon: DollarIcon,
      note: `${formatPeso(data.completedSpending)} spent, ${formatPeso(data.unallocatedBudget)} unallocated`,
      title: "Total Budget",
      tone: "yellow",
      value: formatPeso(data.totalBudget),
    },
    {
      icon: CalendarIcon,
      note: "Scheduled",
      title: "Upcoming Events",
      tone: "purple",
      value: String(data.upcomingEventsCount),
    },
  ];

  return (
    <div className="flex-1 p-8">
      <section className="mb-8 grid grid-cols-4 gap-6 max-xl:grid-cols-2 max-md:grid-cols-1">
        {summaryCards.map((card) => (
          <SummaryCardItem card={card} key={card.title} />
        ))}
      </section>

      <section className="mb-6 grid grid-cols-2 gap-6 max-xl:grid-cols-1">
        <PopulationCard data={data} />
        <SurveyAnswerResultsCard />
      </section>

      <ParticipationTrendCard data={data} />
      <InsightsPanel data={data} />
      <UpcomingEvents data={data} />
    </div>
  );
}
