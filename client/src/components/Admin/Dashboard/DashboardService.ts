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
  event_date: string | null;
  event_time: string | null;
  location: string | null;
  expected_attendees: number | null;
  registered_count: number;
};

export type DashboardData = {
  totalYouth: number;
  activeYouth: number;
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

export async function getDashboardData(): Promise<{
  data: DashboardData | null;
  error: Error | null;
}> {
  const [summary, preferred, suggested] = await Promise.all([
    supabase.rpc("get_admin_dashboard_summary"),
    getPreferredActivityTypes(),
    getTopSuggestedEvents(),
  ]);

  const firstError = summary.error || preferred.error || suggested.error;

  if (firstError) {
    return { data: null, error: firstError };
  }

  const dashboardSummary = summary.data as Omit<
    DashboardData,
    "preferredActivityTypes" | "topSuggestedEvents"
  >;

  return {
    data: {
      activeYouth: Number(dashboardSummary.activeYouth ?? 0),
      allocatedBudget: Number(dashboardSummary.allocatedBudget ?? 0),
      completedEventsCount: Number(dashboardSummary.completedEventsCount ?? 0),
      completedSpending: Number(dashboardSummary.completedSpending ?? 0),
      ongoingEventsCount: Number(dashboardSummary.ongoingEventsCount ?? 0),
      preferredActivityTypes: preferred.data,
      publishedAnnouncementsCount: Number(dashboardSummary.publishedAnnouncementsCount ?? 0),
      publishedSurveysCount: Number(dashboardSummary.publishedSurveysCount ?? 0),
      recentEvents: dashboardSummary.recentEvents ?? [],
      surveyResponsesCount: Number(dashboardSummary.surveyResponsesCount ?? 0),
      topSuggestedEvents: suggested.data,
      totalBudget: Number(dashboardSummary.totalBudget ?? 0),
      totalYouth: Number(dashboardSummary.totalYouth ?? 0),
      upcomingEventsCount: Number(dashboardSummary.upcomingEventsCount ?? 0),
    },
    error: null,
  };
}
