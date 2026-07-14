import { supabase } from "../../../utils/supabase";

export type YouthProfileRecord = {
  profile_id: string;
  fullname: string;
  email: string;
  age: number | null;
  gender: string | null;
  purok: string | null;
  address_line: string | null;
  scholar_status: string | null;
  educational_status: string | null;
  profile_image: string | null;
  created_at: string | null;
};

export type UpdateYouthProfilePayload = {
  fullname: string;
  age: number | null;
  gender: string | null;
  purok: string | null;
  address_line: string | null;
  scholar_status: string | null;
  educational_status: string | null;
  profile_image: string | null;
};

export async function getYouthProfile(profileId: string) {
  return supabase
    .from("kabataan_profiles")
    .select(
      "profile_id, fullname, email, age, gender, purok, address_line, scholar_status, educational_status, profile_image, created_at",
    )
    .eq("profile_id", profileId)
    .maybeSingle<YouthProfileRecord>();
}

export async function updateYouthProfile(
  profileId: string,
  payload: UpdateYouthProfilePayload,
) {
  return supabase
    .from("kabataan_profiles")
    .update(payload)
    .eq("profile_id", profileId);
}

export async function getYouthProfileStats(profileId: string) {
  const [eventRegistrations, surveyVotes] = await Promise.all([
    supabase
      .from("event_registrations")
      .select("registration_id", { count: "exact", head: true })
      .eq("user_id", profileId),
    supabase
      .from("survey_votes")
      .select("vote_id", { count: "exact", head: true })
      .eq("user_id", profileId),
  ]);

  return {
    eventsCount: eventRegistrations.count ?? 0,
    surveysCount: surveyVotes.count ?? 0,
    error: eventRegistrations.error ?? surveyVotes.error,
  };
}
