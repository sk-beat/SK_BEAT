import { supabase } from "../../../utils/supabase";
import type { CreateYouthRecord, UpdateYouthRecord } from "./youthRecordData";

export type CreateYouthResult = {
  account_created: boolean;
  email_error?: string | null;
  email_sent: boolean;
  profile_id: string;
};


export async function getYouthRecords() {
  return await supabase
    .from("kabataan_profiles")
    .select("*")
    .order("created_at", { ascending: false });
}


export async function addYouth(
  data: CreateYouthRecord
): Promise<{ data: CreateYouthResult | null; error: Error | null }> {
  // Bypasses browser restrictions securely via Supabase infrastructure
  const { data: responseData, error: functionError } = await supabase.functions.invoke("create-youth", {
    body: data,
  });

  if (functionError) {
    return { data: null, error: functionError };
  }

  const profileId = responseData?.profile_id;
  if (profileId) {
    return { data: responseData as CreateYouthResult, error: null };
  }

  const { data: profile, error: profileLookupError } = await supabase
    .from("kabataan_profiles")
    .select("profile_id")
    .eq("email", data.email)
    .maybeSingle();

  if (profileLookupError) {
    return { data: null, error: profileLookupError };
  }

  return {
    data: profile
      ? {
          account_created: true,
          email_sent: false,
          profile_id: profile.profile_id,
          email_error: "Unable to confirm welcome email delivery.",
        }
      : null,
    error: null,
  };
}

export async function resendYouthWelcomeEmail(profileId: string) {
  const { data, error } = await supabase.functions.invoke("send-youth-welcome-email", {
    body: { profile_id: profileId },
  });

  return { data, error };
}

    
export async function updateYouth(
  profile_id: string,
  data: UpdateYouthRecord
) {
  const { data: updatedData, error } = await supabase.rpc(
    "save_admin_youth_profile",
    {
      p_address_line: data.address_line,
      p_contact_number: data.contact_number,
      p_date_of_birth: data.date_of_birth,
      p_educational_status: data.educational_status,
      p_fullname: data.fullname,
      p_gender: data.gender,
      p_profile_id: profile_id,
      p_profile_image: data.profile_image || null,
      p_purok: data.purok,
      p_scholar_status: data.scholar_status,
    },
  );

  if (error) throw error;

  return { data: updatedData, error: null };
}

export async function lockYouth(profile_id: string) {
  const { data, error } = await supabase.rpc("lock_admin_youth_account", {
    p_profile_id: profile_id,
    p_reason: "manual_admin",
  });

  return { data, error };
}

export async function unlockYouth(profile_id: string) {
  const { data, error } = await supabase.rpc("unlock_admin_youth_account", {
    p_profile_id: profile_id,
  });

  return { data, error };
}





export async function deleteYouth(profile_id: string) {
  const { data, error } = await supabase.rpc("delete_admin_youth_profile", {
    p_profile_id: profile_id,
  });

  return { data, error };
}
