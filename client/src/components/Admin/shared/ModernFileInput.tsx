type ModernFileInputProps = {
  accept?: string;
  label?: string;
  multiple?: boolean;
};

function UploadIcon({ className }: { className?: string }) {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m17 8-5-5-5 5" />
      <path d="M12 3v12" />
    </svg>
  );
}

export default function ModernFileInput({
  accept,
  label = "Upload file",
  multiple = false,
}: ModernFileInputProps) {
  return (
    <label className="group flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 transition hover:border-[#1e3a5f] hover:bg-blue-50">
      <input accept={accept} className="sr-only" multiple={multiple} type="file" />
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#1e3a5f] shadow-sm ring-1 ring-slate-200 group-hover:ring-[#1e3a5f]/20">
          <UploadIcon className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-slate-800">
            {label}
          </span>
          <span className="block truncate text-xs text-slate-400">
            PNG, JPG, or PDF up to 10MB
          </span>
        </span>
      </span>
      <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200">
        Browse
      </span>
    </label>
  );
}
