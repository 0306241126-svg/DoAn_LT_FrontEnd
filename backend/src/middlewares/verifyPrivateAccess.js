/**
 * MIDDLEWARE XÁC THỰC QUYỀN TRUY CẬP VÙNG RIÊNG TƯ (Task 3.4)
 * File: backend/src/middlewares/verifyPrivateAccess.js
 */

const sessionTokens = new Map();

function setSessionToken(token, username) {
  sessionTokens.set(token, username);
}

/**
 * Middleware kiểm tra Authorization Header từ Client
 */
function verifyPrivateAccess(req, res, next) {
  // 1. Lấy chuỗi Authorization từ Header request
  const authHeader = req.headers.authorization;

  // 2. Kiểm tra nếu không có Header hoặc Header không bắt đầu bằng "Bearer "
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Truy cập bị từ chối. Vui lòng cung cấp Authorization Token.'
    });
  }

  // 3. Tách lấy phần chuỗi token phía sau chữ "Bearer "
  const token = authHeader.slice('Bearer '.length).trim();

  // 4. Đối chiếu token với phiên đã được tạo khi unlock
  const username = sessionTokens.get(token);
  if (!username) {
    return res.status(403).json({
      message: 'Token không hợp lệ hoặc đã hết hạn.'
    });
  }

  req.authUsername = username;
  next();
}

module.exports = verifyPrivateAccess;
module.exports.setSessionToken = setSessionToken;