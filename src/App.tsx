import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Layout } from "./components/layout/Layout";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";

const Login = lazy(() =>
  import("./pages/auth/Login").then((m) => ({ default: m.Login })),
);
const Register = lazy(() =>
  import("./pages/auth/Register").then((m) => ({ default: m.Register })),
);
const Dashboard = lazy(() =>
  import("./pages/dashboard/Dashboard").then((m) => ({ default: m.Dashboard })),
);
const Users = lazy(() =>
  import("./pages/users/Users").then((m) => ({ default: m.Users })),
);
const Roles = lazy(() =>
  import("./pages/roles/Roles").then((m) => ({ default: m.Roles })),
);
const AuditLogs = lazy(() =>
  import("./pages/audit/AuditLogs").then((m) => ({ default: m.AuditLogs })),
);
const Analytics = lazy(() =>
  import("./pages/analytics/Analytics").then((m) => ({ default: m.Analytics })),
);
const Settings = lazy(() =>
  import("./pages/settings/Settings").then((m) => ({ default: m.Settings })),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <VercelAnalytics />
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route
                index
                element={
                  <ProtectedRoute permission="dashboard:view">
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="users"
                element={
                  <ProtectedRoute permission="users:read">
                    <Users />
                  </ProtectedRoute>
                }
              />
              <Route
                path="roles"
                element={
                  <ProtectedRoute permission="roles:read">
                    <Roles />
                  </ProtectedRoute>
                }
              />
              <Route
                path="audit"
                element={
                  <ProtectedRoute permission="logs:read">
                    <AuditLogs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="analytics"
                element={
                  <ProtectedRoute permission="analytics:view">
                    <Analytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="settings"
                element={
                  <ProtectedRoute permission="settings:read">
                    <Settings />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </QueryClientProvider>
  );
}

export default App;
