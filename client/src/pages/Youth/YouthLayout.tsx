import { Link, NavLink, Outlet } from "react-router-dom";
import skLogo from "../../assets/sklogo.png";
import { youthNavItems } from "./youthData";

export default function YouthLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-white/20 bg-[#0b1f3b]/95 text-white backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
          <Link className="flex items-center gap-3" to="/youth-portal">
            <img className="h-11 w-11 rounded-full object-contain" src={skLogo} alt="SK Logo" />
            <span className="flex flex-col leading-tight">
              <span className="font-bold">SK Kabataan</span>
              <span className="text-xs text-white/75">Youth Council</span>
            </span>
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-4 text-sm">
            {youthNavItems.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  isActive ? "font-semibold text-white" : "text-white/75 hover:text-white"
                }
                key={item.to}
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <Outlet />
      <footer className="bg-[#0b1f3b] px-6 py-10 text-white">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          <div>
            <h3 className="font-bold">SK Kabataan</h3>
            <p className="mt-2 text-sm text-white/75">
              Empowering youth, building communities, creating a brighter future together.
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Quick Links</h4>
            <div className="mt-2 flex flex-col gap-1 text-sm text-white/75">
              {youthNavItems.map((item) => (
                <Link className="hover:text-white" key={item.to} to={item.to}>{item.label}</Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-semibold">Contact Us</h4>
            <p className="mt-2 text-sm text-white/75">Barangay Hall, Main Street</p>
            <p className="text-sm text-white/75">sk.kabataan@email.com</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
