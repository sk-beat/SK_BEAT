import AdminModal from "./AdminModal";

type AccountModalKind = "profile" | "add-admin" | null;

type AdminAccountModalsProps = {
  modal: AccountModalKind;
  onClose: () => void;
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/15";

function Field({
  label,
  type = "text",
  value,
}: {
  label: string;
  type?: string;
  value?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <input className={inputClass} defaultValue={value} type={type} />
    </label>
  );
}

export default function AdminAccountModals({
  modal,
  onClose,
}: AdminAccountModalsProps) {
  return (
    <>
      <AdminModal
        footer={
          <>
            <button
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4a6f]"
              onClick={onClose}
              type="button"
            >
              Save Changes
            </button>
          </>
        }
        onClose={onClose}
        open={modal === "profile"}
        title="Edit Admin Profile"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Full Name" value="Juan Dela Cruz" />
          <Field label="Position" value="SK Chairman" />
          <Field label="Email Address" type="email" value="admin@skbeat.gov" />
          <Field label="Contact Number" value="0917-000-0000" />
          <label className="block md:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Barangay
            </span>
            <input
              className={inputClass}
              defaultValue="Barangay Galas Maasim"
              type="text"
            />
          </label>
        </div>
      </AdminModal>

      <AdminModal
        footer={
          <>
            <button
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4a6f]"
              onClick={onClose}
              type="button"
            >
              Add Admin
            </button>
          </>
        }
        onClose={onClose}
        open={modal === "add-admin"}
        title="Add New Admin"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Full Name" />
          <Field label="Position" />
          <Field label="Email Address" type="email" />
          <Field label="Temporary Password" type="password" />
        </div>
      </AdminModal>
    </>
  );
}
