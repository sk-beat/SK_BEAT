import { supabase } from "../../../utils/supabase";
import type { YouthRecord } from "./youthRecordData";


export async function getYouthRecords() {
  return await supabase
    .from("kabataan_profiles")
    .select("*")
    .order("created_at", { ascending: false });
}


export async function addYouth(
  data: Omit<YouthRecord, "profile_id" | "created_at"> & {
    password: string;
  }
) {
  console.log("Sending data to Edge Function for secure processing...");

  // Bypasses browser restrictions securely via Supabase infrastructure
  const { data: responseData, error: functionError } = await supabase.functions.invoke("create-youth", {
    body: data,
  });

  if (functionError) {
    throw functionError;
  }

  return { data: responseData, error: null };
}

    
export async function updateYouth(
  profile_id: string,
  data: Omit<YouthRecord, "profile_id" | "created_at">
) {
  return await supabase
    .from("kabataan_profiles")
    .update(data)
    .eq("profile_id", profile_id)
}


export async function deleteYouth(profile_id: string) {
  return await supabase
    .from("kabataan_profiles")
    .delete()
    .eq("profile_id", profile_id);
}