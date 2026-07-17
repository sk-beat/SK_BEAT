import { type ReactNode, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import Activities from "./components/Admin/Activities/Activities";
import Dashboard from "./components/Admin/Dashboard/Dashboard";
import Financial from "./components/Admin/Financial/Financial";
import SKOfficials from "./components/Admin/SKOfficials/SKOfficials";
import LandingPageSettings from "./components/Admin/LandingPageSettings/LandingPageSettings";
import SurveyBuilder from "./components/Admin/SurveyBuilder/SurveyBuilder";
import SurveysAnnouncements from "./components/Admin/SurveysAnnouncements/SurveysAnnouncements";
import YouthRecord from "./components/Admin/YouthRecord/YouthRecord";
import LoginPage from "./pages/LoginPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import LandingPage from "./pages/LandingPage";
import EventFeedbackPage from "./pages/EventFeedbackPage";
import AdminEventsPage from "./pages/Admin/AdminEventsPage";
import AdminLayout from "./pages/Admin/AdminLayout";
import AdminOfficialsPage from "./pages/Admin/AdminOfficialsPage";
import AdminPortalPage from "./pages/Admin/AdminPortalPage";
import AdminSurveysPage from "./pages/Admin/AdminSurveysPage";
import PublicSurveyDetailsPage from "./pages/PublicSurveyDetailsPage";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import YouthEventsPage from "./pages/Youth/YouthEventsPage";
import YouthAnnouncementsPage from "./pages/Youth/YouthAnnouncementsPage";
import YouthFeedbackPage from "./pages/Youth/YouthFeedbackPage";
import YouthHomePage from "./pages/Youth/YouthHomePage";
import YouthLayoutPage from "./pages/Youth/YouthLayoutPage";
import YouthProfilePage from "./pages/Youth/YouthProfilePage";
import YouthSurveyDetailsPage from "./pages/Youth/YouthSurveyDetailsPage";
import YouthSurveysPage from "./pages/Youth/YouthSurveysPage";
import { PublicRoute } from "./routes/PublicRoute";

const appTitle = "SK Kabataan Portal";

function PageTitle({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  useEffect(() => {
    document.title = `${title} | ${appTitle}`;
  }, [title]);

  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Youth Routes wrapped in YouthLayoutPage */}
          {/* The index route ("") loads when the user visits /youth */}
          <Route path="/youth" element={<YouthLayoutPage />}>
            <Route
              index
              element={
                <ProtectedRoute allowedRoles={["kabataan"]}>
                  <YouthHomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="surveys"
              element={
                <ProtectedRoute allowedRoles={["kabataan"]}>
                  <YouthSurveysPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="surveys/:surveyId"
              element={
                <ProtectedRoute allowedRoles={["kabataan"]}>
                  <YouthSurveyDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="events"
              element={
                <ProtectedRoute allowedRoles={["kabataan"]}>
                  <YouthEventsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="announcements"
              element={
                <ProtectedRoute allowedRoles={["kabataan"]}>
                  <YouthAnnouncementsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="profile"
              element={
                <ProtectedRoute allowedRoles={["kabataan"]}>
                  <YouthProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="feedback"
              element={
                <ProtectedRoute allowedRoles={["kabataan"]}>
                  <YouthFeedbackPage />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route
            path="/event-feedback/:eventId"
            element={
              <PageTitle title="Event Feedback">
                <EventFeedbackPage />
              </PageTitle>
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <PageTitle title="Login">
                  <LoginPage />
                </PageTitle>
              </PublicRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"] as const}>
                <PageTitle title="Dashboard">
                  <Dashboard />
                </PageTitle>
              </ProtectedRoute>
            }
          />
          <Route
            path="/youth-records"
            element={
              <ProtectedRoute allowedRoles={["admin"] as const}>
                <PageTitle title="Youth Records">
                  <YouthRecord />
                </PageTitle>
              </ProtectedRoute>
            }
          />
          <Route
            path="/activities"
            element={
              <ProtectedRoute allowedRoles={["admin"] as const}>
                <PageTitle title="Activities">
                  <Activities />
                </PageTitle>
              </ProtectedRoute>
            }
          />
          <Route
            path="/financial"
            element={
              <ProtectedRoute allowedRoles={["admin"] as const}>
                <PageTitle title="Financial">
                  <Financial />
                </PageTitle>
              </ProtectedRoute>
            }
          />
          <Route
            path="/sk-officials"
            element={
              <ProtectedRoute allowedRoles={["admin"] as const}>
                <PageTitle title="SK Officials">
                  <SKOfficials />
                </PageTitle>
              </ProtectedRoute>
            }
          />
          <Route
            path="/surveys-announcements"
            element={<Navigate to="/kabataan-suggestions" replace />}
          />
          <Route
            path="/kabataan-suggestions"
            element={
              <ProtectedRoute allowedRoles={["admin"] as const}>
                <PageTitle title="Kabataan Suggestions">
                  <SurveysAnnouncements view="suggestions" />
                </PageTitle>
              </ProtectedRoute>
            }
          />
          <Route
            path="/survey-responses"
            element={
              <ProtectedRoute allowedRoles={["admin"] as const}>
                <PageTitle title="Survey Responses">
                  <SurveysAnnouncements view="responses" />
                </PageTitle>
              </ProtectedRoute>
            }
          />
          <Route
            path="/announcements"
            element={
              <ProtectedRoute allowedRoles={["admin"] as const}>
                <PageTitle title="Announcements">
                  <SurveysAnnouncements view="announcements" />
                </PageTitle>
              </ProtectedRoute>
            }
          />
          <Route
            path="/survey-builder"
            element={
              <ProtectedRoute allowedRoles={["admin"] as const}>
                <PageTitle title="Survey Builder">
                  <SurveyBuilder />
                </PageTitle>
              </ProtectedRoute>
            }
          />
          <Route
            path="/landing-page-settings"
            element={
              <ProtectedRoute allowedRoles={["admin"] as const}>
                <PageTitle title="Landing Page Settings">
                  <LandingPageSettings />
                </PageTitle>
              </ProtectedRoute>
            }
          />
          <Route element={<AdminLayout />}>
            <Route
              path="/"
              element={
                <PageTitle title="Home">
                  <LandingPage />
                </PageTitle>
              }
            />
            <Route path="/landing" element={<Navigate to="/" replace />} />
            <Route
              path="/youth-portal"
              element={
                <PageTitle title="Youth Portal">
                  <AdminPortalPage />
                </PageTitle>
              }
            />
            <Route
              path="/youth-officials"
              element={
                <PageTitle title="SK Officials">
                  <AdminOfficialsPage />
                </PageTitle>
              }
            />
            <Route
              path="/youth-events"
              element={
                <PageTitle title="Events">
                  <AdminEventsPage />
                </PageTitle>
              }
            />
            <Route
              path="/youth-surveys"
              element={
                <PageTitle title="Surveys">
                  <AdminSurveysPage />
                </PageTitle>
              }
            />
            <Route path="/surveys" element={<Navigate to="/youth-surveys" replace />} />
            <Route
              path="/surveys/:surveyId"
              element={
                <PageTitle title="Survey">
                  <PublicSurveyDetailsPage />
                </PageTitle>
              }
            />
          </Route>

          <Route
            path="/unauthorized"
            element={
              <PageTitle title="Unauthorized">
                <UnauthorizedPage />
              </PageTitle>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
