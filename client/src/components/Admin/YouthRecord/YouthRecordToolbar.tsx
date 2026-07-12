function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

type YouthRecordToolbarProps = {
  onAdd: () => void;
  totalRecords: number;
};

export default function YouthRecordToolbar({
  onAdd,
  totalRecords,
}: YouthRecordToolbarProps) {
  return (
    <>
      <div className="mb-4 flex gap-4 max-lg:flex-col">
        <label className="flex flex-1 items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <SearchIcon className="h-[18px] w-[18px] text-slate-500" />
          <input
            className="flex-1 border-none bg-transparent text-sm outline-none placeholder:text-slate-500"
            type="text"
            placeholder="Search by name or address..."
          />
        </label>

        <div className="flex gap-3 max-sm:flex-col">
          <select className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-3 pr-8 text-sm font-medium text-slate-700 shadow-sm">
            <option>By Scholar Status</option>
          </select>
          <select className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-3 pr-8 text-sm font-medium text-slate-700 shadow-sm">
            <option>Select Scholar Status</option>
            <option>Scholar</option>
            <option>Non-Scholar</option>
          </select>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <span className="text-sm text-slate-500">
          Showing {totalRecords} of {totalRecords} records
        </span>
        <div className="inline-flex flex-wrap items-center gap-3">
          <a
            className="inline-flex items-center gap-2 text-sm text-[#1e3a5f] hover:underline"
            href="#export"
          >
            <DownloadIcon className="h-4 w-4" />
            Export Data
          </a>
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-[#1e3a5f] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#2a4a6f]"
            onClick={onAdd}
            type="button"
          >
            <PlusIcon className="h-[18px] w-[18px]" />
            Add New
          </button>
        </div>
      </div>
    </>
  );
}
