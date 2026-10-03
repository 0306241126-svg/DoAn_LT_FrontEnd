# ĐỒ ÁN: PRIVATE NOTE-TAKING APP (ỨNG DỤNG QUẢN LÝ GHI CHÚ BẢO MẬT)

---

## 1. THÔNG TIN NHÓM THỰC HIỆN

| STT | MSSV | Họ và Tên | Vai Trò | Nhiệm Vụ Chính |
| :---: | :---: | :--- | :--- | :--- |
| 1 | 0306241126 | **Nguyễn Hoài Linh** | Trưởng nhóm / Quản lý dự án | Khởi tạo Workspace, xây dựng nền tảng File I/O Backend (đọc/ghi, mã hóa Bcrypt); cấu hình Routes chính; phát triển các tính năng nâng cấp (Rich Text, Sắp xếp, Ghim, Layout Header/Sidebar, Modal chi tiết). |
| 2 | 0306241090 | **Ngô Gia Bảo** | Thành viên | Cấu hình Core Frontend (Axios, Services, CSS), quản lý State toàn cục (Context API cho Theme, Notes, Auth); ráp nối giao diện trang NotesPage, PrivateNotesPage và phát triển tính năng Thùng rác. |
| 3 | 0306241143 | **Lê Minh Quân** | Thành viên | Viết toàn bộ API nghiệp vụ Backend (Profile, Topic, Note, Private) và Middleware bảo mật; xây dựng các Component UI dùng chung, khung Layout cơ sở và ráp trang SettingsPage. |

---

## 2. MÔ TẢ SƠ LƯỢC ĐỒ ÁN

**Private Note-Taking App** là ứng dụng ghi chú cá nhân đa nền tảng web, áp dụng kiến trúc Monorepo với công nghệ hiện đại (Frontend: React 18, Vite, Tailwind CSS v4; Backend: Node.js, Express).

### Các chức năng nổi bật:
* **Quản lý danh mục chủ đề (Topics):** Hỗ trợ tạo, sửa, xóa và hiển thị đầy đủ tên chủ đề có dấu tiếng Việt.
* **Quản lý ghi chú thường (Notes CRUD):** Tạo mới, chỉnh sửa, xóa và tìm kiếm nhanh ghi chú theo thời gian thực (tích hợp kỹ thuật Debounce chống quá tải API).
* **Vùng riêng tư bảo mật 2 lớp (Private Zone):** Khu vực lưu trữ các ghi chú nhạy cảm, yêu cầu bảo vệ bằng mật khẩu (mã hóa Bcrypt, yêu cầu độ dài từ 7 ký tự trở lên). Tự động khóa an toàn sau một khoảng thời gian không thao tác.
* **Hệ thống lưu trữ tệp cục bộ an toàn (Local File Storage):** Lưu trữ dữ liệu dạng JSON, áp dụng cơ chế ghi an toàn (Atomic Write) chống lỗi mất dữ liệu khi xảy ra ngắt quãng tiến trình.
* **Tùy biến giao diện (Theming System):** Chuyển đổi linh hoạt chế độ Sáng/Tối (Dark Mode) và bộ chọn 7 màu chủ đạo, lưu trữ trạng thái chống giật màn hình khi tải lại trang.

### Ghi chú lưu trữ: Chức năng Thùng rác

* Xóa ghi chú/chủ đề là xóa mềm. Ghi chú lưu `deletedAt` trong file chủ đề; chủ đề lưu `deletedAt` trong `profile.json`. Dữ liệu đã xóa không xuất hiện trong danh sách hoạt động.
* Thùng rác hiển thị ghi chú đã xóa riêng và chủ đề đã xóa như một mục tổng hợp. Khôi phục chủ đề sẽ khôi phục các ghi chú chưa bị xóa riêng; ghi chú đã xóa riêng vẫn ở trong thùng rác.
* Xóa vĩnh viễn một ghi chú chỉ xóa ghi chú đó. Xóa vĩnh viễn một chủ đề hoặc dọn sạch thùng rác sẽ xóa vĩnh viễn các file ghi chú liên quan.
* API ghi chú: `GET /api/notes/trash`, `POST /api/notes/trash/:topicSlug/:id/restore`, `DELETE /api/notes/trash/:topicSlug/:id/permanent`, `DELETE /api/notes/trash`.
* API chủ đề: `POST /api/topics/trash/:topicSlug/restore`, `DELETE /api/topics/trash/:topicSlug/permanent`. `DELETE /api/topics/:topicSlug` chuyển chủ đề vào thùng rác.
* File triển khai chính: `backend/src/controllers/noteController.js`, `backend/src/controllers/topicController.js`, `backend/src/routes/noteRoutes.js`, `backend/src/routes/topicRoutes.js`, `frontend/src/pages/TrashPage.jsx`, `frontend/src/components/layout/Sidebar.jsx`, `frontend/src/services/noteService.js`, `frontend/src/services/topicService.js`.
* Regression test: chạy `npm run test:trash --prefix backend`.

---

## 3. CẤU TRÚC CÂY THƯ MỤC DỰ ÁN

```text
quan_ly_ghi_chu/
├── .gitignore                                      # Quy định các tệp/thư mục Git bỏ qua, như node_modules và .env
├── HƯỚNG DẪN CHI TIẾT DỰ ÁN .docx                 # Tài liệu hướng dẫn chi tiết của dự án
├── README.md                                       # Giới thiệu dự án, thông tin nhóm, cấu trúc và hướng dẫn chạy
│
├── backend/                                        # Mã nguồn máy chủ Node.js và Express
│   ├── .env                                        # Biến môi trường Backend trên máy local; không đưa giá trị nhạy cảm lên Git
│   ├── data/                                       # Dữ liệu ứng dụng được lưu bằng các tệp JSON
│   │   └── users/                                  # Dữ liệu được phân chia theo người dùng
│   │       └── default_user/                       # Thư mục dữ liệu của người dùng mặc định
│   │           ├── notes/                          # Ghi chú thường, lưu riêng theo slug của chủ đề
│   │           │   ├── .gitkeep                    # Giữ thư mục notes trong Git khi thư mục trống
│   │           │   ├── dadadadad.json              # Dữ liệu ghi chú của một chủ đề
│   │           │   ├── dtqttqq.json                # Dữ liệu ghi chú của một chủ đề
│   │           │   ├── gffgfg.json                 # Dữ liệu ghi chú của một chủ đề
│   │           │   ├── hoc-tap.json                # Ghi chú thuộc chủ đề “Học tập”
│   │           │   └── lap-trinh.json              # Ghi chú thuộc chủ đề “Lập trình”
│   │           ├── private.json                    # Ghi chú thuộc khu vực riêng tư
│   │           ├── profile.json                    # Hồ sơ, tùy chọn giao diện và danh sách chủ đề người dùng
│   │           └── trash.json                      # Các ghi chú/chủ đề đã chuyển vào thùng rác
│   │
│   ├── src/                                        # Mã nguồn Backend
│   │   ├── config/
│   │   │   └── constants.js                        # Hằng số cấu hình như DATA_DIR, PORT và DEFAULT_USERNAME
│   │   ├── controllers/                            # Xử lý nghiệp vụ cho từng nhóm API
│   │   │   ├── noteController.js                   # Xử lý ghi chú thường
│   │   │   ├── privateController.js                # Xử lý mở khóa và ghi chú riêng tư
│   │   │   ├── profileController.js                # Xử lý hồ sơ và tùy chọn người dùng
│   │   │   ├── topicController.js                  # Xử lý danh sách và thao tác với chủ đề
│   │   │   └── trashController.js                  # Xử lý khôi phục, xóa vĩnh viễn và làm trống thùng rác
│   │   ├── middlewares/
│   │   │   └── verifyPrivateAccess.js              # Kiểm tra quyền truy cập API khu vực riêng tư
│   │   ├── routes/                                 # Khai báo các endpoint API
│   │   │   ├── noteRoutes.js                       # Các endpoint ghi chú thường
│   │   │   ├── privateRoutes.js                    # Các endpoint khu vực riêng tư
│   │   │   ├── profileRoutes.js                    # Các endpoint hồ sơ người dùng
│   │   │   ├── topicRoutes.js                      # Các endpoint chủ đề
│   │   │   └── trashRoutes.js                      # Các endpoint thùng rác
│   │   ├── services/
│   │   │   └── trashService.js                     # Nghiệp vụ lưu trữ và quản lý dữ liệu thùng rác
│   │   └── utils/                                   # Các tiện ích dùng chung cho Backend
│   │       ├── encryption.js                       # Băm và kiểm tra mật khẩu bằng bcrypt
│   │       ├── fileHelper.js                       # Đọc và ghi tệp JSON an toàn
│   │       └── slugify.js                           # Chuyển tên chủ đề thành slug dùng trong đường dẫn/tên tệp
│   │
│   ├── tests/                                      # Kiểm thử Backend và tệp mẫu gọi API
│   │   ├── all_routes.http                        # Các request mẫu để kiểm tra những nhóm API
│   │   ├── tasks_3_3_to_3_5.http                  # Request mẫu kiểm tra ghi chú và truy cập riêng tư
│   │   ├── test_constants.js                      # Kiểm tra các hằng số và đường dẫn dữ liệu
│   │   ├── test_encryption.js                     # Kiểm tra chức năng băm và so khớp mật khẩu
│   │   ├── test_trash.js                           # Kiểm tra xóa, khôi phục và làm trống thùng rác
│   │   ├── test_utils.js                           # Kiểm tra slugify và thao tác đọc/ghi JSON
│   │   └── topics.http                             # Request mẫu kiểm tra API chủ đề
│   ├── package-lock.json                           # Khóa phiên bản thư viện Backend đã cài
│   ├── package.json                                # Khai báo thư viện và lệnh chạy/kiểm thử Backend
│   └── server.js                                   # Nạp cấu hình, tạo thư mục dữ liệu và khởi chạy máy chủ
│
└── frontend/                                       # Giao diện người dùng React và Vite
    ├── .gitignore                                  # Các mục Git bỏ qua riêng cho Frontend
    ├── .oxlintrc.json                              # Cấu hình Oxlint cho mã nguồn Frontend
    ├── index.html                                  # HTML gốc, phần tử root và tiêu đề ứng dụng
    ├── package-lock.json                           # Khóa phiên bản thư viện Frontend đã cài
    ├── package.json                                # Khai báo thư viện và lệnh dev, build, lint, preview
    ├── vite.config.js                              # Cấu hình Vite, plugin React/Tailwind và cổng phát triển
    ├── public/                                     # Tài nguyên tĩnh được phục vụ trực tiếp
    │   ├── favicon.svg                             # Biểu tượng ứng dụng trên tab trình duyệt
    │   ├── icons.svg                               # Tập biểu tượng SVG tĩnh
    │   └── images/
    │       └── 1790822702152_3203883919812151739_g5520636365658538576_00d44b88ceb743c678b5b9bce68e51ae-removebg-preview.png
    │                                               # Hình ảnh tĩnh dùng trong giao diện
    └── src/                                        # Mã nguồn giao diện
        ├── components/                             # Các thành phần giao diện tái sử dụng
        │   ├── common/                             # Thành phần dùng chung
        │   │   ├── Button.jsx                      # Nút bấm dùng lại trong ứng dụng
        │   │   ├── ConfirmModal.jsx                # Hộp thoại xác nhận thao tác
        │   │   ├── Input.jsx                       # Trường nhập liệu dùng chung
        │   │   ├── LoadingSpinner.jsx              # Hiệu ứng chờ tải dữ liệu
        │   │   └── Toast.jsx                       # Thông báo ngắn trên giao diện
        │   ├── layout/                             # Thành phần khung bố cục ứng dụng
        │   │   ├── Header.jsx                      # Thanh đầu trang và các thao tác chính
        │   │   ├── MainLayout.jsx                  # Bố cục chính ghép Header, Sidebar và nội dung trang
        │   │   └── Sidebar.jsx                     # Thanh điều hướng và danh sách chủ đề
        │   ├── notes/                              # Thành phần giao diện ghi chú
        │   │   ├── NoteCard.jsx                    # Thẻ tóm tắt một ghi chú
        │   │   ├── NoteFormModal.jsx               # Hộp thoại tạo hoặc chỉnh sửa ghi chú
        │   │   └── NoteViewModal.jsx               # Hộp thoại xem nội dung ghi chú
        │   └── private/
        │       └── PrivateLockModal.jsx            # Hộp thoại khóa/yêu cầu mở khóa khu vực riêng tư
        ├── constants/
        │   └── topics.js                           # Hằng số và dữ liệu chủ đề dùng ở Frontend
        ├── context/                                # Context quản lý trạng thái dùng chung
        │   ├── AuthPrivateContext.jsx              # Trạng thái mở khóa và quyền truy cập khu vực riêng tư
        │   ├── ConfirmContext.jsx                  # Trạng thái và hàm gọi hộp thoại xác nhận
        │   ├── NoteContext.jsx                     # Trạng thái ghi chú và chủ đề
        │   └── ThemeContext.jsx                    # Trạng thái giao diện và tùy chọn chủ đề màu
        ├── hooks/
        │   └── useDebounce.js                      # Hook trì hoãn cập nhật giá trị, hỗ trợ tìm kiếm
        ├── pages/                                  # Các trang chính của ứng dụng
        │   ├── NotesPage.jsx                       # Trang ghi chú thường
        │   ├── PrivateNotesPage.jsx                # Trang ghi chú riêng tư
        │   ├── SettingsPage.jsx                    # Trang cài đặt hồ sơ và giao diện
        │   └── TrashPage.jsx                       # Trang quản lý thùng rác
        ├── services/                               # Các hàm kết nối Frontend với Backend API
        │   ├── api.js                              # Cấu hình Axios dùng chung
        │   ├── noteService.js                      # Request API cho ghi chú thường
        │   ├── privateService.js                   # Request API cho khu vực riêng tư
        │   ├── profileService.js                   # Request API cho hồ sơ người dùng
        │   ├── topicService.js                     # Request API cho chủ đề
        │   └── trashService.js                     # Request API cho thùng rác
        ├── utils/
        │   └── richText.js                         # Tiện ích xử lý nội dung ghi chú dạng văn bản giàu định dạng
        ├── App.css                                 # CSS bổ sung cho ứng dụng
        ├── App.jsx                                 # Khai báo các Provider và định tuyến các trang
        ├── index.css                               # CSS toàn cục, Tailwind và các kiểu giao diện nền tảng
        └── main.jsx                                # Điểm khởi chạy React, Router và tệp CSS toàn cục

    └── node_modules/                               # Thư viện Frontend cài trên máy; không đưa nội dung vào cây
backend/node_modules/                                # Thư viện Backend cài trên máy; không đưa nội dung vào cây
```

---

## 4. HƯỚNG DẪN CÀI ĐẶT & CHẠY ỨNG DỤNG CHO THÀNH VIÊN

Khi các thành viên clone mã nguồn từ GitHub về máy tính cá nhân, các thư mục `node_modules` và tệp `.env` sẽ không có sẵn do đã được chặn bởi `.gitignore`. Thực hiện tuần tự các bước sau để thiết lập môi trường:

### Bước 1: Clone dự án về máy
Mở Terminal/Git Bash tại vị trí thư mục mong muốn và thực hiện clone:
```bash
git clone <URL_REPO_GITHUB_CUA_NHOM>
cd quan-ly-ghi-chu
```

---

### Bước 2: Cài đặt và cấu hình Backend

1. **Di chuyển vào thư mục backend và cài đặt thư viện:**
   ```bash
   cd backend
   npm install
   ```

2. **Tạo tệp biến môi trường `.env`:**
   Tạo tệp `.env` ngay trong thư mục `backend/` với nội dung sau:
   ```env
   PORT=5000
   ```

3. **Khởi động Backend Server:**
   ```bash
   node server.js
   ```
   *Khi Terminal báo `Server running on port 5000` là server đã sẵn sàng hoạt động.*

---

### Bước 3: Cài đặt và cấu hình Frontend

1. **Mở một cửa sổ Terminal mới, di chuyển vào thư mục frontend:**
   ```bash
   cd frontend
   npm install
   ```

2. **Khởi chạy môi trường phát triển (Development Server):**
   ```bash
   npm run dev
   ```
   *Terminal sẽ cung cấp đường dẫn truy cập (mặc định là `http://localhost:5173`).*

3. **Mở trình duyệt:** 
   Truy cập `http://localhost:5173` để bắt đầu trải nghiệm và phát triển ứng dụng.
