import { supabase } from "@/lib/supabase";

export type PreferredActivityType = {
  rank: number;
  activity_type: string;
  authenticated_respondent_count: number;
  guest_respondent_count: number;
  total_respondent_count: number;
  average_rating: number;
  positive_count: number;
  positive_interest_percentage: number;
  total_score: number;
  source_surveys: string[];
};

export type TopSuggestedEvent = {
  rank: number;
  suggested_event_name: string;
  category: string;
  respondent_count: number;
  vote_count: number;
  respondent_percentage: number;
  total_respondent_count: number;
  authenticated_respondent_count: number;
  guest_respondent_count: number;
  average_rating: number;
  total_score: number;
  positive_count: number;
  positive_interest_percentage: number;
  respondent_support_percentage: number;
  submission_count: number;
  source_surveys: string[];
  is_already_planned: boolean;
  matching_event_id: number | null;
  source_type?: "official" | "custom" | "combined";
};

export type FeedbackEventInsight = {
  event_id: number;
  event_name: string;
  event_date: string | null;
  response_count: number;
  average_rating: number | null;
  one_star_count: number;
  two_star_count: number;
  three_star_count: number;
  four_star_count: number;
  five_star_count: number;
};

export type FeedbackInsightsSummary = {
  events: FeedbackEventInsight[];
  highestRatedEvents: FeedbackEventInsight[];
  lowestRatedEvents: FeedbackEventInsight[];
  overallAverageRating: number | null;
  totalResponses: number;
  ratingDistribution: Record<"1" | "2" | "3" | "4" | "5", number>;
  recentTrend: "up" | "down" | "flat" | "not_enough_data";
  insights: string[];
};

export type EventPreferenceRecommendation = {
  rank: number;
  event_name: string;
  event_category: string;
  response_count: number;
  authenticated_respondent_count: number;
  guest_respondent_count: number;
  total_respondent_count: number;
  average_rating: number;
  total_score: number;
  positive_count: number;
  positive_interest_percentage: number;
  source_surveys: string[];
  is_already_planned: boolean;
  matching_event_id: number | null;
};

export type SurveyResponseAnswer = {
  question_id: number;
  question_text: string;
  question_type: string;
  answer_text: string | null;
  selected_options: Array<{ option_id: number; option_text: string }>;
};

export type AdminSurveyResponseDetail = {
  response_id: number;
  survey_id: number;
  survey_title: string;
  profile_id: string;
  fullname: string;
  email: string;
  purok: string | null;
  gender: string | null;
  submitted_at: string | null;
  answers: SurveyResponseAnswer[];
};

export async function getPreferredActivityTypes() {
  const { data, error } = await supabase.rpc("get_admin_preferred_activity_types");
  return { data: (data ?? []) as PreferredActivityType[], error };
}

export async function getTopSuggestedEvents() {
  const { data, error } = await supabase.rpc("get_admin_top_suggested_events");
  return { data: (data ?? []) as TopSuggestedEvent[], error };
}

export async function getFeedbackInsightsSummary() {
  const { data, error } = await supabase.rpc("get_admin_feedback_insights_summary");
  return { data: (data ?? null) as FeedbackInsightsSummary | null, error };
}

export async function getEventPreferenceRecommendations() {
  const { data, error } = await supabase.rpc("get_admin_event_preference_recommendations");
  return { data: (data ?? []) as EventPreferenceRecommendation[], error };
}

export async function getAdminSurveyResponseDetails(options?: {
  search?: string;
  surveyId?: number | null;
}) {
  const { data, error } = await supabase.rpc("get_admin_survey_response_details", {
    p_search: options?.search || null,
    p_survey_id: options?.surveyId ?? null,
  });

  return { data: (data ?? []) as AdminSurveyResponseDetail[], error };
}
