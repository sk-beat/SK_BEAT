import { useEffect, useState } from "react";
import ImageUploadField from "../../shared/ImageUploadField";
import AdminModal from "../shared/AdminModal";
import type { Announcement, AnnouncementPayload } from "./AnnouncementsService";

type SurveysAnnouncementsModalsProps = {
  announcement: Announcement | null;
  errorMessage: string | null;
  isSaving: boolean;
  onClose: () => void;
  onSaveAnnouncement: (payload: AnnouncementPayload) => Promise<void>;
  openCreateAnnouncement: boolean;
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/15";

export default function SurveysAnnouncementsModals({
  announcement,
  errorMessage,
  isSaving,
  onClose,
  onSaveAnnouncement,
  openCreateAnnouncement,
}: SurveysAnnouncementsModalsProps) {
  const [form, setForm] = useState({
    category: "",
    content: "",
    expires_at: "",
    image_path: "",
    is_published: false,
    priority: "0",
    publish_at: "",
    title: "",
  });

  useEffect(() => {
    if (!openCreateAnnouncement) return;

    // Reset the editable modal state whenever the create/edit dialog opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      category: announcement?.category ?? "",
      content: announcement?.content ?? "",
      expires_at: announcement?.expires_at ? announcement.expires_at.slice(0, 16) : "",
      image_path: announcement?.image_path ?? "",
      is_published: announcement?.is_published ?? false,
      priority: String(announcement?.priority ?? 0),
      publish_at: announcement?.publish_at
        ? announcement.publish_at.slice(0, 16)
        : new Date().toISOString().slice(0, 16),
      title: announcement?.title ?? "",
    });
  }, [announcement, openCreateAnnouncement]);

  function updateField(field: keyof typeof form, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSave() {
    await onSaveAnnouncement({
      announcement_id: announcement?.announcement_id,
      category: form.category.trim() || null,
      content: form.content.trim(),
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      image_path: form.image_path.trim() || null,
      is_published: form.is_published,
      priority: Number(form.priority) || 0,
      publish_at: new Date(form.publish_at).toISOString(),
      title: form.title.trim(),
    });
  }

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
            className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4a6f] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving || !form.title.trim() || !form.content.trim() || !form.publish_at}
            onClick={handleSave}
            type="button"
          >
            {isSaving ? "Saving..." : "Save Announcement"}
          </button>
        </>
      }
      onClose={onClose}
      open={openCreateAnnouncement}
      title={announcement ? "Edit Announcement" : "Create Announcement"}
    >
      <div className="grid gap-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Title
          </span>
          <input
            className={inputClass}
            onChange={(event) => updateField("title", event.target.value)}
            placeholder="e.g. Call for Youth Volunteers"
            type="text"
            value={form.title}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Category
            </span>
            <input
              className={inputClass}
              onChange={(event) => updateField("category", event.target.value)}
              placeholder="General"
              type="text"
              value={form.category}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Priority
            </span>
            <input
              className={inputClass}
              min="0"
              onChange={(event) => updateField("priority", event.target.value)}
              type="number"
              value={form.priority}
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Publish Date
            </span>
            <input
              className={inputClass}
              onChange={(event) => updateField("publish_at", event.target.value)}
              type="datetime-local"
              value={form.publish_at}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Expiration Date
            </span>
            <input
              className={inputClass}
              onChange={(event) => updateField("expires_at", event.target.value)}
              type="datetime-local"
              value={form.expires_at}
            />
          </label>
        </div>
        <ImageUploadField
          disabled={isSaving}
          folder="announcements"
          label="Announcement Image"
          onChange={(value) => updateField("image_path", value ?? "")}
          value={form.image_path || null}
        />
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Message
          </span>
          <textarea
            className={`${inputClass} min-h-36 resize-none`}
            onChange={(event) => updateField("content", event.target.value)}
            placeholder="Announcement details..."
            value={form.content}
          />
        </label>
        <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            checked={form.is_published}
            className="h-4 w-4 rounded border-slate-300 text-[#1e3a5f]"
            onChange={(event) => updateField("is_published", event.target.checked)}
            type="checkbox"
          />
          Published
        </label>
        {errorMessage ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}
      </div>
    </AdminModal>
  );
}
