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
    question_text: "",
    question_type: "multiple_choice",
    is_required: true,
    sort_order: sortOrder,
    reporting_key: "suggested_event",
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

function fromDateTimeInputValue(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function toDateTimeInputValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

function getLocalDateTimeInputValue(date = new Date()) {
  const withoutSeconds = new Date(date);
  withoutSeconds.setSeconds(0, 0);
  const offsetDate = new Date(withoutSeconds.getTime() - withoutSeconds.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

function isSameInstant(inputValue: string, storedValue: string | null | undefined) {
  if (!inputValue && !storedValue) return true;
  if (!inputValue || !storedValue) return false;
  return inputValue === toDateTimeInputValue(storedValue);
}

function getEventOptions(survey: AdminSurvey | null) {
  const checkboxQuestion = survey?.survey_questions.find(
    (question) =>
      question.question_type === "multiple_choice" &&
      question.reporting_key === "suggested_event",
  );

  if (checkboxQuestion?.survey_options.length) {
    return checkboxQuestion.survey_options
      .filter((option) => option.option_text.trim().toLowerCase() !== "other")
      .map((option, index) => ({
        ...blankQuestion(index),
        event_name: option.option_text,
      }));
  }

  return survey?.survey_questions.length
    ? survey.survey_questions
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((question, index) => ({
          ...question,
          sort_order: index,
        }))
    : [blankQuestion()];
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
  const [expiresAt, setExpiresAt] = useState("");
  const [questions, setQuestions] = useState<SurveyQuestion[]>([blankQuestion()]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTitle(survey?.title ?? "");
    setDescription(survey?.description ?? "");
    setStatus(survey?.status ?? "draft");
    setAllowGuestResponses(survey?.allow_guest_responses ?? false);
    setStartDate(toDateTimeInputValue(survey?.start_date ?? null));
    setEndDate(toDateInputValue(survey?.end_date ?? null));
    setExpiresAt(toDateTimeInputValue(survey?.expires_at ?? survey?.end_date ?? null));
    setQuestions(getEventOptions(survey));
    setErrorMessage(null);
  }, [survey, mode]);

  function updateQuestion(index: number, patch: Partial<SurveyQuestion>) {
    setQuestions((current) => current.map((question, itemIndex) => (itemIndex === index ? { ...question, ...patch } : question)));
  }

  function validate() {
    const now = new Date();
    const startAt = startDate ? new Date(startDate) : null;
    const expiresAtDate = expiresAt ? new Date(expiresAt) : null;
    const startChanged = !isSameInstant(startDate, survey?.start_date);
    const expirationChanged = !isSameInstant(expiresAt, survey?.expires_at ?? survey?.end_date);
    const startValid =
      !startAt ||
      !startChanged ||
      startAt.getTime() >= now.getTime();
    const expirationValid =
      !expiresAtDate ||
      ((!expirationChanged || expiresAtDate.getTime() >= now.getTime()) &&
        (!startAt || expiresAtDate.getTime() > startAt.getTime()));

    console.log("[Survey Schedule] Validation", {
      startAt: startAt?.toISOString() ?? null,
      expiresAt: expiresAtDate?.toISOString() ?? null,
      now: now.toISOString(),
      startValid,
      expirationValid,
    });

    if (!title.trim()) return "Survey title is required.";
    if (startAt && Number.isNaN(startAt.getTime())) return "Survey start time must be today or in the future.";
    if (expiresAtDate && Number.isNaN(expiresAtDate.getTime())) return "Survey expiration cannot be in the past.";
    if (!startValid) return "Survey start time must be today or in the future.";
    if (expiresAtDate && expirationChanged && expiresAtDate.getTime() < now.getTime()) return "Survey expiration cannot be in the past.";
    if (startAt && expiresAtDate && expiresAtDate.getTime() <= startAt.getTime()) return "Survey expiration must be after the start time.";
    if (startDate && endDate && new Date(`${endDate}T23:59:59`).getTime() <= new Date(startDate).getTime()) return "End date must be later than start date.";
    if (questions.length === 0) return "At least one proposed event is required.";
    if (survey?.survey_responses.length) {
      return "This survey already has responses. Create a new survey instead of editing answered questions.";
    }

    for (const question of questions) {
      if (!question.event_name?.trim()) return "Each proposed event needs a name.";
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
      expires_at: fromDateTimeInputValue(expiresAt),
      allow_guest_responses: allowGuestResponses,
      questions: [
        {
          question_text: "Select the events you want SK to organize",
          question_type: "multiple_choice",
          is_required: true,
          sort_order: 0,
          reporting_key: "suggested_event",
          event_name: null,
          event_category: null,
          event_description: null,
          survey_options: [
            ...questions.map((question, index) => ({
              event_category: question.event_category ?? null,
              event_description: question.event_description ?? null,
              event_name: question.event_name?.trim() || null,
              is_other: false,
              option_text: question.event_name?.trim() || `Event ${index + 1}`,
              score_value: null,
              sort_order: index,
            })),
            {
              event_category: null,
              event_description: null,
              event_name: null,
              is_other: true,
              option_text: "Other",
              score_value: null,
              sort_order: questions.length,
            },
          ],
        },
      ],
      start_date: fromDateTimeInputValue(startDate),
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
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Start Date and Time</span>
              <input
                className={inputClass}
                disabled={isSaving}
                min={getLocalDateTimeInputValue()}
                onChange={(event) => setStartDate(event.target.value)}
                type="datetime-local"
                value={startDate}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">End Date</span>
              <input className={inputClass} disabled={isSaving} onChange={(event) => setEndDate(event.target.value)} type="date" value={endDate} />
            </label>
          </div>
          <label className="block md:col-span-2">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Expiration Date and Time</span>
            <input
              className={inputClass}
              disabled={isSaving}
              min={startDate || getLocalDateTimeInputValue()}
              onChange={(event) => setExpiresAt(event.target.value)}
              type="datetime-local"
              value={expiresAt}
            />
          </label>
        </div>

        <div className="mt-6 space-y-4">
          {questions.map((question, questionIndex) => (
            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4" key={questionIndex}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-800">Event Option {questionIndex + 1}</h3>
                <button className="text-sm text-red-600 hover:underline" disabled={questions.length === 1 || isSaving || Boolean(survey?.survey_responses.length)} onClick={() => setQuestions((current) => current.filter((_, index) => index !== questionIndex))} type="button">Remove</button>
              </div>
              <div className="grid gap-3 md:grid-cols-[1fr_120px]">
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
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input checked={question.is_required} disabled={isSaving} onChange={(event) => updateQuestion(questionIndex, { is_required: event.target.checked })} type="checkbox" />
                  Required
                </label>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Youth can select multiple event options. An Other option is added automatically.
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
                {question.question_type.replace("_", " ")} {question.is_required ? "required" : "optional"}
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
