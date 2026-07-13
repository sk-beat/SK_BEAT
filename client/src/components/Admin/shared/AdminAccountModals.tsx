import AdminModal from "./AdminModal";
import { supabase } from "../../../utils/supabase";
import { useState } from "react";

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

  const [AdminName, setAdminName] = useState<string>("");
  const [position, setPosition] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleAddAdminSubmit = async () => {
    console.log("Adding admin with details:", { AdminName, position, email, password });
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
  };

  return (
    <>
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
          <Field label="Full Name" value="Juan Dela Cruz" />
          <Field label="Position" value="SK Chairman" />
          <Field label="Email Address" type="email" value="admin@skbeat.gov" />
          <Field label="Contact Number" value="0917-000-0000" />
          <label className="block md:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Barangay
            </span>
            <input
              className={inputClass}
              defaultValue="Barangay Galas Maasim"
              type="text"
            />
          </label>
        </div>
      </AdminModal>

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
              onClick={()=> handleAddAdminSubmit() }
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
          <Field label="Full Name" onChange={(e) => setAdminName(e.target.value)} />
          <Field label="Position" onChange={(e) => setPosition(e.target.value)} />
          <Field label="Email Address" type="email" onChange={(e) => setEmail(e.target.value)} />
          <Field label="Temporary Password" type="password" onChange={(e) => setPassword(e.target.value)} />
        </div>
      </AdminModal>
    </>
  );
}
