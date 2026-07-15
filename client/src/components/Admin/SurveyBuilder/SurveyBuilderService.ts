import { supabase } from "../../../utils/supabase";

export type SurveyStatus = "draft" | "published" | "closed";
export type SurveyQuestionType =
  | "short_text"
  | "long_text"
  | "single_choice"
  | "multiple_choice";

export type SurveyOption = {
  option_id?: number;
  option_text: string;
  sort_order: number;
};

export type SurveyQuestion = {
  question_id?: number;
  question_text: string;
  question_type: SurveyQuestionType;
  is_required: boolean;
  sort_order: number;
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
  target_audience: "kabataan";
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
  target_audience: "kabataan";
  questions: SurveyQuestion[];
};

export async function getAdminSurveys() {
  const { data, error } = await supabase
    .from("surveys")
    .select(
      "survey_id,title,question_text,description,status,is_active,start_date,end_date,target_audience,created_at,survey_questions(question_id,question_text,question_type,is_required,sort_order,survey_options(option_id,option_text,sort_order)),survey_responses(response_id)",
    )
    .order("created_at", { ascending: false });

  return { data: (data ?? []) as AdminSurvey[], error };
}

export async function saveAdminSurvey(payload: SaveSurveyPayload) {
  const { data, error } = await supabase.rpc("save_admin_survey", {
    p_description: payload.description,
    p_end_date: payload.end_date,
    p_questions: payload.questions.map((question, index) => ({
      question_text: question.question_text,
      question_type: question.question_type,
      is_required: question.is_required,
      sort_order: index,
      options: question.survey_options.map((option, optionIndex) => ({
        option_text: option.option_text,
        sort_order: optionIndex,
      })),
    })),
    p_start_date: payload.start_date,
    p_status: payload.status,
    p_survey_id: payload.survey_id,
    p_target_audience: payload.target_audience,
    p_title: payload.title,
  });

  return { data: data as AdminSurvey | null, error };
}

export async function deleteAdminSurvey(surveyId: number) {
  return supabase.rpc("delete_admin_survey", {
    p_survey_id: surveyId,
  });
}
