import { ArrowLeft, Send } from "lucide-react";
import { Link } from "react-router-dom";
import type { SurveyAnswerPayload, YouthSurvey } from "./SurveysService";

type Props = {
  answers: Record<number, SurveyAnswerPayload>;
  errorMessage: string | null;
  isLoading: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
  onUpdateAnswer: (questionId: number, answer: SurveyAnswerPayload) => void;
  successMessage: string | null;
  survey: YouthSurvey | null;
};

export default function SurveyDetailsSections({
  answers,
  errorMessage,
  isLoading,
  isSubmitting,
  onSubmit,
  onUpdateAnswer,
  successMessage,
  survey,
}: Props) {
  const alreadyAnswered = Boolean(survey?.survey_responses.length);

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-6 sm:px-6 lg:px-8">
      <Link className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#1e3a5f] hover:underline" to="/youth/surveys">
        <ArrowLeft className="h-4 w-4" />
        Back to surveys
      </Link>

      {isLoading ? (
        <div className="rounded-[14px] border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">Loading survey...</div>
      ) : !survey ? (
        <div className="rounded-[14px] border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">Survey not found.</div>
      ) : (
        <form
          className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <h2 className="text-xl font-bold text-slate-900">{survey.title}</h2>
          {survey.description ? <p className="mt-2 text-sm text-slate-500">{survey.description}</p> : null}
          {successMessage ? <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</div> : null}
          {errorMessage ? <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div> : null}
          {alreadyAnswered ? <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">You already answered this survey.</div> : null}

          <div className="mt-6 space-y-5">
            {survey.survey_questions.map((question, index) => {
              const questionId = question.question_id ?? 0;
              const answer = answers[questionId] ?? { question_id: questionId, option_ids: [] };

              return (
                <fieldset className="rounded-xl border border-slate-200 bg-slate-50 p-4" disabled={alreadyAnswered || isSubmitting} key={questionId}>
                  <legend className="px-1 text-sm font-semibold text-slate-900">
                    {index + 1}. {question.question_text} {question.is_required ? <span className="text-red-500">*</span> : null}
                  </legend>
                  {question.question_type === "short_text" || question.question_type === "long_text" ? (
                    <textarea
                      className="mt-3 min-h-24 w-full resize-y rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      onChange={(event) => onUpdateAnswer(questionId, { question_id: questionId, answer_text: event.target.value })}
                      placeholder="Type your answer..."
                      value={answer.answer_text ?? ""}
                    />
                  ) : (
                    <div className="mt-3 space-y-2">
                      {question.survey_options.map((option) => {
                        const optionId = option.option_id ?? 0;
                        const checked = answer.option_ids?.includes(optionId) ?? false;
                        const isMultiple = question.question_type === "multiple_choice";

                        return (
                          <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700" key={optionId}>
                            <input
                              checked={checked}
                              name={`question-${questionId}`}
                              onChange={(event) => {
                                const optionIds = isMultiple
                                  ? event.target.checked
                                    ? [...(answer.option_ids ?? []), optionId]
                                    : (answer.option_ids ?? []).filter((id) => id !== optionId)
                                  : [optionId];
                                onUpdateAnswer(questionId, { question_id: questionId, option_ids: optionIds });
                              }}
                              type={isMultiple ? "checkbox" : "radio"}
                            />
                            {option.option_text}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </fieldset>
              );
            })}
          </div>

          <button
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1e3a5f] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#173256] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            disabled={alreadyAnswered || isSubmitting}
            type="submit"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? "Submitting..." : "Submit Answers"}
          </button>
        </form>
      )}
    </div>
  );
}
