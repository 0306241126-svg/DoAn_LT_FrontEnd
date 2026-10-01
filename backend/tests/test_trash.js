const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { DATA_DIR } = require('../src/config/constants');
const { atomicWriteJson, readJson } = require('../src/utils/fileHelper');
const controller = require('../src/controllers/noteController');
const topicController = require('../src/controllers/topicController');

const username = `trash_test_${Date.now()}`;
const topicSlug = 'sample';
const notesDir = path.join(DATA_DIR, 'users', username, 'notes');
const filePath = path.join(notesDir, `${topicSlug}.json`);
const profilePath = path.join(DATA_DIR, 'users', username, 'profile.json');
const archivedTopicSlug = 'archive';
const archivedTopicPath = path.join(notesDir, `${archivedTopicSlug}.json`);
const emptyTopicSlug = 'archive-empty';
const emptyTopicPath = path.join(notesDir, `${emptyTopicSlug}.json`);

const createRequest = (params = {}) => ({
  headers: { 'x-username': username },
  params,
  query: {},
});

const invokeController = (handler, req) => new Promise((resolve, reject) => {
  const res = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      resolve({ statusCode: this.statusCode, data });
    },
  };

  Promise.resolve(handler(req, res, reject)).catch(reject);
});

async function runTests() {
  try {
    await fs.mkdir(notesDir, { recursive: true });
    await atomicWriteJson(filePath, [
      { id: 'active', title: 'Active note' },
      { id: 'removed', title: 'Removed note', deletedAt: new Date().toISOString() },
    ]);
    await atomicWriteJson(archivedTopicPath, [{ id: 'archived-note', title: 'Archived note' }]);
    await atomicWriteJson(profilePath, {
      topics: [
        { slug: topicSlug, name: 'Sample' },
        { slug: archivedTopicSlug, name: 'Archive' },
      ],
    });

    assert.equal((await invokeController(controller.getNotes, createRequest({ topicSlug }))).data.length, 1);
    assert.equal((await invokeController(controller.getTrashNotes, createRequest())).data.length, 1);

    assert.equal((await invokeController(
      topicController.deleteTopic,
      createRequest({ topicSlug: archivedTopicSlug })
    )).statusCode, 200);
    assert.equal((await invokeController(
      topicController.getTopics,
      createRequest()
    )).data.data.length, 1);
    assert.equal((await invokeController(
      controller.getNotes,
      createRequest({ topicSlug: archivedTopicSlug })
    )).statusCode, 404);
    const trashWithTopic = await invokeController(controller.getTrashNotes, createRequest());
    assert.equal(trashWithTopic.data.length, 2);
    assert.equal(trashWithTopic.data.find((item) => item.type === 'topic').noteCount, 1);

    assert.equal((await invokeController(
      topicController.restoreTopic,
      createRequest({ topicSlug: archivedTopicSlug })
    )).statusCode, 200);
    assert.equal((await invokeController(
      topicController.getTopics,
      createRequest()
    )).data.data.length, 2);
    assert.equal((await invokeController(
      topicController.deleteTopic,
      createRequest({ topicSlug: archivedTopicSlug })
    )).statusCode, 200);
    assert.equal((await invokeController(
      topicController.permanentlyDeleteTopic,
      createRequest({ topicSlug: archivedTopicSlug })
    )).statusCode, 200);
    await assert.rejects(fs.access(archivedTopicPath));

    await atomicWriteJson(emptyTopicPath, [{ id: 'bulk-note', title: 'Bulk note' }]);
    const profile = await readJson(profilePath);
    profile.topics.push({ slug: emptyTopicSlug, name: 'Archive empty' });
    await atomicWriteJson(profilePath, profile);
    assert.equal((await invokeController(
      topicController.deleteTopic,
      createRequest({ topicSlug: emptyTopicSlug })
    )).statusCode, 200);

    const restored = await invokeController(
      controller.restoreNote,
      createRequest({ topicSlug, id: 'removed' })
    );
    assert.equal(restored.statusCode, 200);
    assert.equal((await invokeController(controller.getNotes, createRequest({ topicSlug }))).data.length, 2);

    const deleted = await invokeController(
      controller.deleteNote,
      createRequest({ topicSlug, id: 'active' })
    );
    assert.equal(deleted.statusCode, 200);
    assert.equal((await invokeController(controller.getTrashNotes, createRequest())).data.length, 2);

    const permanentlyDeleted = await invokeController(
      controller.permanentlyDeleteNote,
      createRequest({ topicSlug, id: 'active' })
    );
    assert.equal(permanentlyDeleted.statusCode, 200);
    assert.equal((await invokeController(controller.getTrashNotes, createRequest())).data.length, 1);

    await invokeController(controller.deleteNote, createRequest({ topicSlug, id: 'removed' }));
    const emptied = await invokeController(controller.emptyTrash, createRequest());
    assert.equal(emptied.data.deletedCount, 2);
    assert.deepEqual(await readJson(filePath), []);
    await assert.rejects(fs.access(emptyTopicPath));
    assert.equal((await readJson(profilePath)).topics.length, 1);

    console.log('PASS: note and topic trash, restore, permanent delete, and empty trash');
  } finally {
    await fs.rm(path.join(DATA_DIR, 'users', username), { recursive: true, force: true });
  }
}

runTests().catch((error) => {
  console.error('Trash lifecycle tests failed:', error);
  process.exitCode = 1;
});