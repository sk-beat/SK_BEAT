import { Eye, Pencil, Trash2 } from "lucide-react";
import type { YouthRecord } from "./youthRecordData";

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
      <table className="w-full min-w-230 border-collapse text-sm">
        <thead>
          <tr>
            {[
              "ID",
              "Name",
              "Gender",
              "Scholar Status",
              "Educational Status",
              "Age",
              "Birthday",
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
                #{record.profile_id.slice(0, 8)}
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
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  {record.educational_status}
                </span>
              </td>
              <td className="border-t border-slate-200 px-5 py-4 text-center">
                {record.age ?? "-"}
              </td>
              <td className="border-t border-slate-200 px-5 py-4 text-center">
                {record.date_of_birth ?? "-"}
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
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                    onClick={() => onEdit(record)}
                    type="button"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-red-100 hover:text-red-600"
                    onClick={() => onDelete(record)}
                    type="button"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
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
