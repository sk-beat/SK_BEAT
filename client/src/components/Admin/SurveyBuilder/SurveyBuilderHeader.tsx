export default function SurveyBuilderHeader() {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-8 py-5">
      <div className="min-w-0 flex-1">
        <h1 className="m-0 text-2xl font-bold leading-tight tracking-tight text-[#1e3a5f]">
          Add Survey
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-slate-400">
          Create checkbox-based surveys for Kabataan and manage existing survey
          templates
        </p>
      </div>
    </header>
  );
}
