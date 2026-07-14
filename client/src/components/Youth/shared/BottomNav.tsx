import { NavLink } from "react-router-dom";
import { youthAppNavItems } from "./youthNavigation";

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 z-50 flex w-full justify-around border-t border-slate-200 bg-white px-2 py-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] md:hidden">
      {youthAppNavItems.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-600"
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
