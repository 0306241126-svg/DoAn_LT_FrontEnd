const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { DATA_DIR, DEFAULT_USERNAME } = require('../src/config/constants');

assert.equal(path.isAbsolute(DATA_DIR), true, 'DATA_DIR must be an absolute path');
assert.equal(path.resolve(DATA_DIR), DATA_DIR, 'DATA_DIR must be normalized');
assert.equal(fs.statSync(DATA_DIR).isDirectory(), true, 'DATA_DIR must exist');
assert.equal(DEFAULT_USERNAME, 'default_user');

console.log('PASS: DATA_DIR is an existing absolute path and DEFAULT_USERNAME is default_user.');