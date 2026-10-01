/**
 * Chuyển chuỗi tiếng Việt có dấu thành slug không dấu dạng [slug]
 * Ví dụ: "Học Tập Lập Trình" -> "hoc-tap-lap-trinh"
 */
function createSlug(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD') // Tách dấu
    .replace(/[\u0300-\u036f]/g, '') // Xóa dấu tiếng Việt
    .replace(/[đĐ]/g, 'd')
    .replace(/([^0-9a-z-\s])/g, '') // Xóa ký tự đặc biệt
    .trim()
    .replace(/\s+/g, '-') // Đổi khoảng trắng thành '-'
    .replace(/-+/g, '-'); // Tránh lặp dấu gạch ngang
}

module.exports = { createSlug };