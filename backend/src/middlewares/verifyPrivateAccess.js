/**
 * MIDDLEWARE XÁC THỰC QUYỀN TRUY CẬP VÙNG RIÊNG TƯ (Task 3.4)
 * File: backend/src/middlewares/verifyPrivateAccess.js
 */

// Token bí mật cố định phục vụ xác thực vùng riêng tư (khớp với token trả về từ API Unlock)
const HARDCODED_PRIVATE_TOKEN = 'secret-private-token-123';

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
  const token = authHeader.split(' ')[1];

  // 4. Đối chiếu token với chuỗi mã hóa hợp lệ
  if (token !== HARDCODED_PRIVATE_TOKEN) {
    return res.status(403).json({
      message: 'Token không hợp lệ hoặc đã hết hạn.'
    });
  }

  // 5. Token hợp lệ -> Chuyển tiếp request sang Controller xử lý tiếp
  next();
}

module.exports = verifyPrivateAccess;