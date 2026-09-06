import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { StudentsPage } from './pages/students/StudentsPage';
import { WeeksPage } from './pages/weeks/WeeksPage';
import { RulesPage } from './pages/rules/RulesPage';
import { StvpPage } from './pages/stvp/StvpPage';
import { XbxhPage } from './pages/xbxh/XbxhPage';
import { DslhPage } from './pages/dslh/DslhPage';
import { TkdlPage } from './pages/tkdl/TkdlPage';
import { SxltPage } from './pages/sxlt/SxltPage';
import { setupApiClient } from './api/setupApiClient';

// Initialize the API client
setupApiClient();

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/dslh" element={<DslhPage />} />
                <Route path="/students" element={<StudentsPage />} />
                <Route path="/weeks" element={<WeeksPage />} />
                <Route path="/rules" element={<RulesPage />} />
                <Route path="/stvp" element={<StvpPage />} />
                <Route path="/xbxh" element={<XbxhPage />} />
                <Route path="/score" element={<Navigate to="/xbxh" replace />} />
                <Route path="/tkdl" element={<TkdlPage />} />
                <Route path="/sxlt" element={<SxltPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
