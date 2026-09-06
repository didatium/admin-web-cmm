import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../auth/AuthContext';

export function AppLayout() {
  const { logout, user } = useAuth();

  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b px-6 bg-white shadow-sm">
          <div className="font-medium text-gray-800">
            {/* Topbar content could go here */}
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">{user?.name || user?.user_name}</span>
            <button
              onClick={logout}
              className="text-sm font-medium text-red-600 hover:text-red-800"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
