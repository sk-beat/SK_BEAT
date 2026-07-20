import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function getProjectRef(url: string) {
  try {
    return new URL(url).hostname.split(".")[0] || "default";
  } catch {
    return "default";
  }
}

export const supabaseAuthStorageKey = `sb-${getProjectRef(supabaseUrl)}-auth-token`;
const supabaseAuthStorageModeKey = "sk-beat-auth-storage-mode";
export const rememberedLoginEmailKey = "sk-beat-remembered-login-email";
export const rememberedLoginPasswordKey = "sk-beat-remembered-login-password";

type AuthStorageMode = "local" | "session";

function getBrowserStorage(type: AuthStorageMode) {
  if (typeof window === "undefined") return null;
  return type === "local" ? window.localStorage : window.sessionStorage;
}

export function getSupabaseAuthStorageMode(): AuthStorageMode {
  return getBrowserStorage("local")?.getItem(supabaseAuthStorageModeKey) === "local"
    ? "local"
    : "session";
}

export function setSupabaseAuthStorageMode(mode: AuthStorageMode) {
  const localStorage = getBrowserStorage("local");
  const sessionStorage = getBrowserStorage("session");

  if (mode === "local") {
    localStorage?.setItem(supabaseAuthStorageModeKey, "local");
    sessionStorage?.removeItem(supabaseAuthStorageKey);
    return;
  }

  localStorage?.removeItem(supabaseAuthStorageModeKey);
  localStorage?.removeItem(supabaseAuthStorageKey);
}

export function clearSupabaseAuthSessionStorage() {
  getBrowserStorage("local")?.removeItem(supabaseAuthStorageKey);
  getBrowserStorage("session")?.removeItem(supabaseAuthStorageKey);
}

const supabaseAuthStorage = {
  getItem(key: string) {
    return getBrowserStorage(getSupabaseAuthStorageMode())?.getItem(key) ?? null;
  },
  setItem(key: string, value: string) {
    getBrowserStorage(getSupabaseAuthStorageMode())?.setItem(key, value);
  },
  removeItem(key: string) {
    getBrowserStorage("local")?.removeItem(key);
    getBrowserStorage("session")?.removeItem(key);
  },
};

declare global {
  var __SK_BEAT_SUPABASE_CLIENT__: SupabaseClient | undefined;
}

export const supabase =
  globalThis.__SK_BEAT_SUPABASE_CLIENT__ ??
  createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: supabaseAuthStorage,
    },
  });

globalThis.__SK_BEAT_SUPABASE_CLIENT__ = supabase;

type AuthErrorLike = {
  code?: string;
  message?: string;
  name?: string;
  status?: number;
};

export function getSafeAuthError(error: unknown) {
  const authError = error as AuthErrorLike | null;

  return {
    code:
      typeof authError?.code === "string" ? authError.code : "unknown_auth_error",
    message:
      typeof authError?.message === "string"
        ? authError.message
        : "Unknown Supabase Auth error.",
    name: typeof authError?.name === "string" ? authError.name : undefined,
    status: typeof authError?.status === "number" ? authError.status : undefined,
  };
}

export function isInvalidRefreshSessionError(error: unknown) {
  const { code, message, status } = getSafeAuthError(error);
  const normalized = `${code} ${message}`.toLowerCase();

  return (
    status === 400 &&
    (normalized.includes("refresh") ||
      normalized.includes("session_not_found") ||
      normalized.includes("invalid_grant") ||
      normalized.includes("jwt")) &&
    (normalized.includes("invalid") ||
      normalized.includes("not found") ||
      normalized.includes("expired") ||
      normalized.includes("revoked") ||
      normalized.includes("already used") ||
      normalized.includes("session_not_found"))
  );
}

export function logSafeAuthError(context: string, error: unknown) {
  console.warn("Supabase Auth error", {
    context,
    ...getSafeAuthError(error),
  });
}

export async function clearInvalidSupabaseSession() {
  const { error } = await supabase.auth.signOut({ scope: "local" });

  if (error) {
    logSafeAuthError("local_sign_out", error);
  }

  clearSupabaseAuthSessionStorage();
}
