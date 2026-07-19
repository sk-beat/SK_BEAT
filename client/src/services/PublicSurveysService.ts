import { supabase } from "@/lib/supabase";
import type { SurveyAnswerPayload, YouthSurvey } from "../components/Youth/Surveys/SurveysService";

const GUEST_SESSION_KEY = "sk_beat_guest_session_id";

export type PublicSurveySummary = {
  survey_id: number;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  question_count: number;
  allow_guest_responses: boolean;
};

function createGuestSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getGuestSessionId() {
  const existing = localStorage.getItem(GUEST_SESSION_KEY);
  if (existing) return existing;
  const next = createGuestSessionId();
  localStorage.setItem(GUEST_SESSION_KEY, next);
  return next;
}

export async function getPublicEventInterestSurveys() {
  const { data, error } = await supabase.rpc("get_public_event_interest_surveys");
  return { data: (data ?? []) as PublicSurveySummary[], error };
}

export async function getPublicEventInterestSurvey(surveyId: number) {
  const { data, error } = await supabase.rpc("get_public_event_interest_survey", {
    p_survey_id: surveyId,
  });
  return { data: data as YouthSurvey | null, error };
}

export async function submitPublicEventInterestSurvey(
  surveyId: number,
  answers: SurveyAnswerPayload[],
) {
  const { data: sessionData } = await supabase.auth.getSession();
  const guestSessionId = sessionData.session ? null : getGuestSessionId();
  return supabase.rpc("submit_public_event_interest_survey", {
    p_answers: answers,
    p_guest_session_id: guestSessionId,
    p_survey_id: surveyId,
  });
}
