import { supabase } from "../../../utils/supabase";

export type PreferredActivityType = {
  rank: number;
  activity_type: string;
  respondent_count: number;
  total_respondents: number;
  respondent_percentage: number;
  selection_count: number;
  total_selections: number;
  selection_share_percentage: number;
  source_surveys: string[];
};

export type TopSuggestedEvent = {
  rank: number;
  suggested_event_name: string;
  category: string;
  respondent_count: number;
  submission_count: number;
  respondent_support_percentage: number;
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

