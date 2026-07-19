import { Image, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../../auth/useAuth";
import Sidebar from "../../Sidebar/Sidebar";
import AdminHeader from "../shared/AdminHeader";
import {
  getLandingAssetUrl,
  getPublicLandingPageSettings,
  removeLandingHeroImage,
  saveAdminLandingPageSettings,
  uploadLandingHeroImage,
} from "../../../services/LandingPageSettingsService";
import { youthImages } from "../../../utils/adminPortalData";

export default function LandingPageSettings() {
  const { logout } = useAuth();
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadSettings() {
      const { data, error } = await getPublicLandingPageSettings();
      if (error) setErrorMessage(error.message);
      setCurrentPath(data.hero_background_path);
      setIsLoading(false);
    }
    loadSettings();
  }, []);

  function handleFile(file: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
    setMessage("");
    setErrorMessage("");
  }

  async function handleSave() {
    setIsSaving(true);
    setMessage("");
    setErrorMessage("");
    let newPath = currentPath;

    try {
      if (selectedFile) {
        newPath = await uploadLandingHeroImage(selectedFile);
      }
      const { error } = await saveAdminLandingPageSettings(newPath);
      if (error) throw error;
      setCurrentPath(newPath);
      setSelectedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setMessage("Landing page hero background updated.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save settings.");
      if (selectedFile && newPath && newPath !== currentPath) {
        await removeLandingHeroImage(newPath);
      }
    } finally {
      setIsSaving(false);
    }
  }

  const displayUrl = previewUrl || getLandingAssetUrl(currentPath) || youthImages.galas;

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900">
      <Sidebar onLogout={logout} />
      <main className="ml-[88px] flex min-h-screen flex-1 flex-col transition-[margin-left] duration-300 ease-in-out peer-hover/sidebar:ml-[300px] max-md:ml-[72px] max-md:peer-hover/sidebar:ml-[72px]">
        <AdminHeader
          title="Landing Page"
          subtitle="Customize public website content and hero imagery."
        />
        <div className="flex-1 p-8">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
              <div>
                <h2 className="text-base font-semibold text-slate-800">Hero Background</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Image behind the main “Login to Join” section.
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                <Image className="h-4 w-4" />
                Upload/Replace
                <input
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  disabled={isSaving}
                  onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
                  type="file"
                />
              </label>
            </div>

            {errorMessage ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}
            {message ? (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {message}
              </div>
            ) : null}

            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
              {isLoading ? (
                <div className="p-8 text-sm text-slate-500">Loading settings...</div>
              ) : (
                <div
                  className="flex min-h-80 items-end bg-cover bg-center p-6 text-white"
                  style={{
                    backgroundImage: `linear-gradient(90deg, rgba(11,31,59,.88), rgba(11,31,59,.62)), url(${displayUrl})`,
                  }}
                >
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/75">Preview</p>
                    <h3 className="mt-2 text-3xl font-bold">SK Kabataan - Barangay Galas Maasim</h3>
                    <button className="mt-5 rounded-lg bg-white px-5 py-3 font-semibold text-[#0b1f3b]" type="button">
                      Login to Join
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#1e3a5f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2a4a6f] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSaving || isLoading || !selectedFile}
              onClick={handleSave}
              type="button"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save Background"}
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}
