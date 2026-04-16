# CodeAudit AI — Project Notes

## Overview

CodeAudit AI is an AI-powered code review platform for the **Orion Build Challenge 2026** hackathon. Users paste a public GitHub repo URL and receive a structured quality report in under 30 seconds. No setup, no accounts, no CI pipelines.

### Key Features
- Architecture analysis & numerical quality score (0-10)
- Security vulnerability flags (high/medium/low severity)
- Actionable prioritized recommendations
- Auto-generated README from codebase analysis
- Three preloaded example repos for demo (vercel/next.js, facebook/react, team's own repo)

### Hackathon Domains
- AI/ML (Gemini AI), Developer Tools (GitHub API), Cybersecurity (security scanning), Open Innovation

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Vercel Serverless Functions |
| AI | Google Gemini 1.5 Flash (`@google/generative-ai`) |
| Data | GitHub REST API v3 |
| Deployment | Vercel (SPA + serverless in one deploy) |

---

## Repository Structure

```
codeaudit-ai/
  /api
    analyze.js              <- Main serverless endpoint
  /src
    /components
      LandingPage.jsx       <- Hero section + URL input
      ResultsDashboard.jsx  <- Full report UI
      LoadingState.jsx      <- Animated loading screen
      ScoreRing.jsx         <- SVG quality score visualizer
      SecurityFlags.jsx     <- Red badge list
      RecommendationList.jsx
      ReadmePreview.jsx     <- Markdown renderer + copy button
    /utils
      githubParser.js       <- URL parsing + GitHub API calls
      geminiPrompt.js       <- Prompt builder
    App.jsx
    main.jsx
  /public
    favicon.svg
  .env                      <- Local env vars (gitignored)
  .env.example              <- Template for team members
  vercel.json               <- Routing config + 30s maxDuration
  package.json
  vite.config.js
  tailwind.config.js
  README.md
```

---

## Environment Variables

```
GEMINI_API_KEY=your_google_gemini_api_key
GITHUB_TOKEN=your_github_personal_access_token
VITE_API_BASE=http://localhost:3000
```

- `GITHUB_TOKEN` is optional but raises GitHub API rate limit from 60 to 5,000 req/hr (read-only public repo scope)

---

## Request Flow

1. User submits GitHub URL in frontend input
2. React validates URL client-side, POSTs to `/api/analyze`
3. Serverless function parses URL, fetches repo file tree via GitHub API
4. File selection algorithm picks ~10 most informative files (3-tier priority)
5. Builds structured prompt, sends to Gemini 1.5 Flash (temp=0.3, `responseMimeType: 'application/json'`)
6. Returns analysis JSON with metadata -> React renders ResultsDashboard

---

## Key Design Decisions

- **No database** — all state is ephemeral, computed per request
- **`responseMimeType: 'application/json'`** forces valid JSON from Gemini
- **Temperature 0.3** for consistent, deterministic analysis
- **Max 10 files** selected to stay within Gemini context limits
- **Vercel function timeout = 30s** (Gemini calls take 5-15s + GitHub fetch time)

---

## Frontend App States

Three states managed by a state machine in `App.jsx`:

1. **idle** — LandingPage with hero, URL input, 3 example repo buttons
2. **loading** — Animated screen with cycling messages
3. **results** — Full ResultsDashboard with all report sections

---

## UI Requirements

- Mobile responsive (375px minimum)
- Dark mode support
- Score ring color changes at thresholds
- Security badges: high = red, medium = orange, low = blue
- Back button from results returns to landing cleanly
- Copy button on README copies markdown to clipboard

---

## Gemini Response Schema

```json
{
  "overview": "2-3 sentence project description",
  "language": "primary programming language",
  "quality_score": 7.4,
  "architecture_summary": "paragraph about code structure",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "security_flags": [
    { "severity": "high|medium|low", "issue": "description", "file": "filename or null" }
  ],
  "recommendations": [
    { "priority": "high|medium|low", "action": "description" }
  ],
  "generated_readme": "full markdown README string"
}
```
