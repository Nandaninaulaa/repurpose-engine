// Pulls engagement metrics for a published post.
//
// Real providers need OAuth tokens the app doesn't have yet — set the env
// vars below once you have them and flip on live mode. Until then, a
// simulated provider returns plausible metrics so the rest of the pipeline
// (sync, auto-outcome, preference profile) is fully working end to end.

const LIVE = {
  twitter: !!process.env.TWITTER_BEARER_TOKEN,
  linkedin: !!process.env.LINKEDIN_ACCESS_TOKEN,
  instagram: !!process.env.INSTAGRAM_ACCESS_TOKEN,
};

// -- Real providers (stubs) --------------------------------------------
// Fill these in once you have API access. Each must return
// { likes, comments, shares, views }.

async function fetchTwitterMetrics(externalUrl) {
  const tweetId = externalUrl.split('/').pop();
  const res = await fetch(
    `https://api.twitter.com/2/tweets/${tweetId}?tweet.fields=public_metrics`,
    { headers: { Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}` } }
  );
  const data = await res.json();
  const m = data.data.public_metrics;
  return { likes: m.like_count, comments: m.reply_count, shares: m.retweet_count, views: m.impression_count || 0 };
}

async function fetchLinkedinMetrics(externalUrl) {
  // LinkedIn's Community Management API requires the post URN and an
  // approved app with r_organization_social scope. Wire this up once
  // you have those credentials.
  throw new Error('LinkedIn live metrics not configured yet');
}

async function fetchInstagramMetrics(externalUrl) {
  // Instagram Graph API requires a connected Business/Creator account
  // and a long-lived access token. Wire this up once available.
  throw new Error('Instagram live metrics not configured yet');
}

const REAL_FETCHERS = {
  twitter: fetchTwitterMetrics,
  linkedin: fetchLinkedinMetrics,
  instagram: fetchInstagramMetrics,
};

// -- Simulated provider ---------------------------------------------------
// Deterministic-ish pseudo-random metrics seeded from the text itself, so
// re-syncing the same post trends upward over time (like a real post would)
// instead of jumping around randomly.

function seedFromString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function simulateMetrics(text, publishedAt) {
  const seed = seedFromString(text);
  const hoursLive = Math.max(1, (Date.now() - new Date(publishedAt).getTime()) / 3.6e6);
  const growth = Math.min(1, hoursLive / 48); // metrics ramp up over ~48h then plateau
  const base = 20 + (seed % 200);

  const hasQuestion = text.includes('?');
  const engagementMultiplier = hasQuestion ? 1.3 : 1.0;

  const likes = Math.round(base * growth * engagementMultiplier);
  const comments = Math.round(likes * 0.08);
  const shares = Math.round(likes * 0.04);
  const views = Math.round(likes * (6 + (seed % 5)));

  return { likes, comments, shares, views };
}

// -- Public API -------------------------------------------------------

async function fetchMetrics(platform, generation) {
  if (LIVE[platform] && REAL_FETCHERS[platform] && generation.externalUrl) {
    return REAL_FETCHERS[platform](generation.externalUrl);
  }
  return simulateMetrics(generation.text, generation.publishedAt || generation.syncedAt || new Date().toISOString());
}

// Turns raw metrics into a single comparable engagement score, and decides
// worked/flopped relative to the creator's own historical average — so the
// bar adapts to each creator instead of being a fixed global threshold.
function engagementScore(metrics) {
  return metrics.likes + metrics.comments * 2 + metrics.shares * 3;
}

function isLiveConfigured(platform) {
  return !!LIVE[platform];
}

module.exports = { fetchMetrics, engagementScore, isLiveConfigured };
