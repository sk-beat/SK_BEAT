import { useEffect, useState } from "react";
import { useAuth } from "../../../auth/useAuth";
import Sidebar from "../../Sidebar/Sidebar";
import YouthRecordHeader from "./YouthRecordHeader";
import YouthRecordModals, { type YouthRecordModalMode } from "./YouthRecordModals";
import YouthRecordTable from "./YouthRecordTable";
import YouthRecordToolbar from "./YouthRecordToolbar";
import { type YouthRecord as YouthRecordType } from "./youthRecordData";
import { addYouth, deleteYouth, getYouthRecords, updateYouth } from "./YouthRecordService";

export default function YouthRecord() {
  const { logout } = useAuth();
  const [records, setRecords] = useState<YouthRecordType[]>([]);

  const [search, setSearch] = useState("");
const [scholarFilter, setScholarFilter] = useState("");
const [educationFilter, setEducationFilter] = useState("");

const filteredRecords = records.filter((record) => {
  const searchValue = search.toLowerCase();

  const matchesSearch =
    record.fullname.toLowerCase().includes(searchValue) ||
    record.purok.toLowerCase().includes(searchValue);

  const matchesScholar =
    scholarFilter === ""
      ? true
      : record.scholar_status === scholarFilter;

    

  const matchesEducation =
    educationFilter === ""
      ? true
      : record.educational_status === educationFilter;

  return matchesSearch && matchesScholar && matchesEducation  ;
});

function escapeCsvCell(value: string | number | null | undefined) {
  const stringValue = String(value ?? "");
  return `"${stringValue.split('"').join('""')}"`;
}

function exportYouthRecords() {
  if (filteredRecords.length === 0) {
    window.alert("No youth records to export.");
    return;
  }

  const headers = [
    "Profile ID",
    "Full Name",
    "Email",
    "Age",
    "Gender",
    "Purok",
    "Address",
    "Educational Status",
    "Scholar Status",
    "Contact Number",
    "Created At",
  ];

  const rows = filteredRecords.map((record) => [
    record.profile_id,
    record.fullname,
    record.email,
    record.age,
    record.gender,
    record.purok,
    record.address_line,
    record.educational_status,
    record.scholar_status,
    record.contact_number,
    record.created_at,
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\n");
  const csvWithBom = `\uFEFF${csv}`;
  const url = `data:text/csv;charset=utf-8,${encodeURIComponent(csvWithBom)}`;
  const link = document.createElement("a");

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `youth-records-${new Date().toISOString().slice(0, 10)}.csv`,
  );
  link.download = `youth-records-${new Date().toISOString().slice(0, 10)}.csv`;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

  
  const [modalMode, setModalMode] = useState<YouthRecordModalMode>(null);
  const [selectedRecord, setSelectedRecord] = useState<YouthRecordType | null>(
    null,
  );

  function openModal(mode: Exclude<YouthRecordModalMode, null>, record?: YouthRecordType) {
    setSelectedRecord(record ?? null);
    setModalMode(mode);
  }

  function closeModal() {
    setModalMode(null);
    setSelectedRecord(null);
  }

  useEffect(() => {
    loadRecords();
}, []);

async function loadRecords() {
    const { data, error } = await getYouthRecords();

    if (error) {
        console.error(error);
        return;
    }

    setRecords(data ?? []);
}
async function createYouth(
  data: Omit<YouthRecordType, "profile_id" | "created_at">
){
  const { error } = await addYouth(data);

  if (error) {
    console.error(error);
    return;
  }

  await loadRecords();
  closeModal();
}

async function editYouth(
  profile_id: string,
  data: Omit<YouthRecordType, "profile_id" | "created_at">
) {
  const { error } = await updateYouth(profile_id, data);

  if (error) {
    console.error(error);
    return;
  }

  await loadRecords();
  closeModal();
}

async function removeYouth(profile_id: string) {
  const { error } = await deleteYouth(profile_id);

  if (error) {
    console.error(error);
    return;
  }

  await loadRecords();
  closeModal();
}

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900">
      <Sidebar onLogout={logout} />
      <main className="ml-22 flex min-h-screen flex-1 flex-col transition-[margin-left] duration-300 ease-in-out peer-hover/sidebar:ml-75 max-md:ml-18 max-md:peer-hover/sidebar:ml-18">
        <YouthRecordHeader />
        <div className="flex-1 px-8 py-6">
          <YouthRecordToolbar
  onAdd={() => openModal("add")}
  onExport={exportYouthRecords}
  totalRecords={records.length}
  visibleRecords={filteredRecords.length}
  search={search}
  setSearch={setSearch}
  scholarFilter={scholarFilter}
  setScholarFilter={setScholarFilter}
  educationFilter={educationFilter}
  setEducationFilter={setEducationFilter}
/>
  

        <YouthRecordTable
  onDelete={(record) => openModal("delete", record)}
  onEdit={(record) => openModal("edit", record)}
  onView={(record) => openModal("view", record)}
  records={filteredRecords}
/>
        </div>
      </main>
      <YouthRecordModals
        mode={modalMode}
        record={selectedRecord}
        onClose={closeModal}
        onCreate={createYouth}
        onUpdate={editYouth}
        onDelete={removeYouth}
    />
    </div>
  );
}
