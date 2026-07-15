import { supabase } from "../../../utils/supabase";
import { getVisibleAnnouncements, type Announcement } from "../../Admin/SurveysAnnouncements/AnnouncementsService";
import { getYouthEventRegistrations, getYouthEvents, type YouthEvent } from "../Events/EventsService";
import { getYouthSurveys, type YouthSurvey } from "../Surveys/SurveysService";

export type YouthHomeData = {
  announcements: Announcement[];
  events: YouthEvent[];
  registeredEventIds: Set<number>;
  surveys: YouthSurvey[];
};

export async function getYouthHomeData(userId: string) {
  const [announcements, events, registrations, surveys] = await Promise.all([
    getVisibleAnnouncements(3),
    getYouthEvents(3),
    getYouthEventRegistrations(userId),
    getYouthSurveys(userId),
  ]);

  return {
    data: {
      announcements: announcements.data,
      events: events.data,
      registeredEventIds: registrations.data,
      surveys: surveys.data.slice(0, 3),
    } as YouthHomeData,
    error: announcements.error || events.error || registrations.error || surveys.error,
  };
}

export async function getYouthProfileName(userId: string) {
  const { data, error } = await supabase
    .from("kabataan_profiles")
    .select("fullname")
    .eq("profile_id", userId)
    .maybeSingle();

  return { data: data?.fullname ?? null, error };
}
