// supabase/functions/create-youth/index.ts

import { createClient } from "supabase";

declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

const temporaryPassword = "12345678";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

class PublicFunctionError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = "bad_request") {
    super(message);
    this.name = "PublicFunctionError";
    this.status = status;
    this.code = code;
  }
}

type CreateYouthPayload = {
  fullname?: string;
  email?: string;
  contact_number?: string | null;
  gender?: string | null;
  purok?: string | null;
  address_line?: string | null;
  scholar_status?: string | null;
  educational_status?: string | null;
  profile_image?: string | null;
  date_of_birth?: string | null;
};

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, ...headers, "Content-Type": "application/json" },
    status,
  });
}

function getBearerToken(req: Request) {
  const authorization = req.headers.get("Authorization") ?? "";
  const [scheme, token] = authorization.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new PublicFunctionError("Missing authenticated admin session.", 401, "missing_auth_token");
  }
  return token;
}

function requireEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) {
    throw new PublicFunctionError("Server configuration is incomplete.", 500, `missing_env_${name}`);
  }
  return value;
}

function validateDateOfBirth(value: unknown) {
  if (!value) {
    throw new PublicFunctionError("Birthday is required.", 400, "missing_birthday");
  }
  if (typeof value !== "string") {
    throw new PublicFunctionError("Date of birth must be a valid date.", 400, "invalid_birthday");
  }

  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    throw new PublicFunctionError("Date of birth must be a valid date.", 400, "invalid_birthday");
  }

  const today = new Date();
  const todayOnly = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  if (date > todayOnly) {
    throw new PublicFunctionError("Date of birth cannot be in the future.", 400, "future_birthday");
  }

  return value;
}

function validateEducationalStatus(value: unknown) {
  if (!value) return "Active";
  if (value !== "Active" && value !== "Inactive") {
    throw new PublicFunctionError("Educational Status must be Active or Inactive.", 400, "invalid_educational_status");
  }
  return value;
}

function normalizeEmail(value: unknown) {
  if (typeof value !== "string") {
    throw new PublicFunctionError("Youth email is required.", 400, "missing_email");
  }

  const email = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new PublicFunctionError("Enter a valid email address.", 400, "invalid_email");
  }
  return email;
}

function optionalText(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function safeLog(stage: string, error: unknown) {
  const code =
    error instanceof PublicFunctionError
      ? error.code
      : typeof error === "object" && error && "code" in error
        ? String((error as { code?: unknown }).code)
        : "unexpected";
  const message =
    error instanceof PublicFunctionError
      ? error.message
      : error instanceof Error
        ? error.message
        : "Unexpected error";

  console.error("create-youth", { stage, code, message });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      {
        success: false,
        code: "METHOD_NOT_ALLOWED",
        message: "Method not allowed.",
        error: "Method not allowed.",
      },
      405,
      { Allow: "POST, OPTIONS" },
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
      data: { user: caller },
      error: callerError,
    } = await userClient.auth.getUser(token);

    if (callerError || !caller) {
      throw new PublicFunctionError("Invalid authenticated admin session.", 401, "invalid_auth_token");
    }

    const { data: admin, error: adminError } = await userClient
      .from("admins")
      .select("admin_id")
      .eq("admin_id", caller.id)
      .eq("status", "active")
      .maybeSingle();

    if (adminError) {
      safeLog("admin_lookup", adminError);
      throw new PublicFunctionError("Unable to verify admin access.", 500, "admin_lookup_failed");
    }
    if (!admin) throw new PublicFunctionError("Active admin required.", 403, "active_admin_required");

    let profileData: CreateYouthPayload;
    try {
      profileData = (await req.json()) as CreateYouthPayload;
    } catch (parseError) {
      safeLog("parse_json", parseError);
      throw new PublicFunctionError("Request body must be valid JSON.", 400, "invalid_json");
    }

    const email = normalizeEmail(profileData.email);
    const fullName = String(profileData.fullname ?? "").trim();
    if (!fullName) throw new PublicFunctionError("Full name is required.", 400, "missing_fullname");

    const dateOfBirth = validateDateOfBirth(profileData.date_of_birth);
    const educationalStatus = validateEducationalStatus(profileData.educational_status);
    const gender = optionalText(profileData.gender);
    const addressLine = optionalText(profileData.address_line);
    const purok = optionalText(profileData.purok);
    const scholarStatus = optionalText(profileData.scholar_status);
    const profileImage = optionalText(profileData.profile_image);
    const contactNumber = optionalText(profileData.contact_number) ?? "";

    const { data: existingProfile, error: existingProfileError } = await supabaseAdmin
      .from("kabataan_profiles")
      .select("profile_id")
      .eq("email", email)
      .maybeSingle();
    if (existingProfileError) {
      safeLog("profile_duplicate_check", existingProfileError);
      throw new PublicFunctionError("Unable to check existing Youth profiles.", 500, "profile_duplicate_check_failed");
    }
    if (existingProfile) {
      throw new PublicFunctionError(
        "A Youth account with this email already exists.",
        409,
        "YOUTH_ALREADY_EXISTS",
      );
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: { must_change_password: true },
    });

    if (authError) {
      const duplicateAuth =
        authError.message.toLowerCase().includes("already") ||
        authError.message.toLowerCase().includes("registered") ||
        authError.message.toLowerCase().includes("exists");
      safeLog("auth_create_user", {
        code: duplicateAuth ? "duplicate_auth_email" : "auth_create_failed",
        message: authError.message,
      });
      throw new PublicFunctionError(
        duplicateAuth ? "A Youth account with this email already exists." : "Unable to create Youth account.",
        duplicateAuth ? 409 : 500,
        duplicateAuth ? "YOUTH_ALREADY_EXISTS" : "auth_create_failed",
      );
    }
    if (!authData.user) {
      throw new PublicFunctionError("Unable to create Youth account.", 500, "auth_create_missing_user");
    }
    const authUserId = authData.user.id;

    const { error: profileError } = await supabaseAdmin
      .from("kabataan_profiles")
      .insert({
        profile_id: authUserId,
        fullname: fullName,
        gender,
        address_line: addressLine,
        purok,
        contact_number: contactNumber,
        email,
        educational_status: educationalStatus,
        scholar_status: scholarStatus,
        profile_image: profileImage,
        date_of_birth: dateOfBirth,
        must_change_password: true,
        onboarding_status: "temporary_password_active",
      });

    if (profileError) {
      const { error: cleanupError } = await supabaseAdmin.auth.admin.deleteUser(authUserId);
      safeLog("profile_insert", {
        code: profileError.code ?? "profile_insert_failed",
        message: profileError.message,
      });
      return jsonResponse(
        {
          success: false,
          code: "profile_insert_failed",
          message: "Youth Auth account was created, but profile creation failed.",
          error: "Youth Auth account was created, but profile creation failed.",
          auth_cleanup_succeeded: !cleanupError,
          auth_cleanup_error: cleanupError ? "Auth cleanup failed." : null,
        },
        500,
      );
    }

    return jsonResponse({
      success: true,
      account_created: true,
      message: "Youth account created successfully.",
      email,
      profile_id: authUserId,
    });
  } catch (error: unknown) {
    if (error instanceof PublicFunctionError) {
      safeLog("request", error);
      return jsonResponse(
        {
          success: false,
          code: error.code,
          message: error.message,
          error: error.message,
        },
        error.status,
      );
    }

    safeLog("unexpected", error);
    return jsonResponse(
      {
        success: false,
        code: "CREATE_YOUTH_FAILED",
        message: "Unable to create Youth account.",
        error: "Unable to create Youth account.",
      },
      500,
    );
  }
});
