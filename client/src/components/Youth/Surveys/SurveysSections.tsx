import { ClipboardList, Clock, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { surveyCards, type SurveyCard } from "./surveysData";

function SurveyCardItem({ deadline, id, questions, status, title }: SurveyCard) {
  return (
    <article className="flex h-full flex-col rounded-[14px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <ClipboardList className="h-5 w-5" />
        </div>
        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
          {status}
        </span>
      </div>

      <h2 className="mt-4 text-base font-semibold leading-snug text-slate-900">
        {title}
      </h2>

      <div className="mt-4 space-y-2 text-sm text-slate-500">
        <p className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {deadline}
        </p>
        <p className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4" />
          {questions}
        </p>
      </div>

      <Link
        className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-[#1e3a5f] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#173256]"
        to={`/youth/surveys/${id}`}
      >
        Answer Survey
      </Link>
    </article>
  );
}

export default function SurveysSections() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {surveyCards.map((survey) => (
          <SurveyCardItem key={survey.id} {...survey} />
        ))}
      </div>
    </div>
  );
}
