// Import module 'path' mặc định của Node.js để xử lý và chuẩn hóa đường dẫn file
const path = require('path');

// Import các hàm tiện ích đọc/ghi file an toàn (Atomic Write chống hỏng dữ liệu)
const { readJson, atomicWriteJson } = require('../utils/fileHelper');

// Import các hằng số: thư mục lưu dữ liệu gốc và tên người dùng mặc định
const { DATA_DIR, DEFAULT_USERNAME } = require('../config/constants');

// Xây dựng đường dẫn tuyệt đối dẫn thẳng tới tệp profile.json của người dùng
// Ví dụ: backend/data/users/default_user/profile.json
const profilePath = path.join(DATA_DIR, 'users', DEFAULT_USERNAME, 'profile.json');

/**
 * HÀM BỔ TRỢ: Lọc bỏ thông tin nhạy cảm
 * Tác dụng: Tạo một bản sao dữ liệu hồ sơ và xóa bỏ hoàn toàn các trường mật khẩu 
 * trước khi gửi dữ liệu về phía Client/Frontend để đảm bảo bảo mật.
 */
function withoutPassword(profile) {
  const safeProfile = { ...profile }; // Tách bản sao để không ảnh hưởng dữ liệu gốc
  delete safeProfile.password;        // Xóa mật khẩu tài khoản
  delete safeProfile.privatePassword; // Xóa mật khẩu vùng riêng tư
  return safeProfile;
}

/**
 * CONTROLLER: Đọc thông tin hồ sơ (GET /api/profile)
 * Tác dụng: Đọc dữ liệu từ file profile.json, bóc tách mật khẩu và trả về kết quả.
 */
async function getProfile(req, res) {
  try {
    // Đọc file profile.json từ ổ đĩa
    const profile = await readJson(profilePath);
    
    // Trả về HTTP 200 OK cùng dữ liệu hồ sơ đã được làm sạch mật khẩu
    return res.status(200).json(withoutPassword(profile));
  } catch (error) {
    console.error('Lỗi đọc profile:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ khi đọc hồ sơ.' });
  }
}

/**
 * CONTROLLER: Cập nhật thông tin hồ sơ (PUT /api/profile)
 * Tác dụng: Đọc dữ liệu cũ, hòa trộn (merge) thông tin mới gửi lên từ req.body, 
 * sau đó ghi đè an toàn lại vào file profile.json mà không làm mất danh sách topics.
 */
async function updateProfile(req, res) {
  try {
    // Trích xuất thông tin người dùng muốn thay đổi từ body request
    const { displayName, preferences } = req.body;
    
    // Đọc dữ liệu hiện tại trong file profile.json lên để làm cơ sở bảo toàn dữ liệu
    const currentProfile = await readJson(profilePath);

    // Dùng cú pháp trải mảng (Spread Operator ...) để trộn dữ liệu
    const updatedProfile = {
      ...currentProfile, // 保留 Giữ nguyên các trường cũ (như mảng topics, id...)
      displayName: displayName || currentProfile.displayName, // Cập nhật tên nếu có truyền lên
      preferences: {
        ...currentProfile.preferences, // Giữ lại các cấu hình giao diện cũ (như theme)
        ...preferences                 // Đè cấu hình mới lên (như primaryColor)
      }
    };

    // Ghi dữ liệu đã cập nhật xuống file profile.json bằng phương pháp Atomic Write
    await atomicWriteJson(profilePath, updatedProfile);

    // Trả về dữ liệu mới đã được làm sạch mật khẩu cho Frontend
    return res.status(200).json(withoutPassword(updatedProfile));
  } catch (error) {
    console.error('Lỗi cập nhật profile:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật hồ sơ.' });
  }
}

// Export các hàm để gộp vào Route xử lý API
module.exports = {
  getProfile,
  updateProfile
};