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

function isEventInterestSurvey(survey: YouthSurvey) {
  return survey.survey_questions.some(
    (question) =>
      question.question_type === "event_interest_likert" &&
      question.reporting_key === "suggested_event_rating" &&
      Boolean(question.event_name?.trim()) &&
      Boolean(question.event_category?.trim()),
  );
}

function isEligibleSurvey(survey: YouthSurvey) {
  const now = new Date();
  const startsAt = survey.start_date ? new Date(survey.start_date) : null;
  const endsAt = survey.end_date ? new Date(survey.end_date) : null;

  return (
    survey.status === "published" &&
    (!startsAt || startsAt <= now) &&
    (!endsAt || endsAt >= now) &&
    isEventInterestSurvey(survey)
  );
}

export async function getYouthSurveys(userId: string) {
  const { data, error } = await supabase
    .from("surveys")
    .select("survey_id,title,description,status,start_date,end_date,created_at,survey_questions(question_id,question_text,question_type,is_required,sort_order,reporting_key,event_name,event_category,event_description,survey_options(option_id,option_text,sort_order,score_value)),survey_responses(response_id,user_id)")
    .order("created_at", { ascending: false });

  const surveys = ((data ?? []) as YouthSurvey[])
    .map((survey) => ({
      ...survey,
      survey_questions: survey.survey_questions
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((question) => ({
          ...question,
          survey_options: question.survey_options.slice().sort((a, b) => a.sort_order - b.sort_order),
        })),
      survey_responses: survey.survey_responses.filter((response) => response.user_id === userId),
    }))
    .filter(isEligibleSurvey);

  return { data: surveys, error };
}

export async function getYouthSurvey(surveyId: number, userId: string) {
  const { data, error } = await supabase
    .from("surveys")
    .select("survey_id,title,description,status,start_date,end_date,created_at,survey_questions(question_id,question_text,question_type,is_required,sort_order,reporting_key,event_name,event_category,event_description,survey_options(option_id,option_text,sort_order,score_value)),survey_responses(response_id,user_id)")
    .eq("survey_id", surveyId)
    .maybeSingle();

  if (!data) {
    return { data: null, error };
  }

  const survey = data as YouthSurvey;
  const normalizedSurvey = {
    ...survey,
    survey_questions: survey.survey_questions
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((question) => ({
        ...question,
        survey_options: question.survey_options.slice().sort((a, b) => a.sort_order - b.sort_order),
      })),
    survey_responses: survey.survey_responses.filter((response) => response.user_id === userId),
  };

  if (!isEligibleSurvey(normalizedSurvey)) {
    return { data: null, error };
  }

  return {
    data: normalizedSurvey,
    error,
  };
}

export async function submitYouthSurveyResponse(surveyId: number, answers: SurveyAnswerPayload[]) {
  return supabase.rpc("submit_youth_survey_response", {
    p_answers: answers,
    p_survey_id: surveyId,
  });
}
