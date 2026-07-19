import { supabase } from "@/lib/supabase";

export type PublicScheduledEvent = {
  event_id: number;
  event_name: string;
  category: string;
  event_date: string;
  event_time: string | null;
  location: string | null;
  description: string | null;
  expected_attendees: number | null;
  cover_image: string | null;
};

export async function getPublicScheduledEvents() {
  const { data, error } = await supabase.rpc("get_public_scheduled_events");
  return { data: (data ?? []) as PublicScheduledEvent[], error };
}

export async function getAllPublicScheduledEvents() {
  const { data, error } = await supabase.rpc("get_all_public_scheduled_events");
  return { data: (data ?? []) as PublicScheduledEvent[], error };
}
