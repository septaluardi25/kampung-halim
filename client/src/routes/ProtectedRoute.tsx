import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { useAuthStore } from '../stores/authStore';

export function ProtectedRoute() {
  const { isAuthenticated, isHydrated } = useAuthStore();
  const location = useLocation();

  if (!isHydrated) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

