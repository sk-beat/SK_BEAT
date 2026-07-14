import { supabase } from "../../../utils/supabase";

export type YouthEventStatus =
  | "draft"
  | "scheduled"
  | "ongoing"
  | "completed"
  | "cancelled";

export type YouthEvent = {
  event_id: number;
  event_name: string;
  category: string;
  status: YouthEventStatus;
  event_date: string | null;
  event_time: string | null;
  location: string | null;
  expected_attendees: number | null;
  cover_image: string | null;
  description: string | null;
  created_at: string | null;
};

export async function getYouthEvents() {
  const { data, error } = await supabase
    .from("events")
    .select(
      "event_id,event_name,category,status,event_date,event_time,location,expected_attendees,cover_image,description,created_at",
    )
    .in("status", ["scheduled", "ongoing"])
    .order("event_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  return { data: (data ?? []) as YouthEvent[], error };
}

export async function getYouthEventRegistrations(userId: string) {
  const { data, error } = await supabase
    .from("event_registrations")
    .select("event_id")
    .eq("user_id", userId);

  return {
    data: new Set((data ?? []).map((registration) => registration.event_id)),
    error,
  };
}

export async function registerYouthEvent(eventId: number, userId: string) {
  const { data: existingRegistration, error: existingError } = await supabase
    .from("event_registrations")
    .select("registration_id")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (existingError) {
    return { error: existingError };
  }

  if (existingRegistration) {
    return { error: null };
  }

  const { error } = await supabase.from("event_registrations").insert({
    event_id: eventId,
    user_id: userId,
  });

  return { error };
}
