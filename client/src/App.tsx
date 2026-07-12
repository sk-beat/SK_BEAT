
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

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute
                allowedRoles={["admin", "technician", "faculty"] as const}
              >
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/youth-records"
            element={
              <ProtectedRoute
                allowedRoles={["admin", "technician", "faculty"] as const}
              >
                <YouthRecord />
              </ProtectedRoute>
            }
          />
          <Route
            path="/activities"
            element={
              <ProtectedRoute
                allowedRoles={["admin", "technician", "faculty"] as const}
              >
                <Activities />
              </ProtectedRoute>
            }
          />
          <Route
            path="/financial"
            element={
              <ProtectedRoute
                allowedRoles={["admin", "technician", "faculty"] as const}
              >
                <Financial />
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
                <SurveysAnnouncements view="suggestions" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/survey-responses"
            element={
              <ProtectedRoute
                allowedRoles={["admin", "technician", "faculty"] as const}
              >
                <SurveysAnnouncements view="responses" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/announcements"
            element={
              <ProtectedRoute
                allowedRoles={["admin", "technician", "faculty"] as const}
              >
                <SurveysAnnouncements view="announcements" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/survey-builder"
            element={
              <ProtectedRoute
                allowedRoles={["admin", "technician", "faculty"] as const}
              >
                <SurveyBuilder />
              </ProtectedRoute>
            }
          />
          <Route element={<YouthLayout />}>
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/youth-portal" element={<YouthPortalPage />} />
            <Route path="/youth-officials" element={<YouthOfficialsPage />} />
            <Route path="/youth-events" element={<YouthEventsPage />} />
            <Route path="/youth-surveys" element={<YouthSurveysPage />} />
          </Route>
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
