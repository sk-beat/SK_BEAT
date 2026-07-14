import SurveyDetailsHeader from "./SurveyDetailsHeader";
import SurveyDetailsSections from "./SurveyDetailsSections";

export default function SurveyDetails() {
  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      <SurveyDetailsHeader />
      <SurveyDetailsSections />
    </div>
  );
}
