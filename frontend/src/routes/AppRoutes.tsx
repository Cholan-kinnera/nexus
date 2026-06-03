import { Routes, Route, Navigate } from "react-router-dom";
import DashboardPage from "../pages/DashboardPage";
import { ProtectedRoute } from "./ProtectedRoute";
import ProjectsPage from "../pages/ProjectsPage";
import { TasksPage } from "../pages/TasksPage";
import AuthPage from "../pages/AuthPage";
import LandingPage from "../pages/LandingPage";
import SettingsPage from "../pages/SettingsPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/login" element={<Navigate to="/auth" replace />} />
      <Route path="/signup" element={<Navigate to="/auth?tab=signup" replace />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <ProjectsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks"
        element={
          <ProtectedRoute>
            <TasksPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<LandingPage />} />
    </Routes>
  );
}