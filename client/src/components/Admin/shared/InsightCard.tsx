import type { ReactNode } from "react";
import {
  insightToneClasses,
  type InsightTone,
} from "../Dashboard/dashboardData";
import type { IconProps } from "../Dashboard/icons";

type InsightCardProps = {
  action?: ReactNode;
  description: string;
  icon: (props: IconProps) => ReactNode;
  title: string;
  tone: InsightTone;
};

export default function InsightCard({
  action,
  description,
  icon: Icon,
  title,
  tone,
}: InsightCardProps) {
  const toneClasses = insightToneClasses[tone];

  return (
    <article
      className={[
        "flex items-center gap-4 rounded-[14px] p-5 shadow-sm",
        toneClasses.card,
      ].join(" ")}
    >
      <div
        className={[
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          toneClasses.icon,
        ].join(" ")}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          {description}
        </p>
        {action}
      </div>
    </article>
  );
}
