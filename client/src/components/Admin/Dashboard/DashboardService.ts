import { supabase } from "@/lib/supabase";
import {
  getPreferredActivityTypes,
  getTopSuggestedEvents,
  type PreferredActivityType,
  type TopSuggestedEvent,
} from "../SurveysAnnouncements/SurveyInsightsService";
import {
  getDecisionInsights,
  type DecisionInsight,
} from "../../../services/DecisionInsightsService";

export type DashboardEvent = {
  event_id: number;
  event_name: string;
  category: string;
  allocated_budget: number;
  event_date: string | null;
  event_time: string | null;
  location: string | null;
  expected_attendees: number | null;
  registered_count: number;
};

export type DashboardPopulationGroup = {
  label: string;
  count: number;
};

export type DashboardParticipationTrend = {
  attendance_count: number;
  category: string;
  event_count: number;
  expected_attendees: number;
  participation_rate: number | null;
  registered_count: number;
};

export type DashboardData = {
  fiscalYear: number | null;
  totalYouth: number;
  genderGroups: DashboardPopulationGroup[];
  purokGroups: DashboardPopulationGroup[];
  totalBudget: number;
  allocatedBudget: number;
  completedSpending: number;
  unallocatedBudget: number;
  availableToSpend: number;
  oversubscribedAllocation: number;
  allocationPercentage: number | null;
  spendingPercentage: number | null;
  upcomingEventsCount: number;
  ongoingEventsCount: number;
  completedEventsCount: number;
  publishedSurveysCount: number;
  surveyResponsesCount: number;
  publishedAnnouncementsCount: number;
  recentEvents: DashboardEvent[];
  decisionInsights: DecisionInsight[];
  participationTrendByCategory: DashboardParticipationTrend[];
  preferredActivityTypes: PreferredActivityType[];
  topSuggestedEvents: TopSuggestedEvent[];
};

export type DashboardSurveyQuestion = {
  question_id: number;
  question_text: string;
  question_type: string;
  sort_order: number;
};

export type DashboardSurveyFilter = {
  survey_id: number;
  title: string;
  status: string;
  created_at: string | null;
  expires_at: string | null;
  responseCount: number;
  questions: DashboardSurveyQuestion[];
};

export type SurveyAnswerChartEntry = {
  answer_type: string;
  count: number;
  display_order: number;
  label: string;
  percentage: number;
  question_id: number;
  question_text: string;
  question_type: string;
  respondent_count: number;
  survey_id: number;
  survey_title: string;
};

type EventRow = Omit<DashboardEvent, "registered_count"> & {
  status: string;
  event_registrations?: Array<{ registration_id: number; attendance_status: string | null }>;
};

function countByValue<T>(rows: T[], getValue: (row: T) => string | null | undefined) {
  const counts = new Map<string, number>();

  rows.forEach((row) => {
    const value = getValue(row)?.trim() || "Not set";
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });

  return Array.from(counts, ([label, count]) => ({ label, count })).sort(
    (first, second) => second.count - first.count || first.label.localeCompare(second.label),
  );
}

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

function buildParticipationTrendByCategory(eventRows: EventRow[]) {
  const grouped = new Map<string, DashboardParticipationTrend>();

  eventRows
    .filter((event) => event.status !== "draft")
    .forEach((event) => {
      const category = event.category?.trim() || "Uncategorized";
      const current =
        grouped.get(category) ??
        {
          attendance_count: 0,
          category,
          event_count: 0,
          expected_attendees: 0,
          participation_rate: null,
          registered_count: 0,
        };
      const registrations = event.event_registrations ?? [];

      current.event_count += 1;
      current.expected_attendees += event.expected_attendees ?? 0;
      current.registered_count += registrations.filter((registration) =>
        ["registered", "attended"].includes(registration.attendance_status ?? "registered"),
      ).length;
      current.attendance_count += registrations.filter(
        (registration) => registration.attendance_status === "attended",
      ).length;
      grouped.set(category, current);
    });

  return Array.from(grouped.values())
    .map((row) => ({
      ...row,
      participation_rate:
        row.expected_attendees > 0
          ? Math.round((row.registered_count / row.expected_attendees) * 100)
          : null,
    }))
    .sort(
      (first, second) =>
        second.registered_count - first.registered_count ||
        first.category.localeCompare(second.category),
    );
}

export async function getDashboardData(): Promise<{
  data: DashboardData | null;
  error: Error | null;
}> {
  const today = todayValue();
  const [
    profiles,
    dashboardSummary,
    events,
    surveys,
    responses,
    announcements,
    preferred,
    suggested,
    decisionInsights,
  ] = await Promise.all([
    supabase
      .from("kabataan_profiles")
      .select("profile_id,gender,purok")
      .eq("status", "active"),
    supabase.rpc("get_admin_dashboard_decision_support"),
    supabase
      .from("events")
      .select(
        "event_id,event_name,category,allocated_budget,status,event_date,event_time,location,expected_attendees,event_registrations(registration_id,attendance_status)",
      )
      .neq("status", "cancelled")
      .order("event_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase.from("surveys").select("survey_id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("survey_responses").select("response_id", { count: "exact", head: true }),
    supabase
      .from("announcements")
      .select("announcement_id", { count: "exact", head: true })
      .eq("is_published", true),
    getPreferredActivityTypes(),
    getTopSuggestedEvents(),
    getDecisionInsights(),
  ]);

  const firstError =
    profiles.error ||
    dashboardSummary.error ||
    events.error ||
    surveys.error ||
    responses.error ||
    announcements.error;
  const decisionError = decisionInsights.error;

  if (firstError || decisionError) {
    return { data: null, error: firstError || decisionError };
  }

  const profileRows = (profiles.data ?? []) as Array<{
    profile_id: string;
    gender: string | null;
    purok: string | null;
  }>;
  const eventRows = (events.data ?? []) as EventRow[];
  const visibleUpcomingEvents = eventRows
    .filter((event) => event.status === "scheduled" && event.event_date !== null && event.event_date >= today)
    .slice(0, 5)
    .map(({ event_registrations, ...event }) => ({
      ...event,
      registered_count: (event_registrations ?? []).filter((registration) =>
        ["registered", "attended"].includes(registration.attendance_status ?? "registered"),
      ).length,
    }));
  const summary = dashboardSummary.data as {
    budget_year?: { fiscal_year?: number | null };
    metrics?: Record<string, number | null>;
  } | null;
  const metrics = summary?.metrics ?? {};

  return {
    data: {
      allocatedBudget: Number(metrics.total_allocated_budget ?? 0),
      allocationPercentage: metrics.allocation_percentage === null ? null : Number(metrics.allocation_percentage ?? 0),
      availableToSpend: Number(metrics.available_to_spend ?? 0),
      completedEventsCount: Number(metrics.completed_events ?? 0),
      completedSpending: Number(metrics.total_completed_spending ?? 0),
      decisionInsights: decisionInsights.data?.insights ?? [],
      fiscalYear: summary?.budget_year?.fiscal_year ?? null,
      genderGroups: countByValue(profileRows, (profile) => profile.gender),
      ongoingEventsCount: Number(metrics.ongoing_events ?? 0),
      oversubscribedAllocation: Number(metrics.oversubscribed_allocation ?? 0),
      participationTrendByCategory: buildParticipationTrendByCategory(eventRows),
      preferredActivityTypes: preferred.error ? [] : preferred.data,
      publishedAnnouncementsCount: Number(metrics.published_announcements ?? announcements.count ?? 0),
      publishedSurveysCount: Number(metrics.published_surveys ?? surveys.count ?? 0),
      purokGroups: countByValue(profileRows, (profile) => profile.purok),
      recentEvents: visibleUpcomingEvents,
      spendingPercentage: metrics.spending_percentage === null ? null : Number(metrics.spending_percentage ?? 0),
      surveyResponsesCount: Number(metrics.survey_responses ?? responses.count ?? 0),
      topSuggestedEvents: suggested.error ? [] : suggested.data,
      totalBudget: Number(metrics.total_annual_budget ?? 0),
      totalYouth: Number(metrics.total_youth ?? profileRows.length),
      unallocatedBudget: Number(metrics.unallocated_budget ?? 0),
      upcomingEventsCount: Number(metrics.upcoming_events ?? 0),
    },
    error: null,
  };
}

type SurveyFilterRow = {
  created_at: string | null;
  expires_at: string | null;
  status: string;
  survey_id: number;
  title: string;
  survey_questions?: DashboardSurveyQuestion[];
  survey_responses?: Array<{ response_id: number }>;
};

export async function getDashboardSurveyFilters() {
  const { data, error } = await supabase
    .from("surveys")
    .select(
      "survey_id,title,status,created_at,expires_at,survey_questions(question_id,question_text,question_type,sort_order),survey_responses(response_id)",
    )
    .order("created_at", { ascending: false })
    .order("sort_order", { ascending: true, referencedTable: "survey_questions" });

  const rows = (data ?? []) as SurveyFilterRow[];

  return {
    data: rows.map((survey) => ({
      created_at: survey.created_at,
      expires_at: survey.expires_at,
      questions: [...(survey.survey_questions ?? [])].sort(
        (first, second) => first.sort_order - second.sort_order || first.question_id - second.question_id,
      ),
      responseCount: survey.survey_responses?.length ?? 0,
      status: survey.status,
      survey_id: survey.survey_id,
      title: survey.title,
    })),
    error,
  };
}

export async function getSurveyAnswerChart(options: {
  questionId: number;
  surveyId: number;
}) {
  const { data, error } = await supabase.rpc("get_admin_survey_answer_chart", {
    p_question_id: options.questionId,
    p_survey_id: options.surveyId,
  });

  return { data: (data ?? []) as SurveyAnswerChartEntry[], error };
}
