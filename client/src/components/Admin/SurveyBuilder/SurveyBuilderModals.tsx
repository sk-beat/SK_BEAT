import { useEffect, useState } from "react";
import AdminModal from "../shared/AdminModal";
import type {
  AdminSurvey,
  SaveSurveyPayload,
  SurveyQuestion,
  SurveyStatus,
} from "./SurveyBuilderService";

export type SurveyBuilderModalMode = "form" | "details" | null;

type Props = {
  isSaving: boolean;
  mode: SurveyBuilderModalMode;
  onClose: () => void;
  onSave: (payload: SaveSurveyPayload) => Promise<void>;
  survey: AdminSurvey | null;
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 disabled:opacity-70";

function blankQuestion(sortOrder = 0): SurveyQuestion {
  return {
    question_text: "Rate your interest in this proposed event",
    question_type: "event_interest_likert",
    is_required: true,
    sort_order: sortOrder,
    reporting_key: "suggested_event_rating",
    event_name: null,
    event_category: null,
    event_description: null,
    survey_options: [],
  };
}

function toDateInputValue(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

function fromDateInputValue(value: string) {
  return value ? new Date(`${value}T00:00:00`).toISOString() : null;
}

export default function SurveyBuilderModals({
  isSaving,
  mode,
  onClose,
  onSave,
  survey,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<SurveyStatus>("draft");
  const [allowGuestResponses, setAllowGuestResponses] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [questions, setQuestions] = useState<SurveyQuestion[]>([blankQuestion()]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTitle(survey?.title ?? "");
    setDescription(survey?.description ?? "");
    setStatus(survey?.status ?? "draft");
    setAllowGuestResponses(survey?.allow_guest_responses ?? false);
    setStartDate(toDateInputValue(survey?.start_date ?? null));
    setEndDate(toDateInputValue(survey?.end_date ?? null));
    setQuestions(
      survey?.survey_questions.length
        ? survey.survey_questions
            .slice()
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((question) => ({
              ...question,
              survey_options: question.survey_options.slice().sort((a, b) => a.sort_order - b.sort_order),
            }))
        : [blankQuestion()],
    );
    setErrorMessage(null);
  }, [survey, mode]);

  function updateQuestion(index: number, patch: Partial<SurveyQuestion>) {
    setQuestions((current) => current.map((question, itemIndex) => (itemIndex === index ? { ...question, ...patch } : question)));
  }

  function validate() {
    if (!title.trim()) return "Survey title is required.";
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) return "End date must be later than start date.";
    if (questions.length === 0) return "At least one proposed event is required.";
    if (survey?.survey_responses.length) {
      return "This survey already has responses. Create a new survey instead of editing answered questions.";
    }

    for (const question of questions) {
      if (!question.event_name?.trim()) return "Each proposed event needs a name.";
      if (!question.event_category?.trim()) return "Each proposed event needs a category.";
    }

    return null;
  }

  async function handleSave() {
    const validationMessage = validate();
    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    await onSave({
      description: description.trim() || null,
      end_date: fromDateInputValue(endDate),
      allow_guest_responses: allowGuestResponses,
      questions: questions.map((question, index) => ({
        ...question,
        question_text: `Rate your interest in ${question.event_name?.trim()}`,
        question_type: "event_interest_likert",
        sort_order: index,
        survey_options: [],
        reporting_key: "suggested_event_rating",
        event_name: question.event_name?.trim() || null,
        event_category: question.event_category?.trim() || null,
        event_description: question.event_description?.trim() || null,
      })),
      start_date: fromDateInputValue(startDate),
      status,
      survey_id: survey?.survey_id ?? null,
      target_audience: "kabataan",
      title: title.trim(),
    });
  }

  return (
    <>
      <AdminModal
        footer={
          <>
            <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" disabled={isSaving} onClick={onClose} type="button">Cancel</button>
            <button className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a4a6f] disabled:opacity-50" disabled={isSaving} onClick={handleSave} type="button">
              {isSaving ? "Saving..." : "Save Survey"}
            </button>
          </>
        }
        maxWidthClass="max-w-5xl"
        onClose={onClose}
        open={mode === "form"}
        title={survey ? "Edit Survey" : "Create Survey"}
      >
        {errorMessage ? <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div> : null}
        {survey?.survey_responses.length ? (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            This survey already has responses. Event questions are locked to protect submitted answers.
          </div>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Survey Title</span>
            <input className={inputClass} disabled={isSaving} onChange={(event) => setTitle(event.target.value)} value={title} />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Description</span>
            <textarea className={`${inputClass} min-h-20 resize-y`} disabled={isSaving} onChange={(event) => setDescription(event.target.value)} value={description} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Status</span>
            <select className={inputClass} disabled={isSaving} onChange={(event) => setStatus(event.target.value as SurveyStatus)} value={status}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="closed">Closed</option>
            </select>
          </label>
          <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 md:col-span-2">
            <input
              checked={allowGuestResponses}
              disabled={isSaving}
              onChange={(event) => setAllowGuestResponses(event.target.checked)}
              type="checkbox"
            />
            Allow Guest Responses
            <span className="text-xs font-normal text-slate-500">
              Guests submit with a browser session id, not a Youth account.
            </span>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Start Date</span>
              <input className={inputClass} disabled={isSaving} onChange={(event) => setStartDate(event.target.value)} type="date" value={startDate} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">End Date</span>
              <input className={inputClass} disabled={isSaving} onChange={(event) => setEndDate(event.target.value)} type="date" value={endDate} />
            </label>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {questions.map((question, questionIndex) => (
            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4" key={questionIndex}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-800">Proposed Event {questionIndex + 1}</h3>
                <button className="text-sm text-red-600 hover:underline" disabled={questions.length === 1 || isSaving || Boolean(survey?.survey_responses.length)} onClick={() => setQuestions((current) => current.filter((_, index) => index !== questionIndex))} type="button">Remove</button>
              </div>
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_120px]">
                <input
                  className={inputClass}
                  disabled={isSaving || Boolean(survey?.survey_responses.length)}
                  onChange={(event) =>
                    updateQuestion(questionIndex, {
                      event_name: event.target.value,
                      question_text: event.target.value
                        ? `Rate your interest in ${event.target.value}`
                        : "Rate your interest in this proposed event",
                    })
                  }
                  placeholder="Event name, e.g. Basketball Tournament"
                  value={question.event_name ?? ""}
                />
                <input
                  className={inputClass}
                  disabled={isSaving || Boolean(survey?.survey_responses.length)}
                  onChange={(event) =>
                    updateQuestion(questionIndex, {
                      event_category: event.target.value,
                    })
                  }
                  placeholder="Category, e.g. Sports"
                  value={question.event_category ?? ""}
                />
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input checked={question.is_required} disabled={isSaving} onChange={(event) => updateQuestion(questionIndex, { is_required: event.target.checked })} type="checkbox" />
                  Required
                </label>
              </div>
              <textarea
                className={`${inputClass} mt-3 min-h-20 resize-y`}
                disabled={isSaving || Boolean(survey?.survey_responses.length)}
                onChange={(event) =>
                  updateQuestion(questionIndex, {
                    event_description: event.target.value,
                  })
                }
                placeholder="Optional event description"
                value={question.event_description ?? ""}
              />
              <p className="mt-3 text-xs text-slate-500">
                Fixed choices are generated automatically: 1 Not Interested, 2 Slightly Interested, 3 Neutral, 4 Interested, 5 Very Interested.
              </p>
            </section>
          ))}
          <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50" disabled={isSaving || Boolean(survey?.survey_responses.length)} onClick={() => setQuestions((current) => [...current, blankQuestion(current.length)])} type="button">Add Proposed Event</button>
        </div>
      </AdminModal>

      <AdminModal onClose={onClose} open={mode === "details"} title="Survey Details" maxWidthClass="max-w-3xl">
        <h3 className="text-lg font-semibold text-slate-900">{survey?.title}</h3>
        <p className="mt-2 text-sm text-slate-500">{survey?.description || "No description."}</p>
        <div className="mt-5 space-y-4">
          {survey?.survey_questions.map((question, index) => (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4" key={question.question_id}>
              <p className="font-medium text-slate-900">{index + 1}. {question.question_text}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.08em] text-slate-400">
                {question.event_category || "Uncategorized"} {question.is_required ? "required" : "optional"}
              </p>
              {question.survey_options.length ? (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
                  {question.survey_options.map((option) => <li key={option.option_id}>{option.option_text}</li>)}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      </AdminModal>
    </>
  );
}
