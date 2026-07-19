import { supabase } from "@/lib/supabase";

export const PROFILE_IMAGES_BUCKET = "profile-images";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function sanitizeFilename(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function validateProfileImageFile(file: File) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Use a JPG, PNG, or WebP image.";
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return "Image must be 5 MB or smaller.";
  }

  return null;
}

export function buildYouthProfileImagePath(profileId: string, file: File) {
  const filename = sanitizeFilename(file.name) || "profile-image";
  return `youth/${profileId}/${crypto.randomUUID()}-${filename}`;
}

export function buildAdminProfileImagePath(adminId: string, file: File) {
  const filename = sanitizeFilename(file.name) || "profile-image";
  return `admins/${adminId}/${crypto.randomUUID()}-${filename}`;
}

export function buildContentImagePath(folder: "announcements" | "events", file: File) {
  const filename = sanitizeFilename(file.name) || "image";
  return `${folder}/${crypto.randomUUID()}-${filename}`;
}

export async function uploadProfileImage(path: string, file: File) {
  return supabase.storage.from(PROFILE_IMAGES_BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });
}

export async function deleteProfileImage(path: string | null) {
  if (!path || /^https?:\/\//i.test(path)) {
    return { error: null };
  }

  return supabase.storage.from(PROFILE_IMAGES_BUCKET).remove([path]);
}

export function getProfileImageUrl(path: string | null) {
  if (!path) {
    return null;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return supabase.storage.from(PROFILE_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl;
}
