import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import skLogo from "../../assets/sklogo.png";
import { youthNavItems } from "../../utils/adminPortalData";
import BottomNav from "../../components/Youth/BottonNav";

export default function YouthLayout() {


  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-white/20 bg-[#0b1f3b]/95 text-white backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
          
          {/* Logo Area */}
          <Link className="flex items-center gap-3" to="/youth">
            <img className="h-11 w-11 rounded-full object-contain" src={skLogo} alt="SK Logo" />
            <span className="flex flex-col leading-tight">
              <span className="font-bold text-lg">SK Kabataan</span>
              <span className="text-xs text-white/75">Youth Council</span>
            </span>
          </Link>

          {/* Desktop Navigation (Hidden on Mobile) */}
          <nav className="hidden md:flex items-center justify-end gap-6 text-sm">
            {youthNavItems.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  isActive
                    ? "font-semibold text-white transition-colors"
                    : "text-white/75 hover:text-white transition-colors"
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

      {/* Main Content */}
      <Outlet />
      <BottomNav />

      {/* Footer - Grids handle mobile stacking automatically via md:grid-cols-3 */}
      <footer className="bg-[#0b1f3b] px-6 py-10 text-white ">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3 pb-20">
          <div>
            <h3 className="font-bold text-lg">SK Kabataan</h3>
            <p className="mt-3 text-sm text-white/75 leading-relaxed">
              Empowering youth, building communities, creating a brighter future together.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Quick Links</h4>
            <div className="flex flex-col gap-2 text-sm text-white/75">
              {youthNavItems.map((item) => (
                <Link className="hover:text-white transition-colors" key={item.to} to={item.to}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Contact Us</h4>
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