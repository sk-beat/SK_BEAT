import {
  isInvalidRefreshSessionError,
  logSafeAuthError,
  supabase,
} from "@/lib/supabase";
import { getSupabaseFunctionErrorMessage } from "../../../utils/supabaseFunctions";
import { getPasswordChangeErrorMessage } from "../../../utils/passwordValidation";

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

function logPasswordChangeFailure({
  code,
  message,
  status,
}: {
  code?: string;
  message: string;
  status?: number;
}) {
  console.error("[Password Change] Failed", {
    message,
    code,
    status,
  });
}

async function getSupabaseFunctionErrorDetails(error: unknown, fallback: string) {
  let code: string | undefined;
  let status: number | undefined;

  if (error && typeof error === "object" && "context" in error) {
    const response = (error as { context?: unknown }).context;

    if (response instanceof Response) {
      status = response.status;

      try {
        const body = await response.clone().json();

        if (body && typeof body === "object") {
          if ("code" in body && typeof body.code === "string") {
            code = body.code;
          }

          if ("message" in body && typeof body.message === "string") {
            return { code, message: body.message, status };
          }

          if ("error" in body && typeof body.error === "string") {
            return { code, message: body.error, status };
          }
        }
      } catch {
        // Fall back to the shared parser below.
      }
    }
  }

  const message = await getSupabaseFunctionErrorMessage(error, fallback);
  const authError = error as { code?: unknown; status?: unknown } | null;

  return {
    code: code ?? (typeof authError?.code === "string" ? authError.code : undefined),
    message,
    status: status ?? (typeof authError?.status === "number" ? authError.status : undefined),
  };
}

function getFriendlyAuthErrorMessage(message: string, code?: string) {
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("invalid login credentials") ||
    normalizedMessage.includes("invalid credentials")
  ) {
    return "Current password is incorrect.";
  }

  if (
    normalizedMessage.includes("weak password") ||
    normalizedMessage.includes("password should be") ||
    normalizedMessage.includes("password is too common") ||
    normalizedMessage.includes("compromised")
  ) {
    return getPasswordChangeErrorMessage(message, code);
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

  return getPasswordChangeErrorMessage(message, code);
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
    logPasswordChangeFailure({
      code: userError.code,
      message: userError.message,
      status: userError.status,
    });

    return {
      error: getFriendlyAuthErrorMessage(userError.message, userError.code),
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
    logPasswordChangeFailure({
      code: reauthError.code,
      message: reauthError.message,
      status: reauthError.status,
    });

    return {
      error: "Current password is incorrect.",
      sessionValid: true,
    };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    logPasswordChangeFailure({
      code: updateError.code,
      message: updateError.message,
      status: updateError.status,
    });

    return {
      error: getFriendlyAuthErrorMessage(updateError.message, updateError.code),
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
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    if (isInvalidRefreshSessionError(userError)) {
      logSafeAuthError("first_password_change_get_user", userError);
    }

    return {
      error: getFriendlyAuthErrorMessage(userError.message, userError.code),
      sessionValid: false,
    };
  }

  if (!user?.email) {
    return {
      error: "Your session expired. Please sign in again.",
      sessionValid: false,
    };
  }

  const { error } = await supabase.functions.invoke("complete-youth-first-password-change", {
    body: {
      current_password: currentPassword,
      new_password: newPassword,
    },
  });

  if (error) {
    const errorDetails = await getSupabaseFunctionErrorDetails(
      error,
      "Unable to change password. Please try again.",
    );
    logPasswordChangeFailure(errorDetails);

    return {
      error: getFriendlyAuthErrorMessage(errorDetails.message, errorDetails.code),
      sessionValid: true,
    };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: newPassword,
  });

  if (signInError) {
    logSafeAuthError("first_password_change_reauth", signInError);
    logPasswordChangeFailure({
      code: signInError.code,
      message: signInError.message,
      status: signInError.status,
    });

    return {
      error: getFriendlyAuthErrorMessage(signInError.message, signInError.code),
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
