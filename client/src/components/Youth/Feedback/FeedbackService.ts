import { supabase } from "../../../utils/supabase";

export type PastFeedbackEvent = {
  event_id: number;
  event_name: string;
  category: string;
  event_date: string | null;
  location: string | null;
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

export async function submitPostEventFeedback({
  comments,
  eventId,
  rating,
  userId,
}: {
  comments: string;
  eventId: number;
  rating: number;
  userId: string;
}) {
  return supabase.from("post_event_feedback").insert({
    comments,
    event_id: eventId,
    rating,
    user_id: userId,
  });
}
