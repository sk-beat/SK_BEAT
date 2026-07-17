import { ClipboardList, Clock, HelpCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getPublicEventInterestSurveys,
  type PublicSurveySummary,
} from "../../services/PublicSurveysService";

function formatDate(value: string | null) {
  if (!value) return "No deadline";
  return new Intl.DateTimeFormat("en-PH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default function AdminSurveysPage() {
  const [surveys, setSurveys] = useState<PublicSurveySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadSurveys() {
      setIsLoading(true);
      setErrorMessage("");
      const { data, error } = await getPublicEventInterestSurveys();
      if (!isMounted) return;
      if (error) setErrorMessage(error.message);
      setSurveys(data);
      setIsLoading(false);
    }

    loadSurveys();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-6 py-14">
      <h1 className="text-3xl font-bold text-[#0b1f3b]">Surveys & Feedback</h1>
      <p className="mt-2 max-w-2xl text-slate-500">
        Answer currently published SK event-interest surveys. Guest submissions
        use a browser session id and are best effort only.
      </p>

      {errorMessage ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {isLoading ? (
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Loading surveys...
        </div>
      ) : surveys.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          No guest-enabled surveys are available right now.
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {surveys.map((survey) => (
            <article
              className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              key={survey.survey_id}
            >
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <ClipboardList className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  Guest open
                </span>
              </div>
              <h2 className="mt-4 text-lg font-bold text-slate-900">{survey.title}</h2>
              {survey.description ? (
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                  {survey.description}
                </p>
              ) : null}
              <div className="mt-4 space-y-2 text-sm text-slate-500">
                <p className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Ends {formatDate(survey.end_date)}
                </p>
                <p className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  {survey.question_count} proposed event(s)
                </p>
              </div>
              <Link
                className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-[#1e3a5f] px-4 py-3 text-sm font-semibold text-white hover:bg-[#173256]"
                to={`/surveys/${survey.survey_id}`}
              >
                View Survey
              </Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
