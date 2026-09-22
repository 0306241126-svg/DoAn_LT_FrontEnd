# ĐỒ ÁN: PRIVATE NOTE-TAKING APP (ỨNG DỤNG QUẢN LÝ GHI CHÚ BẢO MẬT)

---

## 1. THÔNG TIN NHÓM THỰC HIỆN

| STT | Họ và Tên | Vai Trò | Nhiệm Vụ Chính |
| :---: | :--- | :--- | :--- |
| 1 | **Lê Minh Quân** | Thành viên | Setup môi trường dự án, cấu hình Axios, Core CSS, Common Components và Services[cite: 6, 7]. |
| 2 | **Ngô Gia Bảo** | Thành viên | Xây dựng hệ thống File I/O, mã hóa Bcrypt, Profile API, Layout và Giao diện ghi chú[cite: 6, 7]. |
| 3 | **Nguyễn Hoài Linh** | Thành viên | Xây dựng API Topic, API Note, Auth Guard, Context API, Vùng riêng tư và Routing[cite: 6, 7]. |

---

## 2. MÔ TẢ SƠ LƯỢC ĐỒ ÁN

**Private Note-Taking App** là ứng dụng ghi chú cá nhân đa nền tảng web, áp dụng kiến trúc Monorepo với công nghệ hiện đại (Frontend: React 18, Vite, Tailwind CSS v4; Backend: Node.js, Express)[cite: 4, 6].

### Các chức năng nổi bật:
* **Quản lý danh mục chủ đề (Topics):** Hỗ trợ tạo, sửa, xóa và hiển thị đầy đủ tên chủ đề có dấu tiếng Việt[cite: 4, 6].
* **Quản lý ghi chú thường (Notes CRUD):** Tạo mới, chỉnh sửa, xóa và tìm kiếm nhanh ghi chú theo thời gian thực (tích hợp kỹ thuật Debounce chống quá tải API)[cite: 4, 7].
* **Vùng riêng tư bảo mật 2 lớp (Private Zone):** Khu vực lưu trữ các ghi chú nhạy cảm, yêu cầu bảo vệ bằng mật khẩu (mã hóa Bcrypt, yêu cầu độ dài từ 7 ký tự trở lên)[cite: 4, 6, 7]. Tự động khóa an toàn sau một khoảng thời gian không thao tác[cite: 4, 7].
* **Hệ thống lưu trữ tệp cục bộ an toàn (Local File Storage):** Lưu trữ dữ liệu dạng JSON, áp dụng cơ chế ghi an toàn (Atomic Write) chống lỗi mất dữ liệu khi xảy ra ngắt quãng tiến trình[cite: 4, 6].
* **Tùy biến giao diện (Theming System):** Chuyển đổi linh hoạt chế độ Sáng/Tối (Dark Mode) và bộ chọn 7 màu chủ đạo, lưu trữ trạng thái chống giật màn hình khi tải lại trang[cite: 4, 7].

---

## 3. CẤU TRÚC CÂY THƯ MỤC DỰ ÁN

```text
quan-ly-ghi-chu/
│
├── .gitignore                                 # Khai báo loại trừ node_modules/ và .env khi đẩy mã nguồn lên Git[cite: 7]
├── README.md                                  # Tài liệu giới thiệu, thông tin thành viên và hướng dẫn chạy đồ án[cite: 7]
│
├── backend/                                   # Mã nguồn phía máy chủ (Node.js / Express)[cite: 7, 8]
│   ├── data/                                  # Kho lưu trữ dữ liệu JSON tĩnh của ứng dụng[cite: 7, 8]
│   │   └── users/                             # Thư mục lưu dữ liệu theo người dùng[cite: 7, 8]
│   │       └── default_user/                  # Người dùng mặc định của hệ thống[cite: 7, 8]
│   │           ├── notes/                     # Thư mục chứa các tệp ghi chú theo từng chủ đề[cite: 7, 8]
│   │           │   ├── [slug].json            # Tệp ghi chú theo chủ đề động (ví dụ: hoc-tap.json, do-an.json)[cite: 7, 8]
│   │           │   └── private.json           # Tệp ghi chú bảo vệ thuộc Vùng riêng tư[cite: 7, 8]
│   │           └── profile.json               # Cấu hình người dùng: tên, theme, màu sắc, mảng danh sách topics, mật khẩu băm[cite: 7, 8]
│   │
│   ├── src/                                   # Mã nguồn chính của Backend[cite: 7, 8]
│   │   ├── config/                            # Cấu hình hệ thống[cite: 7, 8]
│   │   │   └── constants.js                   # Đường dẫn tuyệt đối DATA_DIR và hằng số DEFAULT_USERNAME[cite: 7, 8]
│   │   │
│   │   ├── controllers/                       # Xử lý nghiệp vụ và thao tác đọc/ghi dữ liệu[cite: 7, 8]
│   │   │   ├── noteController.js              # Xử lý CRUD ghi chú thông thường[cite: 7, 8]
│   │   │   ├── privateController.js           # Xử lý cài đặt mật khẩu, mở khóa và CRUD ghi chú riêng tư[cite: 7, 8]
│   │   │   ├── profileController.js           # Xử lý xem/cập nhật hồ sơ và giao diện[cite: 7, 8]
│   │   │   └── topicController.js             # Xử lý xem, tạo, sửa tên và xóa chủ đề[cite: 7, 8]
│   │   │
│   │   ├── middlewares/                       # Các tầng trung gian kiểm tra bảo mật[cite: 7, 8]
│   │   │   └── verifyPrivateAccess.js         # Kiểm tra Header Authorization, chặn truy cập trái phép vào vùng kín (HTTP 401)[cite: 7, 8]
│   │   │
│   │   ├── routes/                            # Định nghĩa các điểm cuối API[cite: 7, 8]
│   │   │   ├── noteRoutes.js                  # Định tuyến các API liên quan đến ghi chú[cite: 7, 8]
│   │   │   ├── privateRoutes.js               # Định tuyến các API liên quan đến vùng riêng tư[cite: 7, 8]
│   │   │   ├── profileRoutes.js               # Định tuyến các API liên quan đến hồ sơ cá nhân[cite: 7, 8]
│   │   │   └── topicRoutes.js                 # Định tuyến các API liên quan đến chủ đề[cite: 7, 8]
│   │   │
│   │   └── utils/                             # Các hàm tiện ích hỗ trợ nghiệp vụ[cite: 7, 8]
│   │       ├── encryption.js                  # Hàm băm (hashPassword) và so sánh mật khẩu (comparePassword) bằng Bcrypt[cite: 7, 8]
│   │       ├── fileHelper.js                  # Hàm đọc file (readJson) và ghi an toàn (atomicWriteJson)[cite: 7, 8]
│   │       └── slugify.js                     # Hàm chuyển đổi tiếng Việt có dấu sang slug không dấu[cite: 7, 8]
│   │
│   ├── .env                                   # Biến môi trường Backend (chứa PORT=5000)[cite: 7, 8]
│   ├── package.json                           # Khai báo các thư viện npm Backend (express, cors, bcrypt, dotenv)[cite: 7, 8]
│   └── server.js                              # Khởi chạy Express, cấu hình middleware (cors, json parser), gom các routes[cite: 7, 8]
│
│
└── frontend/                                  # Giao diện người dùng (React 18 + Vite + Tailwind CSS v4)[cite: 7, 8]
    ├── public/                                # Chứa tài nguyên tĩnh công khai[cite: 7, 8]
    │   └── vite.svg                           # Logo mặc định của Vite
    │
    ├── src/                                   # Mã nguồn chính của Frontend[cite: 7, 8]
    │   ├── assets/                            # Hình ảnh, biểu tượng hoặc font chữ của ứng dụng[cite: 7, 8]
    │   │   └── react.svg                      # Logo React
    │   │
    │   ├── components/                        # Các thành phần giao diện tái sử dụng[cite: 7, 8]
    │   │   ├── common/                        # Component dùng chung[cite: 7, 8]
    │   │   │   ├── Button.jsx                 # Nút bấm tùy biến giao diện, hỗ trợ icon xoay khi loading[cite: 7, 8]
    │   │   │   ├── Input.jsx                  # Ô nhập liệu có tích hợp nhãn label và hiển thị lỗi validation[cite: 7, 8]
    │   │   │   ├── LoadingSpinner.jsx         # Hiệu ứng vòng xoay khi chờ tải dữ liệu[cite: 7, 8]
    │   │   │   └── Toast.jsx                  # Thông báo popup căn giữa phía trên màn hình, tự đóng sau vài giây[cite: 7, 8]
    │   │   │
    │   │   ├── layout/                        # Khung xương của giao diện[cite: 7, 8]
    │   │   │   ├── Header.jsx                 # Thanh trên cùng chứa ô tìm kiếm, nút chuyển sáng/tối và thông tin người dùng[cite: 7, 8]
    │   │   │   ├── MainLayout.jsx             # Layout chính ghép nối Header, Sidebar và vùng nội dung Outlet[cite: 7, 8]
    │   │   │   └── Sidebar.jsx                # Thanh menu bên trái liệt kê chủ đề có dấu, nút thêm chủ đề và nút Vùng riêng tư[cite: 7, 8]
    │   │   │
    │   │   ├── notes/                         # Component phục vụ tính năng ghi chú[cite: 7, 8]
    │   │   │   ├── NoteCard.jsx               # Thẻ hiển thị tóm tắt ghi chú (tiêu đề, nội dung ngắn gọn, ngày tạo/sửa)[cite: 7, 8]
    │   │   │   └── NoteFormModal.jsx          # Hộp thoại tạo/sửa ghi chú (bắt buộc kiểm tra tiêu đề không được để trống)[cite: 7, 8]
    │   │   │
    │   │   └── private/                       # Component phục vụ tính năng bảo mật[cite: 7, 8]
    │   │       └── PrivateLockModal.jsx       # Hộp thoại chặn màn hình yêu cầu nhập mật khẩu (>6 ký tự), nút X thoát về trang chủ[cite: 7, 8]
    │   │
    │   ├── context/                           # Quản lý trạng thái toàn cục (Context API)[cite: 7, 8]
    │   │   ├── AuthPrivateContext.jsx         # Quản lý trạng thái isUnlocked, token mở khóa và đếm ngược tự động khóa lại[cite: 7, 8]
    │   │   ├── NoteContext.jsx                # Quản lý danh sách ghi chú, danh sách chủ đề và chủ đề active[cite: 7, 8]
    │   │   └── ThemeContext.jsx               # Quản lý Sáng/Tối, 7 màu chủ đạo, lưu temp-theme vào localStorage chống nháy trắng[cite: 7, 8]
    │   │
    │   ├── hooks/                             # Custom hooks[cite: 7, 8]
    │   │   └── useDebounce.js                 # Hook trì hoãn từ khóa tìm kiếm (500ms) để tối ưu hiệu năng gọi API[cite: 7, 8]
    │   │
    │   ├── pages/                             # Các màn hình chính của ứng dụng[cite: 7, 8]
    │   │   ├── NotesPage.jsx                  # Trang hiển thị danh sách thẻ ghi chú thường (có xử lý Empty State)[cite: 7, 8]
    │   │   ├── PrivateNotesPage.jsx           # Trang hiển thị ghi chú bảo mật (bọc khóa an toàn, thanh tiêu đề linh hoạt)[cite: 7, 8]
    │   │   └── SettingsPage.jsx               # Trang Cài đặt (đổi tên hiển thị, chuyển chế độ Sáng/Tối, bảng chọn 7 màu chủ đạo)[cite: 7, 8]
    │   │
    │   ├── services/                          # Tầng gọi API qua Axios kết nối xuống Backend[cite: 7, 8]
    │   │   ├── api.js                         # Cấu hình Axios instance (baseURL cổng 5000, interceptors gắn token)[cite: 7, 8]
    │   │   ├── noteService.js                 # Các hàm gọi API CRUD ghi chú thông thường[cite: 7, 8]
    │   │   ├── privateService.js              # Các hàm gọi API mở khóa, cài đặt mật khẩu và CRUD ghi chú riêng tư[cite: 7, 8]
    │   │   ├── profileService.js              # Các hàm gọi API lấy và cập nhật profile cá nhân[cite: 7, 8]
    │   │   └── topicService.js                # Các hàm gọi API lấy, thêm, sửa tên và xóa chủ đề[cite: 7, 8]
    │   │
    │   ├── App.jsx                            # Cấu hình React Router (trỏ /, /private, /settings) và bọc 3 Provider toàn cục[cite: 7, 8]
    │   ├── index.css                          # Cấu hình Tailwind v4 (@theme, @variant dark, biến --color-primary)[cite: 7, 8]
    │   └── main.jsx                           # Điểm nạp React vào thẻ #root trong DOM[cite: 7, 8]
    │
    ├── index.html                             # File HTML template chính của ứng dụng web[cite: 7, 8]
    ├── package.json                           # Khai báo các thư viện npm Frontend (react, react-router-dom, axios, lucide-react)[cite: 7, 8]
    └── vite.config.js                         # Cấu hình đóng gói Vite (tích hợp plugin React và Tailwind CSS v4)[cite: 7, 8]
```

---

## 4. HƯỚNG DẪN CÀI ĐẶT & CHẠY ỨNG DỤNG CHO THÀNH VIÊN

Khi các thành viên clone mã nguồn từ GitHub về máy tính cá nhân, các thư mục `node_modules` và tệp `.env` sẽ không có sẵn do đã được chặn bởi `.gitignore`[cite: 4, 6]. Thực hiện tuần tự các bước sau để thiết lập môi trường:

### Bước 1: Clone dự án về máy
Mở Terminal/Git Bash tại vị trí thư mục mong muốn và thực hiện clone:
```bash
git clone <URL_REPO_GITHUB_CUA_NHOM>
cd quan-ly-ghi-chu
```

---

### Bước 2: Cài đặt và cấu hình Backend

1. **Di chuyển vào thư mục backend và cài đặt thư viện[cite: 4, 6]:**
   ```bash
   cd backend
   npm install
   ```

2. **Tạo tệp biến môi trường `.env`[cite: 4, 6]:**
   Tạo tệp `.env` ngay trong thư mục `backend/` với nội dung sau[cite: 4, 6]:
   ```env
   PORT=5000
   ```

3. **Khởi động Backend Server[cite: 4, 6]:**
   ```bash
   node server.js
   ```
   *Khi Terminal báo `Server running on port 5000` là server đã sẵn sàng hoạt động[cite: 4, 6].*

---

### Bước 3: Cài đặt và cấu hình Frontend

1. **Mở một cửa sổ Terminal mới, di chuyển vào thư mục frontend[cite: 4, 6]:**
   ```bash
   cd frontend
   npm install
   ```

2. **Khởi chạy môi trường phát triển (Development Server)[cite: 4, 6]:**
   ```bash
   npm run dev
   ```
   *Terminal sẽ cung cấp đường dẫn truy cập (mặc định là `http://localhost:5173`)[cite: 4, 6].*

3. **Mở trình duyệt:** 
   Truy cập `http://localhost:5173` để bắt đầu trải nghiệm và phát triển ứng dụng[cite: 4, 6].