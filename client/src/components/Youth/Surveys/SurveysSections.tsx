import { ClipboardList, Clock, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import type { YouthSurvey } from "./SurveysService";

type Props = {
  errorMessage: string | null;
  isLoading: boolean;
  surveys: YouthSurvey[];
};

function formatDate(value: string | null) {
  if (!value) return "No deadline";
  return new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(new Date(value));
}

function getSurveyState(survey: YouthSurvey) {
  if (survey.survey_responses.length > 0) return "Answered";
  const now = Date.now();
  if (survey.start_date && new Date(survey.start_date).getTime() > now) return "Upcoming";
  if (survey.end_date && new Date(survey.end_date).getTime() <= now) return "Completed";
  return "Open";
}

function SurveyCardItem({ survey }: { survey: YouthSurvey }) {
  const state = getSurveyState(survey);
  const canAnswer = state === "Open";

  return (
    <article className="flex h-full flex-col rounded-[14px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <ClipboardList className="h-5 w-5" />
        </div>
        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">{state}</span>
      </div>

      <h2 className="mt-4 text-base font-semibold leading-snug text-slate-900">{survey.title}</h2>
      {survey.description ? <p className="mt-2 line-clamp-2 text-sm text-slate-500">{survey.description}</p> : null}

      <div className="mt-4 space-y-2 text-sm text-slate-500">
        <p className="flex items-center gap-2"><Clock className="h-4 w-4" />Ends {formatDate(survey.end_date)}</p>
        <p className="flex items-center gap-2"><HelpCircle className="h-4 w-4" />{survey.survey_questions.length} question(s)</p>
      </div>

      <Link
        className={[
          "mt-5 inline-flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-medium transition-colors",
          canAnswer ? "bg-[#1e3a5f] text-white hover:bg-[#173256]" : "border border-slate-200 text-slate-500",
        ].join(" ")}
        to={`/youth/surveys/${survey.survey_id}`}
      >
        {canAnswer ? "Answer Survey" : "View Survey"}
      </Link>
    </article>
  );
}

export default function SurveysSections({ errorMessage, isLoading, surveys }: Props) {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-6 sm:px-6 lg:px-8">
      {errorMessage ? <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{errorMessage}</div> : null}
      {isLoading ? (
        <div className="rounded-[14px] border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">Loading surveys...</div>
      ) : surveys.length === 0 ? (
        <div className="rounded-[14px] border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">No available surveys yet.</div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {surveys.map((survey) => <SurveyCardItem key={survey.survey_id} survey={survey} />)}
        </div>
      )}
    </div>
  );
}
