// Scores archived content on how worth resurfacing it is right now.
// Blends three signals:
//  - staleness: time since last shared (peaks in the 6-18mo "feels fresh
//    again" window)
//  - niche fit: does it match the creator's current stated niche
//  - trend score: is the topic actually trending right now (live via
//    trends.js if configured, heuristic fallback otherwise)

const { trendScoreForTopics } = require('./trends');

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function stalenessScore(lastSharedAt) {
  const daysSince = (Date.now() - new Date(lastSharedAt).getTime()) / MS_PER_DAY;
  if (daysSince < 60) return 0.1;
  if (daysSince < 180) return 0.5;
  if (daysSince < 540) return 1.0;
  if (daysSince < 900) return 0.6;
  return 0.25;
}

function nicheFitScore(item, niche) {
  if (!niche) return 0.5;
  const topics = (item.topics || []).map(t => t.toLowerCase());
  const nicheWords = niche.toLowerCase().split(/[,\s]+/).filter(Boolean);
  const overlap = topics.filter(t => nicheWords.includes(t)).length;
  return overlap > 0 ? Math.min(1, 0.5 + overlap * 0.25) : 0.3;
}

async function scoreItem(item, niche) {
  const staleness = stalenessScore(item.lastSharedAt);
  const nicheFit = nicheFitScore(item, niche);
  const trend = await trendScoreForTopics(item.topics);
  const evergreenScore = Math.round((staleness * 0.45 + nicheFit * 0.25 + trend * 0.30) * 100) / 100;
  return { ...item, evergreenScore, trendScore: Math.round(trend * 100) / 100 };
}

async function rankArchive(items, niche) {
  const scored = await Promise.all(items.map(item => scoreItem(item, niche)));
  return scored.sort((a, b) => b.evergreenScore - a.evergreenScore);
}

module.exports = { rankArchive };
