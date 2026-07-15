import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../../auth/useAuth";
import SurveyDetailsHeader from "./SurveyDetailsHeader";
import SurveyDetailsSections from "./SurveyDetailsSections";
import {
  getYouthSurvey,
  submitYouthSurveyResponse,
  type SurveyAnswerPayload,
  type YouthSurvey,
} from "./SurveysService";

export default function SurveyDetails() {
  const { surveyId } = useParams();
  const { user } = useAuth();
  const [survey, setSurvey] = useState<YouthSurvey | null>(null);
  const [answers, setAnswers] = useState<Record<number, SurveyAnswerPayload>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSurvey() {
      if (!surveyId || !user?.id) return;
      setIsLoading(true);
      setErrorMessage(null);
      const { data, error } = await getYouthSurvey(Number(surveyId), user.id);

      if (!isMounted) return;
      if (error) setErrorMessage(error.message);
      setSurvey(data);
      setIsLoading(false);
    }

    loadSurvey();

    return () => {
      isMounted = false;
    };
  }, [surveyId, user?.id]);

  function updateAnswer(questionId: number, answer: SurveyAnswerPayload) {
    setAnswers((current) => ({ ...current, [questionId]: answer }));
  }

  async function handleSubmit() {
    if (!survey) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    for (const question of survey.survey_questions) {
      const answer = answers[question.question_id ?? 0];
      if (!question.is_required) continue;
      if (!answer) {
        setErrorMessage("Please answer all required questions.");
        return;
      }
      if (["short_text", "long_text"].includes(question.question_type) && !answer.answer_text?.trim()) {
        setErrorMessage("Please answer all required text questions.");
        return;
      }
      if (["single_choice", "multiple_choice"].includes(question.question_type) && !answer.option_ids?.length) {
        setErrorMessage("Please choose an option for all required questions.");
        return;
      }
    }

    setIsSubmitting(true);
    const { error } = await submitYouthSurveyResponse(survey.survey_id, Object.values(answers));
    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSuccessMessage("Your survey response was submitted.");
    setSurvey({ ...survey, survey_responses: [{ response_id: Date.now(), user_id: user?.id ?? "" }] });
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      <SurveyDetailsHeader />
      <SurveyDetailsSections
        answers={answers}
        errorMessage={errorMessage}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        onUpdateAnswer={updateAnswer}
        successMessage={successMessage}
        survey={survey}
      />
    </div>
  );
}
