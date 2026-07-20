import { supabase } from "@/lib/supabase";

export type SurveyStatus = "draft" | "published" | "closed";
export type SurveyQuestionType =
  | "short_text"
  | "long_text"
  | "single_choice"
  | "multiple_choice"
  | "event_interest_likert";

export type SurveyOption = {
  option_id?: number;
  option_text: string;
  sort_order: number;
  score_value?: number | null;
  is_other?: boolean;
  event_name?: string | null;
  event_category?: string | null;
  event_description?: string | null;
};

export type SurveyQuestion = {
  question_id?: number;
  question_text: string;
  question_type: SurveyQuestionType;
  is_required: boolean;
  sort_order: number;
  reporting_key?: string | null;
  event_name?: string | null;
  event_category?: string | null;
  event_description?: string | null;
  survey_options: SurveyOption[];
};

export type AdminSurvey = {
  survey_id: number;
  title: string;
  question_text: string;
  description: string | null;
  status: SurveyStatus;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  expires_at: string | null;
  target_audience: "kabataan";
  allow_guest_responses: boolean;
  created_at: string | null;
  survey_questions: SurveyQuestion[];
  survey_responses: { response_id: number }[];
};

export type SaveSurveyPayload = {
  survey_id: number | null;
  title: string;
  description: string | null;
  status: SurveyStatus;
  start_date: string | null;
  end_date: string | null;
  expires_at: string | null;
  target_audience: "kabataan";
  allow_guest_responses: boolean;
  questions: SurveyQuestion[];
};

export async function getAdminSurveys() {
  const { data, error } = await supabase
    .from("surveys")
    .select(
      "survey_id,title,question_text,description,status,is_active,start_date,end_date,expires_at,target_audience,allow_guest_responses,created_at,survey_questions(question_id,question_text,question_type,is_required,sort_order,reporting_key,event_name,event_category,event_description,survey_options(option_id,option_text,sort_order,score_value,is_other,event_name,event_category,event_description)),survey_responses(response_id)",
    )
    .order("created_at", { ascending: false });

  return { data: (data ?? []) as AdminSurvey[], error };
}

export async function saveAdminSurvey(payload: SaveSurveyPayload) {
  const { data, error } = await supabase.rpc("save_admin_survey", {
    p_description: payload.description,
    p_end_date: payload.end_date,
    p_expires_at: payload.expires_at,
    p_questions: payload.questions.map((question, index) => ({
      question_text: question.question_text,
      question_type: question.question_type,
      is_required: question.is_required,
      sort_order: index,
      options: question.survey_options.map((option, optionIndex) => ({
        option_text: option.option_text,
        score_value: option.score_value ?? null,
        sort_order: optionIndex,
        is_other: option.is_other ?? false,
        event_name: option.event_name ?? null,
        event_category: option.event_category ?? null,
        event_description: option.event_description ?? null,
      })),
      reporting_key: question.reporting_key ?? null,
      event_name: question.event_name ?? null,
      event_category: question.event_category ?? null,
      event_description: question.event_description ?? null,
    })),
    p_start_date: payload.start_date,
    p_status: payload.status,
    p_survey_id: payload.survey_id,
    p_target_audience: payload.target_audience,
    p_title: payload.title,
    p_allow_guest_responses: payload.allow_guest_responses,
  });

  return { data: data as AdminSurvey | null, error };
}

export async function deleteAdminSurvey(surveyId: number) {
  return supabase.rpc("delete_admin_survey", {
    p_survey_id: surveyId,
  });
}
