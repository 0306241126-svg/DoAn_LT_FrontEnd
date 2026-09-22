/**
 * Chuyển đổi chuỗi tiếng Việt có dấu thành slug không dấu dùng làm tên file/URL
 * Ví dụ: "Đồ án" -> "do-an"
 * @param {string} text - Chuỗi tiếng Việt đầu vào
 * @returns {string} - Chuỗi slug đã chuẩn hóa
 */
function createSlug(text) {
  if (!text) return '';

  return text
    .toString()
    .toLowerCase()
    .trim()
    // Đổi ký tự có dấu thành không dấu
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Thay thế ký tự đặc thù tiếng Việt
    .replace(/[đĐ]/g, 'd')
    // Xóa ký tự đặc biệt, chỉ giữ lại chữ, số và khoảng trắng
    .replace(/[^a-z0-9\s-]/g, '')
    // Đổi nhiều khoảng trắng/gạch nối liên tiếp thành 1 dấu gạch nối đơn
    .replace(/[\s-]+/g, '-')
    // Cắt bỏ gạch nối ở đầu và cuối chuỗi
    .replace(/^-+|-+$/g, '');
}

module.exports = {
  createSlug
};