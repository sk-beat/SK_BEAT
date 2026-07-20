import { useAuth } from "../../../auth/useAuth";
import { supabase } from "@/lib/supabase";
import AdminModal from "./AdminModal";
import { useEffect, useState } from "react";
import {
  buildAdminProfileImagePath,
  deleteProfileImage,
  getProfileImageUrl,
  uploadProfileImage,
  validateProfileImageFile,
} from "../../../utils/profileImages";

type AccountModalKind = "profile" | "add-admin" | null;

type AdminAccountModalsProps = {
  modal: AccountModalKind;
  onClose: () => void;
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 disabled:opacity-70";

function Field({
  disabled,
  label,
  type = "text",
  value,
  name,
  onChange,
}: {
  disabled?: boolean;
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
        disabled={disabled}
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
  const [profileImage, setProfileImage] = useState<string>("");
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);

  const [password, setPassword] = useState<string>(" ");
  // const [isLoading, setIsLoading] = useState<boolean>(false);

  async function fetchAdmin() {
    const { data } = await supabase
      .from("admins")
      .select("*")
      .eq("admin_id", user?.id)
      .single();

    setAdminName(data.fullname);
    setPosition(data.position);
    setEmail(data.email);
    setContactNumber(data.contact_number);
    setBarangay(data.barangay);
    setProfileImage(data.profile_image ?? "");
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAddAdminSubmit() {
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

    // setIsLoading(true);

    const {  error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: AdminName,
          position: position,
        },
      },
    });

    // setIsLoading(false);

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

  async function handleSaveAdminProfile() {
    if (!user?.id) return;
    let nextProfileImage = profileImage || null;
    let uploadedPath: string | null = null;

    if (profileImageFile) {
      const validationError = validateProfileImageFile(profileImageFile);
      if (validationError) {
        alert(validationError);
        return;
      }

      uploadedPath = buildAdminProfileImagePath(user.id, profileImageFile);
      const { error: uploadError } = await uploadProfileImage(uploadedPath, profileImageFile);
      if (uploadError) {
        alert(uploadError.message);
        return;
      }
      nextProfileImage = uploadedPath;
    }

    const { error } = await supabase.rpc("update_admin_profile_image", {
      p_profile_image: nextProfileImage,
    });

    if (error) {
      if (uploadedPath) await deleteProfileImage(uploadedPath);
      alert(error.message);
      return;
    }

    if (uploadedPath && profileImage && profileImage !== uploadedPath) {
      await deleteProfileImage(profileImage);
    }

    setProfileImage(nextProfileImage ?? "");
    setProfileImageFile(null);
    setProfileImagePreview(null);
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
              onClick={handleSaveAdminProfile}
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
          <div>
            <Field disabled label="Email Address" type="email" value={email} />
            <p className="mt-1.5 text-xs text-slate-500">
              This email is linked to your account and cannot be changed.
            </p>
          </div>
          <Field label="Contact Number" value={contactNumber} />
          <div className="md:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Profile Image
            </span>
            <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              {profileImagePreview || getProfileImageUrl(profileImage || null) ? (
                <img
                  alt="Admin profile preview"
                  className="h-20 w-20 rounded-full object-cover"
                  src={profileImagePreview || getProfileImageUrl(profileImage || null) || ""}
                />
              ) : (
                <div className="grid h-20 w-20 place-items-center rounded-full bg-white text-xs font-semibold text-slate-400">
                  No image
                </div>
              )}
              <div className="min-w-0 flex-1">
                <input
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setProfileImageFile(file);
                    setProfileImagePreview(file ? URL.createObjectURL(file) : null);
                  }}
                  type="file"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Optional JPG, PNG, or WebP up to 5 MB.
                </p>
              </div>
            </div>
          </div>
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
