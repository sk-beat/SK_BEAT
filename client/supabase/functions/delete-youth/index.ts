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

type DeleteYouthPayload = {
  profile_id?: string;
};

type YouthProfile = {
  email: string | null;
  fullname: string | null;
  profile_id: string;
  profile_image: string | null;
};

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, ...headers, "Content-Type": "application/json" },
    status,
  });
}

function requireEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) {
    throw new PublicFunctionError("Server configuration is incomplete.", 500, `missing_env_${name}`);
  }
  return value;
}

function getBearerToken(req: Request) {
  const authorization = req.headers.get("Authorization") ?? "";
  const [scheme, token] = authorization.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new PublicFunctionError("Missing authenticated admin session.", 401, "missing_auth_token");
  }
  return token;
}

function validateProfileId(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    throw new PublicFunctionError("Youth profile ID is required.", 400, "missing_profile_id");
  }

  const profileId = value.trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(profileId)) {
    throw new PublicFunctionError("Youth profile ID must be a valid UUID.", 400, "invalid_profile_id");
  }

  return profileId;
}

function safeLog(stage: string, error: unknown, details: Record<string, unknown> = {}) {
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

  console.error("delete-youth", { stage, code, message, ...details });
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
    if (!admin) {
      throw new PublicFunctionError("Active admin required.", 403, "active_admin_required");
    }

    let payload: DeleteYouthPayload;
    try {
      payload = (await req.json()) as DeleteYouthPayload;
    } catch (parseError) {
      safeLog("parse_json", parseError);
      throw new PublicFunctionError("Request body must be valid JSON.", 400, "invalid_json");
    }

    const profileId = validateProfileId(payload.profile_id);

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("kabataan_profiles")
      .select("profile_id,fullname,email,profile_image")
      .eq("profile_id", profileId)
      .maybeSingle<YouthProfile>();

    if (profileError) {
      safeLog("profile_lookup", profileError, { profile_id: profileId });
      throw new PublicFunctionError("Unable to load Youth profile.", 500, "profile_lookup_failed");
    }
    if (!profile) {
      throw new PublicFunctionError("Youth profile not found.", 404, "profile_not_found");
    }

    const { data: authUserResult, error: authLookupError } =
      await supabaseAdmin.auth.admin.getUserById(profile.profile_id);

    if (authLookupError || !authUserResult.user) {
      safeLog("auth_lookup", authLookupError ?? new Error("Auth user missing"), {
        profile_id: profile.profile_id,
      });
      throw new PublicFunctionError("Linked Auth user not found.", 404, "auth_user_not_found");
    }

    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(profile.profile_id);

    if (authDeleteError) {
      safeLog("auth_delete", authDeleteError, { profile_id: profile.profile_id });
      throw new PublicFunctionError("Unable to delete Youth login account.", 500, "auth_delete_failed");
    }

    const { error: profileDeleteError } = await supabaseAdmin
      .from("kabataan_profiles")
      .delete()
      .eq("profile_id", profile.profile_id);

    if (profileDeleteError) {
      safeLog("profile_delete", profileDeleteError, { profile_id: profile.profile_id });
      throw new PublicFunctionError(
        "Youth login was deleted, but profile cleanup failed. Please contact support.",
        500,
        "profile_delete_failed",
      );
    }

    if (profile.profile_image && !/^https?:\/\//i.test(profile.profile_image)) {
      const { error: imageDeleteError } = await supabaseAdmin.storage
        .from("profile-images")
        .remove([profile.profile_image]);

      if (imageDeleteError) {
        safeLog("profile_image_delete", imageDeleteError, { profile_id: profile.profile_id });
      }
    }

    return jsonResponse({
      success: true,
      message: "Youth account permanently deleted.",
      profile_id: profile.profile_id,
      email: profile.email,
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
        code: "DELETE_YOUTH_FAILED",
        message: "Unable to delete Youth account.",
        error: "Unable to delete Youth account.",
      },
      500,
    );
  }
});
