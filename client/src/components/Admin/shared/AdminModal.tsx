import { type ReactNode } from "react";

type AdminModalProps = {
  children: ReactNode;
  footer?: ReactNode;
  maxWidthClass?: string;
  onClose: () => void;
  open: boolean;
  title: string;
};

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export default function AdminModal({
  children,
  footer,
  maxWidthClass = "max-w-2xl",
  onClose,
  open,
  title,
}: AdminModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-1000 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <section
        aria-modal="true"
        className={[
          "max-h-[90vh] w-full overflow-hidden rounded-2xl bg-white shadow-[0_28px_80px_rgba(15,23,42,0.28)]",
          maxWidthClass,
        ].join(" ")}
        role="dialog"
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            aria-label="Close modal"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            onClick={onClose}
            type="button"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[calc(90vh-9rem)] overflow-y-auto px-6 py-5">
          {children}
        </div>
        {footer ? (
          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 px-6 py-4">
            {footer}
          </div>
        ) : null}
      </section>
    </div>
  );
}
