import { supabase } from "../../../utils/supabase";

export type ChangeYouthPasswordPayload = {
  profileId: string;
  currentPassword: string;
  newPassword: string;
};

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

function getFriendlyAuthErrorMessage(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("invalid login credentials") ||
    normalizedMessage.includes("invalid credentials")
  ) {
    return "Current password is incorrect.";
  }

  if (
    normalizedMessage.includes("weak password") ||
    normalizedMessage.includes("password should be")
  ) {
    return "New password is too weak. Please choose a stronger password.";
  }

  if (
    normalizedMessage.includes("rate limit") ||
    normalizedMessage.includes("too many")
  ) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  if (
    normalizedMessage.includes("jwt") ||
    normalizedMessage.includes("session") ||
    normalizedMessage.includes("not authenticated")
  ) {
    return "Your session expired. Please sign in again.";
  }

  if (normalizedMessage.includes("network")) {
    return "Network error. Please check your connection and try again.";
  }

  return message || "Unable to change password. Please try again.";
}

export async function changeYouthPassword({
  profileId,
  currentPassword,
  newPassword,
}: ChangeYouthPasswordPayload) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return {
      error: getFriendlyAuthErrorMessage(userError.message),
      sessionValid: false,
    };
  }

  if (!user) {
    return {
      error: "Your session expired. Please sign in again.",
      sessionValid: false,
    };
  }

  if (user.id !== profileId) {
    return {
      error: "Unable to change password for this profile.",
      sessionValid: true,
    };
  }

  if (!user.email) {
    return {
      error: "Your account does not have an email address for verification.",
      sessionValid: true,
    };
  }

  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (reauthError) {
    return {
      error: "Current password is incorrect.",
      sessionValid: true,
    };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return {
      error: getFriendlyAuthErrorMessage(updateError.message),
      sessionValid: true,
    };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return {
    error: null,
    sessionValid: Boolean(session),
  };
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
