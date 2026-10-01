/**
 * TỆP CẤU HÌNH HẰNG SỐ HỆ THỐNG (backend/src/config/constants.js)
 * 
 * Mục đích tệp:
 * - Tập trung hóa các hằng số cấu hình cốt lõi của Backend vào một nơi duy nhất.
 * - Tránh việc "hardcode" (viết cứng) đường dẫn và giá trị mặc định rải rác ở nhiều file.
 * - Giúp các module I/O, Controller, Route tái sử dụng dễ dàng và dễ bảo trì.
 */

// Import module 'path' có sẵn của Node.js để thao tác chuẩn hóa đường dẫn tệp/thư mục tương thích trên mọi hệ điều hành (Windows, Linux, macOS).
const path = require('path');

// Định vị đường dẫn tuyệt đối trỏ thẳng tới thư mục lưu trữ dữ liệu JSON (backend/data).
// __dirname: Đường dẫn tuyệt đối đến thư mục chứa file hiện tại (backend/src/config).
// '../../data': Lùi 2 cấp thư mục (từ config -> src -> backend) rồi trỏ vào thư mục 'data'.
// Việc dùng path.join giúp app luôn đọc/ghi đúng dữ liệu dù bạn chạy lệnh 'node server.js' từ bất kỳ thư mục nào trên terminal[cite: 7].
const DATA_DIR = path.join(__dirname, '../../data');

// Cổng mạng (Port) để server Express lắng nghe kết nối[cite: 7].
// process.env.PORT: Ưu tiên lấy giá trị PORT cấu hình từ tệp biến môi trường .env (nếu có)[cite: 7].
// || 5000: Giá trị dự phòng (fallback), nếu file .env chưa cấu hình hoặc không tìm thấy thì mặc định chạy ở cổng 5000[cite: 7].
const PORT = process.env.PORT || 5000;

// Tên người dùng mặc định dùng để định danh phân vùng thư mục lưu trữ (backend/data/users/default_user/)[cite: 7, 8].
// Giá trị này được dùng xuyên suốt cho các thao tác đọc/ghi profile và ghi chú khi hệ thống chạy ở chế độ người dùng đơn (Single-user mode)[cite: 7, 8].
const DEFAULT_USERNAME = 'default_user';

// Xuất (export) các hằng số dưới dạng một Object để các file khác (server.js, fileHelper.js, các controller) có thể require và sử dụng[cite: 7, 8].
module.exports = {
  DATA_DIR,
  PORT,
  DEFAULT_USERNAME
};