import AdminModal from "../shared/AdminModal";
import ModernFileInput from "../shared/ModernFileInput";

type SurveysAnnouncementsModalsProps = {
  onClose: () => void;
  openCreateAnnouncement: boolean;
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/15";

export default function SurveysAnnouncementsModals({
  onClose,
  openCreateAnnouncement,
}: SurveysAnnouncementsModalsProps) {
  return (
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
            Save Announcement
          </button>
        </>
      }
      onClose={onClose}
      open={openCreateAnnouncement}
      title="Create Announcement"
    >
      <div className="grid gap-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Title
          </span>
          <input
            className={inputClass}
            placeholder="e.g. Call for Youth Volunteers"
            type="text"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Images (optional)
          </span>
          <ModernFileInput accept="image/*" label="Choose announcement images" multiple />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Message
          </span>
          <textarea
            className={`${inputClass} min-h-36 resize-none`}
            placeholder="Announcement details..."
          />
        </label>
      </div>
    </AdminModal>
  );
}
