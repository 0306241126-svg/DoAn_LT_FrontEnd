const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const { DATA_DIR, DEFAULT_USERNAME } = require('../config/constants');
const { readJson, atomicWriteJson } = require('../utils/fileHelper');

const getUserDir = (username = DEFAULT_USERNAME) => path.join(DATA_DIR, 'users', username);
const getTrashPath = (username) => path.join(getUserDir(username), 'trash.json');
const getNotesDir = (username) => path.join(getUserDir(username), 'notes');
const getProfilePath = (username) => path.join(getUserDir(username), 'profile.json');
const createId = () => crypto.randomBytes(16).toString('hex');
const createEmptyTrash = () => ({ deletedTopics: [], deletedNotes: [] });

function normalizeTrash(value) {
  if (Array.isArray(value)) {
    const trash = createEmptyTrash();
    for (const entry of value) {
      if (entry.type === 'topic' && entry.topic?.slug) {
        const topicId = entry.id || createId();
        const topic = {
          id: topicId,
          slug: entry.topic.slug,
          name: entry.topic.name || entry.topic.slug,
          topic: entry.topic,
          deletedAt: entry.deletedAt || new Date().toISOString(),
          noteCount: Array.isArray(entry.notes) ? entry.notes.length : 0,
        };
        trash.deletedTopics.push(topic);
        (Array.isArray(entry.notes) ? entry.notes : []).forEach((note, position) => {
          trash.deletedNotes.push({
            id: createId(),
            note,
            originalTopicSlug: topic.slug,
            originalTopicName: topic.name,
            originalTopic: entry.topic,
            deletedAt: topic.deletedAt,
            position,
            deletedWithTopicId: topicId,
          });
        });
      } else if (entry.type === 'note' && entry.note) {
        trash.deletedNotes.push({
          ...entry,
          originalTopicSlug: entry.originalTopicSlug || entry.topicSlug,
          originalTopicName: entry.originalTopicName || entry.topicName || entry.topicSlug,
          deletedAt: entry.deletedAt || new Date().toISOString(),
        });
      }
    }
    return trash;
  }
  if (
    value &&
    Array.isArray(value.deletedTopics) &&
    Array.isArray(value.deletedNotes)
  ) {
    return value;
  }
  throw new Error('Dữ liệu thùng rác không hợp lệ');
}

async function readTrash(username) {
  let storedTrash;
  try {
    storedTrash = await readJson(getTrashPath(username));
  } catch (error) {
    if (error.code === 'ENOENT') return createEmptyTrash();
    throw error;
  }
  const trash = normalizeTrash(storedTrash);
  if (Array.isArray(storedTrash)) await writeTrash(username, trash);
  return trash;
}

async function writeTrash(username, trash) {
  await atomicWriteJson(getTrashPath(username), trash);
}

async function addToTrash(username, collection, entry) {
  const trash = await readTrash(username);
  const item = { ...entry, id: createId(), deletedAt: new Date().toISOString() };
  trash[collection] = [item, ...trash[collection]];
  await writeTrash(username, trash);
  return item;
}

async function moveNoteToTrash(username, topicSlug, note, position, topicName) {
  let originalTopic;
  try {
    const profile = await readJson(getProfilePath(username));
    originalTopic = profile.topics?.find((topic) => topic.slug === topicSlug);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  return addToTrash(username, 'deletedNotes', {
    note,
    originalTopicSlug: topicSlug,
    originalTopicName: topicName || originalTopic?.name || topicSlug,
    originalTopic: originalTopic || { slug: topicSlug, name: topicName || topicSlug },
    position,
  });
}

async function moveTopicToTrash(username, topicSlug) {
  const notesDir = getNotesDir(username);
  const topicFilePath = path.join(notesDir, `${topicSlug}.json`);
  const profilePath = getProfilePath(username);
  let profile;
  try {
    profile = await readJson(profilePath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    profile = {};
  }

  const topic = Array.isArray(profile.topics)
    ? profile.topics.find((item) => item.slug === topicSlug)
    : null;
  let notes;
  try {
    notes = await readJson(topicFilePath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const notFound = new Error('Không tìm thấy chủ đề');
    notFound.status = 404;
    throw notFound;
  }
  if (!Array.isArray(notes)) throw new Error('Dữ liệu ghi chú của chủ đề không hợp lệ');
  if (!topic && notes.length === 0) {
    const notFound = new Error('Không tìm thấy chủ đề');
    notFound.status = 404;
    throw notFound;
  }

  const storedTopic = topic || { slug: topicSlug, name: topicSlug.replace(/-/g, ' ') };
  const trash = await readTrash(username);
  const deletedAt = new Date().toISOString();
  const topicEntry = {
    id: createId(),
    slug: topicSlug,
    name: storedTopic.name,
    topic: storedTopic,
    deletedAt,
    noteCount: notes.length,
  };
  const noteEntries = notes.map((note, position) => ({
    id: createId(),
    note,
    originalTopicSlug: topicSlug,
    originalTopicName: storedTopic.name,
    originalTopic: storedTopic,
    deletedAt,
    position,
    deletedWithTopicId: topicEntry.id,
  }));
  const previousTrash = JSON.parse(JSON.stringify(trash));
  const nextProfile = {
    ...profile,
    topics: Array.isArray(profile.topics)
      ? profile.topics.filter((item) => item.slug !== topicSlug)
      : [],
  };

  trash.deletedTopics.unshift(topicEntry);
  trash.deletedNotes.unshift(...noteEntries);
  await writeTrash(username, trash);
  try {
    await fs.unlink(topicFilePath);
    if (Array.isArray(profile.topics)) await atomicWriteJson(profilePath, nextProfile);
  } catch (error) {
    const rollbackErrors = [];
    try {
      await atomicWriteJson(topicFilePath, notes);
    } catch (rollbackError) {
      rollbackErrors.push(rollbackError);
    }
    try {
      await atomicWriteJson(profilePath, profile);
    } catch (rollbackError) {
      rollbackErrors.push(rollbackError);
    }
    try {
      await writeTrash(username, previousTrash);
    } catch (rollbackError) {
      rollbackErrors.push(rollbackError);
    }
    if (rollbackErrors.length) {
      throw new AggregateError([error, ...rollbackErrors], 'Không thể hoàn tất hoặc hoàn tác việc chuyển chủ đề vào thùng rác');
    }
    throw error;
  }

  return topicEntry;
}

async function removeTrashItem(username, type, itemId) {
  if (type !== 'topic' && type !== 'note') {
    const badType = new Error('Loại dữ liệu trong thùng rác không hợp lệ');
    badType.status = 400;
    throw badType;
  }
  const trash = await readTrash(username);
  const collection = type === 'topic' ? 'deletedTopics' : 'deletedNotes';
  const item = trash[collection].find((entry) => entry.id === itemId);
  if (!item) return null;
  trash[collection] = trash[collection].filter((entry) => entry.id !== itemId);
  await writeTrash(username, trash);
  return item;
}

async function ensureTopicRestored(username, trash, topicSlug) {
  const topicFilePath = path.join(getNotesDir(username), `${topicSlug}.json`);
  try {
    await fs.access(topicFilePath);
    return false;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const deletedTopic = trash.deletedTopics.find((entry) => entry.slug === topicSlug);
  const topic = deletedTopic?.topic;
  if (!topic || topic.slug !== topicSlug) {
    const conflict = new Error('Không tìm thấy chủ đề ban đầu để khôi phục ghi chú');
    conflict.status = 409;
    throw conflict;
  }

  const profilePath = getProfilePath(username);
  let profile;
  try {
    profile = await readJson(profilePath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    profile = {};
  }
  const topics = Array.isArray(profile.topics) ? profile.topics : [];
  if (topics.some((entry) => entry.slug === topicSlug)) {
    const conflict = new Error('Chủ đề đã tồn tại nhưng tệp ghi chú không tồn tại');
    conflict.status = 409;
    throw conflict;
  }

  await fs.mkdir(getNotesDir(username), { recursive: true });
  await atomicWriteJson(topicFilePath, []);
  try {
    profile.topics = [...topics, topic];
    await atomicWriteJson(profilePath, profile);
  } catch (error) {
    await fs.unlink(topicFilePath);
    throw error;
  }
  if (deletedTopic) {
    trash.deletedTopics = trash.deletedTopics.filter((entry) => entry.id !== deletedTopic.id);
    await writeTrash(username, trash);
  }
  return true;
}

async function restoreTopic(username, slug) {
  const trash = await readTrash(username);
  const item = trash.deletedTopics.find((entry) => entry.slug === slug);
  if (!item) {
    const notFound = new Error('Không tìm thấy chủ đề trong thùng rác');
    notFound.status = 404;
    throw notFound;
  }
  const topicFilePath = path.join(getNotesDir(username), `${slug}.json`);
  let profile;
  try {
    profile = await readJson(getProfilePath(username));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    profile = {};
  }
  const topics = Array.isArray(profile.topics) ? profile.topics : [];
  try {
    await fs.access(topicFilePath);
    const conflict = new Error('Đã có tệp chủ đề cùng đường dẫn');
    conflict.status = 409;
    throw conflict;
  } catch (error) {
    if (error.status) throw error;
    if (error.code !== 'ENOENT') throw error;
  }

  await fs.mkdir(getNotesDir(username), { recursive: true });
  await atomicWriteJson(topicFilePath, []);
  try {
    profile.topics = topics.some((entry) => entry.slug === slug)
      ? topics.map((entry) => (entry.slug === slug ? item.topic : entry))
      : [...topics, item.topic];
    await atomicWriteJson(getProfilePath(username), profile);
  } catch (error) {
    await fs.unlink(topicFilePath);
    throw error;
  }
  trash.deletedTopics = trash.deletedTopics.filter((entry) => entry.id !== item.id);
  try {
    await writeTrash(username, trash);
  } catch (error) {
    await fs.unlink(topicFilePath);
    profile.topics = topics;
    await atomicWriteJson(getProfilePath(username), profile);
    throw error;
  }
  return item;
}

async function restoreNote(username, itemId) {
  const trash = await readTrash(username);
  const item = trash.deletedNotes.find((entry) => entry.id === itemId);
  if (!item) {
    const notFound = new Error('Không tìm thấy ghi chú trong thùng rác');
    notFound.status = 404;
    throw notFound;
  }

  const restoredTopic = await ensureTopicRestored(
    username,
    trash,
    item.originalTopicSlug
  );
  const topicFilePath = path.join(getNotesDir(username), `${item.originalTopicSlug}.json`);
  const notes = await readJson(topicFilePath);
  if (!Array.isArray(notes)) throw new Error('Dữ liệu ghi chú của chủ đề không hợp lệ');
  if (notes.some((note) => note.id === item.note.id)) {
    const conflict = new Error('Ghi chú này đã tồn tại trong chủ đề');
    conflict.status = 409;
    throw conflict;
  }
  const insertAt = Number.isInteger(item.position)
    ? Math.max(0, Math.min(item.position, notes.length))
    : 0;
  notes.splice(insertAt, 0, item.note);
  await atomicWriteJson(topicFilePath, notes);
  trash.deletedNotes = trash.deletedNotes.filter((entry) => entry.id !== itemId);
  try {
    await writeTrash(username, trash);
  } catch (error) {
    await atomicWriteJson(topicFilePath, notes.filter((note) => note.id !== item.note.id));
    throw error;
  }
  return { ...item, restoredTopic };
}

async function restoreTrashItem(username, type, id) {
  if (type === 'topic') return restoreTopic(username, id);
  if (type === 'note') return restoreNote(username, id);
  const badType = new Error('Loại dữ liệu trong thùng rác không hợp lệ');
  badType.status = 400;
  throw badType;
}

async function emptyTrash(username) {
  await writeTrash(username, createEmptyTrash());
}

module.exports = {
  addToTrash,
  emptyTrash,
  moveNoteToTrash,
  moveTopicToTrash,
  readTrash,
  removeTrashItem,
  restoreTrashItem,
};
