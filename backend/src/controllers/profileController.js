const path = require('path');
const { DATA_DIR, DEFAULT_USERNAME } = require('../config/constants');
const { readJson, atomicWriteJson } = require('../utils/fileHelper');

// Hàm lấy đường dẫn file profile.json của người dùng
const getProfilePath = (username) => {
  return path.join(DATA_DIR, 'users', username, 'profile.json');
};

// Dữ liệu mẫu khởi tạo mặc định ban đầu
const DEFAULT_PROFILE = {
  displayName: 'Ghi chú',
  preferences: {
    theme: 'light',
    primaryColor: '#1976d2'
  },
  privatePasswordHash: null
};

/**
 * GET /api/profile
 * Đọc file profile.json, tự khởi tạo nếu chưa có, ẩn privatePasswordHash
 */
const getProfile = async (req, res, next) => {
  try {
    const username = req.headers['x-username'] || DEFAULT_USERNAME;
    const profilePath = getProfilePath(username);

    let profileData;
    try {
      profileData = await readJson(profilePath);
    } catch {
      // File chưa tồn tại -> tự tạo file mặc định ban đầu[cite: 2]
      profileData = { ...DEFAULT_PROFILE };
      await atomicWriteJson(profilePath, profileData);
    }

    // Ẩn chuỗi hash mật khẩu, chỉ trả về cờ kiểm tra hasPrivatePassword[cite: 2]
    const hasPrivatePassword = Boolean(profileData.privatePasswordHash);

    return res.status(200).json({
      displayName: profileData.displayName,
      preferences: profileData.preferences,
      hasPrivatePassword
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/profile
 * Cập nhật displayName, theme, primaryColor vào profile.json[cite: 2]
 */
const updateProfile = async (req, res, next) => {
  try {
    const { displayName, preferences } = req.body;
    const username = req.headers['x-username'] || DEFAULT_USERNAME;
    const profilePath = getProfilePath(username);

    // Kiểm tra dữ liệu đầu vào[cite: 2]
    if (!displayName || typeof displayName !== 'string' || displayName.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Tên hiển thị không được để trống'
      });
    }

    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Thiếu hoặc sai định dạng cấu hình preferences'
      });
    }

    const { theme, primaryColor } = preferences;
    if (!['light', 'dark'].includes(theme)) {
      return res.status(400).json({
        success: false,
        message: 'Theme chỉ nhận giá trị "light" hoặc "dark"'
      });
    }

    if (!primaryColor || typeof primaryColor !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Mã màu primaryColor không hợp lệ'
      });
    }

    // Đọc dữ liệu hiện tại để giữ nguyên privatePasswordHash
    let currentProfile;
    try {
      currentProfile = await readJson(profilePath);
    } catch {
      currentProfile = { ...DEFAULT_PROFILE };
    }

    const updatedProfile = {
      ...currentProfile,
      displayName: displayName.trim(),
      preferences: {
        theme,
        primaryColor
      }
    };

    // Ghi an toàn bằng Atomic Write
    await atomicWriteJson(profilePath, updatedProfile);

    return res.status(200).json({
      success: true,
      message: 'Cập nhật cài đặt thành công',
      data: {
        displayName: updatedProfile.displayName,
        preferences: updatedProfile.preferences,
        hasPrivatePassword: Boolean(updatedProfile.privatePasswordHash)
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile
};