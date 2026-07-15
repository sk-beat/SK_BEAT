import { Bell, Megaphone, User } from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import skLogo from "../../assets/sklogo.png";
import BottomNav from "../../components/Youth/shared/BottomNav";
import { youthAppNavItems } from "../../components/Youth/shared/youthNavigation";

export default function YouthLayoutPage() {
  const navigate = useNavigate();

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
              aria-label="Notifications"
              className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
              title="Notifications"
              type="button"
            >
              <Bell className="h-5 w-5" />
            </button>
            <button
              aria-label="Announcements"
              className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
              onClick={() => navigate("/youth/announcements")}
              title="Announcements"
              type="button"
            >
              <Megaphone className="h-5 w-5" />
            </button>
            <button
              aria-label="Profile"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/15"
              onClick={() => navigate("/youth/profile")}
              title="Profile"
              type="button"
            >
              <User className="h-5 w-5" />
            </button>
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
    </div>
  );
}
