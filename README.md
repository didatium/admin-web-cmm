# CMM Admin Web

Hệ thống Dashboard Quản trị (Admin Portal) dành cho dự án CMM (Class Management & Monitoring).

---

## 1. Giới thiệu

**cmm-admin-web** là ứng dụng web dashboard quản trị của hệ thống CMM, cung cấp giao diện quản lý toàn diện cho ban giám hiệu, đoàn trường và quản trị viên nhằm theo dõi nề nếp, lớp học, học sinh, tài khoản, giao ước thi đua, sổ tay vi phạm, chấm điểm - bảng xếp hạng, phân công lịch trực và thống kê dữ liệu thi đua toàn trường.

---

## 2. Yêu cầu hệ thống

- **Node.js**: Phiên bản `>= 20.x` (khuyến nghị `Node.js 22+` hoặc `24.x`).
- **npm**: Phiên bản `>= 10.x` (khuyến nghị `npm 11.x`).

---

## 3. Cài đặt

### Bước 1: Clone repository và điều hướng vào thư mục dự án
```bash
cd cmm-admin-web
```

### Bước 2: Cài đặt dependencies
```bash
npm install
```

### Bước 3: Cấu hình biến môi trường
Tạo file `.env` từ file mẫu `.env.example`:
```bash
cp .env.example .env
```
---

## 4. Chạy môi trường Development

Khởi chạy Vite dev server:
```bash
npm run dev
```
Mặc định ứng dụng sẽ chạy tại địa chỉ: `http://localhost:5173/`

Các lệnh hỗ trợ khác:
- **Kiểm tra cú pháp / Linting**: `npm run lint` (sử dụng [oxlint](https://oxc.rs/))
- **Xem trước bản build cục bộ**: `npm run preview`

---

## 5. Build Production

Chạy lệnh build để biên dịch TypeScript và đóng gói tài nguyên với Vite:
```bash
npm run build
```

Quá trình này thực thi `tsc -b && vite build` và xuất toàn bộ sản phẩm tĩnh vào thư mục `dist/`. Đây là các file tĩnh (HTML, CSS, JS bundle, fonts, assets), không cần Node.js runtime phía server khi triển khai.

---

## 6. Cấu trúc thư mục

Cấu trúc chính trong thư mục `src/`:

```
src/
├── api/             # Cấu hình API client (setupApiClient.ts, baseUrl, interceptor 401 logout)
├── assets/          # Hình ảnh, biểu tượng và tài nguyên tĩnh của ứng dụng
├── auth/            # Quản lý xác thực (AuthContext.tsx), lưu trữ token và Route Guard (ProtectedRoute.tsx)
├── components/      # UI components dùng chung (Layout, Sidebar, Header, DataTable, Radix/shadcn UI)
├── lib/             # Tiện ích bổ trợ giao diện (hàm cn gộp class Tailwind CSS)
├── pages/           # Toàn bộ màn hình chức năng của hệ thống Admin Dashboard
│   ├── classes/     # Quản lý lớp học
│   ├── dslh/        # Danh sách lớp học, tạo tài khoản đơn lẻ / hàng loạt, xóa phân tầng
│   ├── profile/     # Hồ sơ cá nhân & đổi thông tin tài khoản
│   ├── rules/       # Danh mục quy định giao ước thi đua
│   ├── students/    # Danh sách học sinh, lịch sử vi phạm & xuất Excel
│   ├── stvp/        # Sổ tay vi phạm, ghi nhận lỗi & quản lý Sổ đầu bài (SDB)
│   ├── sxlt/        # Sắp xếp lịch trực ban cờ đỏ
│   ├── tkdl/        # Thống kê dữ liệu thi đua & xuất báo cáo
│   ├── users/       # Quản trị tài khoản người dùng
│   ├── weeks/       # Quản lý lịch tuần học
│   ├── xbxh/        # Xếp bậc xếp hạng, điều chỉnh điểm & xuất Excel thi đua tuần
│   ├── DashboardPage.tsx
│   └── LoginPage.tsx
```


---

## 8. Danh sách các trang (Pages & Routes)

Danh sách định tuyến được khai báo trong [`src/App.tsx`](file:///mnt/data/Projects/cmm-project/cmm-admin-web/src/App.tsx) và hiển thị trên thanh điều hướng [`src/components/layout/Sidebar.tsx`](file:///mnt/data/Projects/cmm-project/cmm-admin-web/src/components/layout/Sidebar.tsx):

| Route Path | Tên trang (Tiếng Việt) | Mục đích / Chức năng chính |
| :--- | :--- | :--- |
| `/login` | **Đăng nhập** | Xác thực tài khoản quản trị viên / cán bộ vào hệ thống. |
| `/dashboard` | **Trang chủ** | Hiển thị tổng quan hệ thống, biểu đồ thi đua, chỉ số nhanh và lối tắt chức năng. |
| `/dslh` | **Danh sách lớp học** | Quản lý khối/lớp, tạo tài khoản lớp lẻ hoặc hàng loạt (Bulk Create), xóa lớp phân tầng (Cascade Delete). |
| `/students` | **Quản lý học sinh** | Quản lý hồ sơ học sinh từng lớp, xem lịch sử vi phạm cá nhân và xuất báo cáo vi phạm ra file Excel. |
| `/weeks` | **Quản lý lịch tuần** | Cấu hình danh sách tuần học trong năm, ngày bắt đầu/kết thúc và trạng thái kích hoạt thi đua. |
| `/rules` | **Giao ước thi đua** | Quản lý hệ thống nội quy, danh mục lỗi vi phạm, điểm cộng/trừ và tiêu chí xếp loại. |
| `/stvp` | **Sổ tay vi phạm** | Theo dõi và ghi nhận vi phạm phát sinh của học sinh/lớp, quản lý dữ liệu Sổ đầu bài (SDB). |
| `/xbxh` *(hoặc `/score`)* | **Bảng xếp hạng** | Bảng tổng kết và xếp hạng thi đua nề nếp các lớp theo tuần/tháng/kỳ, điều chỉnh điểm gốc, xuất file Excel thi đua chuẩn. |
| `/tkdl` | **Thống kê dữ liệu** | Báo cáo chi tiết, thống kê số liệu tổng hợp các tiêu chí thi đua toàn trường và hỗ trợ xuất Excel. |
| `/sxlt` | **Sắp xếp lịch trực** | Lập lịch và phân công trực ban, cờ đỏ cho các lớp học theo từng tuần. |
| `/profile` | **Thông tin cá nhân** | Xem thông tin tài khoản đang đăng nhập và thực hiện đổi mật khẩu hoặc thông tin cá nhân. |

---