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

  constructor(message: string, status = 400) {
    super(message);
    this.name = "PublicFunctionError";
    this.status = status;
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
    throw new PublicFunctionError("Missing authenticated Youth session.", 401);
  }
  return token;
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
    if (typeof currentPassword !== "string" || !currentPassword) {
      throw new PublicFunctionError("Current password is required.");
    }
    if (typeof newPassword !== "string" || !newPassword) {
      throw new PublicFunctionError("New password is required.");
    }
    if (currentPassword.trim() !== currentPassword || newPassword.trim() !== newPassword) {
      throw new PublicFunctionError("Passwords cannot start or end with spaces.");
    }
    if (newPassword.length < 8) {
      throw new PublicFunctionError("New password must be at least 8 characters.");
    }
    if (newPassword === currentPassword) {
      throw new PublicFunctionError("New password must be different from your current password.");
    }
    if (!user.email) {
      throw new PublicFunctionError("Your account does not have an email address for verification.");
    }

    const { data: profile, error: profileError } = await userClient
      .from("kabataan_profiles")
      .select("profile_id,must_change_password,onboarding_status,status")
      .eq("profile_id", user.id)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile) throw new PublicFunctionError("Youth profile not found.", 404);
    if (profile.status !== "active") throw new PublicFunctionError("Youth account is not active.", 403);
    if (!profile.must_change_password || profile.onboarding_status !== "temporary_password_active") {
      throw new PublicFunctionError("Temporary password change is not required for this account.");
    }

    const verifier = createClient(supabaseUrl, supabaseAnonKey);
    const { error: verifyError } = await verifier.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (verifyError) {
      throw new PublicFunctionError("Current password is incorrect.");
    }

    const { error: updatePasswordError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: newPassword,
      user_metadata: { must_change_password: false },
    });
    if (updatePasswordError) {
      throw updatePasswordError;
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
          partial_failure: true,
          error: "Password changed, but onboarding status could not be completed. Please contact an admin.",
        },
        500,
      );
    }

    return jsonResponse({ success: true, message: "Password updated successfully." });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return jsonResponse(
      { success: false, message, error: message },
      error instanceof PublicFunctionError ? error.status : 500,
    );
  }
});
