import {
  Calendar,
  ClipboardList,
  Home,
  User,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  {
    to: "/youth",
    label: "Home",
    icon: Home,
  },
  {
    to: "/youth/surveys",
    label: "Surveys",
    icon: ClipboardList,
  },
  {
    to: "/youth/events",
    label: "Events",
    icon: Calendar,
  },
  {
    to: "/youth/profile",
    label: "Profile",
    icon: User,
  },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 z-50 flex w-full max-w-md -translate-x-1/2 justify-between border-t border-slate-200 bg-white px-6 py-3 pb-6">
      {navItems.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/youth"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 transition-colors ${
                isActive
                  ? "text-blue-600"
                  : "text-slate-400 hover:text-slate-600"
              }`
            }
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium">
              {item.label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}