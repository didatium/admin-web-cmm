import { NavLink } from 'react-router-dom';

const navItems = [
  { name: 'Trang chủ', path: '/dashboard' },
  { name: 'Danh sách lớp học', path: '/dslh' },
  { name: 'Quản lý học sinh', path: '/students' },
  { name: 'Quản lý lịch tuần', path: '/weeks' },
  { name: 'Giao ước thi đua', path: '/rules' },
  { name: 'Sổ tay vi phạm', path: '/stvp' },
  { name: 'Bảng xếp hạng', path: '/xbxh' },
  { name: 'Thống kê dữ liệu', path: '/tkdl' },
  { name: 'Sắp xếp lịch trực', path: '/sxlt' },
];

export function Sidebar() {
  return (
    <div className="flex h-full w-64 flex-col border-r bg-gray-50">
      <div className="flex h-16 items-center border-b px-6">
        <span className="text-lg font-bold text-gray-900">Admin Portal</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `block rounded-md px-3 py-2 text-sm font-medium ${isActive
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            {item.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
