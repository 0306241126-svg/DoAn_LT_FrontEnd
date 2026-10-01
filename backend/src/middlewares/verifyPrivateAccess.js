// Quản lý bộ nhớ token phiên tạm thời (hết hạn sau 15 phút)
const sessionTokens = new Map();

/**
 * Lưu token hợp lệ vào RAM
 * @param {string} token 
 * @param {string} username 
 */
function setSessionToken(token, username) {
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 phút
  sessionTokens.set(token, { username, expiresAt });
}

/**
 * Middleware bảo vệ các endpoint vùng riêng tư
 */
const verifyPrivateAccess = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Không có quyền truy cập: Thiếu hoặc sai định dạng token'
    });
  }

  const token = authHeader.split(' ')[1];
  const session = sessionTokens.get(token);

  if (!session) {
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ hoặc phiên làm việc đã kết thúc'
    });
  }

  if (Date.now() > session.expiresAt) {
    sessionTokens.delete(token);
    return res.status(401).json({
      success: false,
      message: 'Phiên làm việc đã hết hạn. Vui lòng mở khóa lại'
    });
  }

  // Gia hạn thời gian sử dụng thêm khi người dùng có hoạt động
  session.expiresAt = Date.now() + 15 * 60 * 1000;
  req.authUsername = session.username;

  next();
};

module.exports = {
  verifyPrivateAccess,
  setSessionToken
};