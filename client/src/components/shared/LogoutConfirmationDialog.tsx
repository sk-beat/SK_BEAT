import AdminModal from "../Admin/shared/AdminModal";

type LogoutConfirmationDialogProps = {
  errorMessage: string | null;
  isLoggingOut: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
};

export default function LogoutConfirmationDialog({
  errorMessage,
  isLoggingOut,
  onCancel,
  onConfirm,
  open,
}: LogoutConfirmationDialogProps) {
  return (
    <AdminModal
      footer={
        <>
          <button
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoggingOut}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4a6f] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoggingOut}
            onClick={onConfirm}
            type="button"
          >
            {isLoggingOut ? "Logging out..." : "Log out"}
          </button>
        </>
      }
      maxWidthClass="max-w-md"
      onClose={isLoggingOut ? () => undefined : onCancel}
      open={open}
      title="Log out?"
    >
      <p className="text-sm leading-6 text-slate-600">
        Are you sure you want to log out of your SK Beat account?
      </p>
      {errorMessage ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}
    </AdminModal>
  );
}
