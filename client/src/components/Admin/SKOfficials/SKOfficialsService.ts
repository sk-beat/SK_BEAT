import { supabase } from "../../../utils/supabase";

export const SK_OFFICIAL_PHOTOS_BUCKET = "sk-official-photos";
const PHOTO_PREFIX = "sk-officials";
const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type SKOfficial = {
  official_id: string;
  full_name: string;
  position: string;
  committee: string | null;
  biography: string | null;
  photo_path: string | null;
  display_order: number;
  is_active: boolean;
  term_start: string | null;
  term_end: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type SKOfficialPayload = {
  official_id?: string;
  full_name: string;
  position: string;
  committee: string | null;
  biography: string | null;
  photo_path: string | null;
  display_order: number;
  is_active: boolean;
  term_start: string | null;
  term_end: string | null;
};

const officialSelect =
  "official_id,full_name,position,committee,biography,photo_path,display_order,is_active,term_start,term_end,created_by,created_at,updated_at";

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

export async function getPublicSKOfficials() {
  const { data, error } = await supabase
    .from("sk_officials")
    .select(officialSelect)
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true })
    .order("official_id", { ascending: true });

  return { data: (data ?? []) as SKOfficial[], error };
}

export async function getAdminSKOfficials() {
  const { data, error } = await supabase
    .from("sk_officials")
    .select(officialSelect)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true })
    .order("official_id", { ascending: true });

  return { data: (data ?? []) as SKOfficial[], error };
}

export async function createSKOfficial(payload: SKOfficialPayload) {
  const insertPayload: Omit<SKOfficialPayload, "official_id"> = {
    biography: payload.biography,
    committee: payload.committee,
    display_order: payload.display_order,
    full_name: payload.full_name,
    is_active: payload.is_active,
    photo_path: payload.photo_path,
    position: payload.position,
    term_end: payload.term_end,
    term_start: payload.term_start,
  };

  const { data, error } = await supabase
    .from("sk_officials")
    .insert(insertPayload)
    .select(officialSelect)
    .single();

  return { data: data as SKOfficial | null, error };
}

export async function updateSKOfficial(payload: SKOfficialPayload) {
  if (!payload.official_id) {
    throw new Error("Missing official ID.");
  }

  const { official_id, ...updatePayload } = payload;

  const { data, error } = await supabase
    .from("sk_officials")
    .update(updatePayload)
    .eq("official_id", official_id)
    .select(officialSelect)
    .single();

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
