import {
  categories,
  iconToneClasses,
  insights,
  insightToneClasses,
  summaryCards,
  upcomingEvents,
  type SummaryCard,
} from "./dashboardData";
import { ArrowRightIcon, TrendingIcon, UserRoundIcon } from "./icons";

function SummaryCardItem({ card }: { card: SummaryCard }) {
  const Icon = card.icon;

  return (
    <article className="flex items-center justify-between rounded-[14px] border border-[#1e3a5f]/15 bg-white px-6 py-5 shadow-sm">
      <div className="flex min-w-0 flex-col gap-1.5">
        <span className="text-sm font-semibold tracking-[0.02em] text-slate-400">
          {card.title}
        </span>
        <span className="text-3xl font-bold leading-tight tracking-tight text-[#1e3a5f]">
          {card.value}
        </span>
        <span
          className={[
            "flex items-center gap-1 text-[0.8125rem] font-medium",
            card.noteTone === "positive" ? "text-emerald-500" : "text-slate-400",
          ].join(" ")}
        >
          {card.noteTone === "positive" ? (
            <TrendingIcon className="h-4 w-4" />
          ) : null}
          {card.note}
        </span>
      </div>
      <div
        className={[
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
          iconToneClasses[card.tone],
        ].join(" ")}
      >
        <Icon className="h-6 w-6" />
      </div>
    </article>
  );
}

function PopulationCard() {
  return (
    <section className="flex h-full flex-col gap-5 rounded-[14px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="m-0 text-sm font-semibold uppercase tracking-[0.1em] text-slate-400">
            Youth population overview
          </h2>
          <p className="mt-1 text-[0.8125rem] text-slate-400">
            Registered youth by gender or purok
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none"
            aria-label="Sort population overview"
          >
            <option>By Gender</option>
            <option>By Purok</option>
          </select>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1e3a5f]/6 text-[#1e3a5f]">
            <UserRoundIcon className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3">
        <h3 className="text-[0.8rem] font-semibold text-slate-400">
          By Gender
        </h3>
        <div className="flex flex-wrap items-center gap-6">
          <div className="relative h-[200px] w-[200px] shrink-0 rounded-full bg-[conic-gradient(#1a529b_0_52%,#38b6ff_52%_100%)]">
            <div className="absolute inset-[24px] rounded-full bg-white" />
            <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-slate-900">
              15
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2 text-sm">
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#1a529b]" />
              <span className="text-slate-800">Male</span>
              <span className="text-slate-500">8</span>
            </div>
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#38b6ff]" />
              <span className="text-slate-800">Female</span>
              <span className="text-slate-500">7</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoryCard() {
  return (
    <section className="rounded-[14px] border border-[#1e3a5f]/20 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="m-0 text-sm font-semibold uppercase tracking-[0.1em] text-slate-400">
          Participants by category
        </h2>
        <select
          className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none"
          aria-label="Filter participants by month"
        >
          <option>All months</option>
          <option>January</option>
          <option>February</option>
          <option>March</option>
        </select>
      </div>

      <div className="flex h-[180px] items-end gap-4 border-b border-slate-200 pt-6">
        {categories.map((category) => (
          <div
            className="flex flex-1 flex-col items-center justify-end gap-2"
            key={category.label}
          >
            <div
              className="w-full max-w-12 rounded-t-md bg-[#1e3a5f]"
              style={{ height: `${category.value}%` }}
            />
            <span className="text-[0.7rem] font-medium text-slate-500">
              {category.label}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-400">
        Sports currently leads participant demand across submitted youth
        responses.
      </p>
    </section>
  );
}

function InsightsPanel() {
  return (
    <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="m-0 text-base font-semibold text-slate-800">
            Decision Support Insights
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            AI-powered recommendations based on your data
          </p>
        </div>
        <a
          className="inline-flex items-center gap-1 text-sm font-medium text-[#1e3a5f] hover:underline"
          href="#insights"
        >
          View All Insights <ArrowRightIcon className="h-4 w-4" />
        </a>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {insights.map((insight) => {
          const Icon = insight.icon;
          const tone = insightToneClasses[insight.tone];

          return (
            <article
              className={[
                "flex items-center gap-4 rounded-[14px] p-5 shadow-sm",
                tone.card,
              ].join(" ")}
              key={insight.title}
            >
              <div
                className={[
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                  tone.icon,
                ].join(" ")}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-slate-800">
                  {insight.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  {insight.description}
                </p>
                <a
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#1e3a5f] hover:underline"
                  href="#action"
                >
                  {insight.action} <ArrowRightIcon className="h-3.5 w-3.5" />
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function UpcomingEvents() {
  function ClockIcon({ className }: { className?: string }) {
    return (
      <svg
        aria-hidden="true"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    );
  }

  function MapPinIcon({ className }: { className?: string }) {
    return (
      <svg
        aria-hidden="true"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    );
  }

  function UsersMiniIcon({ className }: { className?: string }) {
    return (
      <svg
        aria-hidden="true"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      </svg>
    );
  }

  return (
    <section className="mt-8">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800">
          Upcoming Events
        </h2>
        <a
          className="inline-flex items-center gap-1 text-sm text-[#1e3a5f] hover:underline"
          href="#events"
        >
          View All <ArrowRightIcon className="h-4 w-4" />
        </a>
      </div>

      <div className="flex flex-col gap-4">
        {upcomingEvents.map((event) => (
          <article
            className="flex overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm max-sm:flex-col"
            key={`${event.month}-${event.day}-${event.title}`}
          >
            <div className="flex w-24 min-w-24 flex-col items-center justify-center bg-[#1e3a5f] p-4 text-white max-sm:w-full max-sm:flex-row max-sm:gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide">
                {event.month}
              </span>
              <span className="text-3xl font-bold leading-tight">
                {event.day}
              </span>
            </div>
            <div className="flex-1 px-6 py-5">
              <h3 className="text-lg font-semibold text-slate-800">
                {event.title}
              </h3>
              <div className="mt-3 flex flex-col gap-2 text-sm font-medium text-slate-400">
                <span className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4" />
                  {event.time}
                </span>
                <span className="flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4" />
                  {event.location}
                </span>
                <span className="flex items-center gap-2">
                  <UsersMiniIcon className="h-4 w-4" />
                  Registered: {event.registered}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function DashboardSections() {
  return (
    <div className="flex-1 p-8">
      <section className="mb-8 grid grid-cols-4 gap-6 max-xl:grid-cols-2 max-md:grid-cols-1">
        {summaryCards.map((card) => (
          <SummaryCardItem card={card} key={card.title} />
        ))}
      </section>

      <section className="mb-6 grid grid-cols-2 gap-6 max-xl:grid-cols-1">
        <PopulationCard />
        <CategoryCard />
      </section>

      <InsightsPanel />
      <UpcomingEvents />
    </div>
  );
}
