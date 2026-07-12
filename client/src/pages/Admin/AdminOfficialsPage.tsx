import { officials } from "../../utils/adminPortalData";

export default function AdminOfficialsPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-14">
      <h1 className="text-3xl font-bold text-[#0b1f3b]">SK Officials</h1>
      <p className="mt-2 text-slate-500">Meet the youth leaders serving Barangay Galas Maasim.</p>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {officials.map((role, index) => (
          <article className="rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm" key={role}>
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#1e3a5f] text-2xl font-bold text-white">
              {index + 1}
            </div>
            <h2 className="mt-4 font-bold text-slate-900">{role}</h2>
            <p className="mt-1 text-sm text-slate-500">Barangay Galas Maasim</p>
          </article>
        ))}
      </div>
    </main>
  );
}
