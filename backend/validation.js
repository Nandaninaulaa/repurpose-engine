function validatePostContent(content) {
  if (typeof content !== 'string') {
    return { error: 'content must be a string' };
  }

  const normalized = content.trim();
  if (!normalized) {
    return { error: 'content is required' };
  }

  return { value: normalized };
}

module.exports = { validatePostContent };
