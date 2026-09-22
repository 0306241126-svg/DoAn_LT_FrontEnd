/**
 * TỆP TIỆN ÍCH FILE I/O (backend/src/utils/fileHelper.js)
 * Mục đích: Đọc và ghi dữ liệu file JSON an toàn, chống mất dữ liệu khi ứng dụng gặp sự cố.
 */

// Import module fs dạng Promise để xử lý đọc/ghi file bất đồng bộ (async/await)
const fs = require('fs/promises');
// Import module path để xử lý đường dẫn thư mục chuẩn xác trên mọi hệ điều hành
const path = require('path');

/**
 * Đọc dữ liệu từ file JSON và parse ra Object/Array
 * @param {string} filePath - Đường dẫn tuyệt đối tới file cần đọc
 * @returns {Promise<any>} Dữ liệu đã parse từ file JSON
 */
async function readJson(filePath) {
  try {
    // Đọc nội dung file dưới dạng chuỗi văn bản UTF-8
    const rawData = await fs.readFile(filePath, 'utf8');
    // Chuyển chuỗi JSON đọc được thành Object/Array trong JavaScript
    return JSON.parse(rawData);
  } catch (error) {
    // Bắt và ném lỗi ra ngoài (như ENOENT - không tìm thấy file) để Controller xử lý
    throw error;
  }
}

/**
 * Ghi dữ liệu an toàn theo cơ chế Atomic Write:
 * Ghi ra file tạm trước, sau đó đổi tên đè lên file chính để tránh hỏng dữ liệu nếu mất điện/crash giữa chừng.
 * @param {string} filePath - Đường dẫn file đích
 * @param {any} data - Dữ liệu cần ghi (Object hoặc Array)
 */
async function atomicWriteJson(filePath, data) {
  // Lấy đường dẫn thư mục cha chứa file đích
  const dir = path.dirname(filePath);
  // Tạo tên file tạm độc nhất bằng timestamp + chuỗi ngẫu nhiên để tránh xung đột tiến trình
  const tempFilePath = `${filePath}.tmp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  try {
    // Tự động tạo thư mục cha nếu chưa có (tránh lỗi ENOENT)
    await fs.mkdir(dir, { recursive: true });

    // Định dạng dữ liệu sang chuỗi JSON có thụt lề 2 khoảng trắng cho dễ đọc
    const jsonString = JSON.stringify(data, null, 2);

    // Ghi toàn bộ dữ liệu vào file tạm trước
    await fs.writeFile(tempFilePath, jsonString, 'utf8');

    // Đổi tên file tạm thành file chính (thao tác ở cấp hệ điều hành diễn ra tức thì, an toàn tuyệt đối)
    await fs.rename(tempFilePath, filePath);
  } catch (error) {
    // Nếu có lỗi trong lúc ghi, tiến hành dọn dẹp xóa file tạm để không để lại rác trên ổ cứng
    try {
      await fs.unlink(tempFilePath);
    } catch {
      // Bỏ qua lỗi nếu file tạm chưa kịp được tạo ra
    }
    // Ném lỗi tiếp tục để phía gọi hàm biết thao tác thất bại
    throw error;
  }
}

// Xuất 2 hàm tiện ích để các Controller dùng chung
module.exports = {
  readJson,
  atomicWriteJson
};