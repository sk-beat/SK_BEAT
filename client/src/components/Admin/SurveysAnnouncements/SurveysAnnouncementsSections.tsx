import { Link } from "react-router-dom";
import { announcements, suggestions, surveyResponses } from "./surveysAnnouncementsData";

function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: Array<Array<string | number>>;
}) {
  return (
    <div className="overflow-hidden overflow-x-auto rounded-[14px] border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr>
            {headers.map((header) => (
              <th className="bg-[#1e3a5f] px-5 py-4 text-center text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-white" key={header}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr className="hover:bg-slate-50" key={String(row[0])}>
              {row.map((cell, index) => (
                <td className="border-t border-slate-200 px-5 py-4" key={`${cell}-${index}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function KabataanSuggestionsSection() {
  return (
    <div className="flex-1 p-8">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800">
          Kabataan Suggestions
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Free-form feedback submitted by Kabataan
        </p>
        <div className="mt-4">
          <DataTable
            headers={["#", "Date", "Feedback"]}
            rows={suggestions.map((item) => [
              item.id,
              item.date,
              item.feedback,
            ])}
          />
        </div>
      </section>
    </div>
  );
}

export function SurveyResponsesSection() {
  return (
    <div className="flex-1 p-8">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
          <div>
            <h2 className="text-base font-semibold text-slate-800">
              Survey Responses
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Answers from Kabataan to the activity survey
            </p>
          </div>
          <Link
            className="rounded-lg bg-[#1e3a5f] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#2a4a6f]"
            to="/survey-builder"
          >
            Add Survey
          </Link>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-500">
              Preferred activity types
            </h3>
            <div className="mt-4 h-36 rounded-lg bg-[conic-gradient(#1a529b_0_45%,#38b6ff_45%_70%,#ff9f68_70%_100%)]" />
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.1em] text-slate-500">
              Top suggested events
            </h3>
            <div className="mt-4 flex h-36 items-end gap-4 border-b border-slate-200">
              {[80, 55, 42].map((height) => (
                <div
                  className="flex-1 rounded-t bg-[#1e3a5f]"
                  style={{ height: `${height}%` }}
                  key={height}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <DataTable
            headers={["#", "Date", "Activity Type", "Suggested Event"]}
            rows={surveyResponses.map((item) => [
              item.id,
              item.date,
              item.type,
              item.event,
            ])}
          />
        </div>
      </section>
    </div>
  );
}

export function AnnouncementsSection({
  onCreateAnnouncement,
}: {
  onCreateAnnouncement: () => void;
}) {
  return (
    <div className="flex-1 p-8">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
          <div>
            <h2 className="text-base font-semibold text-slate-800">
              Announcements
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Messages that can be shared with Kabataan
            </p>
          </div>
          <button
            className="rounded-lg bg-[#1e3a5f] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#2a4a6f]"
            onClick={onCreateAnnouncement}
            type="button"
          >
            Create Announcement
          </button>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {announcements.map((announcement) => (
            <article
              className="rounded-xl border border-slate-200 bg-slate-50 p-5"
              key={announcement.title}
            >
              <p className="text-xs font-semibold text-slate-400">
                {announcement.date}
              </p>
              <h3 className="mt-1 font-semibold text-slate-800">
                {announcement.title}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {announcement.body}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function SurveysAnnouncementsSections() {
  return <KabataanSuggestionsSection />;
}
