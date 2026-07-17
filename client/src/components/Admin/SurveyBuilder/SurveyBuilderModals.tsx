import { useEffect, useState } from "react";
import AdminModal from "../shared/AdminModal";
import type {
  AdminSurvey,
  SaveSurveyPayload,
  SurveyQuestion,
  SurveyQuestionType,
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
    question_text: "",
    question_type: "single_choice",
    is_required: true,
    sort_order: sortOrder,
    reporting_key: null,
    event_name: null,
    event_category: null,
    event_description: null,
    survey_options: [
      { option_text: "", sort_order: 0 },
      { option_text: "", sort_order: 1 },
    ],
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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [questions, setQuestions] = useState<SurveyQuestion[]>([blankQuestion()]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTitle(survey?.title ?? "");
    setDescription(survey?.description ?? "");
    setStatus(survey?.status ?? "draft");
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

  function updateOption(questionIndex: number, optionIndex: number, value: string) {
    setQuestions((current) =>
      current.map((question, itemIndex) =>
        itemIndex === questionIndex
          ? {
              ...question,
              survey_options: question.survey_options.map((option, optionItemIndex) =>
                optionItemIndex === optionIndex ? { ...option, option_text: value } : option,
              ),
            }
          : question,
      ),
    );
  }

  function validate() {
    if (!title.trim()) return "Survey title is required.";
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) return "End date must be later than start date.";
    if (questions.length === 0) return "At least one question is required.";

    for (const question of questions) {
      if (!question.question_text.trim()) return "Each question needs text.";
      if (question.question_type === "event_interest_likert") {
        if (!question.event_name?.trim()) return "Event Interest questions need an event name.";
        if (!question.event_category?.trim()) return "Event Interest questions need a category.";
      }
      if (["single_choice", "multiple_choice"].includes(question.question_type)) {
        const validOptions = question.survey_options.filter((option) => option.option_text.trim());
        if (validOptions.length === 0) return "Choice questions need at least one option.";
      }
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
      questions: questions.map((question, index) => ({
        ...question,
        question_text: question.question_text.trim(),
        sort_order: index,
        survey_options: ["single_choice", "multiple_choice"].includes(question.question_type)
          ? question.survey_options
              .filter((option) => option.option_text.trim())
              .map((option, optionIndex) => ({ ...option, option_text: option.option_text.trim(), sort_order: optionIndex }))
          : [],
        reporting_key:
          question.question_type === "event_interest_likert"
            ? "suggested_event_rating"
            : question.reporting_key ?? null,
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
                <h3 className="text-sm font-semibold text-slate-800">Question {questionIndex + 1}</h3>
                <button className="text-sm text-red-600 hover:underline" disabled={questions.length === 1 || isSaving} onClick={() => setQuestions((current) => current.filter((_, index) => index !== questionIndex))} type="button">Remove</button>
              </div>
              <div className="grid gap-3 md:grid-cols-[1fr_180px_120px]">
                <input className={inputClass} disabled={isSaving} onChange={(event) => updateQuestion(questionIndex, { question_text: event.target.value })} placeholder="Question text" value={question.question_text} />
                <select className={inputClass} disabled={isSaving} onChange={(event) => updateQuestion(questionIndex, { question_type: event.target.value as SurveyQuestionType })} value={question.question_type}>
                  <option value="short_text">Short text</option>
                  <option value="long_text">Long text</option>
                  <option value="single_choice">Single choice</option>
                  <option value="multiple_choice">Multiple choice</option>
                  <option value="event_interest_likert">Event Interest</option>
                </select>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input checked={question.is_required} disabled={isSaving} onChange={(event) => updateQuestion(questionIndex, { is_required: event.target.checked })} type="checkbox" />
                  Required
                </label>
              </div>
              {question.question_type === "event_interest_likert" ? (
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <input
                    className={inputClass}
                    disabled={isSaving}
                    onChange={(event) =>
                      updateQuestion(questionIndex, {
                        event_name: event.target.value,
                        question_text: event.target.value
                          ? `Rate your interest in ${event.target.value}`
                          : question.question_text,
                        reporting_key: "suggested_event_rating",
                      })
                    }
                    placeholder="Event name, e.g. Basketball Tournament"
                    value={question.event_name ?? ""}
                  />
                  <input
                    className={inputClass}
                    disabled={isSaving}
                    onChange={(event) =>
                      updateQuestion(questionIndex, {
                        event_category: event.target.value,
                        reporting_key: "suggested_event_rating",
                      })
                    }
                    placeholder="Category, e.g. Sports"
                    value={question.event_category ?? ""}
                  />
                  <textarea
                    className={`${inputClass} min-h-20 resize-y md:col-span-2`}
                    disabled={isSaving}
                    onChange={(event) =>
                      updateQuestion(questionIndex, {
                        event_description: event.target.value,
                      })
                    }
                    placeholder="Optional event description"
                    value={question.event_description ?? ""}
                  />
                  <p className="text-xs text-slate-500 md:col-span-2">
                    Fixed choices will be generated automatically: 1 Not Interested, 2 Slightly Interested, 3 Neutral, 4 Interested, 5 Very Interested.
                  </p>
                </div>
              ) : null}
              {["single_choice", "multiple_choice"].includes(question.question_type) ? (
                <div className="mt-3 space-y-2">
                  {question.survey_options.map((option, optionIndex) => (
                    <div className="flex gap-2" key={optionIndex}>
                      <input className={inputClass} disabled={isSaving} onChange={(event) => updateOption(questionIndex, optionIndex, event.target.value)} placeholder={`Option ${optionIndex + 1}`} value={option.option_text} />
                      <button className="rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 hover:bg-slate-50" disabled={question.survey_options.length === 1 || isSaving} onClick={() => updateQuestion(questionIndex, { survey_options: question.survey_options.filter((_, index) => index !== optionIndex) })} type="button">Remove</button>
                    </div>
                  ))}
                  <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50" disabled={isSaving} onClick={() => updateQuestion(questionIndex, { survey_options: [...question.survey_options, { option_text: "", sort_order: question.survey_options.length }] })} type="button">Add Option</button>
                </div>
              ) : null}
            </section>
          ))}
          <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50" disabled={isSaving} onClick={() => setQuestions((current) => [...current, blankQuestion(current.length)])} type="button">Add Question</button>
        </div>
      </AdminModal>

      <AdminModal onClose={onClose} open={mode === "details"} title="Survey Details" maxWidthClass="max-w-3xl">
        <h3 className="text-lg font-semibold text-slate-900">{survey?.title}</h3>
        <p className="mt-2 text-sm text-slate-500">{survey?.description || "No description."}</p>
        <div className="mt-5 space-y-4">
          {survey?.survey_questions.map((question, index) => (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4" key={question.question_id}>
              <p className="font-medium text-slate-900">{index + 1}. {question.question_text}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.08em] text-slate-400">{question.question_type} {question.is_required ? "required" : "optional"}</p>
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
