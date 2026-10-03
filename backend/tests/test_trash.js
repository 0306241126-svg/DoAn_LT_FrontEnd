const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const constants = require('../src/config/constants');

const createResponse = () => ({
  statusCode: 200,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

async function runTests() {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'private-note-trash-'));
  const previousDataDir = constants.DATA_DIR;
  const previousUsername = constants.DEFAULT_USERNAME;
  constants.DATA_DIR = dataDir;
  constants.DEFAULT_USERNAME = 'trash-test-user';

  try {
    const username = constants.DEFAULT_USERNAME;
    const userDir = path.join(dataDir, 'users', username);
    const notesDir = path.join(userDir, 'notes');
    const profilePath = path.join(userDir, 'profile.json');
    const alphaPath = path.join(notesDir, 'alpha.json');
    const betaPath = path.join(notesDir, 'beta.json');
    await fs.mkdir(notesDir, { recursive: true });
    await fs.writeFile(profilePath, JSON.stringify({
      topics: [{ slug: 'alpha', name: 'Alpha' }, { slug: 'beta', name: 'Beta' }],
    }));
    await fs.writeFile(alphaPath, JSON.stringify([
      { id: 'a1', title: 'First' },
      { id: 'a2', title: 'Second' },
    ]));
    await fs.writeFile(betaPath, JSON.stringify([{ id: 'b1', title: 'Beta note' }]));

    const noteController = require('../src/controllers/noteController');
    const topicController = require('../src/controllers/topicController');
    const trashController = require('../src/controllers/trashController');
    const trashService = require('../src/services/trashService');
    const req = (params = {}) => ({ params, headers: { 'x-username': username } });
    const next = (error) => { throw error; };

    let response = createResponse();
    await noteController.deleteNote(req({ topicSlug: 'alpha', id: 'a1' }), response, next);
    assert.equal(response.statusCode, 200);
    assert.deepEqual(
      JSON.parse(await fs.readFile(alphaPath, 'utf8')).map((note) => note.id),
      ['a2']
    );
    let trash = JSON.parse(await fs.readFile(path.join(userDir, 'trash.json'), 'utf8'));
    assert.deepEqual(Object.keys(trash).sort(), ['deletedNotes', 'deletedTopics']);
    const deletedNote = trash.deletedNotes.find((item) => item.note.id === 'a1');
    assert.equal(deletedNote.note.id, 'a1');

    await fs.writeFile(alphaPath, JSON.stringify([
      { id: 'a1', title: 'Replacement' },
      { id: 'a2', title: 'Second' },
    ]));
    response = createResponse();
    await trashController.restoreTrashEntry(req({ type: 'note', id: deletedNote.id }), response, next);
    assert.equal(response.statusCode, 409);
    await fs.writeFile(alphaPath, JSON.stringify([{ id: 'a2', title: 'Second' }]));

    response = createResponse();
    await trashController.restoreTrashEntry(req({ type: 'note', id: deletedNote.id }), response, next);
    assert.equal(response.statusCode, 200);
    assert.deepEqual(
      JSON.parse(await fs.readFile(alphaPath, 'utf8')).map((note) => note.id),
      ['a1', 'a2']
    );

    response = createResponse();
    await topicController.deleteTopic(req({ topicSlug: 'beta' }), response, next);
    assert.equal(response.statusCode, 200);
    await assert.rejects(fs.access(betaPath), { code: 'ENOENT' });
    trash = JSON.parse(await fs.readFile(path.join(userDir, 'trash.json'), 'utf8'));
    const deletedTopic = trash.deletedTopics.find((item) => item.slug === 'beta');
    const deletedBetaNote = trash.deletedNotes.find((item) => item.note.id === 'b1');
    assert.equal(deletedTopic.noteCount, 1);
    assert.equal(deletedBetaNote.originalTopicSlug, 'beta');
    assert.equal(deletedBetaNote.originalTopicName, 'Beta');

    await fs.writeFile(betaPath, JSON.stringify([]));
    await fs.writeFile(profilePath, JSON.stringify({
      topics: [{ slug: 'alpha', name: 'Alpha' }, { slug: 'beta', name: 'Replacement' }],
    }));
    response = createResponse();
    await trashController.restoreTrashEntry(req({ type: 'topic', id: deletedTopic.slug }), response, next);
    assert.equal(response.statusCode, 409);
    await fs.rm(betaPath);
    await fs.writeFile(profilePath, JSON.stringify({
      topics: [{ slug: 'alpha', name: 'Alpha' }],
    }));
    response = createResponse();
    await trashController.restoreTrashEntry(req({ type: 'topic', id: deletedTopic.slug }), response, next);
    assert.equal(response.statusCode, 200);
    assert.deepEqual(JSON.parse(await fs.readFile(betaPath, 'utf8')), []);
    assert.deepEqual(
      JSON.parse(await fs.readFile(profilePath, 'utf8')).topics.map((topic) => topic.slug).sort(),
      ['alpha', 'beta']
    );
    response = createResponse();
    await trashController.restoreTrashEntry(req({ type: 'note', id: deletedBetaNote.id }), response, next);
    assert.equal(response.statusCode, 200);
    assert.deepEqual(
      JSON.parse(await fs.readFile(betaPath, 'utf8')).map((note) => note.id),
      ['b1']
    );

    const gammaPath = path.join(notesDir, 'gamma.json');
    await fs.writeFile(gammaPath, JSON.stringify([{ id: 'g1', title: 'Gamma note' }]));
    const profileWithGamma = JSON.parse(await fs.readFile(profilePath, 'utf8'));
    profileWithGamma.topics.push({ slug: 'gamma', name: 'Gamma' });
    await fs.writeFile(profilePath, JSON.stringify(profileWithGamma));
    response = createResponse();
    await topicController.deleteTopic(req({ topicSlug: 'gamma' }), response, next);
    trash = JSON.parse(await fs.readFile(path.join(userDir, 'trash.json'), 'utf8'));
    const gammaNote = trash.deletedNotes.find((item) => item.note.id === 'g1');
    assert.equal(trash.deletedTopics.some((item) => item.slug === 'gamma'), true);
    response = createResponse();
    await trashController.restoreTrashEntry(req({ type: 'note', id: gammaNote.id }), response, next);
    assert.equal(response.statusCode, 200);
    assert.deepEqual(
      JSON.parse(await fs.readFile(gammaPath, 'utf8')).map((note) => note.id),
      ['g1']
    );
    assert.equal(
      JSON.parse(await fs.readFile(profilePath, 'utf8')).topics.some((topic) => topic.slug === 'gamma'),
      true
    );
    trash = JSON.parse(await fs.readFile(path.join(userDir, 'trash.json'), 'utf8'));
    assert.equal(trash.deletedTopics.some((item) => item.slug === 'gamma'), false);

    const missingTopicEntry = await trashService.moveNoteToTrash(
      username,
      'missing',
      { id: 'orphan-note', title: 'Orphan' },
      0
    );
    response = createResponse();
    await trashController.restoreTrashEntry(req({ type: 'note', id: missingTopicEntry.id }), response, next);
    assert.equal(response.statusCode, 409);

    const permanentEntry = await trashService.moveNoteToTrash(
      username,
      'alpha',
      { id: 'permanent-note', title: 'Permanent' },
      0
    );
    response = createResponse();
    await trashController.permanentlyDeleteTrashEntry(
      req({ type: 'note', id: permanentEntry.id }),
      response,
      next
    );
    assert.equal(response.statusCode, 200);
    trash = JSON.parse(await fs.readFile(path.join(userDir, 'trash.json'), 'utf8'));
    assert.equal(trash.deletedNotes.some((item) => item.id === permanentEntry.id), false);

    response = createResponse();
    await trashController.emptyAllTrash(req(), response, next);
    assert.equal(response.statusCode, 200);
    assert.deepEqual(
      JSON.parse(await fs.readFile(path.join(userDir, 'trash.json'), 'utf8')),
      { deletedTopics: [], deletedNotes: [] }
    );

    console.log('PASS: note/topic move, restore, missing-topic conflict, and permanent deletion.');
  } finally {
    constants.DATA_DIR = previousDataDir;
    constants.DEFAULT_USERNAME = previousUsername;
    await fs.rm(dataDir, { recursive: true, force: true });
  }
}

runTests().catch((error) => {
  console.error('Trash tests failed:', error);
  process.exitCode = 1;
});
