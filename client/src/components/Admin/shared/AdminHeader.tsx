import { useState } from "react";
import { useAuth } from "../../../auth/useAuth";
import { BellIcon, ChevronDownIcon } from "../Dashboard/icons";
import AdminAccountModals from "./AdminAccountModals";

type AccountModalKind = "profile" | "add-admin" | null;

type AdminHeaderProps = {
  subtitle: string;
  title: string;
};

export default function AdminHeader({ subtitle, title }: AdminHeaderProps) {
  const { logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [accountModal, setAccountModal] = useState<AccountModalKind>(null);

  function openAccountModal(modal: AccountModalKind) {
    setAccountModal(modal);
    setIsUserMenuOpen(false);
  }

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
          <button
            aria-label="Open notifications"
            className="relative p-2 text-slate-500 hover:text-slate-800"
            type="button"
          >
            <BellIcon className="h-6 w-6" />
          </button>

          <div className="relative">
            <button
              className="flex items-center gap-3"
              onClick={() => setIsUserMenuOpen((open) => !open)}
              type="button"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1e3a5f] text-sm font-semibold text-white">
                JD
              </span>
              <span className="flex flex-col text-left max-md:hidden">
                <span className="text-sm font-medium text-slate-800">
                  Juan Dela Cruz
                </span>
                <span className="text-xs text-slate-500">SK Chairman</span>
              </span>
              <ChevronDownIcon className="h-[18px] w-[18px] text-slate-500" />
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
                  onClick={logout}
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
    </>
  );
}
