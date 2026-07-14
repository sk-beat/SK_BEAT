import { type ReactNode } from "react";

type AdminModalProps = {
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  open: boolean;
  title: string;
};

export default function AdminModal({
  children,
  footer,
  onClose,
  open,
  title,
}: AdminModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-1000 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <section
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-[0_28px_80px_rgba(15,23,42,0.3)]"
        role="dialog"
      >
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-bold text-[#0b1f3b]">{title}</h2>
          <button
            aria-label="Close modal"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            x
          </button>
        </header>
        <div className="max-h-[calc(90vh-9rem)] overflow-y-auto px-6 py-5">
          {children}
        </div>
        {footer ? (
          <footer className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
            {footer}
          </footer>
        ) : null}
      </section>
    </div>
  );
}
