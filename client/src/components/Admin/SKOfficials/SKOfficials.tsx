import { useEffect, useState } from "react";
import { useAuth } from "../../../auth/useAuth";
import Sidebar from "../../Sidebar/Sidebar";
import AdminModal from "../shared/AdminModal";
import {
  buildOfficialPhotoPath,
  deleteOfficialPhoto,
  deleteSKOfficial,
  getAdminSKOfficials,
  getPhotoPublicUrl,
  isOfficialPhotoPath,
  saveSKOfficial,
  SK_OFFICIAL_POSITIONS,
  uploadOfficialPhoto,
  validateOfficialPhoto,
  type SKOfficial,
  type SKOfficialPayload,
  type SKOfficialPosition,
} from "./SKOfficialsService";

type ModalMode = "edit" | "create" | null;

type OfficialFormState = {
  biography: string;
  full_name: string;
  position: SKOfficialPosition | "";
  term_end: string;
  term_start: string;
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/15";

function emptyForm(): OfficialFormState {
  return {
    biography: "",
    full_name: "",
    position: "",
    term_end: "",
    term_start: "",
  };
}

function officialToForm(official: SKOfficial): OfficialFormState {
  return {
    biography: official.biography ?? "",
    full_name: official.full_name,
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
      {getInitials(official.full_name) || "SK"}
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
      maxWidthClass="max-w-3xl"
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
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Position *
          </span>
          <select
            className={inputClass}
            onChange={(event) =>
              onChange("position", event.target.value as SKOfficialPosition)
            }
            value={form.position}
          >
            <option value="">Select position</option>
            {SK_OFFICIAL_POSITIONS.map((position) => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>
        </label>
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

        <label className="block md:col-span-2">
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

export default function SKOfficials() {
  const { logout } = useAuth();
  const [officials, setOfficials] = useState<SKOfficial[]>([]);
  const [selectedOfficial, setSelectedOfficial] = useState<SKOfficial | null>(
    null,
  );
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [form, setForm] = useState<OfficialFormState>(emptyForm());
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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
    setForm(emptyForm());
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
    if (form.full_name.trim() === "") {
      setFormError("Full name is required.");
      return null;
    }

    if (!form.position) {
      setFormError("Position is required.");
      return null;
    }

    if (form.term_start && form.term_end && form.term_end < form.term_start) {
      setFormError("Term end cannot be earlier than term start.");
      return null;
    }

    return {
      biography: form.biography.trim() || null,
      full_name: form.full_name.trim(),
      official_id: selectedOfficial?.official_id ?? null,
      photo_path: photoPath,
      position: form.position,
      term_end: form.term_end || null,
      term_start: form.term_start || null,
    };
  }

  async function createPlaceholderOfficial(payload: SKOfficialPayload) {
    const { data, error } = await saveSKOfficial({
      ...payload,
      photo_path: null,
    });

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error("Unable to save official.");
    }

    return data;
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

    const initialPayload = getPayload(selectedOfficial?.photo_path ?? null);

    if (!initialPayload) {
      return;
    }

    setIsSaving(true);

    try {
      let officialId = selectedOfficial?.official_id ?? null;
      let nextPhotoPath = selectedOfficial?.photo_path ?? null;
      let uploadedPhotoPath: string | null = null;
      let savedOfficial: SKOfficial | null = null;

      if (!officialId) {
        savedOfficial = await createPlaceholderOfficial(initialPayload);
        officialId = savedOfficial.official_id;
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

      const { error } = await saveSKOfficial({
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

      setSuccessMessage(selectedOfficial ? "Official updated." : "Official created.");
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
          {successMessage ? (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
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
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Official</th>
                      <th className="px-4 py-3">Term</th>
                      <th className="px-4 py-3">Biography</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {officials.map((official) => (
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
                          {formatTerm(official)}
                        </td>
                        <td className="max-w-md px-4 py-4 text-slate-600">
                          <span className="line-clamp-2">
                            {official.biography || "Not set"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                              onClick={() => openEditModal(official)}
                              type="button"
                            >
                              Edit
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
    </div>
  );
}
