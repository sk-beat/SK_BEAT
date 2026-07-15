import { supabase } from "../../../utils/supabase";
import type { SurveyQuestion, SurveyStatus } from "../../Admin/SurveyBuilder/SurveyBuilderService";

export type YouthSurvey = {
  survey_id: number;
  title: string;
  description: string | null;
  status: SurveyStatus;
  start_date: string | null;
  end_date: string | null;
  created_at: string | null;
  survey_questions: SurveyQuestion[];
  survey_responses: { response_id: number; user_id: string }[];
};

export type SurveyAnswerPayload = {
  question_id: number;
  answer_text?: string | null;
  option_ids?: number[];
};

export async function getYouthSurveys(userId: string) {
  const { data, error } = await supabase
    .from("surveys")
    .select("survey_id,title,description,status,start_date,end_date,created_at,survey_questions(question_id,question_text,question_type,is_required,sort_order,survey_options(option_id,option_text,sort_order)),survey_responses(response_id,user_id)")
    .order("created_at", { ascending: false });

  const surveys = ((data ?? []) as YouthSurvey[]).map((survey) => ({
    ...survey,
    survey_questions: survey.survey_questions
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((question) => ({
        ...question,
        survey_options: question.survey_options.slice().sort((a, b) => a.sort_order - b.sort_order),
      })),
    survey_responses: survey.survey_responses.filter((response) => response.user_id === userId),
  }));

  return { data: surveys, error };
}

export async function getYouthSurvey(surveyId: number, userId: string) {
  const { data, error } = await supabase
    .from("surveys")
    .select("survey_id,title,description,status,start_date,end_date,created_at,survey_questions(question_id,question_text,question_type,is_required,sort_order,survey_options(option_id,option_text,sort_order)),survey_responses(response_id,user_id)")
    .eq("survey_id", surveyId)
    .maybeSingle();

  if (!data) {
    return { data: null, error };
  }

  const survey = data as YouthSurvey;

  return {
    data: {
      ...survey,
      survey_questions: survey.survey_questions
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((question) => ({
          ...question,
          survey_options: question.survey_options.slice().sort((a, b) => a.sort_order - b.sort_order),
        })),
      survey_responses: survey.survey_responses.filter((response) => response.user_id === userId),
    },
    error,
  };
}

export async function submitYouthSurveyResponse(surveyId: number, answers: SurveyAnswerPayload[]) {
  return supabase.rpc("submit_youth_survey_response", {
    p_answers: answers,
    p_survey_id: surveyId,
  });
}
