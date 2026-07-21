import { Download, Plus, Search } from "lucide-react";

type YouthRecordToolbarProps = {
  onAdd: () => void;
  onExport: () => void;
  totalRecords: number;
  visibleRecords: number;
  search: string;
  setSearch: (value: string) => void;
  scholarFilter: string;
  setScholarFilter: (value: string) => void;
  educationFilter: string;
  setEducationFilter: (value: string) => void;
};

export default function YouthRecordToolbar({
  onAdd,
  onExport,
  totalRecords,
  visibleRecords,
  search,
  setSearch,
  scholarFilter,
  setScholarFilter,
  educationFilter,
  setEducationFilter,
}: YouthRecordToolbarProps) {
  return (
    <>
      <div className="mb-4 flex gap-4 max-lg:flex-col">
        <label className="flex flex-1 items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <Search className="h-4.5 w-4.5 text-slate-500" />
          <input
            className="flex-1 border-none bg-transparent text-sm outline-none placeholder:text-slate-500"
            type="text"
            placeholder="Search by name or purok..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <div className="flex gap-3 max-sm:flex-col">
          <select
            value={educationFilter}
            onChange={(event) => setEducationFilter(event.target.value)}
            className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-3 pr-8 text-sm font-medium text-slate-700 shadow-sm"
          >
            <option value="">All Educational Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <select
            value={scholarFilter}
            onChange={(event) => setScholarFilter(event.target.value)}
            className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-3 pr-8 text-sm font-medium text-slate-700 shadow-sm"
          >
            <option value="">All Scholar Status</option>
            <option value="Scholar">Scholar</option>
            <option value="Non-Scholar">Non-Scholar</option>
          </select>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <span className="text-sm text-slate-500">
          Showing {visibleRecords} of {totalRecords} records
        </span>
        <div className="inline-flex flex-wrap items-center gap-3">
          <button
            className="inline-flex items-center gap-2 text-sm text-[#1e3a5f] hover:underline"
            onClick={onExport}
            type="button"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-[#1e3a5f] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#2a4a6f]"
            onClick={onAdd}
            type="button"
          >
            <Plus className="h-4.5 w-4.5" />
            Add New
          </button>
        </div>
      </div>
    </>
  );
}
