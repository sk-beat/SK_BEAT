import { createClient } from "supabase";

declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

class PublicFunctionError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = "BAD_REQUEST") {
    super(message);
    this.name = "PublicFunctionError";
    this.status = status;
    this.code = code;
  }
}

function requireEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing ${name} environment variable.`);
  return value;
}

function getBearerToken(req: Request) {
  const authorization = req.headers.get("Authorization") ?? "";
  const [scheme, token] = authorization.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new PublicFunctionError("Missing authenticated Youth session.", 401, "MISSING_AUTH_TOKEN");
  }
  return token;
}

function getPasswordUpdateError(error: { message?: string; status?: number }) {
  const message = error.message ?? "Unable to change password.";
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("weak password") ||
    normalizedMessage.includes("password should be") ||
    normalizedMessage.includes("password is too common") ||
    normalizedMessage.includes("compromised")
  ) {
    return new PublicFunctionError(
      "This password does not meet the security requirements.",
      error.status ?? 400,
      "PASSWORD_TOO_WEAK",
    );
  }

  return new PublicFunctionError(message, error.status ?? 500, "PASSWORD_UPDATE_FAILED");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse(
      { success: false, message: "Method not allowed.", error: "Method not allowed." },
      405,
    );
  }

  try {
    const token = getBearerToken(req);
    const supabaseUrl = requireEnv("SUPABASE_URL");
    const supabaseAnonKey = requireEnv("SUPABASE_ANON_KEY");
    const supabaseServiceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser(token);
    if (userError || !user) {
      throw new PublicFunctionError("Invalid authenticated Youth session.", 401);
    }

    const { current_password: currentPassword, new_password: newPassword } = await req.json();
    console.log("[Password Change] Validation stage", {
      hasCurrentPassword: Boolean(currentPassword),
      hasNewPassword: Boolean(newPassword),
      sameAsCurrent: currentPassword === newPassword,
      newPasswordLength: typeof newPassword === "string" ? newPassword.length : 0,
    });

    if (typeof currentPassword !== "string" || !currentPassword) {
      throw new PublicFunctionError("Current password is required.", 400, "CURRENT_PASSWORD_REQUIRED");
    }
    if (typeof newPassword !== "string" || !newPassword) {
      throw new PublicFunctionError("New password is required.", 400, "NEW_PASSWORD_REQUIRED");
    }
    if (currentPassword.trim() !== currentPassword || newPassword.trim() !== newPassword) {
      throw new PublicFunctionError("Passwords cannot start or end with spaces.", 400, "PASSWORD_HAS_EDGE_SPACES");
    }
    if (newPassword.length < 8) {
      throw new PublicFunctionError("New password must be at least 8 characters.", 400, "PASSWORD_TOO_SHORT");
    }
    if (newPassword === currentPassword) {
      throw new PublicFunctionError(
        "The new password must be different from your current password.",
        400,
        "PASSWORD_SAME_AS_CURRENT",
      );
    }
    if (!user.email) {
      throw new PublicFunctionError(
        "Your account does not have an email address for verification.",
        400,
        "MISSING_EMAIL",
      );
    }

    const { data: profile, error: profileError } = await userClient
      .from("kabataan_profiles")
      .select("profile_id,must_change_password,onboarding_status,status")
      .eq("profile_id", user.id)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile) throw new PublicFunctionError("Youth profile not found.", 404, "YOUTH_PROFILE_NOT_FOUND");
    if (profile.status !== "active") throw new PublicFunctionError("Youth account is not active.", 403, "YOUTH_INACTIVE");
    if (!profile.must_change_password || profile.onboarding_status !== "temporary_password_active") {
      throw new PublicFunctionError(
        "Temporary password change is not required for this account.",
        400,
        "TEMPORARY_PASSWORD_CHANGE_NOT_REQUIRED",
      );
    }

    const verifier = createClient(supabaseUrl, supabaseAnonKey);
    const { error: verifyError } = await verifier.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (verifyError) {
      throw new PublicFunctionError("Current password is incorrect.", 400, "CURRENT_PASSWORD_INCORRECT");
    }

    const { error: updatePasswordError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: newPassword,
      user_metadata: { must_change_password: false },
    });
    if (updatePasswordError) {
      throw getPasswordUpdateError(updatePasswordError);
    }

    const { error: flagError } = await supabaseAdmin
      .from("kabataan_profiles")
      .update({
        must_change_password: false,
        onboarding_status: "completed",
      })
      .eq("profile_id", user.id);
    if (flagError) {
      return jsonResponse(
        {
          success: false,
          code: "ONBOARDING_STATUS_UPDATE_FAILED",
          partial_failure: true,
          message: "Password changed, but onboarding status could not be completed. Please contact an admin.",
          error: "Password changed, but onboarding status could not be completed. Please contact an admin.",
        },
        500,
      );
    }

    return jsonResponse({ success: true, message: "Password changed successfully." });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const code = error instanceof PublicFunctionError ? error.code : "PASSWORD_CHANGE_FAILED";
    const status = error instanceof PublicFunctionError ? error.status : 500;

    console.error("[Password Change] Failed", {
      message,
      code,
      status,
    });

    return jsonResponse(
      { success: false, code, message, error: message },
      status,
    );
  }
});
