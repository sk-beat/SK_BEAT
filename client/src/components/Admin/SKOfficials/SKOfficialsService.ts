import { supabase } from "@/lib/supabase";

export const SK_OFFICIAL_PHOTOS_BUCKET = "sk-official-photos";
export const SK_OFFICIAL_POSITIONS = [
  "SK Chairperson",
  "SK Councilor",
  "SK Secretary",
  "SK Treasurer",
] as const;

const PHOTO_PREFIX = "sk-officials";
const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type SKOfficialPosition = (typeof SK_OFFICIAL_POSITIONS)[number];

export type SKOfficial = {
  official_id: string;
  full_name: string;
  position: SKOfficialPosition;
  biography: string | null;
  photo_path: string | null;
  term_start: string | null;
  term_end: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type SKOfficialPayload = {
  official_id?: string | null;
  full_name: string;
  position: SKOfficialPosition;
  biography: string | null;
  photo_path: string | null;
  term_start: string | null;
  term_end: string | null;
};

const adminOfficialSelect =
  "official_id,full_name,position,biography,photo_path,term_start,term_end";

const publicOfficialSelect =
  "official_id,full_name,position,biography,photo_path,term_start,term_end";

function sanitizeFilename(filename: string) {
  const fallback = "official-photo";
  const sanitized = filename
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return sanitized || fallback;
}

export function getPhotoPublicUrl(photoPath: string | null) {
  if (!photoPath) {
    return null;
  }

  return supabase.storage
    .from(SK_OFFICIAL_PHOTOS_BUCKET)
    .getPublicUrl(photoPath).data.publicUrl;
}

export function validateOfficialPhoto(file: File) {
  if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
    return "Use a JPG, PNG, or WebP image.";
  }

  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    return "Photo must be 5MB or smaller.";
  }

  return null;
}

export function buildOfficialPhotoPath(officialId: string, file: File) {
  const randomId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `${PHOTO_PREFIX}/${officialId}/${randomId}-${sanitizeFilename(file.name)}`;
}

export function isOfficialPhotoPath(path: string | null | undefined) {
  return Boolean(path?.startsWith(`${PHOTO_PREFIX}/`));
}

export function sortOfficialsByRole(officials: SKOfficial[]) {
  const rank = new Map<SKOfficialPosition, number>(
    SK_OFFICIAL_POSITIONS.map((position, index) => [position, index]),
  );

  return [...officials].sort((first, second) => {
    const roleDelta = (rank.get(first.position) ?? 99) - (rank.get(second.position) ?? 99);
    if (roleDelta !== 0) return roleDelta;
    return first.full_name.localeCompare(second.full_name) || first.official_id.localeCompare(second.official_id);
  });
}

export async function getPublicSKOfficials() {
  const { data, error } = await supabase
    .from("public_sk_officials")
    .select(publicOfficialSelect);

  return { data: sortOfficialsByRole((data ?? []) as SKOfficial[]), error };
}

export async function getAdminSKOfficials() {
  const { data, error } = await supabase
    .from("sk_officials")
    .select(adminOfficialSelect);

  return { data: sortOfficialsByRole((data ?? []) as SKOfficial[]), error };
}

export async function saveSKOfficial(payload: SKOfficialPayload) {
  const { data, error } = await supabase.rpc("save_admin_sk_official", {
    p_biography: payload.biography,
    p_full_name: payload.full_name,
    p_official_id: payload.official_id ?? null,
    p_photo_path: payload.photo_path,
    p_position: payload.position,
    p_term_end: payload.term_end,
    p_term_start: payload.term_start,
  });

  return { data: data as SKOfficial | null, error };
}

export async function deleteSKOfficial(officialId: string) {
  return await supabase
    .from("sk_officials")
    .delete()
    .eq("official_id", officialId);
}

export async function uploadOfficialPhoto(path: string, file: File) {
  return await supabase.storage
    .from(SK_OFFICIAL_PHOTOS_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
}

export async function deleteOfficialPhoto(path: string) {
  return await supabase.storage.from(SK_OFFICIAL_PHOTOS_BUCKET).remove([path]);
}
