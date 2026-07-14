import { supabase } from "../../../utils/supabase";

export type KabataanSuggestion = {
  suggestion_id: number;
  message: string;
  submitted_at: string | null;
  submitted_by: string;
};

type KabataanSuggestionRow = {
  suggestion_id: number;
  message: string;
  submitted_at: string | null;
  kabataan_profiles:
    | {
        fullname: string;
      }
    | {
        fullname: string;
      }[]
    | null;
};

export async function getKabataanSuggestions() {
  const { data, error } = await supabase
    .from("kabataan_suggestions")
    .select("suggestion_id,message,submitted_at,kabataan_profiles(fullname)")
    .order("submitted_at", { ascending: false });

  const suggestions = ((data ?? []) as KabataanSuggestionRow[]).map((item) => {
    const profile = Array.isArray(item.kabataan_profiles)
      ? item.kabataan_profiles[0]
      : item.kabataan_profiles;

    return {
      suggestion_id: item.suggestion_id,
      message: item.message,
      submitted_at: item.submitted_at,
      submitted_by: profile?.fullname ?? "Kabataan",
    };
  });

  return { data: suggestions, error };
}
