const path = require('path');
const fs = require('fs/promises');
const { readJson, atomicWriteJson } = require('../utils/fileHelper');
const createSlug = require('../utils/slugify');
const { DATA_DIR, DEFAULT_USERNAME } = require('../config/constants');

const profilePath = path.join(DATA_DIR, 'users', DEFAULT_USERNAME, 'profile.json');
const notesDir = path.join(DATA_DIR, 'users', DEFAULT_USERNAME, 'notes');

async function getTopics(req, res) {
  try {
    const profile = await readJson(profilePath);
    return res.status(200).json(profile.topics || []);
  } catch (error) {
    console.error('Lỗi lấy danh sách chủ đề:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách chủ đề.' });
  }
}

async function createTopic(req, res) {
  try {
    const { name } = req.body;
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Tên chủ đề không được để trống.' });
    }

    const trimmedName = name.trim();
    const slug = createSlug(trimmedName);
    if (!slug) {
      return res.status(400).json({ message: 'Tên chủ đề không hợp lệ.' });
    }

    const profile = await readJson(profilePath);
    const topics = profile.topics || [];
    if (topics.some(topic => topic.slug === slug || topic.name === trimmedName)) {
      return res.status(400).json({ message: 'Chủ đề này đã tồn tại.' });
    }

    const newTopic = { name: trimmedName, slug };
    await atomicWriteJson(profilePath, {
      ...profile,
      topics: [...topics, newTopic]
    });
    await atomicWriteJson(path.join(notesDir, `${slug}.json`), []);

    return res.status(201).json(newTopic);
  } catch (error) {
    console.error('Lỗi tạo chủ đề:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ khi tạo chủ đề.' });
  }
}

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

async function deleteTopic(req, res) {
  try {
    const { slug } = req.params;
    const profile = await readJson(profilePath);
    const topics = profile.topics || [];
    const topic = topics.find(item => item.slug === slug);
    if (!topic) {
      return res.status(404).json({ message: 'Không tìm thấy chủ đề.' });
    }

    await atomicWriteJson(profilePath, {
      ...profile,
      topics: topics.filter(item => item.slug !== slug)
    });

    try {
      await fs.unlink(path.join(notesDir, `${topic.slug}.json`));
    } catch (error) {
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

module.exports = {
  getTopics,
  createTopic,
  updateTopic,
  deleteTopic
};
