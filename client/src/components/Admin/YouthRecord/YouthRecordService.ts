import { supabase } from "../../../utils/supabase";
import type { YouthRecord, UpdateYouthRecord } from "./youthRecordData";


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

  const profileId = responseData?.profile_id;
  if (profileId) {
    return { data: { profile_id: profileId }, error: null };
  }

  const { data: profile, error: profileLookupError } = await supabase
    .from("kabataan_profiles")
    .select("profile_id")
    .eq("email", data.email)
    .maybeSingle();

  if (profileLookupError) {
    throw profileLookupError;
  }

  return { data: profile, error: null };
}

    
export async function updateYouth(
  profile_id: string,
  data: UpdateYouthRecord
) {

  const { data: existing, error: selectError } = await supabase
  .from("kabataan_profiles")
  .select("profile_id, fullname")
  .eq("profile_id", profile_id);

console.log("Existing:", existing);
console.log("Select error:", selectError);

  const { data: updatedData, error } = await supabase
  .from("kabataan_profiles")
  .update({
    fullname: data.fullname,
    age: data.age,
    gender: data.gender,
    address_line: data.address_line,
    purok: data.purok,
    contact_number: data.contact_number,
    educational_status: data.educational_status,
    scholar_status: data.scholar_status,
    profile_image: data.profile_image,
  })
  .eq("profile_id", profile_id)
  .select("*");

console.log("Update payload:", {
  profile_id,
  data,
});

console.log("Updated:", updatedData);
console.log("Error:", error);

  if (error) throw error;

  return { data: updatedData, error: null };
}





export async function deleteYouth(profile_id: string) {
  return await supabase
    .from("kabataan_profiles")
    .delete()
    .eq("profile_id", profile_id);
}
