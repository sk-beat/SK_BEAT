type YouthHeaderProps = {
  subtitle: string;
  title: string;
  userInitial?: string;
};

export default function YouthHeader({
  subtitle,
  title,
  userInitial = "M",
}: YouthHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 max-sm:items-start">
        <div className="min-w-0 flex-1">
          <h1 className="m-0 text-2xl font-bold leading-tight tracking-tight text-[#1e3a5f] sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            {subtitle}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1e3a5f] text-sm font-semibold text-white shadow-sm">
          {userInitial}
        </div>
      </div>
    </header>
  );
}
