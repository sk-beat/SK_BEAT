import { supabase } from "@/lib/supabase";
import {
  getLandingAssetUrl,
  getPublicLandingPageSettings,
} from "../../../services/LandingPageSettingsService";
import { getVisibleAnnouncements, type Announcement } from "../../Admin/SurveysAnnouncements/AnnouncementsService";
import { getYouthEvents, type YouthEvent } from "../Events/EventsService";
import type { YouthHomePastEvent } from "./types";

export type YouthHomeData = {
  announcements: Announcement[];
  events: YouthEvent[];
  heroBackgroundUrl: string | null;
  pastEvents: YouthHomePastEvent[];
  registeredEventIds: Set<number>;
};

export async function getYouthHomeData() {
  const [announcements, events, pastEvents, landingSettings] = await Promise.all([
    getVisibleAnnouncements(4),
    getYouthEvents(3),
    getYouthHomePastEvents(4),
    getPublicLandingPageSettings(),
  ]);

  return {
    data: {
      announcements: announcements.data,
      events: events.data,
      heroBackgroundUrl: getLandingAssetUrl(landingSettings.data.hero_background_path),
      pastEvents: pastEvents.data,
      registeredEventIds: new Set(events.data.filter((event) => event.is_registered).map((event) => event.event_id)),
    } as YouthHomeData,
    error: announcements.error || events.error || pastEvents.error || landingSettings.error,
  };
}

export async function getYouthHomePastEvents(limit = 4) {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("events")
    .select("event_id,event_name,category,event_date,event_time,location,cover_image,description")
    .eq("status", "completed")
    .not("event_date", "is", null)
    .lt("event_date", today)
    .order("event_date", { ascending: false })
    .order("event_time", { ascending: false, nullsFirst: false })
    .order("event_id", { ascending: false })
    .limit(limit);

  return { data: (data ?? []) as YouthHomePastEvent[], error };
}

export async function getYouthProfileName(userId: string) {
  const { data, error } = await supabase
    .from("kabataan_profiles")
    .select("fullname")
    .eq("profile_id", userId)
    .maybeSingle();

  return { data: data?.fullname ?? null, error };
}
