import { useEffect, useState } from "react";
import {
  getPhotoPublicUrl,
  getPublicSKOfficials,
  type SKOfficial,
} from "../../components/Admin/SKOfficials/SKOfficialsService";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function AdminOfficialsPage() {
  const [officials, setOfficials] = useState<SKOfficial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadOfficials() {
      setIsLoading(true);
      setErrorMessage("");

      const { data, error } = await getPublicSKOfficials();

      if (error) {
        setErrorMessage(error.message);
      } else {
        setOfficials(data);
      }

      setIsLoading(false);
    }

    void Promise.resolve().then(() => loadOfficials());
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-6 py-14">
      <h1 className="text-3xl font-bold text-[#0b1f3b]">SK Officials</h1>
      <p className="mt-2 text-slate-500">Meet the youth leaders serving Barangay Galas Maasim.</p>

      {isLoading ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <article
              className="rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm"
              key={index}
            >
              <div className="mx-auto h-24 w-24 animate-pulse rounded-full bg-slate-200" />
              <div className="mx-auto mt-4 h-4 w-32 animate-pulse rounded bg-slate-200" />
              <div className="mx-auto mt-2 h-3 w-24 animate-pulse rounded bg-slate-100" />
            </article>
          ))}
        </div>
      ) : null}

      {!isLoading && errorMessage ? (
        <p className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMessage}
        </p>
      ) : null}

      {!isLoading && !errorMessage && officials.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center text-sm text-slate-500">
          No active SK officials are available yet.
        </p>
      ) : null}

      {!isLoading && !errorMessage && officials.length > 0 ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {officials.map((official) => {
            const photoUrl = getPhotoPublicUrl(official.photo_path);

            return (
              <article className="rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm" key={official.official_id}>
                {photoUrl ? (
                  <img
                    alt={official.full_name}
                    className="mx-auto h-24 w-24 rounded-full object-cover"
                    src={photoUrl}
                  />
                ) : (
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#1e3a5f] text-2xl font-bold text-white">
                    {getInitials(official.full_name) || "SK"}
                  </div>
                )}
                <h2 className="mt-4 font-bold text-slate-900">
                  {official.full_name}
                </h2>
                <p className="mt-1 text-sm font-medium text-[#1e3a5f]">
                  {official.position}
                </p>
                {official.biography ? (
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    {official.biography}
                  </p>
                ) : null}
                {(official.term_start || official.term_end) ? (
                  <p className="mt-3 text-xs font-medium text-slate-400">
                    {official.term_start ?? "Start not set"} - {official.term_end ?? "Present"}
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : null}
    </main>
  );
}
