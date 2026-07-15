import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../auth/useAuth";
import Sidebar from "../../Sidebar/Sidebar";
import AdminModal from "../shared/AdminModal";
import {
  buildOfficialPhotoPath,
  createSKOfficial,
  deleteOfficialPhoto,
  deleteSKOfficial,
  getAdminSKOfficials,
  getPhotoPublicUrl,
  isOfficialPhotoPath,
  updateSKOfficial,
  uploadOfficialPhoto,
  validateOfficialPhoto,
  type SKOfficial,
  type SKOfficialPayload,
} from "./SKOfficialsService";

type ModalMode = "view" | "edit" | "create" | null;

type OfficialFormState = {
  full_name: string;
  position: string;
  committee: string;
  biography: string;
  display_order: string;
  is_active: boolean;
  term_start: string;
  term_end: string;
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/15";

function emptyForm(nextOrder: number): OfficialFormState {
  return {
    biography: "",
    committee: "",
    display_order: String(nextOrder),
    full_name: "",
    is_active: true,
    position: "",
    term_end: "",
    term_start: "",
  };
}

function officialToForm(official: SKOfficial): OfficialFormState {
  return {
    biography: official.biography ?? "",
    committee: official.committee ?? "",
    display_order: String(official.display_order),
    full_name: official.full_name,
    is_active: official.is_active,
    position: official.position,
    term_end: official.term_end ?? "",
    term_start: official.term_start ?? "",
  };
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatTerm(official: SKOfficial) {
  if (!official.term_start && !official.term_end) {
    return "Not set";
  }

  return `${official.term_start ?? "Start not set"} - ${official.term_end ?? "Present"}`;
}

function PhotoAvatar({ official }: { official: SKOfficial }) {
  const photoUrl = getPhotoPublicUrl(official.photo_path);

  if (photoUrl) {
    return (
      <img
        alt={official.full_name}
        className="h-12 w-12 rounded-full object-cover"
        src={photoUrl}
      />
    );
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1e3a5f] text-sm font-bold text-white">
      {getInitials(official.full_name) || official.display_order + 1}
    </div>
  );
}

function Field({
  label,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <input
        className={inputClass}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}

function OfficialFormModal({
  errorMessage,
  form,
  isSaving,
  mode,
  onChange,
  onClose,
  onFileChange,
  onSave,
  photoFile,
  selectedOfficial,
}: {
  errorMessage: string;
  form: OfficialFormState;
  isSaving: boolean;
  mode: "create" | "edit";
  onChange: <T extends keyof OfficialFormState>(
    field: T,
    value: OfficialFormState[T],
  ) => void;
  onClose: () => void;
  onFileChange: (file: File | null) => void;
  onSave: () => void;
  photoFile: File | null;
  selectedOfficial: SKOfficial | null;
}) {
  const photoUrl = selectedOfficial
    ? getPhotoPublicUrl(selectedOfficial.photo_path)
    : null;

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
            disabled={isSaving}
            onClick={onSave}
            type="button"
          >
            {isSaving ? "Saving..." : "Save Official"}
          </button>
        </>
      }
      maxWidthClass="max-w-4xl"
      onClose={onClose}
      open
      title={mode === "create" ? "Add SK Official" : "Edit SK Official"}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {errorMessage ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 md:col-span-2">
            {errorMessage}
          </p>
        ) : null}

        <Field
          label="Full Name *"
          onChange={(value) => onChange("full_name", value)}
          placeholder="Juan Dela Cruz"
          value={form.full_name}
        />
        <Field
          label="Position *"
          onChange={(value) => onChange("position", value)}
          placeholder="SK Chairperson"
          value={form.position}
        />
        <Field
          label="Committee or Responsibility"
          onChange={(value) => onChange("committee", value)}
          placeholder="Education Committee"
          value={form.committee}
        />
        <Field
          label="Display Order *"
          onChange={(value) => onChange("display_order", value)}
          type="number"
          value={form.display_order}
        />
        <Field
          label="Term Start"
          onChange={(value) => onChange("term_start", value)}
          type="date"
          value={form.term_start}
        />
        <Field
          label="Term End"
          onChange={(value) => onChange("term_end", value)}
          type="date"
          value={form.term_end}
        />

        <label className="block md:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Short Biography
          </span>
          <textarea
            className={`${inputClass} min-h-28 resize-none`}
            onChange={(event) => onChange("biography", event.target.value)}
            placeholder="Brief public description"
            value={form.biography}
          />
        </label>

        <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
          <input
            checked={form.is_active}
            className="h-4 w-4 accent-[#1e3a5f]"
            onChange={(event) => onChange("is_active", event.target.checked)}
            type="checkbox"
          />
          <span className="text-sm font-medium text-slate-700">
            Show on homepage
          </span>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Photo
          </span>
          <input
            accept="image/jpeg,image/png,image/webp"
            className={inputClass}
            onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
            type="file"
          />
          <span className="mt-1 block text-xs text-slate-400">
            JPG, PNG, or WebP up to 5MB.
          </span>
          {photoFile ? (
            <span className="mt-1 block text-xs font-medium text-[#1e3a5f]">
              Selected: {photoFile.name}
            </span>
          ) : null}
          {!photoFile && photoUrl ? (
            <span className="mt-1 block text-xs font-medium text-slate-500">
              Current photo will be kept.
            </span>
          ) : null}
        </label>
      </div>
    </AdminModal>
  );
}

function PreviewModal({
  official,
  onClose,
}: {
  official: SKOfficial;
  onClose: () => void;
}) {
  const photoUrl = getPhotoPublicUrl(official.photo_path);

  return (
    <AdminModal
      footer={
        <button
          className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4a6f]"
          onClick={onClose}
          type="button"
        >
          Done
        </button>
      }
      maxWidthClass="max-w-md"
      onClose={onClose}
      open
      title="Homepage Preview"
    >
      <article className="rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm">
        {photoUrl ? (
          <img
            alt={official.full_name}
            className="mx-auto h-24 w-24 rounded-full object-cover"
            src={photoUrl}
          />
        ) : (
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#1e3a5f] text-2xl font-bold text-white">
            {getInitials(official.full_name)}
          </div>
        )}
        <h2 className="mt-4 font-bold text-slate-900">{official.full_name}</h2>
        <p className="mt-1 text-sm font-medium text-[#1e3a5f]">
          {official.position}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {official.committee || "Barangay Galas Maasim"}
        </p>
        {official.biography ? (
          <p className="mt-3 text-sm text-slate-500">{official.biography}</p>
        ) : null}
      </article>
    </AdminModal>
  );
}

export default function SKOfficials() {
  const { logout } = useAuth();
  const [officials, setOfficials] = useState<SKOfficial[]>([]);
  const [selectedOfficial, setSelectedOfficial] = useState<SKOfficial | null>(
    null,
  );
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [form, setForm] = useState<OfficialFormState>(emptyForm(0));
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const activeCount = officials.filter((official) => official.is_active).length;
  const hiddenCount = officials.length - activeCount;
  const nextOrder = useMemo(
    () =>
      officials.length === 0
        ? 0
        : Math.max(...officials.map((official) => official.display_order)) + 1,
    [officials],
  );

  async function loadOfficials() {
    setIsLoading(true);
    setErrorMessage("");

    const { data, error } = await getAdminSKOfficials();

    if (error) {
      setErrorMessage(error.message);
    } else {
      setOfficials(data);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    void Promise.resolve().then(() => loadOfficials());
  }, []);

  function closeModal() {
    setModalMode(null);
    setSelectedOfficial(null);
    setPhotoFile(null);
    setFormError("");
  }

  function openCreateModal() {
    setSelectedOfficial(null);
    setForm(emptyForm(nextOrder));
    setPhotoFile(null);
    setFormError("");
    setModalMode("create");
  }

  function openEditModal(official: SKOfficial) {
    setSelectedOfficial(official);
    setForm(officialToForm(official));
    setPhotoFile(null);
    setFormError("");
    setModalMode("edit");
  }

  function updateForm<T extends keyof OfficialFormState>(
    field: T,
    value: OfficialFormState[T],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function getPayload(photoPath: string | null): SKOfficialPayload | null {
    const displayOrder = Number(form.display_order);

    if (form.full_name.trim() === "") {
      setFormError("Full name is required.");
      return null;
    }

    if (form.position.trim() === "") {
      setFormError("Position is required.");
      return null;
    }

    if (!Number.isInteger(displayOrder) || displayOrder < 0) {
      setFormError("Display order must be a nonnegative whole number.");
      return null;
    }

    if (form.term_start && form.term_end && form.term_end < form.term_start) {
      setFormError("Term end cannot be earlier than term start.");
      return null;
    }

    return {
      biography: form.biography.trim() || null,
      committee: form.committee.trim() || null,
      display_order: displayOrder,
      full_name: form.full_name.trim(),
      is_active: form.is_active,
      official_id: selectedOfficial?.official_id,
      photo_path: photoPath,
      position: form.position.trim(),
      term_end: form.term_end || null,
      term_start: form.term_start || null,
    };
  }

  async function handleSave() {
    setFormError("");
    setErrorMessage("");

    if (photoFile) {
      const photoError = validateOfficialPhoto(photoFile);

      if (photoError) {
        setFormError(photoError);
        return;
      }
    }

    setIsSaving(true);

    try {
      const isEditing = Boolean(selectedOfficial);
      let officialId = selectedOfficial?.official_id;
      let nextPhotoPath = selectedOfficial?.photo_path ?? null;
      let uploadedPhotoPath: string | null = null;

      if (!isEditing) {
        const initialPayload = getPayload(null);

        if (!initialPayload) {
          return;
        }

        const { data, error } = await createSKOfficial(initialPayload);

        if (error) {
          throw error;
        }

        officialId = data?.official_id;
      }

      if (!officialId) {
        throw new Error("Unable to identify the saved official.");
      }

      if (photoFile) {
        uploadedPhotoPath = buildOfficialPhotoPath(officialId, photoFile);
        const { error: uploadError } = await uploadOfficialPhoto(
          uploadedPhotoPath,
          photoFile,
        );

        if (uploadError) {
          throw uploadError;
        }

        nextPhotoPath = uploadedPhotoPath;
      }

      const finalPayload = getPayload(nextPhotoPath);

      if (!finalPayload) {
        if (uploadedPhotoPath) {
          await deleteOfficialPhoto(uploadedPhotoPath);
        }
        return;
      }

      const { error } = await updateSKOfficial({
        ...finalPayload,
        official_id: officialId,
      });

      if (error) {
        throw error;
      }

      const oldPhotoPath = selectedOfficial?.photo_path ?? null;

      if (
        uploadedPhotoPath &&
        oldPhotoPath &&
        oldPhotoPath !== uploadedPhotoPath &&
        isOfficialPhotoPath(oldPhotoPath)
      ) {
        await deleteOfficialPhoto(oldPhotoPath);
      }

      setSuccessMessage(isEditing ? "Official updated." : "Official created.");
      closeModal();
      await loadOfficials();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to save official.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(official: SKOfficial) {
    const shouldDelete = window.confirm(`Delete ${official.full_name}?`);

    if (!shouldDelete) {
      return;
    }

    setErrorMessage("");

    const { error } = await deleteSKOfficial(official.official_id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    if (official.photo_path && isOfficialPhotoPath(official.photo_path)) {
      await deleteOfficialPhoto(official.photo_path);
    }

    setSuccessMessage("Official deleted.");
    await loadOfficials();
  }

  async function handleToggleActive(official: SKOfficial) {
    setErrorMessage("");

    const { error } = await updateSKOfficial({
      ...official,
      is_active: !official.is_active,
    });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSuccessMessage(official.is_active ? "Official hidden." : "Official shown.");
    await loadOfficials();
  }

  async function handleMove(official: SKOfficial, direction: "up" | "down") {
    const currentIndex = officials.findIndex(
      (item) => item.official_id === official.official_id,
    );
    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const swapOfficial = officials[swapIndex];

    if (!swapOfficial) {
      return;
    }

    setErrorMessage("");

    const first = await updateSKOfficial({
      ...official,
      display_order: swapOfficial.display_order,
    });

    if (first.error) {
      setErrorMessage(first.error.message);
      return;
    }

    const second = await updateSKOfficial({
      ...swapOfficial,
      display_order: official.display_order,
    });

    if (second.error) {
      setErrorMessage(second.error.message);
      return;
    }

    setSuccessMessage("Display order updated.");
    await loadOfficials();
  }

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900">
      <Sidebar onLogout={logout} />
      <main className="ml-[88px] flex min-h-screen flex-1 flex-col transition-[margin-left] duration-300 ease-in-out peer-hover/sidebar:ml-[300px] max-md:ml-[72px] max-md:peer-hover/sidebar:ml-[72px]">
        <header className="border-b border-slate-200 bg-white px-6 py-6">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 max-sm:flex-col max-sm:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#1e3a5f]">
                Admin
              </p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">
                SK Officials
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Manage the officials displayed on the public homepage.
              </p>
            </div>
            <button
              className="rounded-lg bg-[#1e3a5f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2a4a6f]"
              onClick={openCreateModal}
              type="button"
            >
              Add Official
            </button>
          </div>
        </header>

        <section className="mx-auto w-full max-w-7xl flex-1 px-6 py-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-400">Total</p>
              <p className="mt-1 text-3xl font-bold text-[#1e3a5f]">
                {officials.length}
              </p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-400">Active</p>
              <p className="mt-1 text-3xl font-bold text-emerald-600">
                {activeCount}
              </p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-400">Hidden</p>
              <p className="mt-1 text-3xl font-bold text-slate-500">
                {hiddenCount}
              </p>
            </article>
          </div>

          {successMessage ? (
            <p className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {successMessage}
            </p>
          ) : null}

          {errorMessage ? (
            <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {errorMessage}
            </p>
          ) : null}

          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {isLoading ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500">
                Loading officials...
              </p>
            ) : null}

            {!isLoading && officials.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500">
                No SK officials yet. Add one to publish the homepage section.
              </p>
            ) : null}

            {!isLoading && officials.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Official</th>
                      <th className="px-4 py-3">Committee</th>
                      <th className="px-4 py-3">Term</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Order</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {officials.map((official, index) => (
                      <tr key={official.official_id}>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <PhotoAvatar official={official} />
                            <div>
                              <p className="font-semibold text-slate-900">
                                {official.full_name}
                              </p>
                              <p className="text-xs font-medium text-[#1e3a5f]">
                                {official.position}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          {official.committee || "Not set"}
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          {formatTerm(official)}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={[
                              "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                              official.is_active
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-600",
                            ].join(" ")}
                          >
                            {official.is_active ? "Active" : "Hidden"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          {official.display_order}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                              disabled={index === 0}
                              onClick={() => handleMove(official, "up")}
                              type="button"
                            >
                              Up
                            </button>
                            <button
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                              disabled={index === officials.length - 1}
                              onClick={() => handleMove(official, "down")}
                              type="button"
                            >
                              Down
                            </button>
                            <button
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                              onClick={() => {
                                setSelectedOfficial(official);
                                setModalMode("view");
                              }}
                              type="button"
                            >
                              Preview
                            </button>
                            <button
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                              onClick={() => openEditModal(official)}
                              type="button"
                            >
                              Edit
                            </button>
                            <button
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                              onClick={() => handleToggleActive(official)}
                              type="button"
                            >
                              {official.is_active ? "Hide" : "Activate"}
                            </button>
                            <button
                              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                              onClick={() => handleDelete(official)}
                              type="button"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </section>
      </main>

      {modalMode === "create" || modalMode === "edit" ? (
        <OfficialFormModal
          errorMessage={formError}
          form={form}
          isSaving={isSaving}
          mode={modalMode}
          onChange={updateForm}
          onClose={closeModal}
          onFileChange={setPhotoFile}
          onSave={handleSave}
          photoFile={photoFile}
          selectedOfficial={selectedOfficial}
        />
      ) : null}

      {modalMode === "view" && selectedOfficial ? (
        <PreviewModal official={selectedOfficial} onClose={closeModal} />
      ) : null}
    </div>
  );
}
