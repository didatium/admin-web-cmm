import { Outlet, useNavigate } from 'react-router-dom';
import { User, LogOut, ChevronDown } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { SmallScreenGuard } from './SmallScreenGuard';
import { useAuth } from '../../auth/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function AppLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.name || user?.user_name || 'Admin';
  const initial = displayName.charAt(0).toUpperCase();

  const getRoleBadge = (role?: string | null) => {
    switch (role) {
      case 'admin':
        return 'Quản trị viên';
      case 'admin_khoi':
        return 'Admin khối';
      case 'sao_do':
        return 'Sao đỏ';
      default:
        return role || 'Người dùng';
    }
  };

  return (
    <div className="flex h-screen bg-white">
      <SmallScreenGuard />
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex h-16 items-center justify-between border-b px-6 bg-white shadow-sm">
          <div className="font-medium text-gray-800">
            {/* Topbar content */}
          </div>
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 rounded-full p-1 pl-2 pr-3 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-medium text-sm shadow-sm">
                    {initial}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-sm font-semibold text-gray-800 leading-tight">
                      {displayName}
                    </div>
                    <div className="text-xs text-gray-500 leading-tight">
                      {getRoleBadge(user?.role)}
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500 ml-0.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-1">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold leading-none text-gray-900">{displayName}</p>
                    <p className="text-xs leading-none text-gray-500">
                      ID: {user?.user_id || user?.id || '-'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigate('/profile')}
                  className="cursor-pointer gap-2 py-2"
                >
                  <User className="h-4 w-4 text-gray-600" />
                  <span>Tài khoản của tôi</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer gap-2 py-2 text-red-600 focus:text-red-700 focus:bg-red-50"
                >
                  <LogOut className="h-4 w-4 text-red-600" />
                  <span>Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

