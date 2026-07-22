// Scores how "trending" a topic is right now.
//
// Real live trends need a SerpApi key (wraps Google Trends — Google has no
// direct public API). Set SERPAPI_KEY once you have one and this switches
// to live automatically. Until then, a heuristic fallback based on a
// curated seed list of currently-hot creator-niche topics keeps the whole
// decay pipeline fully working.

const LIVE = !!process.env.SERPAPI_KEY;

// -- Real provider ------------------------------------------------------
async function fetchLiveTrendScore(topic) {
  const url = `https://serpapi.com/search.json?engine=google_trends&q=${encodeURIComponent(topic)}&data_type=TIMESERIES&api_key=${process.env.SERPAPI_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  const points = data?.interest_over_time?.timeline_data || [];
  if (points.length === 0) return 0.4; // no signal — neutral-ish default
  const recent = points.slice(-4); // last few data points
  const avg = recent.reduce((sum, p) => sum + (p.values?.[0]?.extracted_value || 0), 0) / recent.length;
  return Math.min(1, avg / 100); // Google Trends values are already 0-100
}

// -- Heuristic fallback ---------------------------------------------------
// Curated, manually-refreshed seed list of topics with above-average
// interest across common creator niches right now. Update this list
// periodically — it's the seam a real live feed replaces.
const HOT_TOPICS = {
  'ai agents': 0.95, 'ai': 0.88, 'llm': 0.8, 'automation': 0.72,
  'personal branding': 0.78, 'newsletter': 0.6, 'creator economy': 0.7,
  'burnout': 0.65, 'productivity': 0.6, 'remote work': 0.5,
  'short-form video': 0.82, 'faceless content': 0.7, 'ugc': 0.68,
  'career change': 0.55, 'side hustle': 0.6, 'freelancing': 0.52,
  'mental health': 0.7, 'fitness': 0.5, 'budgeting': 0.55,
  'saas': 0.6, 'no-code': 0.58, 'web3': 0.3, 'nft': 0.2,
};

function seedFromString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function heuristicTrendScore(topic) {
  const norm = topic.toLowerCase().trim();
  if (HOT_TOPICS[norm] !== undefined) return HOT_TOPICS[norm];

  // Fuzzy match: does the topic contain, or get contained by, a seed term?
  const fuzzyHit = Object.entries(HOT_TOPICS).find(
    ([seed]) => norm.includes(seed) || seed.includes(norm)
  );
  if (fuzzyHit) return fuzzyHit[1] * 0.85; // slight discount for partial match

  // No signal at all — small deterministic jitter so unrelated topics
  // don't all collapse to one identical flat score.
  const jitter = (seedFromString(norm) % 20) / 100; // 0.00–0.19
  return 0.25 + jitter;
}

// -- Public API -----------------------------------------------------------

async function trendScore(topic) {
  if (LIVE) {
    try {
      return await fetchLiveTrendScore(topic);
    } catch {
      return heuristicTrendScore(topic); // live call failed — fall back gracefully
    }
  }
  return heuristicTrendScore(topic);
}

async function trendScoreForTopics(topics) {
  if (!topics || topics.length === 0) return 0.4; // no topics tagged — neutral
  const scores = await Promise.all(topics.map(trendScore));
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function isLiveConfigured() {
  return LIVE;
}

module.exports = { trendScore, trendScoreForTopics, isLiveConfigured };
