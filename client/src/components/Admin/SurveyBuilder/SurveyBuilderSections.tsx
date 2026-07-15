import type { AdminSurvey, SurveyStatus } from "./SurveyBuilderService";

type SurveyBuilderSectionsProps = {
  errorMessage: string | null;
  isLoading: boolean;
  onCreate: () => void;
  onDelete: (surveyId: number) => void;
  onEdit: (survey: AdminSurvey) => void;
  onStatusChange: (survey: AdminSurvey, status: SurveyStatus) => void;
  onView: (survey: AdminSurvey) => void;
  surveys: AdminSurvey[];
};

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", { month: "short", day: "2-digit", year: "numeric" }).format(new Date(value));
}

function getScheduleStatus(survey: AdminSurvey) {
  const now = Date.now();
  const start = survey.start_date ? new Date(survey.start_date).getTime() : null;
  const end = survey.end_date ? new Date(survey.end_date).getTime() : null;

  if (survey.status !== "published") return survey.status;
  if (start && start > now) return "upcoming";
  if (end && end <= now) return "completed";
  return "active";
}

export default function SurveyBuilderSections({
  errorMessage,
  isLoading,
  onCreate,
  onDelete,
  onEdit,
  onStatusChange,
  onView,
  surveys,
}: SurveyBuilderSectionsProps) {
  return (
    <div className="flex-1 p-8">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Survey List</h2>
            <p className="mt-1 text-sm text-slate-500">
              Create surveys, publish them, and monitor response counts.
            </p>
          </div>
          <button
            className="rounded-lg bg-[#1e3a5f] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#2a4a6f]"
            onClick={onCreate}
            type="button"
          >
            Add Survey
          </button>
        </div>

        {errorMessage ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-4 overflow-hidden overflow-x-auto rounded-[14px] border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead>
              <tr>
                {["#", "Title", "Status", "Schedule", "Questions", "Responses", "Actions"].map((heading) => (
                  <th
                    className="bg-slate-50 px-5 py-4 text-center text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-slate-400"
                    key={heading}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="border-t border-slate-200 px-5 py-8 text-center text-slate-500" colSpan={7}>
                    Loading surveys...
                  </td>
                </tr>
              ) : surveys.length === 0 ? (
                <tr>
                  <td className="border-t border-slate-200 px-5 py-8 text-center text-slate-500" colSpan={7}>
                    No surveys created yet.
                  </td>
                </tr>
              ) : (
                surveys.map((survey) => (
                  <tr className="hover:bg-slate-50" key={survey.survey_id}>
                    <td className="border-t border-slate-200 px-5 py-4">{survey.survey_id}</td>
                    <td className="border-t border-slate-200 px-5 py-4">
                      <p className="font-medium text-slate-900">{survey.title}</p>
                      <p className="mt-1 line-clamp-1 text-xs text-slate-500">{survey.description || survey.question_text}</p>
                    </td>
                    <td className="border-t border-slate-200 px-5 py-4 text-center">
                      <span className="rounded-md bg-blue-100 px-3 py-1.5 text-xs font-medium capitalize text-blue-700">
                        {getScheduleStatus(survey)}
                      </span>
                    </td>
                    <td className="border-t border-slate-200 px-5 py-4 text-center">
                      {formatDate(survey.start_date)} - {formatDate(survey.end_date)}
                    </td>
                    <td className="border-t border-slate-200 px-5 py-4 text-center">{survey.survey_questions.length}</td>
                    <td className="border-t border-slate-200 px-5 py-4 text-center">{survey.survey_responses.length}</td>
                    <td className="border-t border-slate-200 px-5 py-4">
                      <div className="flex flex-wrap justify-center gap-2">
                        <button className="text-sm font-medium text-[#1e3a5f] hover:underline" onClick={() => onView(survey)} type="button">View</button>
                        <button className="text-sm font-medium text-[#1e3a5f] hover:underline" onClick={() => onEdit(survey)} type="button">Edit</button>
                        <button
                          className="text-sm font-medium text-[#1e3a5f] hover:underline"
                          onClick={() => onStatusChange(survey, survey.status === "published" ? "draft" : "published")}
                          type="button"
                        >
                          {survey.status === "published" ? "Unpublish" : "Publish"}
                        </button>
                        <button className="text-sm font-medium text-red-600 hover:underline" onClick={() => onDelete(survey.survey_id)} type="button">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
