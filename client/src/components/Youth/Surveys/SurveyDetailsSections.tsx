import { ArrowLeft, Send } from "lucide-react";
import { Link } from "react-router-dom";

const surveyQuestions = [
  "What youth programs are most helpful for your community?",
  "Which schedule works best for youth activities?",
  "What suggestions would you like to share with the SK Council?",
];

export default function SurveyDetailsSections() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-6 sm:px-6 lg:px-8">
      <Link
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#1e3a5f] hover:underline"
        to="/youth/surveys"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to surveys
      </Link>

      <form className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="space-y-5">
          {surveyQuestions.map((question, index) => (
            <label className="block" key={question}>
              <span className="text-sm font-semibold text-slate-900">
                {index + 1}. {question}
              </span>
              <textarea
                className="mt-2 min-h-28 w-full resize-y rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="Type your answer..."
              />
            </label>
          ))}
        </div>

        <button
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1e3a5f] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#173256] sm:w-auto"
          type="button"
        >
          <Send className="h-4 w-4" />
          Submit Answers
        </button>
      </form>
    </div>
  );
}
