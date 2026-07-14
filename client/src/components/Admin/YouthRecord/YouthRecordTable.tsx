import type { YouthRecord } from "./youthRecordData";

function EyeIcon({ className }: { className?: string }) {
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
      <path d="M2.1 12S5.5 5 12 5s9.9 7 9.9 7-3.4 7-9.9 7-9.9-7-9.9-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
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
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
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
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function YouthRecordTable({
  onDelete,
  onEdit,
  onView,
  records,
}: {
  onDelete: (record: YouthRecord) => void;
  onEdit: (record: YouthRecord) => void;
  onView: (record: YouthRecord) => void;
  records: YouthRecord[];
}) {
  return (
    <div className="overflow-hidden overflow-x-auto rounded-[14px] border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[860px] border-collapse text-sm">
        <thead>
          <tr>
            {[
              "ID",
              "Name",
              "Gender",
              "Scholar Status",
              "Status",
              "Purok",
              "Actions",
            ].map((heading) => (
              <th
                className="bg-slate-50 px-5 py-4 text-center text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-slate-400"
                key={heading}
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr className="hover:bg-slate-50" key={record.profile_id}>
              <td className="border-t px-5 py-4">
                #{record.profile_id.slice(0,8)}
              </td>
              <td className="border-t border-slate-200 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 min-w-9 items-center justify-center rounded-full bg-[#1e3a5f] text-xs font-semibold text-white">
                    {initials(record.fullname)}
                  </span>
                  <span className="font-medium text-slate-800">
                    {record.fullname}
                  </span>
                </div>
              </td>
              <td className="border-t border-slate-200 px-5 py-4 text-center">
                {record.gender === "Male" ? "M" : "F"}
              </td>
              <td className="border-t border-slate-200 px-5 py-4 text-center">
                {record.scholar_status}
              </td>
              <td className="border-t border-slate-200 px-5 py-4 text-center">
                <span
                  className={[
                    "inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold",
                    record.educational_status === "Active"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-slate-200 text-slate-500",
                  ].join(" ")}
                >
                  {record.educational_status === "Active" ? "✓" : null}
                  {record.educational_status}
                </span>
              </td>
              <td className="border-t border-slate-200 px-5 py-4 text-center">
                {record.purok}
              </td>
              <td className="border-t border-slate-200 px-5 py-4">
                <div className="flex justify-center gap-3">
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                    onClick={() => onView(record)}
                    type="button"
                    title="View"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                    onClick={() => onEdit(record)}
                    type="button"
                    title="Edit"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-red-100 hover:text-red-600"
                    onClick={() => onDelete(record)}
                    type="button"
                    title="Delete"
                  >
                    <TrashIcon className="h-4 w-4 " />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
