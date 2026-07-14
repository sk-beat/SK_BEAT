import type { ReactNode } from "react";

type YouthSectionCardProps = {
  children: ReactNode;
  icon?: ReactNode;
  subtitle?: string;
  title: string;
  tone?: "blue" | "emerald" | "orange" | "slate";
};

const toneClasses = {
  blue: "bg-blue-50 text-blue-600",
  emerald: "bg-emerald-50 text-emerald-600",
  orange: "bg-orange-50 text-orange-600",
  slate: "bg-slate-100 text-slate-600",
};

export default function YouthSectionCard({
  children,
  icon,
  subtitle,
  title,
  tone = "blue",
}: YouthSectionCardProps) {
  return (
    <section className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        {icon ? (
          <div
            className={[
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              toneClasses[tone],
            ].join(" ")}
          >
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}
