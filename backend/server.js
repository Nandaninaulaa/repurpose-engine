require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { load, save, nextId } = require('./store');
const { generateForPlatform, PLATFORM_PROMPTS, USE_LIVE_API } = require('./generate');
const { computeProfile } = require('./profile');
const { rankArchive } = require('./decay');
const { fetchMetrics, engagementScore, isLiveConfigured } = require('./metrics');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

const PLATFORMS = Object.keys(PLATFORM_PROMPTS);

// -- Posts: create a post and generate all platform variants --
app.post('/api/posts', async (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'content is required' });

  const db = load();
  const post = { id: nextId(db.posts), content, createdAt: new Date().toISOString() };
  db.posts.push(post);

  const profile = computeProfile(db.generations, db.outcomes);

  const generations = [];
  for (const platform of PLATFORMS) {
    const text = await generateForPlatform(platform, content, profile);
    const gen = { id: nextId(db.generations.concat(generations)), postId: post.id, platform, text };
    generations.push(gen);
  }
  db.generations.push(...generations);
  save(db);

  res.json({ post, generations, usedLiveApi: USE_LIVE_API, profileUsed: profile });
});

app.get('/api/posts', (req, res) => {
  const db = load();
  res.json(db.posts.map(p => ({
    ...p,
    generations: db.generations.filter(g => g.postId === p.id),
  })));
});

// -- Outcomes: the feedback loop --
app.post('/api/outcomes', (req, res) => {
  const { generationId, result } = req.body; // result: 'worked' | 'flopped'
  if (!generationId || !['worked', 'flopped'].includes(result)) {
    return res.status(400).json({ error: 'generationId and result (worked|flopped) required' });
  }
  const db = load();
  const gen = db.generations.find(g => g.id === generationId);
  if (!gen) return res.status(404).json({ error: 'generation not found' });

  const existing = db.outcomes.find(o => o.generationId === generationId);
  if (existing) { existing.result = result; existing.source = 'manual'; }
  else db.outcomes.push({ id: nextId(db.outcomes), generationId, result, source: 'manual' });
  save(db);

  res.json({ ok: true, profile: computeProfile(db.generations, db.outcomes) });
});

// -- Mark a generation as published (paste the live URL once you post it) --
app.post('/api/generations/:id/publish', (req, res) => {
  const { externalUrl } = req.body;
  if (!externalUrl) return res.status(400).json({ error: 'externalUrl is required' });

  const db = load();
  const gen = db.generations.find(g => g.id === Number(req.params.id));
  if (!gen) return res.status(404).json({ error: 'generation not found' });

  gen.externalUrl = externalUrl;
  gen.publishedAt = gen.publishedAt || new Date().toISOString();
  save(db);
  res.json(gen);
});

// -- Pull (or simulate) engagement metrics and auto-derive an outcome --
app.post('/api/generations/:id/sync-metrics', async (req, res) => {
  const db = load();
  const gen = db.generations.find(g => g.id === Number(req.params.id));
  if (!gen) return res.status(404).json({ error: 'generation not found' });
  if (!gen.publishedAt) return res.status(400).json({ error: 'publish this generation first (POST .../publish)' });

  const metrics = await fetchMetrics(gen.platform, gen);
  gen.metrics = metrics;
  gen.syncedAt = new Date().toISOString();
  gen.score = engagementScore(metrics);

  // Auto-derive worked/flopped relative to this creator's own average for
  // the platform, unless they've already set an outcome manually.
  const priorScores = db.generations
    .filter(g => g.platform === gen.platform && g.id !== gen.id && typeof g.score === 'number')
    .map(g => g.score);
  const avg = priorScores.length ? priorScores.reduce((a, b) => a + b, 0) / priorScores.length : null;

  const existingOutcome = db.outcomes.find(o => o.generationId === gen.id);
  let autoResult = null;
  if (!existingOutcome || existingOutcome.source === 'auto') {
    autoResult = avg === null ? null : gen.score >= avg ? 'worked' : 'flopped';
    if (autoResult) {
      if (existingOutcome) existingOutcome.result = autoResult;
      else db.outcomes.push({ id: nextId(db.outcomes), generationId: gen.id, result: autoResult, source: 'auto' });
    }
  }

  save(db);
  res.json({
    generation: gen,
    autoResult,
    comparedToAvg: avg,
    liveConfigured: isLiveConfigured(gen.platform),
    profile: computeProfile(db.generations, db.outcomes),
  });
});

app.get('/api/profile', (req, res) => {
  const db = load();
  res.json(computeProfile(db.generations, db.outcomes));
});

// -- Archive: content-decay resurfacing --
app.post('/api/archive', (req, res) => {
  const { title, topics, lastSharedAt } = req.body;
  if (!title || !lastSharedAt) return res.status(400).json({ error: 'title and lastSharedAt required' });

  const db = load();
  const item = {
    id: nextId(db.archiveItems),
    title,
    topics: topics || [],
    lastSharedAt,
  };
  db.archiveItems.push(item);
  save(db);
  res.json(item);
});

app.get('/api/archive', (req, res) => {
  const db = load();
  res.json(db.archiveItems);
});

app.get('/api/archive/decay', async (req, res) => {
  const { niche } = req.query;
  const db = load();
  res.json(await rankArchive(db.archiveItems, niche || ''));
});

// -- Resurface an archive item: run it back through generation --
app.post('/api/archive/:id/resurface', async (req, res) => {
  const db = load();
  const item = db.archiveItems.find(i => i.id === Number(req.params.id));
  if (!item) return res.status(404).json({ error: 'archive item not found' });

  const post = { id: nextId(db.posts), content: item.title, createdAt: new Date().toISOString(), fromArchiveId: item.id };
  db.posts.push(post);

  const profile = computeProfile(db.generations, db.outcomes);
  const generations = [];
  for (const platform of PLATFORMS) {
    const text = await generateForPlatform(platform, item.title, profile);
    generations.push({ id: nextId(db.generations.concat(generations)), postId: post.id, platform, text });
  }
  db.generations.push(...generations);
  save(db);

  res.json({ post, generations });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Repurposing engine running on http://localhost:${PORT}`);
  console.log(USE_LIVE_API ? 'Using live Anthropic API for generation.' : 'No ANTHROPIC_API_KEY set — using offline mock generator.');
});
