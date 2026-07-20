import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState, type ReactNode } from "react";
import skLogo from "../../assets/sklogo.png";
import { useAuth } from "../../auth/useAuth";
import { getSafeAuthError } from "../../lib/supabase";
import LogoutConfirmationDialog from "../shared/LogoutConfirmationDialog";

type IconProps = {
  className?: string;
};

type SidebarItem = {
  label: string;
  to: string;
  icon: (props: IconProps) => ReactNode;
  end?: boolean;
  subItems?: SidebarSubItem[];
};

type SidebarSubItem = {
  label: string;
  to: string;
  icon: (props: IconProps) => ReactNode;
};

type SidebarProps = {
  items?: SidebarItem[];
  onLogout?: () => void;
};

function DashboardIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}

function TrendIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

function CalendarIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

function BriefcaseIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      <rect width="20" height="14" x="2" y="6" rx="2" />
    </svg>
  );
}

function UsersIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function MegaphoneIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m3 11 18-5v12L3 14v-3Z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  );
}

function LogoutIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}

function MessageIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  );
}

function BarChartIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 3v18h18" />
      <path d="M8 17V9" />
      <path d="M13 17V5" />
      <path d="M18 17v-3" />
    </svg>
  );
}

function BellRingIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10.3 21a2 2 0 0 0 3.4 0" />
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M4 2 2 4" />
      <path d="m22 4-2-2" />
    </svg>
  );
}

function GlobeIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
    </svg>
  );
}

const defaultSidebarItems: SidebarItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: DashboardIcon, end: true },
  { label: "Youth Records", to: "/youth-records", icon: TrendIcon },
  { label: "Activities", to: "/activities", icon: CalendarIcon },
  { label: "Financial", to: "/financial", icon: BriefcaseIcon },
  { label: "SK Officials", to: "/sk-officials", icon: UsersIcon },
  { label: "Landing Page", to: "/landing-page-settings", icon: GlobeIcon },
  {
    label: "Surveys & Announcements",
    to: "/kabataan-suggestions",
    icon: MegaphoneIcon,
    subItems: [
      {
        label: "Kabataan Suggestions",
        to: "/kabataan-suggestions",
        icon: MessageIcon,
      },
      {
        label: "Survey Responses",
        to: "/survey-responses",
        icon: BarChartIcon,
      },
      {
        label: "Announcements",
        to: "/announcements",
        icon: BellRingIcon,
      },
    ],
  },
];

function navItemClass({ isActive }: { isActive: boolean }) {
  return [
    "relative flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-2 text-white no-underline transition-colors duration-200",
    "group/nav",
    "group-hover/sidebar:justify-start group-hover/sidebar:pl-1",
    "max-md:justify-center max-md:pl-2",
    isActive ? "is-active" : "",
  ].join(" ");
}

export default function Sidebar({
  items = defaultSidebarItems,
  onLogout,
}: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { role } = useAuth();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  function openLogoutDialog() {
    console.log("[Logout] Confirmation opened", {
      role,
    });
    setLogoutError(null);
    setIsLogoutDialogOpen(true);
  }

  async function handleLogoutConfirm() {
    if (!onLogout || isLoggingOut) return;

    console.log("[Logout] Confirmed", {
      role,
    });
    setIsLoggingOut(true);
    setLogoutError(null);

    try {
      await onLogout();
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
    <>
    <aside className="peer/sidebar group/sidebar fixed left-0 top-0 z-[100] flex h-screen w-[88px] shrink-0 flex-col items-center overflow-hidden bg-[#1e3a5f] py-6 text-white transition-[width] duration-300 ease-in-out hover:w-[300px] max-md:w-[72px] max-md:py-4 max-md:hover:w-[72px]">
      <div className="mb-2 flex min-h-20 w-full flex-col items-center gap-2 px-4 pb-8">
        <img
          className="h-12 w-12 shrink-0 object-contain"
          src={skLogo}
          alt="SK Logo"
        />
        <span className="w-0 overflow-hidden whitespace-nowrap text-center text-[0.9375rem] font-semibold text-white opacity-0 transition-[opacity,width] duration-300 group-hover/sidebar:w-auto group-hover/sidebar:opacity-100 max-md:hidden">
          SK BEAT - Galas Maasim
        </span>
      </div>

      <nav className="flex w-full flex-1 flex-col items-center gap-2 px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isGroupActive =
            item.subItems?.some(
              (subItem) => location.pathname === subItem.to,
            ) || false;

          return (
            <div className="group/navitem w-full" key={item.to}>
              <NavLink
                className={navItemClass}
                end={item.end}
                to={item.to}
                title={item.label}
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={[
                        "flex h-12 w-12 min-w-12 shrink-0 items-center justify-center rounded-2xl transition-colors duration-200",
                        isActive || isGroupActive
                          ? "bg-white text-[#1e3a5f]"
                          : "bg-transparent text-white group-hover/nav:bg-white/15",
                      ].join(" ")}
                    >
                      <Icon className="h-6 w-6 shrink-0" />
                    </span>
                    <span className="w-0 overflow-hidden whitespace-nowrap text-[0.9375rem] font-medium opacity-0 transition-[opacity,width] duration-300 group-hover/sidebar:w-auto group-hover/sidebar:opacity-100 max-md:hidden">
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>

              {item.subItems ? (
                <div className="grid max-h-0 grid-rows-[0fr] overflow-hidden pl-[62px] pr-2 opacity-0 transition-[grid-template-rows,max-height,opacity,padding] duration-300 ease-out group-hover/navitem:max-h-40 group-hover/navitem:grid-rows-[1fr] group-hover/navitem:py-1 group-hover/navitem:opacity-100 max-md:hidden">
                  <div className="flex min-h-0 flex-col gap-1">
                  {item.subItems.map((subItem) => {
                    const SubIcon = subItem.icon;
                    const isSubActive = location.pathname === subItem.to;

                    return (
                      <Link
                        className={[
                          "flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                          isSubActive
                            ? "bg-white/16 text-white"
                            : "text-white/70 hover:bg-white/12 hover:text-white",
                        ].join(" ")}
                        key={subItem.to}
                        to={subItem.to}
                      >
                        <SubIcon className="h-5 w-5 shrink-0" />
                        <span className="whitespace-nowrap">
                          {subItem.label}
                        </span>
                      </Link>
                    );
                  })}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      {onLogout ? (
        <button
          className="mb-4 flex min-h-12 w-[calc(100%-1rem)] items-center justify-center gap-2 rounded-xl px-2 text-white transition-colors duration-200 hover:bg-white/15 group-hover/sidebar:justify-start group-hover/sidebar:pl-1 max-md:justify-center max-md:pl-2"
          type="button"
          onClick={openLogoutDialog}
          title="Logout"
        >
          <LogoutIcon className="h-6 w-6 shrink-0" />
          <span className="w-0 overflow-hidden whitespace-nowrap text-[0.9375rem] font-medium opacity-0 transition-[opacity,width] duration-300 group-hover/sidebar:w-auto group-hover/sidebar:opacity-100 max-md:hidden">
            Logout
          </span>
        </button>
      ) : null}
    </aside>
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
    </>
  );
}
