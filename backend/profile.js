// Computes a lightweight preference profile from a creator's logged outcomes.
// v1: simple aggregation stats, no ML model needed yet — this is the seam
// where a real learned model / embedding-based conditioner would plug in later.

function computeProfile(generations, outcomes) {
  const winners = outcomes
    .filter(o => o.result === 'worked')
    .map(o => generations.find(g => g.id === o.generationId))
    .filter(Boolean);

  if (winners.length === 0) {
    return { sampleSize: 0, avgWinningLength: null, preferredOpening: null };
  }

  const lengths = winners.map(w => w.text.split(/\s+/).length);
  const avgWinningLength = Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);

  const openings = winners.map(w => w.text.trim().split(/\n/)[0]);
  const questionOpeners = openings.filter(o => o.includes('?')).length;
  const preferredOpening =
    questionOpeners / openings.length > 0.5
      ? 'a question hook'
      : 'a direct statement, not a question';

  return { sampleSize: winners.length, avgWinningLength, preferredOpening };
}

module.exports = { computeProfile };
