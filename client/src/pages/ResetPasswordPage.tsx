import { KeyRound } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  getPasswordChangeErrorMessage,
  validatePasswordChange,
} from "../utils/passwordValidation";

function validateStrongPassword(password: string) {
  const baseError = validatePasswordChange({ newPassword: password });
  if (baseError) return baseError;

  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    return "Password must include uppercase, lowercase, and number characters.";
  }

  return null;
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === "PASSWORD_RECOVERY" && session) {
        setHasRecoverySession(true);
        setIsCheckingSession(false);
      }
    });

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      window.setTimeout(() => {
        if (!isMounted) return;
        setHasRecoverySession((current) => current || Boolean(session));
        setIsCheckingSession(false);
      }, 800);
    }

    checkSession();

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!hasRecoverySession) {
      setErrorMessage("This password reset link is invalid or has expired.");
      return;
    }

    const passwordError =
      validateStrongPassword(newPassword) ||
      validatePasswordChange({ confirmPassword, newPassword });
    if (passwordError) {
      setErrorMessage(passwordError);
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    setIsSubmitting(false);

    if (error) {
      setErrorMessage(getPasswordChangeErrorMessage(error.message, error.code));
      return;
    }

    setSuccessMessage("Password updated successfully.");
    await supabase.auth.signOut({ scope: "local" });
    window.setTimeout(() => navigate("/login", { replace: true }), 900);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6 py-12 font-sans text-slate-900">
      <section className="w-full max-w-md rounded-[14px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <KeyRound className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-[#0b1f3b]">Reset Password</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Choose a new password for your SK Beat account.
        </p>

        {isCheckingSession ? (
          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            Checking password reset link...
          </div>
        ) : !hasRecoverySession ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              This password reset link is invalid or has expired.
            </div>
            <Link
              className="inline-flex w-full items-center justify-center rounded-lg bg-[#1e3a5f] px-4 py-3 text-sm font-semibold text-white hover:bg-[#173256]"
              to="/forgot-password"
            >
              Request New Link
            </Link>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                New password
              </span>
              <input
                autoComplete="new-password"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#1e3a5f]"
                onChange={(event) => setNewPassword(event.target.value)}
                type="password"
                value={newPassword}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                Confirm new password
              </span>
              <input
                autoComplete="new-password"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#1e3a5f]"
                onChange={(event) => setConfirmPassword(event.target.value)}
                type="password"
                value={confirmPassword}
              />
            </label>

            {errorMessage ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}
            {successMessage ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {successMessage}
              </div>
            ) : null}

            <button
              className="inline-flex w-full items-center justify-center rounded-lg bg-[#1e3a5f] px-4 py-3 text-sm font-semibold text-white hover:bg-[#173256] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
