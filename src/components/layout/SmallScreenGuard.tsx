import { useState } from 'react';
import { Monitor, AlertTriangle, X } from 'lucide-react';

interface SmallScreenGuardProps {
  /**
   * If true, allows the user to dismiss the warning for the current session.
   * Default: true
   */
  allowBypass?: boolean;
}

export function SmallScreenGuard({ allowBypass = false }: SmallScreenGuardProps) {
  const [dismissed, setDismissed] = useState(false);

  // If dismissed by user, render a small floating helper badge
  if (dismissed) {
    return (
      <div className="fixed bottom-3 right-3 z-50 md:hidden">
        <button
          onClick={() => setDismissed(false)}
          className="flex items-center gap-1.5 rounded-full bg-amber-500/90 text-white px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur hover:bg-amber-600 transition-all"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>Màn hình nhỏ</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 p-4 backdrop-blur-md md:hidden animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl space-y-6 text-gray-800">
        {/* Header with Icon */}
        <div className="flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Monitor className="h-6 w-6" />
          </div>
          {allowBypass && (
            <button
              onClick={() => setDismissed(true)}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              aria-label="Đóng thông báo"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Title and Description */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            Khuyến nghị màn hình lớn hơn 768px
          </div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Yêu cầu màn hình lớn hơn
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Hệ thống <strong>CMM Admin Portal</strong> được thiết kế tối ưu cho bảng biểu phức tạp, thống kê nhiều cột và xuất nhập dữ liệu trên <strong>Máy tính bảng hoặc Laptop</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
