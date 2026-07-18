import { Eye, Lock, LockOpen, Pencil, Trash2 } from "lucide-react";
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

function formatBirthday(value: string | null) {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function YouthRecordTable({
  onDelete,
  onEdit,
  onLock,
  onUnlock,
  onView,
  records,
}: {
  onDelete: (record: YouthRecord) => void;
  onEdit: (record: YouthRecord) => void;
  onLock: (record: YouthRecord) => void;
  onUnlock: (record: YouthRecord) => void;
  onView: (record: YouthRecord) => void;
  records: YouthRecord[];
}) {
  function getHeadingClass(heading: string) {
    return [
      "bg-slate-50 px-5 py-4 text-center text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-slate-400",
      heading === "Birthday" ? "min-w-[150px] whitespace-nowrap" : "",
    ].join(" ");
  }

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
              "Account Access",
              "Purok",
              "Actions",
            ].map((heading) => (
              <th
                className={getHeadingClass(heading)}
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
              <td className="min-w-[150px] whitespace-nowrap border-t border-slate-200 px-5 py-4 text-center">
                {formatBirthday(record.date_of_birth)}
              </td>
              <td className="border-t border-slate-200 px-5 py-4 text-center">
                <span
                  className={[
                    "inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold",
                    record.status === "active"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-red-500/10 text-red-600",
                  ].join(" ")}
                  title={
                    record.account_lock_reason === "age_limit"
                      ? "Locked automatically because the Youth is 31 or older."
                      : record.account_lock_reason === "manual_admin"
                        ? "Locked manually by Admin."
                        : "Account is active."
                  }
                >
                  {record.status === "active" ? "Active" : "Locked"}
                </span>
                {record.account_lock_reason ? (
                  <p className="mt-1 text-xs text-slate-400">
                    {record.account_lock_reason === "age_limit"
                      ? "Age limit"
                      : "Manual"}
                  </p>
                ) : null}
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
                  {record.status === "active" ? (
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-amber-100 hover:text-amber-700"
                      onClick={() => onLock(record)}
                      type="button"
                      title="Lock account"
                    >
                      <Lock className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-emerald-100 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={record.account_lock_reason === "age_limit"}
                      onClick={() => onUnlock(record)}
                      type="button"
                      title={
                        record.account_lock_reason === "age_limit"
                          ? "Age-locked accounts cannot be unlocked"
                          : "Unlock account"
                      }
                    >
                      <LockOpen className="h-4 w-4" />
                    </button>
                  )}
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
