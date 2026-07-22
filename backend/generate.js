const USE_LIVE_API = !!process.env.ANTHROPIC_API_KEY;

const PLATFORM_PROMPTS = {
  twitter: 'Turn this content into a punchy Twitter/X thread (5-7 tweets, numbered, hook in tweet 1).',
  linkedin: 'Turn this content into a LinkedIn post (professional tone, 150-250 words, ends with a question).',
  instagram: 'Turn this content into an Instagram caption (conversational, short paragraphs, 3-5 relevant hashtags at the end).',
  summary: 'Write a 2-3 sentence summary of this content.',
};

// Builds extra prompt context from a creator's learned preference profile.
function styleContext(profile) {
  if (!profile || profile.sampleSize === 0) return '';
  const bits = [];
  if (profile.avgWinningLength) bits.push(`aim for roughly ${profile.avgWinningLength} words`);
  if (profile.preferredOpening) bits.push(`open the way their best posts do: ${profile.preferredOpening}`);
  if (bits.length === 0) return '';
  return ` Based on this creator's past high-performing posts, ${bits.join(', ')}.`;
}

async function callLiveApi(systemPrompt, content) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: 'user', content }],
    }),
  });
  const data = await res.json();
  const textBlock = (data.content || []).find(b => b.type === 'text');
  return textBlock ? textBlock.text : '[no content returned]';
}

// Deterministic offline fallback so the app is fully runnable without an API key.
function mockGenerate(platform, content) {
  const snippet = content.trim().slice(0, 160).replace(/\s+/g, ' ');
  const templates = {
    twitter: `1/ ${snippet}...\n2/ Here's why that matters.\n3/ The key insight most people miss.\n4/ What this means for you.\n5/ Full piece linked below.`,
    linkedin: `${snippet}...\n\nA few takeaways worth sitting with. This connects to a broader pattern I've been noticing.\n\nWhat's your take on this?`,
    instagram: `${snippet}...\n\nSwipe through for the full story ✨\n\n#content #creator #growth`,
    summary: `${snippet}...`,
  };
  return templates[platform] || snippet;
}

async function generateForPlatform(platform, content, profile) {
  const base = PLATFORM_PROMPTS[platform];
  if (!base) throw new Error(`Unknown platform: ${platform}`);
  if (!USE_LIVE_API) return mockGenerate(platform, content);

  const systemPrompt = base + styleContext(profile);
  return callLiveApi(systemPrompt, content);
}

module.exports = { generateForPlatform, PLATFORM_PROMPTS, USE_LIVE_API };
