const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { readJson, atomicWriteJson } = require('../src/utils/fileHelper');
const createSlug = require('../src/utils/slugify');

async function runTests() {
  assert.equal(createSlug('Đồ án'), 'do-an');
  assert.equal(createSlug('  Học   tập!! '), 'hoc-tap');
  assert.equal(createSlug(''), '');
  console.log('PASS: Vietnamese text is normalized into safe slugs.');

  const testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'private-note-utils-'));
  const testFilePath = path.join(testDir, 'nested', 'test_sample.json');
  const expectedData = {
    testId: 101,
    title: 'Ghi chú thử nghiệm',
    tags: ['học tập', 'đồ án'],
  };

  try {
    await atomicWriteJson(testFilePath, expectedData);
    const actualData = await readJson(testFilePath);
    assert.deepEqual(actualData, expectedData);
    console.log('PASS: atomicWriteJson creates nested folders and readJson returns the original JSON data.');
  } finally {
    await fs.rm(testDir, { recursive: true, force: true });
  }
}

runTests().catch((error) => {
  console.error('Utility tests failed:', error);
  process.exitCode = 1;
});
