
import { type ReactNode, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import Activities from "./components/Admin/Activities/Activities";
import Dashboard from "./components/Admin/Dashboard/Dashboard";
import Financial from "./components/Admin/Financial/Financial";
import SurveyBuilder from "./components/Admin/SurveyBuilder/SurveyBuilder";
import SurveysAnnouncements from "./components/Admin/SurveysAnnouncements/SurveysAnnouncements";
import YouthRecord from "./components/Admin/YouthRecord/YouthRecord";
import LoginPage from "./pages/Admin/LoginPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import LandingPage from "./pages/Youth/LandingPage";
import YouthEventsPage from "./pages/Youth/YouthEventsPage";
import YouthLayout from "./pages/Youth/YouthLayout";
import YouthOfficialsPage from "./pages/Youth/YouthOfficialsPage";
import YouthPortalPage from "./pages/Youth/YouthPortalPage";
import YouthSurveysPage from "./pages/Youth/YouthSurveysPage";
import { ProtectedRoute, PublicRoute } from "./routes/ProtectedRoute";

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
              <ProtectedRoute
                allowedRoles={["admin", "technician", "faculty"] as const}
              >
                <PageTitle title="Dashboard">
                  <Dashboard />
                </PageTitle>
              </ProtectedRoute>
            }
          />
          <Route
            path="/youth-records"
            element={
              <ProtectedRoute
                allowedRoles={["admin", "technician", "faculty"] as const}
              >
                <PageTitle title="Youth Records">
                  <YouthRecord />
                </PageTitle>
              </ProtectedRoute>
            }
          />
          <Route
            path="/activities"
            element={
              <ProtectedRoute
                allowedRoles={["admin", "technician", "faculty"] as const}
              >
                <PageTitle title="Activities">
                  <Activities />
                </PageTitle>
              </ProtectedRoute>
            }
          />
          <Route
            path="/financial"
            element={
              <ProtectedRoute
                allowedRoles={["admin", "technician", "faculty"] as const}
              >
                <PageTitle title="Financial">
                  <Financial />
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
              <ProtectedRoute
                allowedRoles={["admin", "technician", "faculty"] as const}
              >
                <PageTitle title="Kabataan Suggestions">
                  <SurveysAnnouncements view="suggestions" />
                </PageTitle>
              </ProtectedRoute>
            }
          />
          <Route
            path="/survey-responses"
            element={
              <ProtectedRoute
                allowedRoles={["admin", "technician", "faculty"] as const}
              >
                <PageTitle title="Survey Responses">
                  <SurveysAnnouncements view="responses" />
                </PageTitle>
              </ProtectedRoute>
            }
          />
          <Route
            path="/announcements"
            element={
              <ProtectedRoute
                allowedRoles={["admin", "technician", "faculty"] as const}
              >
                <PageTitle title="Announcements">
                  <SurveysAnnouncements view="announcements" />
                </PageTitle>
              </ProtectedRoute>
            }
          />
          <Route
            path="/survey-builder"
            element={
              <ProtectedRoute
                allowedRoles={["admin", "technician", "faculty"] as const}
              >
                <PageTitle title="Survey Builder">
                  <SurveyBuilder />
                </PageTitle>
              </ProtectedRoute>
            }
          />
          <Route element={<YouthLayout />}>
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
                  <YouthPortalPage />
                </PageTitle>
              }
            />
            <Route
              path="/youth-officials"
              element={
                <PageTitle title="SK Officials">
                  <YouthOfficialsPage />
                </PageTitle>
              }
            />
            <Route
              path="/youth-events"
              element={
                <PageTitle title="Events">
                  <YouthEventsPage />
                </PageTitle>
              }
            />
            <Route
              path="/youth-surveys"
              element={
                <PageTitle title="Surveys">
                  <YouthSurveysPage />
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
