import { useEffect, useState } from "react";
import { useAuth } from "../../../auth/useAuth";
import SurveysHeader from "./SurveysHeader";
import SurveysSections from "./SurveysSections";
import { getYouthSurveys, type YouthSurvey } from "./SurveysService";

export default function Surveys() {
  const { user } = useAuth();
  const [surveys, setSurveys] = useState<YouthSurvey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSurveys() {
      if (!user?.id) return;
      setIsLoading(true);
      setErrorMessage(null);
      const { data, error } = await getYouthSurveys(user.id);

      if (!isMounted) return;
      if (error) setErrorMessage(error.message);
      setSurveys(data);
      setIsLoading(false);
    }

    loadSurveys();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      <SurveysHeader />
      <SurveysSections errorMessage={errorMessage} isLoading={isLoading} surveys={surveys} />
    </div>
  );
}
