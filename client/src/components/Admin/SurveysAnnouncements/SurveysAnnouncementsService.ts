import { supabase } from "@/lib/supabase";

export type AdminEventFeedbackRecord = {
  comment: string | null;
  event_id: number | null;
  event_name: string | null;
  feedback_id: number;
  is_guest: boolean;
  rating: number | null;
  respondent_status: "Guest" | "Registered User";
  submitted_at: string | null;
  submitted_by: string;
  was_registered: boolean;
};

type AdminEventFeedbackRecordRow = {
  comments: string | null;
  event_id: number | null;
  events: { event_name: string | null } | { event_name: string | null }[] | null;
  feedback_id: number;
  guest_name: string | null;
  kabataan_profiles:
    | { fullname: string | null; email: string | null }
    | { fullname: string | null; email: string | null }[]
    | null;
  rating: number | null;
  respondent_type: string | null;
  submitted_at: string | null;
  user_id: string | null;
  was_registered: boolean | null;
};

function firstRelated<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function getAdminEventFeedbackRecords() {
  const { data, error } = await supabase
    .from("post_event_feedback")
    .select(
      "feedback_id,event_id,user_id,rating,comments,submitted_at,respondent_type,guest_name,was_registered,events(event_name),kabataan_profiles(fullname,email)",
    )
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .order("feedback_id", { ascending: false });

  const records: AdminEventFeedbackRecord[] = ((data ?? []) as AdminEventFeedbackRecordRow[]).map((item) => {
    const event = firstRelated(item.events);
    const profile = firstRelated(item.kabataan_profiles);
    const isGuest = item.respondent_type === "guest" || !item.user_id;
    const guestName = item.guest_name?.trim();
    const profileName = profile?.fullname?.trim();
    const profileEmail = profile?.email?.trim();

    return {
      comment: item.comments,
      event_id: item.event_id,
      event_name: event?.event_name ?? null,
      feedback_id: item.feedback_id,
      is_guest: isGuest,
      rating: item.rating,
      respondent_status: isGuest ? "Guest" : "Registered User",
      submitted_at: item.submitted_at,
      submitted_by: isGuest
        ? guestName || "Guest"
        : profileName || profileEmail || "Registered User",
      was_registered: item.was_registered ?? false,
    };
  });

  return { data: records, error };
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
