// supabase/functions/create-youth/index.ts

// supabase/functions/create-youth/index.ts

// @ts-ignore: Prevents React/Vite TypeScript from scanning this local alias module
import { createClient } from "supabase";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};


// @ts-ignore: Bypasses local editor warnings if Deno namespace isn't registering
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  try {
    // @ts-ignore
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    // @ts-ignore
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing system environment variables inside Supabase.");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { password, ...profileData } = await req.json();

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
        age: profileData.age,
        gender: profileData.gender,
        address_line: profileData.address_line,
        purok: profileData.purok,
        contact_number: profileData.contact_number,
        email: profileData.email,
        educational_status: profileData.educational_status,
        scholar_status: profileData.scholar_status,
        profile_image: profileData.profile_image || "",
      });

    if (profileError) throw profileError;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || error }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
