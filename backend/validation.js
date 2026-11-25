function validatePostContent(content) {
  if (typeof content !== 'string') {
    return { error: 'content must be a string' };
  }

  if (!content.trim()) {
    return { error: 'content is required' };
  }

  return { value: content };
}

module.exports = { validatePostContent };
