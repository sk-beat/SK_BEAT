import { LogOut, Megaphone, Menu, Users } from "lucide-react";
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import skLogo from "../../assets/sklogo.png";
import BottomNav from "../../components/Youth/shared/BottomNav";
import { youthAppNavItems } from "../../components/Youth/shared/youthNavigation";
import LogoutConfirmationDialog from "../../components/shared/LogoutConfirmationDialog";
import { getSafeAuthError } from "../../lib/supabase";
import { useState } from "react";

export default function YouthLayoutPage() {
  const { loading, logout, role, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const isFirstLoginYouth = role === "kabataan" && user?.mustChangePassword;
  const isProfileRoute = location.pathname === "/youth/profile";

  if (!loading && isFirstLoginYouth && !isProfileRoute) {
    return <Navigate to="/youth/profile?changePassword=1" replace />;
  }

  function openLogoutDialog() {
    console.log("[Logout] Confirmation opened", {
      role,
    });
    setLogoutError(null);
    setIsLogoutDialogOpen(true);
  }

  async function handleLogoutConfirm() {
    if (isLoggingOut) return;
    console.log("[Logout] Confirmed", {
      role,
    });
    setIsLoggingOut(true);
    setLogoutError(null);

    try {
      await logout();
      setIsLogoutDialogOpen(false);
      navigate("/login", { replace: true });
    } catch (error) {
      const errorMessage = getSafeAuthError(error).message;
      console.error("[Logout] Failed", {
        message: errorMessage,
      });
      setLogoutError(errorMessage);
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-white/20 bg-[#0b1f3b]/95 text-white backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-4 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-3" to="/youth">
            <img className="h-11 w-11 rounded-full object-contain" src={skLogo} alt="SK Logo" />
            <span className="flex flex-col leading-tight">
              <span className="text-lg font-bold">SK Kabataan</span>
              <span className="text-xs text-white/75">Youth Council</span>
            </span>
          </Link>

          <nav className="hidden items-center justify-end gap-5 text-sm md:flex">
            {youthAppNavItems.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  isActive
                    ? "font-semibold text-white"
                    : "text-white/75 transition-colors hover:text-white"
                }
                key={item.to}
                to={item.to}
                end={item.end}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button
              aria-label="Announcements"
              className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
              onClick={() => navigate("/youth/announcements")}
              title="Announcements"
              type="button"
            >
              <Megaphone className="h-5 w-5" />
            </button>
            <div className="relative">
              <button
                aria-expanded={isUserMenuOpen}
                aria-label="Open youth menu"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/15"
                onClick={() => setIsUserMenuOpen((current) => !current)}
                title="Menu"
                type="button"
              >
                <Menu className="h-5 w-5" />
              </button>
              {isUserMenuOpen ? (
                <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-white/10 bg-white py-1 text-sm text-slate-800 shadow-xl">
                  <button
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left font-medium hover:bg-slate-50"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      navigate("/youth/officials");
                    }}
                    type="button"
                  >
                    <Users className="h-4 w-4 text-[#0b1f3b]" />
                    SK Officials
                  </button>
                  <button
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left font-medium text-red-600 hover:bg-red-50"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      openLogoutDialog();
                    }}
                    type="button"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <Outlet />
      <BottomNav />

      <footer className="bg-[#0b1f3b] px-5 py-10 pb-28 text-white md:pb-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          <div>
            <h3 className="text-lg font-bold">SK Kabataan</h3>
            <p className="mt-3 text-sm leading-relaxed text-white/75">
              Empowering youth, building communities, creating a brighter future together.
            </p>
          </div>
          <div>
            <h4 className="mb-3 font-semibold">Quick Links</h4>
            <div className="flex flex-col gap-2 text-sm text-white/75">
              {youthAppNavItems.map((item) => (
                <Link className="transition-colors hover:text-white" key={item.to} to={item.to}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="mb-3 font-semibold">Contact Us</h4>
            <div className="flex flex-col gap-2 text-sm text-white/75">
              <p>Barangay Hall, Main Street</p>
              <p>sk.kabataan@email.com</p>
            </div>
          </div>
        </div>
      </footer>
      <LogoutConfirmationDialog
        errorMessage={logoutError}
        isLoggingOut={isLoggingOut}
        onCancel={() => {
          setIsLogoutDialogOpen(false);
          setLogoutError(null);
        }}
        onConfirm={handleLogoutConfirm}
        open={isLogoutDialogOpen}
      />
    </div>
  );
}
