// supabase/functions/create-youth/index.ts

// supabase/functions/create-youth/index.ts

import { createClient } from "supabase";

declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
  serve(
    handler: (req: Request) => Response | Promise<Response>,
  ): void;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing system environment variables inside Supabase.");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { password, ...profileData } = await req.json();
    const dateOfBirth = validateDateOfBirth(profileData.date_of_birth);
    const educationalStatus = validateEducationalStatus(profileData.educational_status);

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: profileData.email,
      password: password,
      email_confirm: true,
    });

    if (authError) throw authError;

    const { error: profileError } = await supabaseAdmin
      .from("kabataan_profiles")
      .insert({
        profile_id: authData.user.id,
        fullname: profileData.fullname,
        gender: profileData.gender,
        address_line: profileData.address_line,
        purok: profileData.purok,
        contact_number: profileData.contact_number,
        email: profileData.email,
        educational_status: educationalStatus,
        scholar_status: profileData.scholar_status,
        profile_image: profileData.profile_image || null,
        date_of_birth: dateOfBirth,
      });

    if (profileError) throw profileError;

    return new Response(JSON.stringify({ success: true, profile_id: authData.user.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
