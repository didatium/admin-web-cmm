import { useAuth } from '../auth/AuthContext';

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-4 text-gray-600">
        Welcome back, <span className="font-semibold text-gray-900">{user?.name || user?.user_name || 'Admin'}</span>!
      </p>
    </div>
  );
}
