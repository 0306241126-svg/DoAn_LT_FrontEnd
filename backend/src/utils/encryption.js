/**
 * TỆP TIỆN ÍCH MÃ HÓA MẬT KHẨU (backend/src/utils/encryption.js)
 * Mục đích: Băm mật khẩu một chiều và xác thực mật khẩu người dùng bằng thư viện bcrypt.
 */

const bcrypt = require('bcrypt');

// Số vòng làm muối (salt rounds), chuẩn khuyến nghị an toàn và hiệu năng tốt là 10
const SALT_ROUNDS = 10;

/**
 * Băm mật khẩu dạng chuỗi thô (plain-text) thành chuỗi hash an toàn
 * @param {string} plainPassword - Mật khẩu người dùng nhập
 * @returns {Promise<string>} - Chuỗi băm an toàn bcrypt
 */
async function hashPassword(plainPassword) {
  if (!plainPassword || typeof plainPassword !== 'string') {
    throw new Error('Mật khẩu plainPassword phải là chuỗi ký tự hợp lệ.');
  }
  return await bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * So khớp mật khẩu dạng chuỗi thô với mã hash đã lưu
 * @param {string} plainPassword - Mật khẩu người dùng nhập vào để kiểm tra
 * @param {string} hashedPassword - Chuỗi băm đã lưu trữ trước đó
 * @returns {Promise<boolean>} - Trả về true nếu khớp, ngược lại false
 */
async function comparePassword(plainPassword, hashedPassword) {
  if (!plainPassword || !hashedPassword) {
    return false;
  }
  return await bcrypt.compare(plainPassword, hashedPassword);
}

module.exports = {
  hashPassword,
  comparePassword
};