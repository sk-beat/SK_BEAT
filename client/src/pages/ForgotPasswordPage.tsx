import { ArrowLeft, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

const passwordResetRedirectUrl = "https://sk-beat.vercel.app/reset-password";
const neutralSuccessMessage =
  "If an account exists for this email, a password reset link has been sent.";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedEmail = email.trim();
    setMessage("");
    setErrorMessage("");

    if (!isValidEmail(trimmedEmail)) {
      setErrorMessage("Enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo: passwordResetRedirectUrl,
    });
    setIsSubmitting(false);

    console.log("[Forgot Password] Request completed", {
      hasEmail: Boolean(trimmedEmail),
      success: !error,
    });

    if (error) {
      setErrorMessage("Unable to send a reset link right now. Please try again.");
      return;
    }

    setMessage(neutralSuccessMessage);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6 py-12 font-sans text-slate-900">
      <section className="w-full max-w-md rounded-[14px] border border-slate-200 bg-white p-6 shadow-sm">
        <Link
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#1e3a5f] hover:underline"
          to="/login"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <Mail className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-[#0b1f3b]">Forgot Password</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Enter your account email and we will send a password reset link.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Email address
            </span>
            <input
              autoComplete="email"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#1e3a5f]"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              type="email"
              value={email}
            />
          </label>

          {errorMessage ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}
          {message ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>
          ) : null}

          <button
            className="inline-flex w-full items-center justify-center rounded-lg bg-[#1e3a5f] px-4 py-3 text-sm font-semibold text-white hover:bg-[#173256] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      </section>
    </main>
  );
}
