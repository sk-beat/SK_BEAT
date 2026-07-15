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
  event_registrations?: { registration_id: number }[];
};

export async function getYouthEvents(limit?: number) {
  let query = supabase
    .from("events")
    .select(
      "event_id,event_name,category,status,event_date,event_time,location,expected_attendees,cover_image,description,created_at,event_registrations(registration_id)",
    )
    .in("status", ["scheduled", "ongoing"])
    .order("event_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  return { data: (data ?? []) as YouthEvent[], error };
}

export async function getYouthEventRegistrations(_userId: string) {
  const { data, error } = await supabase
    .from("event_registrations")
    .select("event_id")
    .eq("attendance_status", "registered");

  return {
    data: new Set((data ?? []).map((registration) => registration.event_id)),
    error,
  };
}

export async function registerYouthEvent(eventId: number) {
  const { error } = await supabase.rpc("register_youth_for_event", {
    p_event_id: eventId,
  });

  return { error };
}

export async function cancelYouthEventRegistration(eventId: number) {
  const { error } = await supabase.rpc("cancel_youth_event_registration", {
    p_event_id: eventId,
  });

  return { error };
}
