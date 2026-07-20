import { useCallback, useEffect, useState, type ReactNode } from "react";

import {
  clearInvalidSupabaseSession,
  clearSupabaseAuthSessionStorage,
  getSafeAuthError,
  isInvalidRefreshSessionError,
  logSafeAuthError,
  setSupabaseAuthStorageMode,
  supabase,
} from "@/lib/supabase";

import { AuthContext } from "./AuthContext";

import type {
  AuthUser,
  AppRole,
  AuthContextValue,
  LoginPayload,
} from "./types";

function isInvalidLoginCredentialsError(error: unknown) {
  const { code, message, status } = getSafeAuthError(error);
  const normalized = `${code} ${message}`.toLowerCase();

  return (
    status === 400 &&
    (normalized.includes("invalid login credentials") ||
      normalized.includes("invalid_credentials"))
  );
}

function getLoginErrorMessage(error: unknown) {
  const { code, message, status } = getSafeAuthError(error);
  const normalized = `${code} ${message}`.toLowerCase();

  console.error("[Login] Authentication failed", {
    message,
    status,
    code,
  });

  if (isInvalidLoginCredentialsError(error)) {
    return "Email or password is invalid.";
  }

  if (
    normalized.includes("email not confirmed") ||
    normalized.includes("email_not_confirmed") ||
    normalized.includes("confirm")
  ) {
    return "Please confirm your email before logging in.";
  }

  if (
    normalized.includes("fetch failed") ||
    normalized.includes("network") ||
    normalized.includes("failed to fetch")
  ) {
    return "Unable to connect right now. Please check your connection and try again.";
  }

  return "Unable to log in right now. Please try again.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const handleInvalidSession = useCallback(async (error: unknown) => {
    logSafeAuthError("session_recovery", error);
    await clearInvalidSupabaseSession();
    setUser(null);
    setRole(null);
    setLoading(false);

    if (window.location.pathname !== "/login") {
      window.location.replace("/login");
    }
  }, []);

  const loadUser = useCallback(async () => {
    setLoading(true);
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      if (isInvalidRefreshSessionError(authError)) {
        await handleInvalidSession(authError);
        return;
      }

      logSafeAuthError("get_user", authError);
    }

    if (!authUser) {
      setUser(null);
      setRole(null);
      setLoading(false);
      return;
    }

    // Admin Check
    const { data: admin, error: err } = await supabase
      .from("admins")
      .select("fullname,email")
      .eq("admin_id", authUser.id)
      .eq("status", "active")
      .maybeSingle();

    if (err) {
      console.error("Admin query error:", err);
    }

    if (admin) {
      const nextUser = {
        id: authUser.id,
        email: admin.email,
        fullname: admin.fullname,
      };

      setUser(nextUser);
      setRole("admin");
      setLoading(false);
      return { role: "admin" as const, user: nextUser };
    }

    await supabase.rpc("refresh_my_kabataan_account_lock");

    // Kabataan Check
    const { data: kabataan, error } = await supabase
      .from("kabataan_profiles")
      .select("fullname,email,must_change_password,onboarding_status")
      .eq("profile_id", authUser.id)
      .eq("status", "active")
      .maybeSingle();

    if (error) {
      console.error("Kabataan query error:", error);
    }

    if (kabataan) {
      const nextUser = {
        id: authUser.id,
        email: kabataan.email,
        fullname: kabataan.fullname,
        mustChangePassword:
          Boolean(kabataan.must_change_password) ||
          kabataan.onboarding_status === "temporary_password_active",
      };

      setUser(nextUser);
      setRole("kabataan");
      setLoading(false);
      return { role: "kabataan" as const, user: nextUser };
    } else {
      setUser(null);
      setRole(null);
    }

    setLoading(false);
    return null;
  }, [handleInvalidSession]);

  useEffect(() => {
    void Promise.resolve().then(loadUser);

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      void loadUser();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [loadUser]);

  async function login({ rememberMe = false, username, password }: LoginPayload) {
    setLoading(true);
    setSupabaseAuthStorageMode(rememberMe ? "local" : "session");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: username,
      password,
    });

    if (error) {
      setLoading(false);
      throw new Error(getLoginErrorMessage(error));
    }

    const authUser = data.user;

    if (!authUser) {
      setLoading(false);
      throw new Error("Login failed.");
    }

    const { data: admin } = await supabase
      .from("admins")
      .select("admin_id,status")
      .eq("admin_id", authUser.id)
      .maybeSingle();

    if (admin) {
      if (admin.status !== "active") {
        await supabase.auth.signOut({ scope: "local" });
        setLoading(false);
        throw new Error("Your Admin account is inactive. Please contact an administrator.");
      }

      const loaded = await loadUser();
      if (!loaded) throw new Error("Unable to load account profile.");
      return loaded;
    }

    await supabase.rpc("refresh_my_kabataan_account_lock");

    const { data: kabataan, error: youthError } = await supabase
      .from("kabataan_profiles")
      .select("status,account_lock_reason")
      .eq("profile_id", authUser.id)
      .maybeSingle();

    if (youthError) {
      await supabase.auth.signOut({ scope: "local" });
      setLoading(false);
      throw youthError;
    }

    if (!kabataan) {
      await supabase.auth.signOut({ scope: "local" });
      setLoading(false);
      throw new Error("Account is not authorized for this portal.");
    }

    if (kabataan.status !== "active") {
      await supabase.auth.signOut({ scope: "local" });
      setLoading(false);
      throw new Error(
        kabataan.account_lock_reason === "age_limit"
          ? "Your Youth account is locked because you reached the age limit."
          : "Your Youth account is locked. Please contact an administrator.",
      );
    }

    const loaded = await loadUser();
    if (!loaded) throw new Error("Unable to load account profile.");
    return loaded;
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      logSafeAuthError("sign_out", error);
      await clearInvalidSupabaseSession();
    } else {
      clearSupabaseAuthSessionStorage();
    }

    setUser(null);
    setRole(null);

    if (error) {
      throw error;
    }
  }

  const value: AuthContextValue = {
    isAuthenticated: user !== null,
    user,
    role,
    loading,
    login,
    logout,
    refreshUser: async () => {
      await loadUser();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
