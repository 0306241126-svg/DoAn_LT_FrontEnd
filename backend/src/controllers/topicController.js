const fs = require('fs');
const path = require('path');
const { DATA_DIR, DEFAULT_USERNAME } = require('../config/constants');
const { readJson, atomicWriteJson } = require('../utils/fileHelper');
const { createSlug } = require('../utils/slugify');
const { moveTopicToTrash } = require('../services/trashService');

// Hàm lấy đường dẫn profile
const getProfilePath = (username = DEFAULT_USERNAME) => {
  return path.join(DATA_DIR, 'users', username, 'profile.json');
};

// Hàm lấy đường dẫn thư mục notes
const getNotesDir = (username = DEFAULT_USERNAME) => {
  return path.join(DATA_DIR, 'users', username, 'notes');
};

// 1. LẤY DANH SÁCH CHỦ ĐỀ
const getTopics = async (req, res, next) => {
  try {
    const username = req.headers['x-username'] || DEFAULT_USERNAME;
    const profilePath = getProfilePath(username);
    const notesDir = getNotesDir(username);

    let topics = [];

    try {
      const profileData = await readJson(profilePath);
      if (Array.isArray(profileData.topics) && profileData.topics.length > 0) {
        topics = profileData.topics;
      }
    } catch (err) {
      // Bỏ qua nếu file chưa tồn tại
    }

    if (topics.length === 0 && fs.existsSync(notesDir)) {
      const files = fs.readdirSync(notesDir).filter((file) => file.endsWith('.json'));
      topics = files.map((file) => {
        const slug = file.replace('.json', '');
        return { slug, name: slug.replace(/-/g, ' ') };
      });
    }

    return res.status(200).json({ success: true, data: topics });
  } catch (error) {
    next(error);
  }
};

// 2. TẠO CHỦ ĐỀ MỚI
const createTopic = async (req, res, next) => {
  try {
    const { name } = req.body;
    const username = req.headers['x-username'] || DEFAULT_USERNAME;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Tên chủ đề không được để trống' });
    }

    const trimmedName = name.trim();
    const slug = createSlug(trimmedName);
    if (!slug) {
      return res.status(400).json({ success: false, message: 'Tên chủ đề không hợp lệ' });
    }

    const notesDir = getNotesDir(username);
    const topicFilePath = path.join(notesDir, `${slug}.json`);
    const profilePath = getProfilePath(username);
    let profileData;
    try {
      profileData = await readJson(profilePath);
    } catch {
      profileData = {};
    }

    const topics = Array.isArray(profileData.topics) ? profileData.topics : [];
    const alreadyExists = topics.some(
      (topic) =>
        topic &&
        (topic.slug === slug ||
          (typeof topic.name === 'string' && createSlug(topic.name) === slug))
    );
    if (alreadyExists || fs.existsSync(topicFilePath)) {
      return res.status(409).json({ success: false, message: 'Chủ đề đã tồn tại' });
    }

    if (!fs.existsSync(notesDir)) {
      fs.mkdirSync(notesDir, { recursive: true });
    }

    await atomicWriteJson(topicFilePath, []);
    profileData.topics = [...topics, { slug, name: trimmedName }];
    await atomicWriteJson(profilePath, profileData);

    return res.status(201).json({
      success: true,
      data: { slug, name: trimmedName },
    });
  } catch (error) {
    next(error);
  }
};

// 3. ĐỔI TÊN CHỦ ĐỀ
const updateTopic = async (req, res, next) => {
  try {
    const { topicSlug } = req.params;
    const { name } = req.body;
    const username = req.headers['x-username'] || DEFAULT_USERNAME;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Tên chủ đề không hợp lệ' });
    }

    const trimmedName = name.trim();
    const profilePath = getProfilePath(username);

    try {
      const profileData = await readJson(profilePath);
      if (Array.isArray(profileData.topics)) {
        const topic = profileData.topics.find((t) => t.slug === topicSlug);
        if (topic) {
          topic.name = trimmedName;
          await atomicWriteJson(profilePath, profileData);
        }
      }
    } catch (err) {
      // bỏ qua
    }

    return res.status(200).json({
      success: true,
      message: 'Cập nhật chủ đề thành công',
      data: { slug: topicSlug, name: trimmedName }
    });
  } catch (error) {
    next(error);
  }
};

// 4. XÓA CHỦ ĐỀ
const deleteTopic = async (req, res, next) => {
  try {
    const { topicSlug } = req.params;
    const username = req.headers['x-username'] || DEFAULT_USERNAME;
    await moveTopicToTrash(username, topicSlug);
    return res.status(200).json({ success: true, message: 'Đã xóa chủ đề thành công' });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// XUẤT ĐẦY ĐỦ CÁC HÀM
module.exports = {
  getTopics,
  createTopic,
  updateTopic,
  deleteTopic,
};
