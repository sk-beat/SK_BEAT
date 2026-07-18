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

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
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
    throw new Error("Missing authenticated admin session.");
  }
  return token;
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

async function sendWelcomeEmail(args: { fullName: string; email: string }) {
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

  try {
    const token = getBearerToken(req);
    const supabaseUrl = requireEnv("SUPABASE_URL");
    const supabaseAnonKey = requireEnv("SUPABASE_ANON_KEY");
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { profile_id: profileId } = await req.json();
    if (!profileId || typeof profileId !== "string") {
      throw new Error("Youth profile is required.");
    }

    const { data: reservedProfile, error: reserveError } = await userClient
      .rpc("reserve_admin_youth_welcome_email_send", { p_profile_id: profileId })
      .single();
    if (reserveError) throw reserveError;
    if (!reservedProfile) throw new Error("Youth profile not found.");

    try {
      await sendWelcomeEmail({
        fullName: reservedProfile.fullname,
        email: reservedProfile.email,
      });
      await userClient.rpc("record_admin_youth_welcome_email_result", {
        p_profile_id: profileId,
        p_sent: true,
        p_error: null,
      });

      return jsonResponse({ email_sent: true });
    } catch (emailError) {
      const message = emailError instanceof Error ? emailError.message : "Email delivery failed.";
      await userClient.rpc("record_admin_youth_welcome_email_result", {
        p_profile_id: profileId,
        p_sent: false,
        p_error: message,
      });
      return jsonResponse({ email_sent: false, error: "Welcome email could not be sent." }, 400);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return jsonResponse({ error: message }, 400);
  }
});
