import { supabase } from "@/lib/supabase";

export type KabataanSuggestion = {
  comment: string | null;
  created_at: string | null;
  feedback_id: string;
  is_guest: boolean;
  related_title: string | null;
  source_type: string;
  submitted_by: string;
};

type KabataanSuggestionRow = {
  comment: string | null;
  created_at: string | null;
  feedback_id: string;
  is_guest: boolean;
  related_title: string | null;
  source_type: string;
  submitted_by_name: string;
};

export async function getKabataanSuggestions() {
  const { data, error } = await supabase.rpc("get_admin_kabataan_feedback_records");
  const suggestions = ((data ?? []) as KabataanSuggestionRow[]).map((item) => ({
    comment: item.comment,
    created_at: item.created_at,
    feedback_id: item.feedback_id,
    is_guest: item.is_guest,
    related_title: item.related_title,
    source_type: item.source_type,
    submitted_by: item.is_guest ? "Guest" : item.submitted_by_name || "Youth",
  }));

  return { data: suggestions, error };
}

export type SurveyResponseReport = {
  response_id: number;
  submitted_at: string | null;
  surveys: { title: string } | null;
  kabataan_profiles: { fullname: string } | null;
  survey_answers: Array<{
    answer_text: string | null;
    survey_questions: {
      question_text: string;
      question_type: string;
    } | null;
    survey_answer_options: Array<{
      survey_options: {
        option_text: string;
      } | null;
    }>;
  }>;
};

type SurveyResponseReportRow = {
  response_id: number;
  submitted_at: string | null;
  surveys: { title: string } | { title: string }[] | null;
  kabataan_profiles: { fullname: string } | { fullname: string }[] | null;
  survey_answers: Array<{
    answer_text: string | null;
    survey_questions:
      | {
          question_text: string;
          question_type: string;
        }
      | {
          question_text: string;
          question_type: string;
        }[]
      | null;
    survey_answer_options: Array<{
      survey_options:
        | {
            option_text: string;
          }
        | {
            option_text: string;
          }[]
        | null;
    }>;
  }>;
};

function firstRelated<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function getSurveyResponseReports() {
  const { data, error } = await supabase
    .from("survey_responses")
    .select(
      "response_id,submitted_at,surveys(title),kabataan_profiles(fullname),survey_answers(answer_text,survey_questions(question_text,question_type),survey_answer_options(survey_options(option_text)))",
    )
    .order("submitted_at", { ascending: false });

  const reports = ((data ?? []) as SurveyResponseReportRow[]).map((response) => ({
    response_id: response.response_id,
    submitted_at: response.submitted_at,
    surveys: firstRelated(response.surveys),
    kabataan_profiles: firstRelated(response.kabataan_profiles),
    survey_answers: response.survey_answers.map((answer) => ({
      answer_text: answer.answer_text,
      survey_questions: firstRelated(answer.survey_questions),
      survey_answer_options: answer.survey_answer_options.map((answerOption) => ({
        survey_options: firstRelated(answerOption.survey_options),
      })),
    })),
  }));

  return { data: reports, error };
}
