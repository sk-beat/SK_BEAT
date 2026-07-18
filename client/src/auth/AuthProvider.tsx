import { useEffect, useState, type ReactNode } from "react";

import { supabase } from "../utils/supabase";

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

  async function loadUser() {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

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
      .select("fullname,email")
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
      });

      setRole("kabataan");
    } else {
      setUser(null);
      setRole(null);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

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
    await supabase.auth.signOut();
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
