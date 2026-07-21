import { useEffect, useState } from "react";
import { useAuth } from "../../../auth/useAuth";
import Sidebar from "../../Sidebar/Sidebar";
import AdminModal from "../shared/AdminModal";
import YouthRecordHeader from "./YouthRecordHeader";
import YouthRecordModals, { type YouthRecordModalMode } from "./YouthRecordModals";
import YouthRecordTable from "./YouthRecordTable";
import YouthRecordToolbar from "./YouthRecordToolbar";
import { type CreateYouthRecord, type UpdateYouthRecord, type YouthRecord as YouthRecordType } from "./youthRecordData";
import { sendYouthWelcomeEmail } from "../../../services/emailService";
import { addYouth, deleteYouth, getYouthRecords, lockYouth, recordYouthWelcomeEmailResult, unlockYouth, updateYouth } from "./YouthRecordService";
import { openOfficialPdfReport } from "../../../utils/pdfExport";

type AccountAction = "lock" | "unlock" | null;
type ToastState = { message: string; tone: "success" | "error" } | null;
type PendingWelcomeEmail = {
  email: string;
  name: string;
  password: string;
  profileId: string;
} | null;

function calculateAge(dateOfBirth: string | null) {
  if (!dateOfBirth) return null;
  const [year, month, day] = dateOfBirth.split("-").map(Number);
  if (!year || !month || !day) return null;
  const today = new Date();
  let age = today.getFullYear() - year;
  const hasBirthdayPassed =
    today.getMonth() + 1 > month ||
    (today.getMonth() + 1 === month && today.getDate() >= day);
  if (!hasBirthdayPassed) age -= 1;
  return age;
}

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getAccountAccessLabel(record: YouthRecordType) {
  if (record.status === "active") return "Active";
  if (record.account_lock_reason === "age_limit") return "Locked - age limit";
  if (record.account_lock_reason === "manual_admin") return "Locked - manual";
  return "Locked";
}

function getLockReasonLabel(record: YouthRecordType) {
  if (record.account_lock_reason === "age_limit") return "Age limit";
  if (record.account_lock_reason === "manual_admin") return "Locked manually by Admin";
  return "-";
}

function AccountDetail({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-slate-800">
        {value ?? "-"}
      </p>
    </div>
  );
}

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

  return matchesSearch && matchesScholar && matchesEducation;
});

function exportYouthRecords() {
  if (filteredRecords.length === 0) {
    window.alert("No youth records to export.");
    return;
  }

  try {
    openOfficialPdfReport({
      columns: [
        { header: "#", value: (_record, index) => index + 1 },
        { header: "Full Name", value: (record) => record.fullname },
        { header: "Email", value: (record) => record.email },
        { header: "Age", value: (record) => calculateAge(record.date_of_birth) ?? "-" },
        { header: "Gender", value: (record) => record.gender },
        { header: "Purok", value: (record) => record.purok },
        { header: "Education", value: (record) => record.educational_status },
        { header: "Access", value: (record) => getAccountAccessLabel(record) },
        { header: "Contact", value: (record) => record.contact_number },
      ],
      fileName: `youth-records-${new Date().toISOString().slice(0, 10)}.pdf`,
      rows: filteredRecords,
      subtitle: "Filtered Kabataan profile records",
      summary: [
        { label: "Total Records", value: filteredRecords.length },
        { label: "Scholar Filter", value: scholarFilter || "All" },
        { label: "Education Filter", value: educationFilter || "All" },
      ],
      title: "Youth Records Report",
    });
  } catch (error) {
    window.alert(error instanceof Error ? error.message : "Unable to export youth records.");
  }
}

  
  const [modalMode, setModalMode] = useState<YouthRecordModalMode>(null);
  const [selectedRecord, setSelectedRecord] = useState<YouthRecordType | null>(
    null,
  );
  const [accountAction, setAccountAction] = useState<AccountAction>(null);
  const [accountActionRecord, setAccountActionRecord] =
    useState<YouthRecordType | null>(null);
  const [accountActionLoading, setAccountActionLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [pendingWelcomeEmail, setPendingWelcomeEmail] = useState<PendingWelcomeEmail>(null);
  const [isRetryingWelcomeEmail, setIsRetryingWelcomeEmail] = useState(false);

  function openModal(mode: Exclude<YouthRecordModalMode, null>, record?: YouthRecordType) {
    setSelectedRecord(record ?? null);
    setModalMode(mode);
  }

  function closeModal() {
    setModalMode(null);
    setSelectedRecord(null);
  }

  function getToastTone(message: string, tone: "success" | "error") {
    const normalizedMessage = message.toLowerCase();

    if (
      normalizedMessage.includes("created successfully") ||
      normalizedMessage.includes("updated successfully") ||
      normalizedMessage.includes("sent successfully") ||
      normalizedMessage.includes("welcome email sent")
    ) {
      return "success";
    }

    return tone;
  }

  function showToast(message: string, tone: "success" | "error") {
    setToast({ message, tone: getToastTone(message, tone) });
    window.setTimeout(() => setToast(null), 4200);
  }

  function openAccountAction(action: Exclude<AccountAction, null>, record: YouthRecordType) {
    if (accountActionLoading) return;
    setAccountAction(action);
    setAccountActionRecord(record);
  }

  function closeAccountAction() {
    if (accountActionLoading) return;
    setAccountAction(null);
    setAccountActionRecord(null);
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
  data: CreateYouthRecord
){
  const { data: createdProfile, error } = await addYouth(data);

  if (error) {
    setPendingWelcomeEmail(null);
    showToast(error.message, "error");
    return null;
  }

  if (!createdProfile?.profile_id || !createdProfile.temporary_password) {
    showToast("Youth account was not created.", "error");
    return null;
  }

  const welcomeEmail = {
    email: createdProfile.email,
    name: data.fullname,
    password: createdProfile.temporary_password,
  };

  try {
    console.log("welcome email send starting", {
      hasEmail: Boolean(welcomeEmail.email),
      hasName: Boolean(welcomeEmail.name),
      hasPassword: Boolean(welcomeEmail.password),
      profileId: createdProfile.profile_id,
    });
    await sendYouthWelcomeEmail(welcomeEmail);
    console.log("welcome email send finished", {
      profileId: createdProfile.profile_id,
    });
    await recordYouthWelcomeEmailResult({
      profileId: createdProfile.profile_id,
      sent: true,
    });
    setPendingWelcomeEmail(null);
    showToast("Youth account created successfully and welcome email sent.", "success");
  } catch (emailError) {
    await recordYouthWelcomeEmailResult({
      errorMessage:
        emailError instanceof Error ? emailError.message : "EmailJS delivery failed.",
      profileId: createdProfile.profile_id,
      sent: false,
    });
    setPendingWelcomeEmail({
      ...welcomeEmail,
      profileId: createdProfile.profile_id,
    });
    showToast("Youth account created successfully, but the welcome email could not be sent.", "success");
  }

  await loadRecords();
  return createdProfile?.profile_id ?? null;
}

async function handleRetryWelcomeEmail() {
  if (!pendingWelcomeEmail || isRetryingWelcomeEmail) return;

  setIsRetryingWelcomeEmail(true);

  try {
    await sendYouthWelcomeEmail({
      email: pendingWelcomeEmail.email,
      name: pendingWelcomeEmail.name,
      password: pendingWelcomeEmail.password,
    });
    await recordYouthWelcomeEmailResult({
      profileId: pendingWelcomeEmail.profileId,
      sent: true,
    });

    setPendingWelcomeEmail(null);
    await loadRecords();
    showToast("Welcome email sent.", "success");
  } catch (emailError) {
    await recordYouthWelcomeEmailResult({
      errorMessage:
        emailError instanceof Error ? emailError.message : "EmailJS delivery failed.",
      profileId: pendingWelcomeEmail.profileId,
      sent: false,
    });
    showToast("Welcome email could not be sent.", "error");
  } finally {
    setIsRetryingWelcomeEmail(false);
  }
}

async function editYouth(
  profile_id: string,
  data: UpdateYouthRecord
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
    throw error;
  }

  await loadRecords();
  closeModal();
  showToast("Youth account permanently deleted.", "success");
}

async function lockYouthAccount(profile_id: string) {
  const { error } = await lockYouth(profile_id);

  if (error) {
    throw error;
  }

  await loadRecords();
}

async function unlockYouthAccount(profile_id: string) {
  const { error } = await unlockYouth(profile_id);

  if (error) {
    throw error;
  }

  await loadRecords();
}

async function confirmAccountAction() {
  if (!accountAction || !accountActionRecord || accountActionLoading) return;

  try {
    setAccountActionLoading(true);

    if (accountAction === "lock") {
      await lockYouthAccount(accountActionRecord.profile_id);
      showToast("Kabataan account locked successfully.", "success");
    } else {
      await unlockYouthAccount(accountActionRecord.profile_id);
      showToast("Kabataan account unlocked successfully.", "success");
    }

    setAccountAction(null);
    setAccountActionRecord(null);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Account action failed. Please try again.";
    showToast(message, "error");
  } finally {
    setAccountActionLoading(false);
  }
}

const selectedAccountAge = calculateAge(accountActionRecord?.date_of_birth ?? null);
const isOverAgeLimit = (selectedAccountAge ?? 0) >= 31;
const isUnlockBlocked = accountAction === "unlock" && isOverAgeLimit;

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
  onLock={(record) => openAccountAction("lock", record)}
  onUnlock={(record) => openAccountAction("unlock", record)}
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
      <AdminModal
        footer={
          <>
            <button
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={accountActionLoading}
              onClick={closeAccountAction}
              type="button"
            >
              Cancel
            </button>
            <button
              className={[
                "rounded-lg px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50",
                accountAction === "lock"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-[#1e3a5f] hover:bg-[#2a4a6f]",
              ].join(" ")}
              disabled={accountActionLoading || isUnlockBlocked}
              onClick={confirmAccountAction}
              type="button"
            >
              {accountActionLoading
                ? accountAction === "lock"
                  ? "Locking..."
                  : "Unlocking..."
                : accountAction === "lock"
                  ? "Lock Account"
                  : "Unlock Account"}
            </button>
          </>
        }
        onClose={closeAccountAction}
        open={accountAction !== null && accountActionRecord !== null}
        title={accountAction === "lock" ? "Lock Kabataan Account?" : "Unlock Kabataan Account?"}
      >
        {accountActionRecord ? (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-slate-600">
              {accountAction === "lock"
                ? "This user will no longer be able to access the Youth portal until an administrator unlocks the account."
                : "This user will regain access to the Youth portal if they are still within the allowed age limit."}
            </p>
            {isUnlockBlocked ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                This account cannot be unlocked because the Kabataan is over the age limit.
              </p>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <AccountDetail label="Full name" value={accountActionRecord.fullname} />
              </div>
              <AccountDetail label="Email" value={accountActionRecord.email} />
              <AccountDetail label="Calculated age" value={selectedAccountAge ?? "-"} />
              {accountAction === "lock" ? (
                <AccountDetail
                  label="Current account access"
                  value={getAccountAccessLabel(accountActionRecord)}
                />
              ) : (
                <>
                  <AccountDetail
                    label="Birthday"
                    value={formatDate(accountActionRecord.date_of_birth)}
                  />
                  <AccountDetail
                    label="Lock reason"
                    value={getLockReasonLabel(accountActionRecord)}
                  />
                  <AccountDetail
                    label="Locked date"
                    value={formatDateTime(accountActionRecord.account_locked_at)}
                  />
                </>
              )}
            </div>
          </div>
        ) : null}
      </AdminModal>
      {toast ? (
        <div
          className={[
            "fixed bottom-5 right-5 z-1100 max-w-sm rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg",
            toast.tone === "success" ? "bg-emerald-600" : "bg-red-600",
          ].join(" ")}
          role="status"
        >
          <div className="flex items-center gap-3">
            <span>{toast.message}</span>
            {pendingWelcomeEmail ? (
              <button
                className="rounded-md bg-white/15 px-2 py-1 text-xs font-semibold hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isRetryingWelcomeEmail}
                onClick={handleRetryWelcomeEmail}
                type="button"
              >
                {isRetryingWelcomeEmail ? "Sending..." : "Retry Welcome Email"}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
