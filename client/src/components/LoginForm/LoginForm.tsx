import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import skLogo from "../../assets/sklogo.png";
import {
  rememberedLoginEmailKey,
  rememberedLoginPasswordKey,
} from "../../lib/supabase";

function getRememberedLoginEmail() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(rememberedLoginEmailKey) ?? "";
}

function getRememberedLoginPassword() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(rememberedLoginPasswordKey) ?? "";
}

type PasswordCredentialData = {
  id: string;
  name?: string;
  password: string;
};

type PasswordCredentialConstructor = new (
  data: PasswordCredentialData,
) => Credential;

type PasswordCredentialLike = Credential & {
  id: string;
  password?: string;
};

function getPasswordCredentialConstructor() {
  if (typeof window === "undefined") return null;

  return (
    window as Window & {
      PasswordCredential?: PasswordCredentialConstructor;
    }
  ).PasswordCredential ?? null;
}

async function getStoredLoginCredential() {
  if (typeof navigator === "undefined" || !navigator.credentials) {
    return null;
  }

  try {
    const credential = (await navigator.credentials.get({
      password: true,
      mediation: "optional",
    } as CredentialRequestOptions)) as PasswordCredentialLike | null;

    if (!credential?.id || typeof credential.password !== "string") {
      return null;
    }

    return {
      password: credential.password,
      username: credential.id,
    };
  } catch {
    return null;
  }
}

async function storeLoginCredential(username: string, password: string) {
  if (typeof navigator === "undefined" || !navigator.credentials) {
    return;
  }

  const PasswordCredential = getPasswordCredentialConstructor();
  if (!PasswordCredential) {
    return;
  }

  try {
    await navigator.credentials.store(
      new PasswordCredential({
        id: username,
        name: username,
        password,
      }),
    );
  } catch {
    // Some browsers disable Credential Management or leave this to autocomplete.
  }
}

function SkLogo({ size = "large" }: { size?: "large" | "small" }) {
  const isLarge = size === "large";

  return (
    <div
      className={[
        "flex shrink-0 items-center justify-center rounded-full bg-slate-900/30 text-white shadow-2xl ring-1 ring-white/15",
        isLarge ? "h-56 w-56" : "h-14 w-14",
      ].join(" ")}
    >
      <img
        src={skLogo}
        alt="SK Logo"
        className={[
          "rounded-full object-contain",
          isLarge ? "h-44 w-44" : "h-11 w-11",
        ].join(" ")}
      />
    </div>
  );
}

export default function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const hoverCount = useRef(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLockedOpen, setIsLockedOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberedEmail] = useState(getRememberedLoginEmail);
  const [rememberedPassword] = useState(getRememberedLoginPassword);
  const [username, setUsername] = useState(rememberedEmail);
  const [password, setPassword] = useState(rememberedPassword);
  const [rememberMe, setRememberMe] = useState(
    () => Boolean(getRememberedLoginEmail()) || Boolean(getRememberedLoginPassword()),
  );
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const expand = () => setIsExpanded(true);

  const collapse = () => {
    if (!isLockedOpen) {
      setIsExpanded(false);
    }
  };

  const handleEnter = () => {
    if (isLockedOpen) {
      return;
    }

    hoverCount.current += 1;
    expand();
  };

  const handleLeave = () => {
    if (isLockedOpen) {
      return;
    }

    hoverCount.current = Math.max(hoverCount.current - 1, 0);

    if (hoverCount.current === 0) {
      collapse();
    }
  };

  const lockOpen = () => {
    setIsLockedOpen(true);
    expand();
  };

  useEffect(() => {
    let isMounted = true;

    if (!rememberMe) {
      return () => {
        isMounted = false;
      };
    }

    void getStoredLoginCredential().then((credential) => {
      if (!isMounted || !credential) {
        return;
      }

      setUsername(credential.username);
      setPassword(credential.password);
    });

    return () => {
      isMounted = false;
    };
  }, [rememberMe]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    const loginUsername = username.trim();

    try {
      const session = await login({
        rememberMe,
        username: loginUsername,
        password,
      });

      if (rememberMe) {
        window.localStorage.setItem(rememberedLoginEmailKey, loginUsername);
        window.localStorage.setItem(rememberedLoginPasswordKey, password);
        await storeLoginCredential(loginUsername, password);
      } else {
        window.localStorage.removeItem(rememberedLoginEmailKey);
        window.localStorage.removeItem(rememberedLoginPasswordKey);
      }

      navigate(
        session.role === "admin"
          ? "/dashboard"
          : session.user.mustChangePassword
            ? "/youth/profile?changePassword=1"
            : "/youth",
        { replace: true },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0b1f3b] font-sans text-slate-900">
      <section className="flex min-h-screen items-center justify-center">
        <div className="relative min-h-[560px] w-full overflow-visible">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.08),transparent_55%)]" />

          <button
            type="button"
            className={[
              "absolute inset-0 z-20 flex cursor-pointer flex-col items-center justify-center gap-3 text-white transition duration-500 ease-out",
              isExpanded
                ? "pointer-events-none -translate-y-8 opacity-0"
                : "translate-y-0 opacity-100",
            ].join(" ")}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
            onClick={lockOpen}
            aria-label="Open login form"
          >
            <SkLogo />
            <p className="text-lg font-semibold tracking-[0.08em]">
              SK BEAT - Galas Maasim
            </p>
          </button>

          <div
            className={[
              "absolute inset-0 z-30 m-auto flex h-fit max-h-none w-[min(840px,90vw)] items-stretch justify-center overflow-hidden rounded-[22px] bg-white shadow-[0_26px_80px_rgba(15,23,42,0.65)] transition duration-500 ease-out md:max-h-[420px]",
              isExpanded
                ? "pointer-events-auto scale-100 opacity-100 [clip-path:inset(0_0)]"
                : "pointer-events-none scale-80 opacity-0 [clip-path:inset(0_50%)]",
            ].join(" ")}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
            onFocus={lockOpen}
          >
            <div className="flex w-full flex-col md:flex-row">
              <aside className="flex flex-col justify-center gap-3 bg-gradient-to-br from-[#102548] to-[#18345d] px-8 py-8 text-white md:basis-[38%] md:px-10">
                <div className="mb-4 flex items-center gap-3">
                  <SkLogo size="small" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-base font-bold tracking-[0.08em]">
                      SK BEAT
                    </span>
                    <span className="text-xs text-white/90">
                      Sangguniang Kabataan Management Portal
                    </span>
                  </div>
                </div>

                <div className="mx-auto max-w-[280px] leading-relaxed text-white/90">
                  <h1 className="mb-2 text-3xl font-bold tracking-[0.1em]">
                    WELCOME
                  </h1>
                  <h2 className="mb-5 text-sm font-bold tracking-[0.08em] text-white/95">
                    SK GALAS MAASIM
                  </h2>
                  <p className="text-sm">
                    Access the SK BEAT portal to manage programs, activities,
                    and youth records for Barangay Galas Maasim.
                  </p>
                </div>
              </aside>

              <div className="flex flex-1 items-center justify-center px-8 py-8 md:px-9">
                <div className="w-full max-w-[360px]">
                  <h2 className="mb-2 text-3xl font-bold text-slate-800">
                    Sign in
                  </h2>
                  <p className="mb-8 text-sm text-slate-500">
                    Admin login or Kabataan email access
                  </p>

                  <form className="space-y-5" onSubmit={handleSubmit}>
                    <label className="relative block">
                      <span className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 text-slate-500">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden="true"
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </span>
                      <input
                        className="w-full rounded-lg border border-slate-300 px-4 py-3.5 pl-12 text-[0.9375rem] text-slate-800 transition outline-none placeholder:text-slate-400 focus:border-[#0b1f3b]"
                        type="text"
                        name="username"
                        placeholder="User Name"
                        autoComplete="username"
                        onChange={(event) => {
                          setUsername(event.target.value);
                          if (error) setError("");
                        }}
                        required
                        value={username}
                      />
                    </label>

                    <label className="relative block">
                      <span className="pointer-events-none absolute left-4 top-1/2 flex -translate-y-1/2 text-slate-500">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden="true"
                        >
                          <rect x="3" y="11" width="18" height="11" rx="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </span>
                      <input
                        className="w-full rounded-lg border border-slate-300 px-4 py-3.5 pl-12 pr-20 text-[0.9375rem] text-slate-800 transition outline-none placeholder:text-slate-400 focus:border-[#0b1f3b]"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Password"
                        autoComplete="current-password"
                        onChange={(event) => {
                          setPassword(event.target.value);
                          if (error) setError("");
                        }}
                        required
                        value={password}
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#0b1f3b] hover:underline"
                        onClick={() => setShowPassword((current) => !current)}
                      >
                        {showPassword ? "HIDE" : "SHOW"}
                      </button>
                    </label>

                    <div className="flex items-center justify-between gap-4">
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                        <input
                          checked={rememberMe}
                          className="peer sr-only"
                          onChange={(event) => setRememberMe(event.target.checked)}
                          type="checkbox"
                        />
                        <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border-2 border-slate-300 peer-checked:border-[#0b1f3b] peer-checked:bg-[#0b1f3b] peer-checked:after:mb-0.5 peer-checked:after:h-2.5 peer-checked:after:w-1.5 peer-checked:after:rotate-45 peer-checked:after:border-b-2 peer-checked:after:border-r-2 peer-checked:after:border-white peer-checked:after:content-['']" />
                        Remember me
                      </label>
                      <Link
                        className="text-sm text-[#0b1f3b] hover:underline"
                        to="/forgot-password"
                      >
                        Forgot Password?
                      </Link>
                    </div>

                    {error ? (
                      <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600" role="alert">
                        {error}
                      </div>
                    ) : null}

                    <button
                      type="submit"
                      className="w-full rounded-lg bg-[#0b1f3b] px-6 py-3.5 text-[0.9375rem] font-semibold text-white transition hover:bg-[#102548] disabled:cursor-not-allowed disabled:opacity-70"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Signing in..." : "Sign in"}
                    </button>

                    <p className="text-center text-sm text-slate-500">
                      <button
                        className="font-medium text-[#0b1f3b] hover:underline"
                        onClick={() => {
                          navigate("/youth-events");
                        }}
                        type="button"
                      >
                        View upcoming events
                      </button>{" "}
                      without logging in.
                    </p>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
