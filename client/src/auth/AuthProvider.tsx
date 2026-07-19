import { useCallback, useEffect, useState, type ReactNode } from "react";

import {
  clearInvalidSupabaseSession,
  isInvalidRefreshSessionError,
  logSafeAuthError,
  supabase,
} from "@/lib/supabase";

import { AuthContext } from "./AuthContext";

import type {
  AuthUser,
  AppRole,
  AuthContextValue,
  LoginPayload,
} from "./types";

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
      setUser({
        id: authUser.id,
        email: admin.email,
        fullname: admin.fullname,
      });

      setRole("admin");
      setLoading(false);
      return;
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
      setUser({
        id: authUser.id,
        email: kabataan.email,
        fullname: kabataan.fullname,
        mustChangePassword:
          Boolean(kabataan.must_change_password) ||
          kabataan.onboarding_status === "temporary_password_active",
      });

      setRole("kabataan");
    } else {
      setUser(null);
      setRole(null);
    }

    setLoading(false);
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

  async function login({ username, password }: LoginPayload) {
    const { error } = await supabase.auth.signInWithPassword({
      email: username,
      password,
    });

    
    if (error) {
      throw error;
    }

    loadUser();
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      logSafeAuthError("sign_out", error);
      await clearInvalidSupabaseSession();
    }

    setUser(null);
    setRole(null);
  }

  const value: AuthContextValue = {
    isAuthenticated: user !== null,
    user,
    role,
    loading,
    login,
    logout,
    refreshUser: loadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
