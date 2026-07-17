import { supabase } from "../../../utils/supabase";

export type PastFeedbackEvent = {
  event_id: number;
  event_name: string;
  category: string;
  event_date: string | null;
  event_time?: string | null;
  location: string | null;
  description?: string | null;
};

export async function getPastFeedbackEvents() {
  const { data, error } = await supabase
    .from("events")
    .select("event_id,event_name,category,event_date,location")
    .eq("status", "completed")
    .order("event_date", { ascending: false, nullsFirst: false });

  return { data: (data ?? []) as PastFeedbackEvent[], error };
}

export async function getSubmittedFeedbackEventIds(userId: string) {
  const { data, error } = await supabase
    .from("post_event_feedback")
    .select("event_id")
    .eq("user_id", userId);

  return {
    data: new Set((data ?? []).map((feedback) => feedback.event_id)),
    error,
  };
}

export async function getPublicFeedbackEvent(eventId: number) {
  const { data, error } = await supabase.rpc("get_public_feedback_event", {
    p_event_id: eventId,
  });

  const event = Array.isArray(data) ? data[0] : null;
  return { data: (event ?? null) as PastFeedbackEvent | null, error };
}

export async function submitPostEventFeedback({
  comments,
  eventId,
  guestName,
  rating,
}: {
  comments: string;
  eventId: number;
  guestName?: string | null;
  rating: number;
}) {
  return supabase.rpc("submit_event_feedback", {
    p_comments: comments,
    p_event_id: eventId,
    p_guest_name: guestName || null,
    p_rating: rating,
  });
}
