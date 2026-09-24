const path = require('path');
const fs = require('fs/promises'); // Module thao tác tệp tin hệ thống dạng bất đồng bộ
const { readJson, atomicWriteJson } = require('../utils/fileHelper'); // Hàm tiện ích đọc/ghi file an toàn
const createSlug = require('../utils/slugify'); // Hàm chuẩn hóa tiếng Việt có dấu thành slug
const { DATA_DIR, DEFAULT_USERNAME } = require('../config/constants'); // Các hằng số đường dẫn gốc

// Đường dẫn tuyệt đối tới tệp profile.json của người dùng
const profilePath = path.join(DATA_DIR, 'users', DEFAULT_USERNAME, 'profile.json');
// Đường dẫn tuyệt đối tới thư mục chứa danh sách ghi chú (/notes)
const notesDir = path.join(DATA_DIR, 'users', DEFAULT_USERNAME, 'notes');

/**
 * @route   GET /api/topics
 * @desc    Lấy danh sách tất cả các chủ đề từ profile.json
 */
async function getTopics(req, res) {
  try {
    const profile = await readJson(profilePath);
    return res.status(200).json(profile.topics || []);
  } catch (error) {
    console.error('Lỗi lấy danh sách chủ đề:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách chủ đề.' });
  }
}

/**
 * @route   POST /api/topics
 * @desc    Tạo chủ đề mới, lưu vào profile.json và TỰ ĐỘNG TẠO tệp [slug].json trong thư mục notes/
 */
async function createTopic(req, res) {
  try {
    const { name } = req.body;

    // 1. Kiểm tra tính hợp lệ của dữ liệu đầu vào
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Tên chủ đề không được để trống.' });
    }

    const trimmedName = name.trim();
    const slug = createSlug(trimmedName); // Chuyển đổi tên tiếng Việt thành slug (VD: "Học tập" -> "hoc-tap")
    
    if (!slug) {
      return res.status(400).json({ message: 'Tên chủ đề không hợp lệ.' });
    }

    // 2. Đọc file profile.json để kiểm tra trùng lặp
    const profile = await readJson(profilePath);
    const topics = profile.topics || [];
    
    if (topics.some(topic => topic.slug === slug || topic.name === trimmedName)) {
      return res.status(400).json({ message: 'Chủ đề này đã tồn tại.' });
    }

    // 3. Cập nhật mảng topics mới vào profile.json
    const newTopic = { name: trimmedName, slug };
    await atomicWriteJson(profilePath, {
      ...profile,
      topics: [...topics, newTopic]
    });

    // 4. BƯỚC ĐẢM BẢO TẠO FILE: Tự động khởi tạo file ghi chú rỗng [slug].json
    // atomicWriteJson sẽ tự kiểm tra & tạo thư mục notes/ nếu chưa có, sau đó ghi mảng rỗng []
    const noteFilePath = path.join(notesDir, `${slug}.json`);
    await atomicWriteJson(noteFilePath, []);

    return res.status(201).json(newTopic);
  } catch (error) {
    console.error('Lỗi tạo chủ đề:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ khi tạo chủ đề.' });
  }
}

/**
 * @route   PUT /api/topics/:slug
 * @desc    Cập nhật tên hiển thị tiếng Việt của chủ đề trong profile.json
 */
async function updateTopic(req, res) {
  try {
    const { slug } = req.params;
    const { name } = req.body;

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Tên chủ đề mới không được để trống.' });
    }

    const profile = await readJson(profilePath);
    const topics = profile.topics || [];
    
    const topicIndex = topics.findIndex(topic => topic.slug === slug);
    if (topicIndex === -1) {
      return res.status(404).json({ message: 'Không tìm thấy chủ đề.' });
    }

    // Cập nhật tên mới, giữ nguyên slug cũ để không phá vỡ liên kết tệp tin
    const updatedTopic = { ...topics[topicIndex], name: name.trim() };
    const updatedTopics = [...topics];
    updatedTopics[topicIndex] = updatedTopic;

    await atomicWriteJson(profilePath, { ...profile, topics: updatedTopics });

    return res.status(200).json(updatedTopic);
  } catch (error) {
    console.error('Lỗi cập nhật chủ đề:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật chủ đề.' });
  }
}

/**
 * @route   DELETE /api/topics/:slug
 * @desc    Xóa chủ đề khỏi profile.json và TỰ ĐỘNG XÓA tệp [slug].json tương ứng trên ổ đĩa
 */
async function deleteTopic(req, res) {
  try {
    const { slug } = req.params;
    const profile = await readJson(profilePath);
    const topics = profile.topics || [];
    
    const topic = topics.find(item => item.slug === slug);
    if (!topic) {
      return res.status(404).json({ message: 'Không tìm thấy chủ đề.' });
    }

    // 1. Cập nhật profile.json (loại bỏ chủ đề bị xóa)
    await atomicWriteJson(profilePath, {
      ...profile,
      topics: topics.filter(item => item.slug !== slug)
    });

    // 2. Xóa tệp dữ liệu [slug].json vật lý trong thư mục notes/
    try {
      await fs.unlink(path.join(notesDir, `${topic.slug}.json`));
    } catch (error) {
      // Nếu file không tồn tại trên đĩa (lỗi ENOENT) thì bỏ qua, nếu là lỗi khác thì ném ra catch ngoài
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    return res.status(200).json({ message: 'Xóa chủ đề thành công.', slug });
  } catch (error) {
    console.error('Lỗi xóa chủ đề:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ khi xóa chủ đề.' });
  }
}

// Export đủ 4 hàm CRUD
module.exports = {
  getTopics,
  createTopic,
  updateTopic,
  deleteTopic
};