# 🌱 Regrowth — AI Content Repurposing Engine

Turn one piece of content into platform-optimized variants for **Twitter/X**, **LinkedIn**, **Instagram**, and **Summaries**—while learning what performs best for **your audience** over time. Regrowth also resurfaces your best evergreen content, so your great ideas never go to waste.

---

## ✨ Features

### 🧠 AI-Powered Content Repurposing

Generate multiple content formats from a single input:

* 🐦 Twitter/X Thread
* 💼 LinkedIn Post
* 📸 Instagram Caption
* 📝 Summary

---

### 📈 Feedback Learning Loop

Regrowth continuously improves future generations by learning from your content performance.

* ✅ Mark posts as **Worked** or **Flopped** manually.
* 🤖 Or let Regrowth automatically determine the outcome from engagement metrics.
* 📊 Builds a lightweight preference profile, including:

  * Preferred opening style
  * Best-performing content length
  * Winning writing patterns

Future generations automatically use these insights.

---

### 📊 Automatic Engagement Tracking

Once you publish generated content:

1. 🔗 Paste the live post URL.
2. 📥 Sync engagement metrics.
3. 📈 Compare performance against your historical averages.
4. 🤖 Automatically classify the post as **Worked** or **Flopped**.

> Manual feedback always overrides automatic predictions.

---

### ♻️ Evergreen Content Resurfacing

Never let valuable content disappear.

Archive old posts with:

* 📅 Last published date
* 🏷️ Topics
* 🎯 Niche

Regrowth calculates an **Evergreen Score** using:

* ⏳ Content age
* 🎯 Niche relevance
* 🔥 Trend popularity

Then recommends the best posts to repurpose again with a single click.

---

# 📂 Project Structure

```text
repurpose-engine/
│
├── backend/
│   ├── server.js        # Express API
│   ├── store.js         # JSON storage
│   ├── generate.js      # AI generation logic
│   ├── profile.js       # Preference learning
│   ├── decay.js         # Evergreen scoring
│   ├── trends.js        # Trend detection
│   ├── metrics.js       # Engagement metrics
│   └── data.json        # Auto-created database
│
└── frontend/
    └── index.html       # Single-page application
```

---

# 🚀 Running the Project

```bash
cd backend
npm install
npm start
```

Open:

```
http://localhost:3001
```

The backend serves the frontend automatically.

---

# 🤖 Live AI Generation (Optional)

By default, Regrowth uses a deterministic offline generator, allowing it to run without API keys.

To enable Claude:

```bash
cp .env.example .env
```

Add:

```env
ANTHROPIC_API_KEY=your_key_here
```

Restart the server.

---

# ⚙️ API Overview

### 📝 Generate Platform Variants

```
POST /api/posts
```

Generates optimized content while injecting your learned writing preferences.

---

### 📊 Record Outcomes

```
POST /api/outcomes
```

Stores performance results and updates the preference profile.

---

### 🧠 View Learned Preferences

```
GET /api/profile
```

Displays the current AI-generated writing profile.

---

### 📚 Archive Content

```
POST /api/archive
```

Add old posts to the archive.

---

### 🌱 Evergreen Ranking

```
GET /api/archive/decay?niche=...
```

Ranks archived content by evergreen score.

---

### 🔄 Resurface Content

```
POST /api/archive/:id/resurface
```

Repurpose archived content using the latest preference profile.

---

### 📢 Publish Generated Content

```
POST /api/generations/:id/publish
```

Attach the live social media URL.

---

### 📈 Sync Engagement Metrics

```
POST /api/generations/:id/sync-metrics
```

Fetches or simulates:

* ❤️ Likes
* 💬 Comments
* 🔁 Shares
* 👀 Views

Automatically determines whether the content performed well.

---

# 📡 Live Engagement Metrics (Optional)

Without credentials, Regrowth uses simulated engagement data.

For live metrics, configure:

```env
TWITTER_BEARER_TOKEN=...
LINKEDIN_ACCESS_TOKEN=...
INSTAGRAM_ACCESS_TOKEN=...
```

* 🐦 Twitter API v2 is fully integrated.
* 💼 LinkedIn integration is scaffolded.
* 📸 Instagram Graph API integration is scaffolded.

---

# 🔥 Live Trend Scoring (Optional)

Evergreen scoring combines:

* ⏳ Content freshness
* 🎯 Niche alignment
* 📈 Trend popularity

Enable real trend analysis using SerpApi:

```env
SERPAPI_KEY=...
```

If the API is unavailable, Regrowth automatically falls back to a built-in heuristic of trending creator topics.

---

# 🛣️ Future Improvements

* 🗄️ Replace JSON storage with PostgreSQL for multi-user support.
* 🌍 Integrate real-time Google Trends relevance.
* 🧠 Replace statistical preference learning with few-shot style conditioning.
* 📲 Fully automate engagement tracking across supported social platforms.
* 👥 Add authentication and user accounts.
* ☁️ Deploy as a cloud-hosted SaaS platform.

---

# 👩‍💻 Author

**Nandani Naula**

🎓 B.Tech Computer Science & Engineering (AI & ML)

💻 Full Stack Developer | AI/ML Enthusiast | Open Source Learner

🔗 GitHub: https://github.com/Nandaninaulaa

⭐ If you found this project helpful, consider giving it a star!

