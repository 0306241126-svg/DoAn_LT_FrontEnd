// Import thư viện Express để sử dụng tính năng điều hướng (Router)
const express = require('express');

// Import các hàm xử lý logic (Controller) đã được viết sẵn từ file profileController.js
// getProfile: Hàm xử lý việc đọc và trả về thông tin hồ sơ (đã xóa mật khẩu)
// updateProfile: Hàm xử lý việc cập nhật tên và màu sắc hồ sơ
const { getProfile, updateProfile } = require('../controllers/profileController');

// Khởi tạo một đối tượng Router của Express để định nghĩa các API endpoints
const router = express.Router();

// ----------------------------------------------------------------------
// ĐỊNH NGHĨA CÁC ĐƯỜNG DẪN API (ENDPOINTS)
// Lưu ý: Đường dẫn gốc (ví dụ: '/api/profile') sẽ được cấu hình ở file server.js, 
// nên ở đây ta chỉ cần dùng '/' là đủ.
// ----------------------------------------------------------------------

// Định tuyến phương thức GET:
// Khi có request GET gửi tới '/api/profile', hệ thống sẽ gọi hàm getProfile để lấy dữ liệu.
router.get('/', getProfile);

// Định tuyến phương thức PUT:
// Khi có request PUT gửi tới '/api/profile' (kèm theo dữ liệu JSON cập nhật), 
// hệ thống sẽ gọi hàm updateProfile để xử lý việc ghi đè file.
router.put('/', updateProfile);

// Xuất (export) cấu hình router này ra ngoài để file server.js chính có thể nhúng (import) vào và sử dụng
module.exports = router;