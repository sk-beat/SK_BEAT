import { ArrowLeft, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { SurveyAnswerPayload, YouthSurvey } from "../components/Youth/Surveys/SurveysService";
import {
  getGuestSessionId,
  getPublicEventInterestSurvey,
  submitPublicEventInterestSurvey,
} from "../services/PublicSurveysService";

export default function PublicSurveyDetailsPage() {
  const { surveyId } = useParams();
  const [survey, setSurvey] = useState<YouthSurvey | null>(null);
  const [answers, setAnswers] = useState<Record<number, SurveyAnswerPayload>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadSurvey() {
      if (!surveyId) return;
      setIsLoading(true);
      setErrorMessage("");
      const { data, error } = await getPublicEventInterestSurvey(Number(surveyId));
      if (!isMounted) return;
      if (error) setErrorMessage(error.message);
      setSurvey(data);
      setIsLoading(false);
    }

    loadSurvey();

    return () => {
      isMounted = false;
    };
  }, [surveyId]);

  function updateAnswer(questionId: number, optionId: number) {
    setAnswers((current) => ({
      ...current,
      [questionId]: { question_id: questionId, option_ids: [optionId] },
    }));
  }

  async function handleSubmit() {
    if (!survey) return;
    setErrorMessage("");
    setSuccessMessage("");

    for (const question of survey.survey_questions) {
      const questionId = question.question_id ?? 0;
      if (question.is_required && !answers[questionId]?.option_ids?.length) {
        setErrorMessage("Please answer all required event ratings.");
        return;
      }
    }

    setIsSubmitting(true);
    const { error } = await submitPublicEventInterestSurvey(
      survey.survey_id,
      Object.values(answers),
    );
    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSuccessMessage("Your survey response was submitted.");
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <Link className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#1e3a5f] hover:underline" to="/youth-surveys">
        <ArrowLeft className="h-4 w-4" />
        Back to surveys
      </Link>

      {isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Loading survey...
        </div>
      ) : !survey ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Survey unavailable.
        </div>
      ) : (
        <form
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}
        >
          <h1 className="text-2xl font-bold text-[#0b1f3b]">{survey.title}</h1>
          {survey.description ? (
            <p className="mt-2 text-sm leading-6 text-slate-500">{survey.description}</p>
          ) : null}
          <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Submitting as Guest using this browser session. Clearing browser storage
            or using another device may allow another guest submission.
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Guest session: {getGuestSessionId()}
          </p>

          {errorMessage ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}
          {successMessage ? (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {successMessage}
            </div>
          ) : null}

          <div className="mt-6 space-y-5">
            {survey.survey_questions.map((question, index) => {
              const questionId = question.question_id ?? 0;
              const selected = answers[questionId]?.option_ids?.[0];
              return (
                <fieldset
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  disabled={isSubmitting || Boolean(successMessage)}
                  key={questionId}
                >
                  <legend className="px-1 text-sm font-semibold text-slate-900">
                    {index + 1}. {question.event_name}
                    {question.is_required ? <span className="text-red-500"> *</span> : null}
                  </legend>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#1e3a5f]">
                    {question.event_category}
                  </p>
                  {question.event_description ? (
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {question.event_description}
                    </p>
                  ) : null}
                  <div className="mt-4 grid gap-2 sm:grid-cols-5">
                    {question.survey_options.map((option) => {
                      const optionId = option.option_id ?? 0;
                      return (
                        <label
                          className={[
                            "rounded-lg border bg-white p-3 text-center text-sm transition",
                            selected === optionId
                              ? "border-[#1e3a5f] ring-2 ring-[#1e3a5f]/15"
                              : "border-slate-200",
                          ].join(" ")}
                          key={optionId}
                        >
                          <input
                            checked={selected === optionId}
                            className="sr-only"
                            name={`question-${questionId}`}
                            onChange={() => updateAnswer(questionId, optionId)}
                            type="radio"
                          />
                          <strong className="block text-[#1e3a5f]">{option.score_value}</strong>
                          <span className="mt-1 block text-xs text-slate-600">{option.option_text}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              );
            })}
          </div>

          <button
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1e3a5f] px-4 py-3 text-sm font-semibold text-white hover:bg-[#173256] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            disabled={isSubmitting || Boolean(successMessage)}
            type="submit"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? "Submitting..." : "Submit Survey"}
          </button>
        </form>
      )}
    </main>
  );
}
