import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  CalendarDays,
  Scale,
  ClipboardList,
  Trophy,
  BarChart3,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const navItems = [
  { name: 'Trang chủ', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Danh sách lớp học', path: '/dslh', icon: GraduationCap },
  { name: 'Quản lý học sinh', path: '/students', icon: Users },
  { name: 'Quản lý lịch tuần', path: '/weeks', icon: CalendarDays },
  { name: 'Giao ước thi đua', path: '/rules', icon: Scale },
  { name: 'Sổ tay vi phạm', path: '/stvp', icon: ClipboardList },
  { name: 'Bảng xếp hạng', path: '/xbxh', icon: Trophy },
  { name: 'Thống kê dữ liệu', path: '/tkdl', icon: BarChart3 },
  { name: 'Sắp xếp lịch trực', path: '/sxlt', icon: CalendarClock },
];

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ isCollapsed = false, onToggle }: SidebarProps) {
  return (
    <aside
      className={`relative flex h-full shrink-0 flex-col border-r bg-gray-50/90 backdrop-blur transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Sidebar Header */}
      <div
        className={`flex h-16 items-center border-b bg-white px-3.5 transition-all duration-300 ${
          isCollapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs shadow-xs">
            CMM
          </div>
          {!isCollapsed && (
            <span className="text-base font-bold text-gray-900 tracking-tight truncate">
              Admin Portal
            </span>
          )}
        </div>

        {/* Toggle Collapse Button on Desktop */}
        {onToggle && !isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8 text-gray-500 hover:text-gray-800 hover:bg-gray-100"
            title="Thu gọn thanh điều hướng"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex-1 space-y-1.5 p-2.5 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              title={isCollapsed ? item.name : undefined}
              className={({ isActive }) =>
                `group flex items-center rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-150 ${
                  isCollapsed ? 'justify-center' : 'gap-3'
                } ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                    : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      isActive
                        ? 'text-indigo-600'
                        : 'text-gray-500 group-hover:text-gray-700'
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="truncate leading-normal">{item.name}</span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Sidebar Footer / Collapsed Toggle when in Mini mode */}
      {onToggle && isCollapsed && (
        <div className="border-t bg-white p-2 flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8 text-gray-500 hover:text-gray-800 hover:bg-gray-100"
            title="Mở rộng thanh điều hướng"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </aside>
  );
}
