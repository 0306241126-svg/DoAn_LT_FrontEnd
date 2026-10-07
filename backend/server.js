/**
 * ==============================================================================
 * TỆP TIN: server.js (hoặc index.js) - ENTRY POINT CỦA BACKEND
 * ==============================================================================
 * MỤC ĐÍCH CHÍNH:
 * - Là tệp chạy đầu tiên khi khởi động hệ thống Backend.
 * - Nạp biến môi trường (.env).
 * - Đảm bảo môi trường lưu trữ (thư mục chứa dữ liệu JSON) đã sẵn sàng trước khi nhận request.
 * - Khởi chạy HTTP server và lắng nghe kết nối từ Client trên cổng được chỉ định.
 * - Bắt các lỗi nghiêm trọng làm gián đoạn quá trình khởi động.
 * ==============================================================================
 */

/* -------------------------------------------------------------------------- */
/* PHẦN 1: IMPORT CÁC THƯ VIỆN CỐT LÕI VÀ CẤU HÌNH HỆ THỐNG                   */
/* -------------------------------------------------------------------------- */

// Module làm việc với hệ thống tập tin (File System) dạng Promise để dùng async/await
const fs = require('fs/promises');

// Module xử lý đường dẫn tệp/thư mục tương thích đa nền tảng (Windows, Linux, macOS)
const path = require('path');

// Đọc và nạp các biến từ tệp .env vào process.env (chạy ngay lập tức khi import)
require('dotenv').config();

// Nhận instance Express app đã được cấu hình routes, middleware từ tệp app.js
const app = require('./src/app');

// Lấy cổng chạy server (PORT) và đường dẫn gốc lưu trữ dữ liệu (DATA_DIR) từ file hằng số
const { PORT, DATA_DIR } = require('./src/config/constants');


/* -------------------------------------------------------------------------- */
/* PHẦN 2: HÀM KHỞI CHẠY SERVER VÀ TIỀN XỬ LÝ (PRE-CHECK)                      */
/* -------------------------------------------------------------------------- */

async function startServer() {
  try {
    /**
     * BƯỚC 1: ĐẢM BẢO MÔI TRƯỜNG DỮ LIỆU SẴN SÀNG
     * Tạo đường dẫn tuyệt đối đến thư mục: <DATA_DIR>/users.
     * Tùy chọn { recursive: true } giúp:
     * - Tự động tạo toàn bộ các thư mục cha nếu chưa có (tránh lỗi ENOENT).
     * - Nếu thư mục đã tồn tại từ trước thì bỏ qua, không ném lỗi ra ngoài.
     */
    await fs.mkdir(path.join(DATA_DIR, 'users'), { recursive: true });

    /**
     * BƯỚC 2: MỞ CỔNG LẮNG NGHE YÊU CẦU (LISTEN HTTP REQUESTS)
     * Chỉ khi thư mục dữ liệu đã sẵn sàng, server Express mới bắt đầu mở cổng tiếp nhận kết nối.
     */
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📁 Thư mục lưu trữ: ${DATA_DIR}`);
    });

  } catch (error) {
    /**
     * BƯỚC 3: XỬ LÝ SỰ CỐ KHỞI ĐỘNG (ERROR HANDLING)
     * Nếu xảy ra lỗi nghiêm trọng (ví dụ: ổ đĩa bị khóa quyền ghi không thể tạo folder,
     * hoặc cổng PORT đang bị chiếm dụng bởi app khác):
     * - In chi tiết lỗi ra console để lập trình viên kiểm tra.
     * - Đặt mã thoát (exitCode = 1) để báo hiệu cho Node.js biết tiến trình kết thúc vì có lỗi.
     */
    console.error('❌ Không thể khởi động server:', error);
    process.exitCode = 1;
  }
}


/* -------------------------------------------------------------------------- */
/* PHẦN 3: KÍCH HOẠT HÀM KHỞI ĐỘNG                                            */
/* -------------------------------------------------------------------------- */

// Thực thi tiến trình chạy server
startServer();