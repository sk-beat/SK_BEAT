import { supabase } from "../../../utils/supabase";
import { getSupabaseFunctionErrorMessage } from "../../../utils/supabaseFunctions";
import type { CreateYouthRecord, UpdateYouthRecord } from "./youthRecordData";

export type CreateYouthResult = {
  success: true;
  account_created: boolean;
  email: string;
  message: string;
  profile_id: string;
  temporary_password: string;
};

type CreateYouthFunctionResponse = {
  account_created?: boolean;
  code?: string;
  email?: string;
  error?: string;
  message?: string;
  profile_id?: string;
  success?: boolean;
  temporary_password?: string;
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
    const message = await getSupabaseFunctionErrorMessage(
      functionError,
      "Unable to create Youth account.",
    );
    return { data: null, error: new Error(message) };
  }

  const response = responseData as CreateYouthFunctionResponse | null;

  if (
    response?.success === true &&
    response.account_created === true &&
    response.profile_id &&
    response.temporary_password
  ) {
    return {
      data: {
        success: true,
        account_created: true,
        email: response.email ?? data.email,
        message: response.message ?? "Youth account created successfully.",
        profile_id: response.profile_id,
        temporary_password: response.temporary_password,
      },
      error: null,
    };
  }

  return {
    data: null,
    error: new Error(
      response?.message ?? response?.error ?? "Youth account was not created.",
    ),
  };
}

export async function recordYouthWelcomeEmailResult({
  errorMessage,
  profileId,
  sent,
}: {
  errorMessage?: string | null;
  profileId: string;
  sent: boolean;
}) {
  return supabase.rpc("record_admin_youth_welcome_email_result", {
    p_error: errorMessage ?? null,
    p_profile_id: profileId,
    p_sent: sent,
  });
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
