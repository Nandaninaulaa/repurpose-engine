const test = require('node:test');
const assert = require('node:assert/strict');
const { validatePostContent } = require('../validation');

test('rejects values that are not strings', () => {
  for (const content of [undefined, null, 123, [], {}]) {
    assert.deepEqual(validatePostContent(content), {
      error: 'content must be a string',
    });
  }
});

test('rejects empty and whitespace-only strings', () => {
  for (const content of ['', '   ', '\n\t']) {
    assert.deepEqual(validatePostContent(content), {
      error: 'content is required',
    });
  }
});

test('preserves valid strings, including surrounding whitespace', () => {
  const content = '  Hello, world!  ';
  assert.deepEqual(validatePostContent(content), { value: content });
});
