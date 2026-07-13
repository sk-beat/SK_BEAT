import { useAuth } from "../../../auth/useAuth";
import { supabase } from "../../../utils/supabase";
import AdminModal from "./AdminModal";
import { useEffect, useState } from "react";

type AccountModalKind = "profile" | "add-admin" | null;

type AdminAccountModalsProps = {
  modal: AccountModalKind;
  onClose: () => void;
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/15";

function Field({
  label,
  type = "text",
  value,
  name,
  onChange,
}: {
  label: string;
  type?: string;
  value?: string;
  name?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <input
        className={inputClass}
        value={value}
        name={name}
        onChange={onChange}
        type={type}
      />
    </label>
  );
}

export default function AdminAccountModals({
  modal,
  onClose,
}: AdminAccountModalsProps) {
  const { user } = useAuth();

  const [AdminName, setAdminName] = useState<string>("");
  const [position, setPosition] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [contactNumber, setContactNumber] = useState<string>("");
  const [barangay, setBarangay] = useState<string>("");

  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  async function fetchAdmin() {
    const { data, error } = await supabase
      .from("admins")
      .select("*")
      .eq("admin_id", user?.id)
      .single();

    console.log(data.email);
    setAdminName(data.fullname);
    setPosition(data.position);
    setEmail(data.email);
    setContactNumber(data.contact_number);
    setBarangay(data.barangay);
  }

  useEffect(() => {
    fetchAdmin();
  }, []);

  async function handleAddAdminSubmit() {
    console.log("Adding admin with details:", {
      AdminName,
      position,
      email,
      password,
    });
    if (!email || !email.includes("@") || !email.includes(".")) {
      alert("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    if (!AdminName || !position) {
      alert("Please fill out all fields.");
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: AdminName,
          position: position,
        },
      },
    });

    setIsLoading(false);

    if (error) {
      if (error.message.includes("already registered")) {
        alert("An account with this email already exists.");
      } else {
        alert("Error adding admin: " + error.message);
      }
      return;
    }

    alert("Admin successfully added! They will need to verify their email.");

    setAdminName("");
    setPosition("");
    setEmail("");
    setPassword("");
    onClose();
  }

  return (
    <>
      {/* For Editing Admin Profile*/}
      <AdminModal
        footer={
          <>
            <button
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4a6f]"
              onClick={onClose}
              type="button"
            >
              Save Changes
            </button>
          </>
        }
        onClose={onClose}
        open={modal === "profile"}
        title="Edit Admin Profile"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Full Name" value={AdminName} />
          <Field label="Position" value={position} />
          <Field label="Email Address" type="email" value={email} />
          <Field label="Contact Number" value={contactNumber} />
          <label className="block md:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Barangay
            </span>
            <input className={inputClass} defaultValue={barangay} type="text" />
          </label>
        </div>
      </AdminModal>

      {/* For Creating new Admin */}
      <AdminModal
        footer={
          <>
            <button
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4a6f]"
              onClick={() => handleAddAdminSubmit()}
              type="button"
            >
              Add Admin
            </button>
          </>
        }
        onClose={onClose}
        open={modal === "add-admin"}
        title="Add New Admin"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Full Name"
            onChange={(e) => setAdminName(e.target.value)}
          />
          <Field
            label="Position"
            onChange={(e) => setPosition(e.target.value)}
          />
          <Field
            label="Email Address"
            type="email"
            onChange={(e) => setEmail(e.target.value)}
          />
          <Field
            label="Temporary Password"
            type="password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </AdminModal>
    </>
  );
}
