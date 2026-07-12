import { useAuth } from "../../../auth/useAuth";
import Sidebar from "../../Sidebar/Sidebar";
import SurveyBuilderHeader from "./SurveyBuilderHeader";
import SurveyBuilderSections from "./SurveyBuilderSections";

export default function SurveyBuilder() {
  const { logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900">
      <Sidebar onLogout={logout} />
      <main className="ml-[88px] flex min-h-screen flex-1 flex-col transition-[margin-left] duration-300 ease-in-out peer-hover/sidebar:ml-[300px] max-md:ml-[72px] max-md:peer-hover/sidebar:ml-[72px]">
        <SurveyBuilderHeader />
        <SurveyBuilderSections />
      </main>
    </div>
  );
}
