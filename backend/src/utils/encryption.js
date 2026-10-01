const bcrypt = require('bcrypt');

// Số vòng băm tiêu chuẩn để đảm bảo cân bằng giữa hiệu năng và độ bảo mật
const SALT_ROUNDS = 10;

/**
 * Băm mật khẩu khi người dùng thiết lập mới hoặc đổi mật khẩu
 * @param {string} plainPassword - Mật khẩu dạng văn bản gốc người dùng nhập
 * @returns {Promise<string>} Chuỗi mật khẩu đã được hash an toàn
 */
async function hashPassword(plainPassword) {
  if (!plainPassword || typeof plainPassword !== 'string') {
    throw new Error('Mật khẩu không hợp lệ để mã hóa');
  }
  const hash = await bcrypt.hash(plainPassword, SALT_ROUNDS);
  return hash;
}

/**
 * So sánh mật khẩu gốc với chuỗi hash đã lưu trong profile.json khi mở khóa vùng riêng tư
 * @param {string} plainPassword - Mật khẩu người dùng nhập vào modal
 * @param {string} hashedPassword - Chuỗi hash đọc ra từ file profile.json
 * @returns {Promise<boolean>} Trả về true nếu khớp, ngược lại false
 */
async function comparePassword(plainPassword, hashedPassword) {
  if (!plainPassword || !hashedPassword) {
    return false;
  }
  const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
  return isMatch;
}

module.exports = {
  hashPassword,
  comparePassword
};