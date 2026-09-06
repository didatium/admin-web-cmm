import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, ROLE_ADMIN } from './AuthContext';

export function ProtectedRoute() {
  const { isAuthenticated, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role !== ROLE_ADMIN) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
