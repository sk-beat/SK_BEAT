import { useNavigate } from "react-router-dom";
import type { DecisionInsight } from "../services/DecisionInsightsService";
import type {
  ActivityEvent,
  ActivityRecommendation,
} from "../components/Admin/Activities/ActivitiesService";

type ActionCallbacks = {
  findEvent?: (eventId: number) => ActivityEvent | null;
  onCreateEvent?: (recommendation: ActivityRecommendation) => void;
  onOpenEvent?: (event: ActivityEvent) => void;
  onOpenPerformance?: (eventId: number) => void;
  onOpenRegistrations?: (event: ActivityEvent) => void;
};

export function canRunDecisionInsightAction(insight: DecisionInsight) {
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
    case "none":
      return false;
  }
}

export function useDecisionInsightActions(callbacks: ActionCallbacks = {}) {
  const navigate = useNavigate();

  function runInsightAction(insight: DecisionInsight) {
    if (!canRunDecisionInsightAction(insight)) return;

    switch (insight.actionType) {
      case "create_event": {
        if (callbacks.onCreateEvent) {
          callbacks.onCreateEvent({
            authenticated_respondent_count: 0,
            average_rating: 0,
            event_category: insight.recommendedEventCategory || "Sports",
            event_name: insight.recommendedEventName || "",
            guest_respondent_count: 0,
            is_already_planned: false,
            matching_event_id: null,
            positive_count: 0,
            positive_interest_percentage: 0,
            rank: 0,
            response_count: 0,
            source_surveys: [],
            total_respondent_count: 0,
            total_score: 0,
          });
          return;
        }

        const params = new URLSearchParams({
          action: "create-event",
          category: insight.recommendedEventCategory || "",
          name: insight.recommendedEventName || "",
        });
        navigate(`/activities?${params.toString()}`);
        return;
      }
      case "view_event": {
        const eventId = insight.eventId ?? insight.matchingEventId;
        if (!eventId) return;
        const event = callbacks.findEvent?.(eventId);
        if (event && callbacks.onOpenEvent) {
          callbacks.onOpenEvent(event);
          return;
        }
        navigate(`/activities?eventId=${eventId}`);
        return;
      }
      case "view_event_registrations": {
        if (!insight.eventId) return;
        const event = callbacks.findEvent?.(insight.eventId);
        if (event && callbacks.onOpenRegistrations) {
          callbacks.onOpenRegistrations(event);
          return;
        }
        navigate(`/activities?eventId=${insight.eventId}&panel=registrations`);
        return;
      }
      case "view_event_performance": {
        if (!insight.eventId) return;
        if (callbacks.onOpenPerformance) {
          callbacks.onOpenPerformance(insight.eventId);
          return;
        }
        navigate(`/activities?eventId=${insight.eventId}&panel=performance`);
        return;
      }
      case "view_event_feedback": {
        if (!insight.eventId) return;
        navigate(`/activities?eventId=${insight.eventId}&panel=performance`);
        return;
      }
      case "view_survey_results": {
        const params = new URLSearchParams();
        if (insight.categoryName) params.set("section", insight.categoryName);
        if (insight.surveyId) params.set("surveyId", String(insight.surveyId));
        navigate(`/survey-responses?${params.toString()}`);
        return;
      }
      case "view_budget":
        navigate(insight.budgetYearId ? `/financial?budgetYearId=${insight.budgetYearId}` : "/financial");
        return;
      case "view_transactions":
        navigate(insight.eventId ? `/financial?eventId=${insight.eventId}` : "/financial");
        return;
      case "view_notifications":
      case "none":
        return;
    }
  }

  return { runInsightAction };
}
