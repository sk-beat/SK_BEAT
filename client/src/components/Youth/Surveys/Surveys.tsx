import SurveysHeader from "./SurveysHeader";
import SurveysSections from "./SurveysSections";

export default function Surveys() {
  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      <SurveysHeader />
      <SurveysSections />
    </div>
  );
}
