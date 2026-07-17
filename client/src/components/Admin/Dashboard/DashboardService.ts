import { supabase } from "../../../utils/supabase";
import {
  getPreferredActivityTypes,
  getTopSuggestedEvents,
  type PreferredActivityType,
  type TopSuggestedEvent,
} from "../SurveysAnnouncements/SurveyInsightsService";

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
  decisionInsights: DashboardInsight[];
  preferredActivityTypes: PreferredActivityType[];
  topSuggestedEvents: TopSuggestedEvent[];
};

export type DashboardInsight = {
  title: string;
  description: string;
  tone: "success" | "info" | "warning";
  basis?: Record<string, unknown>;
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
  ] = await Promise.all([
    supabase.from("kabataan_profiles").select("profile_id,gender,purok"),
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
  ]);

  const firstError =
    profiles.error ||
    dashboardSummary.error ||
    events.error ||
    surveys.error ||
    responses.error ||
    announcements.error;

  if (firstError) {
    return { data: null, error: firstError };
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
    insights?: DashboardInsight[];
  } | null;
  const metrics = summary?.metrics ?? {};

  return {
    data: {
      allocatedBudget: Number(metrics.total_allocated_budget ?? 0),
      allocationPercentage: metrics.allocation_percentage === null ? null : Number(metrics.allocation_percentage ?? 0),
      availableToSpend: Number(metrics.available_to_spend ?? 0),
      completedEventsCount: Number(metrics.completed_events ?? 0),
      completedSpending: Number(metrics.total_completed_spending ?? 0),
      decisionInsights: summary?.insights ?? [],
      fiscalYear: summary?.budget_year?.fiscal_year ?? null,
      genderGroups: countByValue(profileRows, (profile) => profile.gender),
      ongoingEventsCount: Number(metrics.ongoing_events ?? 0),
      oversubscribedAllocation: Number(metrics.oversubscribed_allocation ?? 0),
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
