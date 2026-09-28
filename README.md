# AI/ML Auto Evaluation of R&D Proposals (SIH25180)
**Ministry of Coal — NaCCER, CMPDI Ranchi**

Evaluates coal-sector R&D proposals on two axes and combines them into one
explainable score to help reviewers prioritize funding:

1. **Novelty (60%)** — Gemini compares the proposal against a reference database
   of 30 past/existing projects and returns a score, the closest match, an
   overlap %, and its reasoning.
2. **Financial soundness (40%)** — a deterministic, rule-based budget check
   (no LLM), so every flag can be explained exactly.

## Features
- **Upload a proposal** (PDF, DOCX, TXT; ≤10 MB locally/Render, ≤4 MB on Vercel) → text extracted, and title,
  institution, budget (converted to ₹ lakhs) and duration (months) auto-filled
  by Gemini for the reviewer to verify
- Or paste text / fill the form manually
- Explainable score card: novelty reasoning, closest match, budget flag, expected range
- **Compare** tab ranks all evaluated proposals by overall score
- **Reference Database** tab shows exactly what novelty is judged against

## Stack
- **Backend:** Node.js + Express + better-sqlite3, multer (uploads), pdf-parse v2, mammoth (DOCX)
- **Frontend:** React + Vite + Tailwind CSS
- **AI:** Google Gemini API (free tier) — `gemini-3.5-flash-lite` first for speed, with automatic fallback to `gemini-3.6-flash` / `gemini-3.8-flash`

## Project Structure
```
rnd-evaluator/
├── backend/
│   ├── server.js
│   ├── db/
│   │   ├── db.js                     # SQLite setup
│   │   └── pastProposalsReference.js # 30 reference projects
│   ├── routes/
│   │   ├── evaluate.js               # POST /api/evaluate
│   │   ├── extract.js                # POST /api/extract (file upload)
│   │   └── proposals.js              # GET/DELETE /api/proposals, GET /api/reference
│   └── services/
│       ├── llmService.js             # Gemini: novelty + field extraction
│       ├── financialCheck.js         # Rule-based budget check
│       └── documentParser.js         # PDF / DOCX / TXT → text
├── frontend/src/
│   ├── App.jsx
│   └── components/ UploadForm · ScoreDashboard · ProposalList · ReferenceList
└── sample-data/README.md             # 4 demo proposals + an upload test doc
```

## Setup
Requires **Node.js 20.16+ or 22.3+** (needed by pdf-parse v2).

```bash
# 1. Backend (from rnd-evaluator/)
npm install
cp .env.example .env        # Windows: copy .env.example .env
# edit .env → GEMINI_API_KEY from aistudio.google.com (free, no card)

# 2. Frontend
cd frontend
npm install
```

## Run (development — two terminals)
```bash
# Terminal 1, in rnd-evaluator/
npm run dev                 # backend on http://localhost:3000

# Terminal 2, in rnd-evaluator/frontend/
npm run dev                 # frontend on http://localhost:5173
```
Open **http://localhost:5173**. Restart the backend after editing `.env`.

## Run (single server, for the final demo)
```bash
cd frontend && npm run build && cd ..
npm start                   # everything on http://localhost:3000
```

## Deploy (Vercel)
This repo includes `vercel.json`: the React app is served as static files from Vercel's CDN and
the Express API runs as one serverless function (`api/index.js` → `backend/app.js`).

1. Push this folder to GitHub (`.gitignore` keeps `.env`, `node_modules` and the database out).
2. On [vercel.com/new](https://vercel.com/new) → **Import** the repo. Leave the settings as detected
   (vercel.json sets install/build/output).
3. Under **Environment Variables** add `GEMINI_API_KEY` (optionally `GEMINI_MODEL=gemini-3.5-flash-lite`
   and `GEMINI_FALLBACK_MODELS=gemini-3.6-flash,gemini-3.8-flash`).
4. **Deploy** → live at `https://<project>.vercel.app`.

**Vercel notes:** uploads are limited to 4 MB (Vercel's 4.5 MB request cap). Saved evaluations live in
`/tmp` (or in memory if SQLite can't load) and reset when the function restarts — fine for demos; use a
hosted database for production. `GET /api/health` shows which storage is active.

## Deploy (Render, free tier)
This repo includes `render.yaml`, so Render can set everything up from GitHub.

1. Push this folder to a GitHub repository (`.gitignore` keeps `.env`, `node_modules` and the database out).
2. On [render.com](https://render.com) → **New → Blueprint** → pick the repo → Render reads `render.yaml`.
3. When asked, paste your **GEMINI_API_KEY** (it is stored in Render, never in the code).
4. Wait for the build (~2-3 min). Your app is live at `https://<name>.onrender.com`.

Build: `npm install && npm run build` · Start: `npm start` · Health check: `/api/health`

**Free-tier notes:** the service sleeps after 15 min idle and takes ~1 min to wake — open the link a couple of
minutes before a demo. The SQLite database resets on each restart/redeploy (fine for demos).

## API
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/extract` | multipart `file` → `{ text, fields, warning }` |
| POST | `/api/evaluate` | `{ title, proposer, proposalText, requestedBudgetLakhs, durationMonths }` → score |
| GET | `/api/proposals` | all evaluations |
| DELETE | `/api/proposals/:id` | remove one |
| GET | `/api/reference` | the 30 reference projects |

## How scoring works (for judges' Q&A)
- **Novelty:** proposal text + the 30 reference projects go to Gemini, which must
  return JSON: `novelty_score` (1-10), `closest_match`, `overlap_percentage`,
  `reasoning`. All four are shown in the UI — nothing hidden.
- **Financial:** duration sets the scale (≤12 mo small, ≤24 medium, else large);
  the budget is checked against that scale's range → REASONABLE / OVER / UNDER.
- **Overall:** `novelty × 0.6 + financial_subscore × 0.4`
  (REASONABLE = 10, UNDER = 5, OVER = 4).

## Resilience
- Gemini overloaded (503), rate-limited (429) or slow (>25s) → skip straight to the next model in `GEMINI_FALLBACK_MODELS`, and remember the busy model for 3 minutes; retired model ids (404) are skipped
- "Thinking" is kept low (Flash-Lite: minimal by default; Flash: `thinkingLevel: low`) since answers are short JSON
- Gemini completely down → rule-based field reader + keyword-similarity novelty check, clearly labelled in the UI
- Field auto-fill fails → text still loads, with a warning to fill fields manually
- Unsupported file / >10 MB / scanned image-only PDF → clear error message
- Unparseable model output → neutral fallback score instead of a crash

## Known limitations (be upfront if asked)
- The 30 reference projects are **illustrative**, not NaCCER's real records
- Budget ranges are **illustrative** demo thresholds, not NaCCER funding data
- Scanned (image-only) PDFs aren't supported — no OCR
- No login / authentication
