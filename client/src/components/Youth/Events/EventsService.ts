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
  registration_count: number;
  occupied_slots: number;
  remaining_slots: number | null;
  is_registered: boolean;
  attendance_status: "registered" | "attended" | "absent" | null;
};

export async function getYouthEvents(limit?: number) {
  const { data, error } = await supabase.rpc("get_youth_scheduled_events");
  const rows = ((data ?? []) as YouthEvent[]).map((event) => ({
    ...event,
    created_at: null,
  }));

  return { data: typeof limit === "number" ? rows.slice(0, limit) : rows, error };
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
