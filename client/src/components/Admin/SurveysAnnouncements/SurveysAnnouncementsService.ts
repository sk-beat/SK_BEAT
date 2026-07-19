import { supabase } from "@/lib/supabase";

export type KabataanSuggestion = {
  suggestion_id: number;
  message: string;
  submitted_at: string | null;
  submitted_by: string;
};

type KabataanSuggestionRow = {
  suggestion_id: number;
  message: string;
  submitted_at: string | null;
  kabataan_profiles:
    | {
        fullname: string;
      }
    | {
        fullname: string;
      }[]
    | null;
};

export async function getKabataanSuggestions() {
  const { data, error } = await supabase
    .from("kabataan_suggestions")
    .select("suggestion_id,message,submitted_at,kabataan_profiles(fullname)")
    .order("submitted_at", { ascending: false });

  const suggestions = ((data ?? []) as KabataanSuggestionRow[]).map((item) => {
    const profile = Array.isArray(item.kabataan_profiles)
      ? item.kabataan_profiles[0]
      : item.kabataan_profiles;

    return {
      suggestion_id: item.suggestion_id,
      message: item.message,
      submitted_at: item.submitted_at,
      submitted_by: profile?.fullname ?? "Kabataan",
    };
  });

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
