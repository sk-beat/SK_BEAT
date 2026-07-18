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

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

function getBearerToken(req: Request) {
  const authorization = req.headers.get("Authorization") ?? "";
  const [scheme, token] = authorization.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new Error("Missing authenticated admin session.");
  }
  return token;
}

function requireEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing ${name} environment variable.`);
  }
  return value;
}

function validateDateOfBirth(value: unknown) {
  if (!value) {
    throw new Error("Birthday is required.");
  }
  if (typeof value !== "string") {
    throw new Error("Date of birth must be a valid date.");
  }

  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Date of birth must be a valid date.");
  }

  const today = new Date();
  const todayOnly = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  if (date > todayOnly) {
    throw new Error("Date of birth cannot be in the future.");
  }

  return value;
}

function validateEducationalStatus(value: unknown) {
  if (!value) return "Active";
  if (value !== "Active" && value !== "Inactive") {
    throw new Error("Educational Status must be Active or Inactive.");
  }
  return value;
}

function normalizeEmail(value: unknown) {
  if (typeof value !== "string") {
    throw new Error("Email is required.");
  }

  const email = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address.");
  }
  return email;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getLoginUrl() {
  const appBaseUrl = requireEnv("APP_BASE_URL").trim();
  const parsed = new URL(appBaseUrl);
  if (parsed.protocol !== "https:" && !parsed.hostname.includes("localhost")) {
    throw new Error("APP_BASE_URL must be HTTPS in production.");
  }
  return new URL("/login", parsed).toString();
}

async function sendWelcomeEmail(args: {
  fullName: string;
  email: string;
}) {
  const apiKey = requireEnv("RESEND_API_KEY");
  const from = requireEnv("WELCOME_EMAIL_FROM");
  const loginUrl = getLoginUrl();
  const escapedName = escapeHtml(args.fullName);
  const escapedEmail = escapeHtml(args.email);
  const escapedLoginUrl = escapeHtml(loginUrl);

  const text = [
    `Hello ${args.fullName},`,
    "",
    "Welcome to the SK Kabataan Portal.",
    "",
    `Login email: ${args.email}`,
    `Temporary password: ${temporaryPassword}`,
    `Portal link: ${loginUrl}`,
    "",
    "You must change this temporary password after your first login.",
    "Do not share your login credentials with anyone.",
  ].join("\n");

  const html = `
    <p>Hello ${escapedName},</p>
    <p>Welcome to the SK Kabataan Portal.</p>
    <p><strong>Login email:</strong> ${escapedEmail}<br />
    <strong>Temporary password:</strong> ${temporaryPassword}<br />
    <strong>Portal link:</strong> <a href="${escapedLoginUrl}">${escapedLoginUrl}</a></p>
    <p>You must change this temporary password after your first login.</p>
    <p>Do not share your login credentials with anyone.</p>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [args.email],
      subject: "Welcome to the SK Kabataan Portal",
      text,
      html,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Email provider rejected the welcome email.");
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  let authUserId: string | null = null;

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
      throw new Error("Invalid authenticated admin session.");
    }

    const { data: admin, error: adminError } = await userClient
      .from("admins")
      .select("admin_id")
      .eq("admin_id", caller.id)
      .eq("status", "active")
      .maybeSingle();

    if (adminError) throw adminError;
    if (!admin) throw new Error("Active admin required.");

    const profileData = (await req.json()) as CreateYouthPayload;
    const email = normalizeEmail(profileData.email);
    const fullName = String(profileData.fullname ?? "").trim();
    if (!fullName) throw new Error("Full name is required.");

    const dateOfBirth = validateDateOfBirth(profileData.date_of_birth);
    const educationalStatus = validateEducationalStatus(profileData.educational_status);

    const { data: existingProfile, error: existingProfileError } = await supabaseAdmin
      .from("kabataan_profiles")
      .select("profile_id")
      .eq("email", email)
      .maybeSingle();
    if (existingProfileError) throw existingProfileError;
    if (existingProfile) throw new Error("A Youth profile with this email already exists.");

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: { must_change_password: true },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Unable to create Youth account.");
    authUserId = authData.user.id;

    const { error: profileError } = await supabaseAdmin
      .from("kabataan_profiles")
      .insert({
        profile_id: authUserId,
        fullname: fullName,
        gender: profileData.gender,
        address_line: profileData.address_line,
        purok: profileData.purok,
        contact_number: profileData.contact_number ?? "",
        email,
        educational_status: educationalStatus,
        scholar_status: profileData.scholar_status,
        profile_image: profileData.profile_image || null,
        date_of_birth: dateOfBirth,
        must_change_password: true,
        onboarding_status: "temporary_password_active",
        welcome_email_attempt_count: 1,
        welcome_email_last_attempt_at: new Date().toISOString(),
      });

    if (profileError) {
      const { error: cleanupError } = await supabaseAdmin.auth.admin.deleteUser(authUserId);
      return jsonResponse(
        {
          error: profileError.message,
          auth_cleanup_succeeded: !cleanupError,
          auth_cleanup_error: cleanupError?.message ?? null,
        },
        400,
      );
    }

    try {
      await sendWelcomeEmail({ fullName, email });
      await supabaseAdmin
        .from("kabataan_profiles")
        .update({
          welcome_email_sent_at: new Date().toISOString(),
          welcome_email_last_error: null,
        })
        .eq("profile_id", authUserId);

      return jsonResponse({
        account_created: true,
        email_sent: true,
        profile_id: authUserId,
      });
    } catch (emailError) {
      const message = emailError instanceof Error ? emailError.message : "Email delivery failed.";
      await supabaseAdmin
        .from("kabataan_profiles")
        .update({ welcome_email_last_error: message.slice(0, 500) })
        .eq("profile_id", authUserId);

      return jsonResponse({
        account_created: true,
        email_sent: false,
        email_error: "Welcome email could not be sent.",
        profile_id: authUserId,
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return jsonResponse({ error: message }, 400);
  }
});
