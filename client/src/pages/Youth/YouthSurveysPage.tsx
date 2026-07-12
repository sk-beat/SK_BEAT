export default function YouthSurveysPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-14">
      <h1 className="text-3xl font-bold text-[#0b1f3b]">Surveys & Feedback</h1>
      <p className="mt-2 max-w-2xl text-slate-500">
        Share your voice and help the SK Council improve programs and services for the youth.
      </p>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-slate-900">Pre-Event Survey</h2>
          <p className="mt-2 text-sm text-slate-500">Select activities you want to see in future SK programs.</p>
          <div className="mt-5 flex flex-col gap-3">
            {["Sports Programs", "Educational Activities", "Community Service", "Health & Wellness"].map((item) => (
              <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3" key={item}>
                <input type="checkbox" />
                <span>{item}</span>
              </label>
            ))}
          </div>
          <button className="mt-5 rounded-lg bg-[#1e3a5f] px-5 py-2.5 text-sm font-semibold text-white" type="button">Submit Survey</button>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-slate-900">Share your suggestions</h2>
          <textarea className="mt-4 min-h-40 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none" placeholder="Share any ideas, concerns, or feedback for SK programs..." />
          <button className="mt-4 rounded-lg bg-[#1e3a5f] px-5 py-2.5 text-sm font-semibold text-white" type="button">Submit Feedback</button>
        </section>
      </div>
    </main>
  );
}
