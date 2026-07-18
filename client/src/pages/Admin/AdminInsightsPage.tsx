import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import Sidebar from "../../components/Sidebar/Sidebar";
import {
  AlertIcon,
  ArrowRightIcon,
  BanknoteIcon,
  LineChartIcon,
} from "../../components/Admin/Dashboard/icons";
import {
  canRunDecisionInsightAction,
} from "../../hooks/useDecisionInsightActions";
import {
  getDecisionInsights,
  type DecisionInsight,
  type DecisionInsightCategory,
  type DecisionInsightSeverity,
} from "../../services/DecisionInsightsService";

const categoryOptions: Array<"all" | DecisionInsightCategory> = [
  "all",
  "budget",
  "event",
  "survey",
  "registration",
  "feedback",
  "notification",
];

const severityOptions: Array<"all" | DecisionInsightSeverity> = [
  "all",
  "critical",
  "warning",
  "opportunity",
  "info",
];

function titleize(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getSeverityClass(severity: DecisionInsightSeverity) {
  switch (severity) {
    case "critical":
      return "bg-red-50 text-red-700 ring-red-200";
    case "warning":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "opportunity":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "info":
      return "bg-blue-50 text-blue-700 ring-blue-200";
  }
}

function getIcon(insight: DecisionInsight) {
  if (insight.severity === "critical" || insight.severity === "warning") {
    return AlertIcon;
  }

  if (insight.severity === "opportunity") {
    return LineChartIcon;
  }

  return BanknoteIcon;
}

function getInsightPath(insight: DecisionInsight) {
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

export default function AdminInsightsPage() {
  const { logout } = useAuth();
  const [categoryFilter, setCategoryFilter] = useState<"all" | DecisionInsightCategory>("all");
  const [severityFilter, setSeverityFilter] = useState<"all" | DecisionInsightSeverity>("all");
  const [insights, setInsights] = useState<DecisionInsight[]>([]);
  const [budgetYear, setBudgetYear] = useState<number | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function loadInsights() {
    setIsLoading(true);
    setErrorMessage(null);

    const { data, error } = await getDecisionInsights();
    if (error) {
      setErrorMessage(error.message);
      setInsights([]);
      setIsLoading(false);
      return;
    }

    setInsights(data?.insights ?? []);
    setBudgetYear(data?.fiscalYear ?? null);
    setLastRefreshedAt(data?.lastRefreshedAt ?? new Date().toISOString());
    setIsLoading(false);
  }

  useEffect(() => {
    void Promise.resolve().then(loadInsights);
  }, []);

  const filteredInsights = useMemo(
    () =>
      insights.filter(
        (insight) =>
          (categoryFilter === "all" || insight.category === categoryFilter) &&
          (severityFilter === "all" || insight.severity === severityFilter),
      ),
    [categoryFilter, insights, severityFilter],
  );
  const criticalCount = insights.filter((insight) => insight.severity === "critical").length;
  const warningCount = insights.filter((insight) => insight.severity === "warning").length;
  const opportunityCount = insights.filter((insight) => insight.severity === "opportunity").length;

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900">
      <Sidebar onLogout={logout} />
      <main className="ml-[88px] flex min-h-screen flex-1 flex-col transition-[margin-left] duration-300 ease-in-out peer-hover/sidebar:ml-[300px] max-md:ml-[72px] max-md:peer-hover/sidebar:ml-[72px]">
        <div className="border-b border-slate-200 bg-white px-8 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1e3a5f]">
                Decision Support Insights
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Live survey, event, feedback, registration, and budget signals
              </p>
            </div>
            <button
              className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2a4a6f] disabled:opacity-60"
              disabled={isLoading}
              onClick={loadInsights}
              type="button"
            >
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        <div className="flex-1 p-8">
          <section className="mb-6 grid gap-4 md:grid-cols-4">
            {[
              ["Budget Year", budgetYear ?? "Current"],
              ["Total Insights", insights.length],
              ["Critical", criticalCount],
              ["Warning", warningCount],
              ["Opportunity", opportunityCount],
            ].map(([label, value]) => (
              <article
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                key={label}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                  {label}
                </p>
                <p className="mt-2 text-2xl font-bold text-[#1e3a5f]">
                  {value}
                </p>
              </article>
            ))}
          </section>

          <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
              <label>
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Category
                </span>
                <select
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1e3a5f]"
                  onChange={(event) =>
                    setCategoryFilter(event.target.value as typeof categoryFilter)
                  }
                  value={categoryFilter}
                >
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option === "all" ? "All Categories" : titleize(option)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Severity
                </span>
                <select
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#1e3a5f]"
                  onChange={(event) =>
                    setSeverityFilter(event.target.value as typeof severityFilter)
                  }
                  value={severityFilter}
                >
                  {severityOptions.map((option) => (
                    <option key={option} value={option}>
                      {option === "all" ? "All Severities" : titleize(option)}
                    </option>
                  ))}
                </select>
              </label>
              <p className="text-sm text-slate-500">
                Last refreshed:{" "}
                {lastRefreshedAt
                  ? new Date(lastRefreshedAt).toLocaleString("en-PH")
                  : "Not yet loaded"}
              </p>
            </div>
          </section>

          {errorMessage ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
              {errorMessage}
            </div>
          ) : isLoading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
              Loading insights...
            </div>
          ) : filteredInsights.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500 shadow-sm">
              No insights match the selected filters.
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredInsights.map((insight) => {
                const Icon = getIcon(insight);
                const canAct = canRunDecisionInsightAction(insight);

                return (
                  <article
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                    key={insight.id}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1e3a5f]/10 text-[#1e3a5f]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={[
                              "rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1",
                              getSeverityClass(insight.severity),
                            ].join(" ")}
                          >
                            {insight.severity === "info" ? "Information" : insight.severity}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-600">
                            {titleize(insight.category)}
                          </span>
                        </div>
                        <h2 className="mt-3 text-base font-semibold text-slate-900">
                          {insight.title}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {insight.description}
                        </p>
                        <div className="mt-4 grid gap-3 text-xs text-slate-500 sm:grid-cols-2">
                          <p>
                            <span className="font-semibold text-slate-700">
                              Source:
                            </span>{" "}
                            {insight.dataSource}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-700">
                              Metric:
                            </span>{" "}
                            {insight.supportingValue || "Not available"}
                          </p>
                        </div>
                        {insight.recommendedAction ? (
                          <p className="mt-3 text-sm font-medium text-slate-700">
                            {insight.recommendedAction}
                          </p>
                        ) : null}
                        {canAct ? (
                          <Link
                            className="mt-4 inline-flex items-center gap-1 rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-semibold text-white hover:bg-[#2a4a6f]"
                            to={getInsightPath(insight)}
                          >
                            {insight.actionLabel}{" "}
                            <ArrowRightIcon className="h-3.5 w-3.5" />
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
