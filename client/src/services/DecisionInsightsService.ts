import { supabase } from "../utils/supabase";
import {
  getEventPreferenceRecommendations,
  getPreferredActivityTypes,
} from "../components/Admin/SurveysAnnouncements/SurveyInsightsService";
import type {
  ActivityEvent,
  CompletedEventPerformance,
} from "../components/Admin/Activities/ActivitiesService";

export type DecisionInsightCategory =
  | "budget"
  | "event"
  | "survey"
  | "registration"
  | "feedback"
  | "notification";

export type DecisionInsightSeverity =
  | "critical"
  | "warning"
  | "opportunity"
  | "info";

export type DecisionInsightActionType =
  | "create_event"
  | "view_event"
  | "view_event_registrations"
  | "view_event_performance"
  | "view_event_feedback"
  | "view_survey_results"
  | "view_budget"
  | "view_transactions"
  | "view_notifications"
  | "none";

export type DecisionInsight = {
  id: string;
  type: string;
  category: DecisionInsightCategory;
  severity: DecisionInsightSeverity;
  title: string;
  description: string;
  supportingValue?: string;
  dataSource: string;
  recommendedAction?: string;
  actionType: DecisionInsightActionType;
  actionLabel?: string;
  eventId?: number;
  surveyId?: number;
  matchingEventId?: number;
  budgetYearId?: number;
  categoryName?: string;
  recommendedEventName?: string;
  recommendedEventCategory?: string;
  priority: number;
};

export type DecisionInsightsResult = {
  budgetYearId: number | null;
  fiscalYear: number | null;
  lastRefreshedAt: string;
  insights: DecisionInsight[];
};

type DashboardSupportPayload = {
  budget_year?: {
    budget_year_id?: number | null;
    fiscal_year?: number | null;
  };
  metrics?: Record<string, number | null>;
};

type EventRow = ActivityEvent & {
  event_registrations?: Array<{
    registration_id: number;
    attendance_status?: string | null;
  }>;
};

function formatPeso(amount: number) {
  return `P${amount.toLocaleString("en-PH")}`;
}

function severityRank(severity: DecisionInsightSeverity) {
  switch (severity) {
    case "critical":
      return 0;
    case "warning":
      return 1;
    case "opportunity":
      return 2;
    case "info":
      return 3;
  }
}

export function sortDecisionInsights(insights: DecisionInsight[]) {
  return [...insights].sort(
    (first, second) =>
      first.priority - second.priority ||
      severityRank(first.severity) - severityRank(second.severity) ||
      first.category.localeCompare(second.category) ||
      first.title.localeCompare(second.title),
  );
}

function hasValidAction(insight: DecisionInsight) {
  switch (insight.actionType) {
    case "create_event":
      return Boolean(insight.recommendedEventName && insight.recommendedEventCategory);
    case "view_event":
      return Boolean(insight.eventId || insight.matchingEventId);
    case "view_event_registrations":
    case "view_event_performance":
    case "view_event_feedback":
      return Boolean(insight.eventId);
    case "view_survey_results":
      return Boolean(insight.categoryName);
    case "view_budget":
      return Boolean(insight.budgetYearId);
    case "view_transactions":
      return true;
    case "view_notifications":
      return false;
    case "none":
      return false;
  }
}

function withActionVisibility(insight: DecisionInsight): DecisionInsight {
  return hasValidAction(insight)
    ? insight
    : { ...insight, actionLabel: undefined, actionType: "none" };
}

export async function getDecisionInsights(): Promise<{
  data: DecisionInsightsResult | null;
  error: Error | null;
}> {
  const [
    dashboardSupport,
    recommendations,
    preferredCategories,
    performance,
    events,
    notifications,
  ] = await Promise.all([
    supabase.rpc("get_admin_dashboard_decision_support"),
    getEventPreferenceRecommendations(),
    getPreferredActivityTypes(),
    supabase.rpc("get_admin_completed_event_performance"),
    supabase
      .from("events")
      .select(
        "event_id,budget_year_id,event_name,category,allocated_budget,budget_items,status,event_date,event_time,location,expected_attendees,cover_image,description,created_by,created_at,event_expenses(expense_id,event_id,expense_type,calculation_type,unit_cost,quantity,amount,description),event_registrations(registration_id,attendance_status)",
      )
      .neq("status", "cancelled"),
    supabase
      .from("admin_notifications")
      .select("notification_id", { count: "exact", head: true })
      .eq("is_read", false),
  ]);

  const error =
    dashboardSupport.error ||
    recommendations.error ||
    preferredCategories.error ||
    performance.error ||
    events.error ||
    notifications.error;

  if (error) {
    return { data: null, error };
  }

  const support = dashboardSupport.data as DashboardSupportPayload | null;
  const budgetYearId = support?.budget_year?.budget_year_id ?? null;
  const fiscalYear = support?.budget_year?.fiscal_year ?? null;
  const metrics = support?.metrics ?? {};
  const insightRows: DecisionInsight[] = [];
  const eventRows = (events.data ?? []) as EventRow[];
  const performanceRows = (performance.data ?? []) as CompletedEventPerformance[];

  const oversubscribed = Number(metrics.oversubscribed_allocation ?? 0);
  if (oversubscribed > 0) {
    insightRows.push({
      actionLabel: "View Financial Records",
      actionType: "view_transactions",
      budgetYearId: budgetYearId ?? undefined,
      category: "budget",
      dataSource: "Annual budget and event allocations",
      description: `Planned event allocations exceed the annual budget by ${formatPeso(oversubscribed)}.`,
      id: `budget-oversubscribed-${budgetYearId ?? "current"}`,
      priority: 1,
      recommendedAction: "Review allocations and completed financial records.",
      severity: "critical",
      supportingValue: formatPeso(oversubscribed),
      title: "Annual budget allocation exceeded",
      type: "annual_budget_exceeded",
    });
  }

  performanceRows
    .filter((event) => (event.budget_utilization_percentage ?? 0) > 100)
    .forEach((event) => {
      insightRows.push({
        actionLabel: "View Financial Records",
        actionType: "view_transactions",
        category: "budget",
        dataSource: "Completed event performance and financial transactions",
        description: `${event.event_name} used ${event.budget_utilization_percentage}% of its allocation based on completed spending.`,
        eventId: event.event_id,
        id: `event-over-budget-${event.event_id}`,
        priority: 2,
        recommendedAction: "Review event spending and financial records.",
        severity: "critical",
        supportingValue: `${event.budget_utilization_percentage}% utilization`,
        title: "Completed event spending exceeded allocation",
        type: "completed_event_over_budget",
      });
    });

  eventRows
    .filter((event) => event.status === "scheduled" && (event.expected_attendees ?? 0) > 0)
    .map((event) => {
      const registeredCount = (event.event_registrations ?? []).filter((registration) =>
        ["registered", "attended"].includes(registration.attendance_status ?? "registered"),
      ).length;
      const fillRate = (registeredCount / Math.max(event.expected_attendees ?? 1, 1)) * 100;
      return { event, fillRate, registeredCount };
    })
    .filter(({ fillRate }) => fillRate < 30)
    .forEach(({ event, fillRate, registeredCount }) => {
      insightRows.push({
        actionLabel: "View Registrations",
        actionType: "view_event_registrations",
        category: "registration",
        dataSource: "Events and event registrations",
        description: `${event.event_name} has ${registeredCount} registration(s) out of ${event.expected_attendees} expected attendee(s).`,
        eventId: event.event_id,
        id: `low-registration-${event.event_id}`,
        priority: 3,
        recommendedAction: "Review registration list and outreach needs.",
        severity: "warning",
        supportingValue: `${Math.round(fillRate)}% filled`,
        title: "Scheduled event with low registration",
        type: "low_registration",
      });
    });

  performanceRows
    .filter(
      (event) =>
        event.registration_count >= 3 &&
        ((event.attendance_rate ?? 100) < 50 ||
          (event.feedback_count >= 3 && (event.average_feedback_rating ?? 5) < 3)),
    )
    .forEach((event) => {
      insightRows.push({
        actionLabel: "View Performance",
        actionType: "view_event_performance",
        category: "feedback",
        dataSource: "Completed event performance",
        description: `${event.event_name} needs review: ${event.attendance_rate ?? 0}% attendance rate and ${event.average_feedback_rating ?? "no"} average feedback.`,
        eventId: event.event_id,
        id: `weak-performance-${event.event_id}`,
        priority: 4,
        recommendedAction: "Review attendance, feedback, and spending outcomes.",
        severity: "warning",
        supportingValue: `${event.registration_count} registration(s)`,
        title: "Weak completed-event performance",
        type: "weak_completed_event_performance",
      });
    });

  const unreadNotifications = notifications.count ?? 0;
  if (unreadNotifications > 0) {
    insightRows.push({
      actionType: "none",
      category: "notification",
      dataSource: "Admin notifications",
      description: `${unreadNotifications} unread notification(s) need admin attention.`,
      id: "unread-notifications",
      priority: 5,
      recommendedAction: "Review the notification menu in the admin header.",
      severity: "info",
      supportingValue: `${unreadNotifications} unread`,
      title: "Unread admin notifications",
      type: "unread_notifications",
    });
  }

  recommendations.data
    .filter((recommendation) => recommendation.total_respondent_count >= 3)
    .slice(0, 3)
    .forEach((recommendation) => {
      const alreadyPlanned = recommendation.is_already_planned && recommendation.matching_event_id;
      insightRows.push({
        actionLabel: alreadyPlanned ? "View Event" : "Create Event",
        actionType: alreadyPlanned ? "view_event" : "create_event",
        category: "survey",
        dataSource: "Survey event preference results",
        description: `${recommendation.event_name} averages ${recommendation.average_rating}/5 from ${recommendation.total_respondent_count} respondent(s).`,
        eventId: recommendation.matching_event_id ?? undefined,
        id: `survey-recommendation-${recommendation.rank}-${recommendation.event_name}`,
        matchingEventId: recommendation.matching_event_id ?? undefined,
        priority: alreadyPlanned ? 8 : 6,
        recommendedAction: alreadyPlanned
          ? "Review the planned event."
          : "Create a draft event for admin review.",
        recommendedEventCategory: recommendation.event_category,
        recommendedEventName: recommendation.event_name,
        severity: "opportunity",
        supportingValue: `${recommendation.positive_interest_percentage}% positive`,
        title: alreadyPlanned
          ? "High-interest event is already planned"
          : "High-interest unscheduled recommendation",
        type: alreadyPlanned
          ? "already_planned_recommendation"
          : "unscheduled_recommendation",
      });
    });

  performanceRows
    .filter(
      (event) =>
        event.registration_count >= 3 &&
        (event.attendance_rate ?? 0) >= 70 &&
        event.feedback_count >= 3 &&
        (event.average_feedback_rating ?? 0) >= 4,
    )
    .slice(0, 2)
    .forEach((event) => {
      insightRows.push({
        actionLabel: "View Performance",
        actionType: "view_event_performance",
        category: "event",
        dataSource: "Completed event performance",
        description: `${event.event_name} performed strongly with ${event.attendance_rate}% attendance and ${event.average_feedback_rating}/5 feedback.`,
        eventId: event.event_id,
        id: `strong-performance-${event.event_id}`,
        priority: 7,
        recommendedAction: "Use this event as a reference for future planning.",
        severity: "opportunity",
        supportingValue: `${event.feedback_count} feedback response(s)`,
        title: "Strong completed-event performance",
        type: "strong_completed_event_performance",
      });
    });

  preferredCategories.data
    .filter((category) => category.total_respondent_count >= 3)
    .slice(0, 2)
    .forEach((category) => {
      insightRows.push({
        actionLabel: "View Survey Results",
        actionType: "view_survey_results",
        category: "survey",
        categoryName: "preferred-activity-types",
        dataSource: "Preferred activity type analytics",
        description: `${category.activity_type} averages ${category.average_rating}/5 from ${category.total_respondent_count} respondent(s).`,
        id: `preferred-category-${category.rank}-${category.activity_type}`,
        priority: 8,
        recommendedAction: "Review preferred activity type results.",
        severity: "info",
        supportingValue: `${category.positive_interest_percentage}% positive`,
        title: "Preferred activity category signal",
        type: "preferred_activity_category",
      });
    });

  if (insightRows.length === 0) {
    insightRows.push({
      actionLabel: "Open Survey Responses",
      actionType: "view_survey_results",
      category: "survey",
      categoryName: "top-suggested-events",
      dataSource: "Dashboard decision support",
      description:
        "Not enough data yet. Publish event-interest surveys, collect registrations, and record completed-event feedback to unlock stronger recommendations.",
      id: "insufficient-data",
      priority: 99,
      recommendedAction: "Collect more survey, registration, and feedback data.",
      severity: "info",
      supportingValue: "Minimum 3 respondents or registrations required",
      title: "Not enough data for strong conclusions",
      type: "insufficient_data",
    });
  }

  return {
    data: {
      budgetYearId,
      fiscalYear,
      insights: sortDecisionInsights(insightRows.map(withActionVisibility)),
      lastRefreshedAt: new Date().toISOString(),
    },
    error: null,
  };
}
