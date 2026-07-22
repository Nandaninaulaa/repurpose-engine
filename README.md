# Regrowth — AI Content Repurposing Engine

Turns one piece of content into platform-tuned variants (Twitter/X thread,
LinkedIn post, Instagram caption, summary) — and learns what actually works
for you over time, while surfacing your own old content that's worth
resharing.

## What makes this different from a plain "repurposing" tool

1. **Feedback loop** — mark each generated post `worked` / `flopped`, or let
   the engine derive it automatically from real engagement (see below). It
   builds a lightweight preference profile (typical winning length,
   preferred opening style) from your outcomes and feeds it back into future
   generations.
2. **Auto-pulled engagement metrics** — paste the live URL once you post a
   generated variant, then sync metrics. The engine compares the post's
   engagement score to your own historical average *for that platform* and
   auto-tags it `worked`/`flopped` — no manual judgment call needed. Manual
   tags always take precedence over auto ones.
3. **Content decay / resurfacing** — add old posts to an archive with a
   topic list and the date you last shared them. The engine scores each one
   on an "evergreen score" blending staleness, niche fit, and a real
   trend-topicality signal, and lets you resurface the best candidates
   through the same repurposing pipeline in one click.

## Project structure

```
repurpose-engine/
  backend/
    server.js      Express API — all routes
    store.js        Simple JSON-file persistence (no native DB deps)
    generate.js      Generation logic — live Anthropic API or offline mock
    profile.js       Feedback-loop preference profile computation
    decay.js         Content-decay / evergreen scoring
    trends.js        Trend-topicality signal — live (SerpApi) or heuristic
    metrics.js       Engagement metrics — live platform APIs or simulated
    data.json        Created automatically on first run
  frontend/
    index.html       Single-page UI (vanilla JS, no build step)
```

## Running it

```bash
cd backend
npm install
npm start
```

Then open **http://localhost:3001** — the backend serves the frontend
directly.

### Live AI generation (optional)

By default the app runs with a deterministic **offline mock generator**, so
it works immediately with zero setup or cost. To use real Claude-generated
content instead:

```bash
cp .env.example .env
# edit .env and set ANTHROPIC_API_KEY=sk-ant-...
npm start
```

## How the pieces fit together

- **`POST /api/posts`** — generate all platform variants for new content,
  automatically injecting the current preference profile as extra prompt
  context.
- **`POST /api/outcomes`** — log whether a generated post worked; recomputes
  the preference profile.
- **`GET /api/profile`** — inspect the current learned preference profile.
- **`POST /api/archive`** / **`GET /api/archive/decay?niche=...`** — add old
  content and get it ranked by evergreen score.
- **`POST /api/archive/:id/resurface`** — regenerate platform variants for
  an archived item, personalized by the current profile.
- **`POST /api/generations/:id/publish`** — attach the live URL once you've
  posted a generated variant.
- **`POST /api/generations/:id/sync-metrics`** — pull (or simulate) likes,
  comments, shares, views; auto-derives `worked`/`flopped` by comparing to
  your own historical average on that platform.

### Live engagement metrics (optional)

Without credentials, `sync-metrics` uses a simulated provider so the full
pipeline (publish → sync → auto-outcome → preference profile) works
immediately. To pull real numbers, add the relevant token to `.env`:

```bash
TWITTER_BEARER_TOKEN=...     # Twitter API v2, tweet.fields=public_metrics
LINKEDIN_ACCESS_TOKEN=...    # stub in metrics.js — needs r_organization_social scope
INSTAGRAM_ACCESS_TOKEN=...   # stub in metrics.js — needs Graph API + Business account
```

The Twitter fetcher is fully wired up; LinkedIn and Instagram are stubbed
in `metrics.js` with notes on what each needs — fill those in once you have
the API access.

### Live trend scoring (optional)

`decay.js` blends staleness, niche fit, and a trend-topicality score. Without
credentials, `trends.js` uses a curated heuristic list of currently-hot
creator-niche topics (AI agents, short-form video, personal branding, etc. —
update the `HOT_TOPICS` list in that file as trends shift) with fuzzy
matching, so ranking is fully functional out of the box. For real Google
Trends data (Google has no direct public API, so this goes through SerpApi):

```bash
SERPAPI_KEY=...   # https://serpapi.com — wraps Google Trends
```

If a live call fails for any reason, it falls back to the heuristic
automatically rather than erroring out.

## Where this goes next

- Swap the JSON file store for Postgres once you want multi-user support.
- Replace the heuristic evergreen scorer in `decay.js` with a real trends-API
  relevance signal.
- Replace the stats-based preference profile in `profile.js` with a proper
  few-shot style-conditioning model once you have enough logged outcomes.
- Auto-pull engagement metrics from platform APIs instead of manual
  worked/flopped logging.
