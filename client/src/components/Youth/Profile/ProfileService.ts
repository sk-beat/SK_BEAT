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
  contact_number: string | null;
  age: number | null;
  gender: string | null;
  purok: string | null;
  address_line: string | null;
  scholar_status: string | null;
  educational_status: string | null;
  profile_image: string | null;
  date_of_birth: string | null;
  created_at: string | null;
};

export type UpdateYouthProfilePayload = {
  fullname: string;
  gender: string | null;
  purok: string | null;
  contact_number: string | null;
  address_line: string | null;
  scholar_status: string | null;
  profile_image: string | null;
  date_of_birth: string | null;
};

export async function getYouthProfile(profileId: string) {
  return supabase
    .from("kabataan_profiles")
    .select(
      "profile_id, fullname, email, contact_number, age, gender, purok, address_line, scholar_status, educational_status, profile_image, date_of_birth, created_at",
    )
    .eq("profile_id", profileId)
    .maybeSingle<YouthProfileRecord>();
}

export async function updateYouthProfile(
  profileId: string,
  payload: UpdateYouthProfilePayload,
) {
  if (payload.date_of_birth) {
    const dateOfBirth = new Date(`${payload.date_of_birth}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (Number.isNaN(dateOfBirth.getTime()) || dateOfBirth > today) {
      return {
        data: null,
        error: new Error("Date of birth cannot be in the future."),
      };
    }
  }

  void profileId;
  return supabase.rpc("update_my_youth_profile", {
    p_address_line: payload.address_line,
    p_contact_number: payload.contact_number,
    p_date_of_birth: payload.date_of_birth,
    p_fullname: payload.fullname,
    p_gender: payload.gender,
    p_profile_image: payload.profile_image,
    p_purok: payload.purok,
    p_scholar_status: payload.scholar_status,
  });
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

export async function completeYouthFirstPasswordChange({
  currentPassword,
  newPassword,
}: Omit<ChangeYouthPasswordPayload, "profileId">) {
  const { error } = await supabase.functions.invoke("complete-youth-first-password-change", {
    body: {
      current_password: currentPassword,
      new_password: newPassword,
    },
  });

  if (error) {
    return {
      error: getFriendlyAuthErrorMessage(error.message),
      sessionValid: true,
    };
  }

  const { error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError) {
    return {
      error: getFriendlyAuthErrorMessage(refreshError.message),
      sessionValid: false,
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
