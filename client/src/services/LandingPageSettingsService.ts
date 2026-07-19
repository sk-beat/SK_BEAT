import { supabase } from "@/lib/supabase";

export const LANDING_ASSETS_BUCKET = "landing-page-assets";

export type LandingPageSettings = {
  hero_background_path: string | null;
};

function sanitizeFilename(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/-+/g, "-");
}

export function getLandingAssetUrl(path: string | null) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path) || path.startsWith("/")) return path;
  return supabase.storage.from(LANDING_ASSETS_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function getPublicLandingPageSettings() {
  const { data, error } = await supabase.rpc("get_public_landing_page_settings");
  const first = Array.isArray(data) ? data[0] : data;
  return { data: (first ?? { hero_background_path: null }) as LandingPageSettings, error };
}

export async function saveAdminLandingPageSettings(heroBackgroundPath: string | null) {
  const { data, error } = await supabase.rpc("save_admin_landing_page_settings", {
    p_hero_background_path: heroBackgroundPath,
  });
  return { data: data as LandingPageSettings | null, error };
}

export async function uploadLandingHeroImage(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Use a JPEG, PNG, or WebP image.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Image must be 5 MB or smaller.");
  }

  const path = `hero/${crypto.randomUUID()}-${sanitizeFilename(file.name)}`;
  const { error } = await supabase.storage.from(LANDING_ASSETS_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function removeLandingHeroImage(path: string) {
  if (!path.startsWith("hero/")) return;
  await supabase.storage.from(LANDING_ASSETS_BUCKET).remove([path]);
}
