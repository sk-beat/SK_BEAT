import { useState } from "react";
import { useAuth } from "../../../auth/useAuth";
import Sidebar from "../../Sidebar/Sidebar";
import YouthRecordHeader from "./YouthRecordHeader";
import YouthRecordModals, { type YouthRecordModalMode } from "./YouthRecordModals";
import YouthRecordTable from "./YouthRecordTable";
import YouthRecordToolbar from "./YouthRecordToolbar";
import { type YouthRecord as YouthRecordType, youthRecords } from "./youthRecordData";

export default function YouthRecord() {
  const { logout } = useAuth();
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

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900">
      <Sidebar onLogout={logout} />
      <main className="ml-[88px] flex min-h-screen flex-1 flex-col transition-[margin-left] duration-300 ease-in-out peer-hover/sidebar:ml-[300px] max-md:ml-[72px] max-md:peer-hover/sidebar:ml-[72px]">
        <YouthRecordHeader />
        <div className="flex-1 px-8 py-6">
          <YouthRecordToolbar
            onAdd={() => openModal("add")}
            totalRecords={youthRecords.length}
          />
          <YouthRecordTable
            onDelete={(record) => openModal("delete", record)}
            onEdit={(record) => openModal("edit", record)}
            onView={(record) => openModal("view", record)}
            records={youthRecords}
          />
        </div>
      </main>
      <YouthRecordModals
        mode={modalMode}
        onClose={closeModal}
        record={selectedRecord}
      />
    </div>
  );
}
