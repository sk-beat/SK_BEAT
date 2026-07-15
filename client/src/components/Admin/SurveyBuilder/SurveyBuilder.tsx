import { useEffect, useState } from "react";
import { useAuth } from "../../../auth/useAuth";
import Sidebar from "../../Sidebar/Sidebar";
import SurveyBuilderHeader from "./SurveyBuilderHeader";
import SurveyBuilderModals, { type SurveyBuilderModalMode } from "./SurveyBuilderModals";
import SurveyBuilderSections from "./SurveyBuilderSections";
import {
  deleteAdminSurvey,
  getAdminSurveys,
  saveAdminSurvey,
  type AdminSurvey,
  type SaveSurveyPayload,
} from "./SurveyBuilderService";

export default function SurveyBuilder() {
  const { logout } = useAuth();
  const [surveys, setSurveys] = useState<AdminSurvey[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<AdminSurvey | null>(null);
  const [modalMode, setModalMode] = useState<SurveyBuilderModalMode>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function loadSurveys() {
    setIsLoading(true);
    setErrorMessage(null);
    const { data, error } = await getAdminSurveys();

    if (error) {
      setErrorMessage(error.message);
    }

    setSurveys(data);
    setIsLoading(false);
  }

  function openModal(mode: Exclude<SurveyBuilderModalMode, null>, survey?: AdminSurvey) {
    setSelectedSurvey(survey ?? null);
    setModalMode(mode);
  }

  function closeModal() {
    setSelectedSurvey(null);
    setModalMode(null);
  }

  async function handleSave(payload: SaveSurveyPayload) {
    setIsSaving(true);
    setErrorMessage(null);
    const { error } = await saveAdminSurvey(payload);
    setIsSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    closeModal();
    await loadSurveys();
  }

  async function handleDelete(surveyId: number) {
    const shouldDelete = window.confirm("Delete this survey?");

    if (!shouldDelete) {
      return;
    }

    const { error } = await deleteAdminSurvey(surveyId);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    await loadSurveys();
  }

  async function handleStatusChange(survey: AdminSurvey, status: AdminSurvey["status"]) {
    await handleSave({
      description: survey.description,
      end_date: survey.end_date,
      questions: survey.survey_questions,
      start_date: survey.start_date,
      status,
      survey_id: survey.survey_id,
      target_audience: survey.target_audience,
      title: survey.title,
    });
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSurveys();
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900">
      <Sidebar onLogout={logout} />
      <main className="ml-[88px] flex min-h-screen flex-1 flex-col transition-[margin-left] duration-300 ease-in-out peer-hover/sidebar:ml-[300px] max-md:ml-[72px] max-md:peer-hover/sidebar:ml-[72px]">
        <SurveyBuilderHeader />
        <SurveyBuilderSections
          errorMessage={errorMessage}
          isLoading={isLoading}
          onCreate={() => openModal("form")}
          onDelete={handleDelete}
          onEdit={(survey) => openModal("form", survey)}
          onStatusChange={handleStatusChange}
          onView={(survey) => openModal("details", survey)}
          surveys={surveys}
        />
      </main>
      <SurveyBuilderModals
        isSaving={isSaving}
        mode={modalMode}
        onClose={closeModal}
        onSave={handleSave}
        survey={selectedSurvey}
      />
    </div>
  );
}
