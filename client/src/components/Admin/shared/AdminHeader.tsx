import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/useAuth";
import { BellIcon, ChevronDownIcon } from "../Dashboard/icons";
import AdminAccountModals from "./AdminAccountModals";
import { getSafeAuthError, supabase } from "@/lib/supabase";
import { getProfileImageUrl } from "../../../utils/profileImages";
import LogoutConfirmationDialog from "../../shared/LogoutConfirmationDialog";
import {
  getAdminNotifications,
  getAdminUnreadNotificationCount,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  type AdminNotification,
} from "./AdminNotificationsService";

type AccountModalKind = "profile" | "add-admin" | null;

type AdminHeaderProps = {
  subtitle: string;
  title: string;
};

export default function AdminHeader({ subtitle, title }: AdminHeaderProps) {
  const { logout, role, user } = useAuth();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [accountModal, setAccountModal] = useState<AccountModalKind>(null);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const [adminName, setAdminName] = useState("");
  const [adminPosition, setAdminPostion] = useState("");
  const [adminImage, setAdminImage] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  function openAccountModal(modal: AccountModalKind) {
    setAccountModal(modal);
    setIsUserMenuOpen(false);
  }

  function openLogoutDialog() {
    console.log("[Logout] Confirmation opened", {
      role,
    });
    setLogoutError(null);
    setIsUserMenuOpen(false);
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

  async function fetchAdmin() {
    const { data } = await supabase
      .from("admins")
      .select("*")
      .eq("admin_id", user?.id)
      .single();

    setAdminName(data.fullname);
    setAdminPostion(data.position);
    setAdminImage(data.profile_image ?? null);
  }

  async function refreshUnreadCount() {
    const { data, error } = await getAdminUnreadNotificationCount();
    if (!error) {
      setUnreadCount(data);
    }
  }

  async function loadNotifications() {
    setIsLoadingNotifications(true);
    const { data, error } = await getAdminNotifications(20);
    if (!error) {
      setNotifications(data);
    }
    setIsLoadingNotifications(false);
  }

  async function handleToggleNotifications() {
    setIsNotificationsOpen((open) => !open);
    setIsUserMenuOpen(false);
    if (!isNotificationsOpen) {
      await loadNotifications();
      await refreshUnreadCount();
    }
  }

  async function handleMarkRead(notificationId: number) {
    const { error } = await markAdminNotificationRead(notificationId);
    if (!error) {
      await loadNotifications();
      await refreshUnreadCount();
    }
  }

  async function handleMarkAllRead() {
    const { error } = await markAllAdminNotificationsRead();
    if (!error) {
      await loadNotifications();
      await refreshUnreadCount();
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAdmin();
    refreshUnreadCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-8 py-5 max-md:flex-col max-md:items-stretch">
        <div className="min-w-0 flex-1">
          <h1 className="m-0 text-2xl font-bold leading-tight tracking-tight text-[#1e3a5f]">
            {title}
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-slate-400">
            {subtitle}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-6 max-md:self-end">
          <div className="relative">
            <button
              aria-label="Open notifications"
              className="relative p-2 text-slate-500 hover:text-slate-800"
              onClick={handleToggleNotifications}
              type="button"
            >
              <BellIcon className="h-6 w-6" />
              {unreadCount > 0 ? (
                <span className="absolute right-0 top-0 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[0.68rem] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </button>

            {isNotificationsOpen ? (
              <div className="absolute right-0 top-[120%] z-40 w-80 overflow-hidden rounded-xl bg-white shadow-[0_18px_40px_rgba(15,23,42,0.18)] ring-1 ring-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <h2 className="text-sm font-semibold text-slate-800">Notifications</h2>
                  <button
                    className="text-xs font-semibold text-[#1e3a5f] hover:underline disabled:text-slate-300"
                    disabled={unreadCount === 0}
                    onClick={handleMarkAllRead}
                    type="button"
                  >
                    Mark all read
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {isLoadingNotifications ? (
                    <div className="px-4 py-6 text-sm text-slate-500">Loading notifications...</div>
                  ) : null}
                  {!isLoadingNotifications && notifications.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-slate-500">No admin notifications yet.</div>
                  ) : null}
                  {!isLoadingNotifications
                    ? notifications.map((notification) => (
                        <button
                          className={[
                            "block w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50",
                            notification.is_read ? "bg-white" : "bg-blue-50/70",
                          ].join(" ")}
                          key={notification.notification_id}
                          onClick={() => handleMarkRead(notification.notification_id)}
                          type="button"
                        >
                          <span className="block text-sm font-semibold text-slate-800">
                            {notification.title}
                          </span>
                          <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                            {notification.message}
                          </span>
                          <span className="mt-2 block text-[0.68rem] font-medium uppercase tracking-[0.08em] text-slate-400">
                            {new Date(notification.created_at).toLocaleString("en-PH")}
                          </span>
                        </button>
                      ))
                    : null}
                </div>
              </div>
            ) : null}
          </div>

          <div className="relative">
            <button
              className="flex items-center gap-3"
              onClick={() => setIsUserMenuOpen((open) => !open)}
              type="button"
            >
              {getProfileImageUrl(adminImage) ? (
                <img
                  alt={adminName || "Admin"}
                  className="h-10 w-10 rounded-full object-cover"
                  src={getProfileImageUrl(adminImage) || ""}
                />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1e3a5f] text-sm font-semibold text-white">
                  AD
                </span>
              )}
              <span className="flex flex-col text-left max-md:hidden">
                <span className="text-sm font-medium text-slate-800">
                  {adminName}
                </span>
                <span className="text-xs text-slate-500">{adminPosition}</span>
              </span>
              <ChevronDownIcon className="h-4.5 w-4.5 text-slate-500" />
            </button>

            {isUserMenuOpen ? (
              <div className="absolute right-0 top-[120%] z-30 w-44 overflow-hidden rounded-xl bg-white py-1.5 shadow-[0_18px_40px_rgba(15,23,42,0.18)] ring-1 ring-slate-200">
                <button
                  className="block w-full px-3 py-2 text-center text-sm text-slate-900 hover:bg-blue-50"
                  onClick={() => openAccountModal("profile")}
                  type="button"
                >
                  Edit Profile
                </button>
                <button
                  className="block w-full px-3 py-2 text-center text-sm text-slate-900 hover:bg-blue-50"
                  onClick={() => openAccountModal("add-admin")}
                  type="button"
                >
                  Add New Admin
                </button>
                <button
                  className="block w-full px-3 py-2 text-center text-sm text-slate-900 hover:bg-blue-50"
                  onClick={openLogoutDialog}
                  type="button"
                >
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <AdminAccountModals
        modal={accountModal}
        onClose={() => setAccountModal(null)}
      />
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
