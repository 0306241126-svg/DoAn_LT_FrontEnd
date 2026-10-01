const fs = require('fs/promises');
const path = require('path');

/**
 * Đọc dữ liệu từ file JSON và parse ra Object/Array
 * @param {string} filePath - Đường dẫn tuyệt đối tới file cần đọc
 * @returns {Promise<any>} Dữ liệu đã parse từ file JSON
 */
async function readJson(filePath) {
  try {
    const rawData = await fs.readFile(filePath, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    // Nếu file chưa tồn tại hoặc rỗng, ném lỗi ra ngoài để controller xử lý
    throw error;
  }
}

/**
 * Ghi dữ liệu an toàn theo cơ chế Atomic Write:
 * Ghi dữ liệu ra file tạm (.tmp) cùng thư mục, sau đó dùng fs.rename ghi đè lên file chính
 * @param {string} filePath - Đường dẫn file đích
 * @param {any} data - Dữ liệu cần ghi (Object hoặc Array)
 */
async function atomicWriteJson(filePath, data) {
  // Tạo đường dẫn file tạm: ví dụ notes/hoc-tap.json.tmp_1726585200000
  const dir = path.dirname(filePath);
  const tempFilePath = `${filePath}.tmp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  try {
    // Đảm bảo thư mục cha tồn tại
    await fs.mkdir(dir, { recursive: true });

    // 1. Chuyển object sang chuỗi JSON có format đẹp (indent 2 khoảng trắng)
    const jsonString = JSON.stringify(data, null, 2);

    // 2. Ghi dữ liệu ra file tạm
    await fs.writeFile(tempFilePath, jsonString, 'utf8');

    // 3. Đổi tên chớp nhoáng (atomic replace) đè lên file chính
    await fs.rename(tempFilePath, filePath);
  } catch (error) {
    // Nếu xảy ra lỗi giữa chừng, xóa file tạm để dọn rác
    try {
      await fs.unlink(tempFilePath);
    } catch {
      // Bỏ qua lỗi nếu file tạm chưa kịp sinh ra
    }
    throw error;
  }
}

module.exports = {
  readJson,
  atomicWriteJson
};