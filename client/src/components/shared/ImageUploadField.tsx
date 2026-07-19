import { useRef, useState } from "react";
import {
  buildContentImagePath,
  getProfileImageUrl,
  uploadProfileImage,
  validateProfileImageFile,
} from "../../utils/profileImages";

type ImageUploadFieldProps = {
  disabled?: boolean;
  folder: "announcements" | "events";
  label: string;
  onChange: (url: string | null) => void;
  value: string | null;
};

export default function ImageUploadField({
  disabled = false,
  folder,
  label,
  onChange,
  value,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFileChange(file: File | undefined) {
    if (!file) return;

    const validationError = validateProfileImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsUploading(true);

    const path = buildContentImagePath(folder, file);
    const { error: uploadError } = await uploadProfileImage(path, file);

    setIsUploading(false);

    if (uploadError) {
      setError(uploadError.message);
      return;
    }

    onChange(getProfileImageUrl(path));
  }

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {value ? (
        <img
          alt=""
          className="h-40 w-full rounded-xl border border-slate-200 object-cover"
          src={value}
        />
      ) : (
        <div className="grid h-40 place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
          No image selected
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disabled || isUploading}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          {isUploading ? "Uploading..." : value ? "Replace Image" : "Upload Image"}
        </button>
        {value ? (
          <button
            className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={disabled || isUploading}
            onClick={() => onChange(null)}
            type="button"
          >
            Remove
          </button>
        ) : null}
      </div>
      <input
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        disabled={disabled || isUploading}
        onChange={(event) => void handleFileChange(event.target.files?.[0])}
        ref={inputRef}
        type="file"
      />
      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
      <p className="text-xs text-slate-500">JPG, PNG, or WebP. Maximum 5 MB.</p>
    </div>
  );
}
