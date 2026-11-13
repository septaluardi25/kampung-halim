import { useEffect } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { registerUnauthorizedHandler } from './lib/api';
import { AdminPlaceholderPage } from './pages/AdminPlaceholderPage';
import { EmployeeDetailPage } from './pages/EmployeeDetailPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { MemoriesPage } from './pages/MemoriesPage';
import { MemoryDetailPage } from './pages/MemoryDetailPage';
import { MessagesPage } from './pages/MessagesPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AdminRoute } from './routes/AdminRoute';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { useAuthStore } from './stores/authStore';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Rute Publik */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Rute Terlindungi (User & Admin) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/karyawan" element={<EmployeesPage />} />
          <Route path="/karyawan/:id" element={<EmployeeDetailPage />} />
          <Route path="/kenangan" element={<MemoriesPage />} />
          <Route path="/kenangan/:id" element={<MemoryDetailPage />} />
          <Route path="/pesan" element={<MessagesPage />} />
        </Route>

        {/* Rute Khusus Admin */}
        <Route element={<AdminRoute />}>
          <Route path="/admin/*" element={<AdminPlaceholderPage />} />
        </Route>

        {/* Fallback 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  const hydrateAuth = useAuthStore((state) => state.hydrateAuth);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    void hydrateAuth();
  }, [hydrateAuth]);

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      if (location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
    });
    return () => registerUnauthorizedHandler(null);
  }, [location.pathname, navigate]);

  return <AppRoutes />;
}

