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
  totalYouth: number;
  genderGroups: DashboardPopulationGroup[];
  purokGroups: DashboardPopulationGroup[];
  totalBudget: number;
  allocatedBudget: number;
  completedSpending: number;
  upcomingEventsCount: number;
  ongoingEventsCount: number;
  completedEventsCount: number;
  publishedSurveysCount: number;
  surveyResponsesCount: number;
  publishedAnnouncementsCount: number;
  recentEvents: DashboardEvent[];
  preferredActivityTypes: PreferredActivityType[];
  topSuggestedEvents: TopSuggestedEvent[];
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

function sumAmounts(rows: Array<Record<string, unknown>>, column: string) {
  return rows.reduce((total, row) => total + Number(row[column] ?? 0), 0);
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
    budgets,
    transactions,
    events,
    surveys,
    responses,
    announcements,
    preferred,
    suggested,
  ] = await Promise.all([
    supabase.from("kabataan_profiles").select("profile_id,gender,purok"),
    supabase.from("annual_budgets").select("total_allocation,remaining_balance"),
    supabase
      .from("financial_transactions")
      .select("amount,status,transaction_type")
      .eq("status", "completed"),
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
    budgets.error ||
    transactions.error ||
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
    .filter(
      (event) =>
        (event.status === "scheduled" || event.status === "ongoing") &&
        (!event.event_date || event.event_date >= today),
    )
    .slice(0, 5)
    .map(({ event_registrations, ...event }) => ({
      ...event,
      registered_count: (event_registrations ?? []).filter((registration) =>
        ["registered", "attended"].includes(registration.attendance_status ?? "registered"),
      ).length,
    }));
  const budgetRows = (budgets.data ?? []) as Array<Record<string, unknown>>;
  const transactionRows = (transactions.data ?? []) as Array<Record<string, unknown>>;

  return {
    data: {
      allocatedBudget: sumAmounts(eventRows as unknown as Array<Record<string, unknown>>, "allocated_budget"),
      completedEventsCount: eventRows.filter((event) => event.status === "completed").length,
      completedSpending: sumAmounts(transactionRows, "amount"),
      genderGroups: countByValue(profileRows, (profile) => profile.gender),
      ongoingEventsCount: eventRows.filter((event) => event.status === "ongoing").length,
      preferredActivityTypes: preferred.error ? [] : preferred.data,
      publishedAnnouncementsCount: announcements.count ?? 0,
      publishedSurveysCount: surveys.count ?? 0,
      purokGroups: countByValue(profileRows, (profile) => profile.purok),
      recentEvents: visibleUpcomingEvents,
      surveyResponsesCount: responses.count ?? 0,
      topSuggestedEvents: suggested.error ? [] : suggested.data,
      totalBudget: sumAmounts(budgetRows, "total_allocation"),
      totalYouth: profileRows.length,
      upcomingEventsCount: eventRows.filter(
        (event) => event.status === "scheduled" && (!event.event_date || event.event_date >= today),
      ).length,
    },
    error: null,
  };
}
