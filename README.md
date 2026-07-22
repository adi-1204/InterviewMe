# InterviewMe

Personalized, multimodal mock interview practice platform for engineering students preparing for placements.

InterviewMe takes a candidate's resume, runs a live AI-conducted mock interview personalized to it, and scores the candidate across three dimensions — **content**, **speech delivery**, and **body language** — the way a real interview panel would.

This README is the starting point for anyone joining the project. Read this fully before writing any code.

---

## 1. Start Here: Required Reading

Before touching code, read these docs in `/docs`, in this order:

1. **[InterviewMe_PRD.md](docs/InterviewMe_PRD.md)** — what we're building, for whom, and why. Defines must-have vs nice-to-have features and what's explicitly out of scope for v1.
2. **[InterviewMe_Technical_Architecture.md](docs/InterviewMe_Technical_Architecture.md)** — the tech stack, full folder structure, and complete database schema. This skeleton is built directly from this doc.
3. **[InterviewMe_Security_and_Access.md](docs/InterviewMe_Security_and_Access.md)** — authentication approach, user roles, row-level security rules, and error-handling standards. Non-negotiable reading before writing any database query or auth code.
4. **[InterviewMe_Frontend_Specification.md](docs/InterviewMe_Frontend_Specification.md)** — the design system (colors, type, components) and the full third-party API integration spec (Clerk, Cloudinary, LLM providers).
5. **[InterviewMe_Feature_Ticket_List.md](docs/InterviewMe_Feature_Ticket_List.md)** — every feature broken into a buildable ticket with description, acceptance criteria, dependencies, and priority. **This is what you actually work from day to day.**

If a decision in the code seems to contradict one of these docs, the doc wins — flag it in the team channel rather than silently deviating.

---

## 2. Project Structure

```
interviewme/
├── frontend/     # React (Vite) + Tailwind — the SPA
├── backend/      # Flask API + AI/processing services
├── docs/         # the five reference documents above
└── README.md     # this file
```

**Frontend structure at a glance:**
```
frontend/src/
├── routes/         # one file per page (Landing, Login, InterviewSession, ReportDashboard, ...)
├── components/     # organized by feature area: layout/, interview/, report/, shared/
├── hooks/          # useAuth, useWebcamRecorder, useSessionPolling
├── services/       # api.js — the single place all backend calls go through
└── context/        # AuthContext
```

**Backend structure at a glance:**
```
backend/app/
├── models/         # one file per database table (user, resume, session, question, response, ...)
├── routes/         # one file per resource — thin, just request/response handling
├── services/       # ALL real logic lives here (resume parsing, LLM calls, speech/vision analysis, scoring)
├── schemas/        # request/response validation
├── utils/          # file storage helpers, error handlers, rate-limit fallback logic
└── prompts/         # LLM prompt text, kept separate from llm_service.py so prompt iteration is easy to review
```

**The one rule to internalize about this structure:** routes stay thin, services hold the logic. If you're writing more than a few lines of actual logic inside a route file, it belongs in `services/` instead.

---

## 3. Environment Setup

### Prerequisites
- Node.js v18 or v20 (LTS)
- Python 3.11+
- Git

### Frontend
```bash
cd frontend
npm install
cp .env.example .env      # fill in the values — ask in the team channel for shared dev keys
npm run dev               # runs at http://localhost:5173
```

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # fill in the values — ask in the team channel for shared dev keys
python wsgi.py             # runs at http://localhost:5000
```
Confirm it's running: visit `http://localhost:5000/api/health` — should return `{"status": "ok"}`.

### AI/processing dependencies
These are commented out in `requirements.txt` on purpose so the base install stays fast. Install them when you're actually working on the service that needs them:
```bash
pip install PyMuPDF faster-whisper mediapipe librosa
```

### Accounts everyone needs (free tiers)
- **Clerk** — authentication
- **Cloudinary** — resume/audio/video file storage
- **Gemini API or OpenRouter** — LLM calls
- **Neon or Supabase** — Postgres (only needed once we move off local SQLite)

**Never commit your `.env` file.** Only `.env.example` (placeholder values) belongs in git — this is already handled in `.gitignore`, but double-check before every commit involving credentials.

---

## 4. How We Work: Day-to-Day Workflow

1. **Pick a ticket** from `InterviewMe_Feature_Ticket_List.md`. Check its **Dependencies** field first — don't start a ticket whose dependencies aren't merged yet.
2. **Check the ticket's Priority label.** Must-have tickets block launch; build these first as a team. Should-have and nice-to-have can be picked up once the must-have list is under control.
3. **Branch naming:** `epic-letter/ticket-id-short-description`, e.g. `epic-c/c3-interview-screen-recording-flow`.
4. **Before opening a PR**, check your work against the ticket's **Acceptance Criteria** — this is the actual definition of done, not just "it compiles."
5. **Every PR touching a database query must be checked against the [Security & Access Document](docs/InterviewMe_Security_and_Access.md)'s row-level security rules** (Section 3 of that doc) — every read/write must verify the requesting user owns the data. This is the single most important rule in the whole project; a violation here is treated as a blocking issue, not a style note.
6. **Every user-facing error must follow the Error Handling Guide** in the [Security & Access Document](docs/InterviewMe_Security_and_Access.md) (Section 4) — plain language, no raw stack traces, no silent failures.

---

## 5. Design System Quick Reference

Full detail in [InterviewMe_Frontend_Specification.md](docs/InterviewMe_Frontend_Specification.md). The short version so you don't have to open it for every small styling decision:

- **Colors:** ink-navy (`#0F1420`) dark surfaces, warm paper (`#F6F4EF`) light surfaces, amber spotlight (`#E8A94B`) as the one primary accent. Three fixed score-dimension colors: teal = content, amber = communication, violet = body language — never swap these.
- **Type:** Fraunces (serif) for the interview question and headline scores only, Inter for everything else, IBM Plex Mono for transcripts/metrics.
- **The signature moment:** the live interview screen dims all page chrome and puts a soft spotlight glow around the active question and recording indicator. This effect belongs only on that screen — don't reuse it as a generic transition elsewhere.

---

## 6. Key Architectural Rules (Don't Skip These)

- **Row-level security, always:** every database query must filter by the requesting user's ownership — no exceptions, even for "internal" calls. See [Security doc](docs/InterviewMe_Security_and_Access.md), Section 3.
- **Routes are thin, services hold logic.** See Section 2 above.
- **Every LLM/speech/vision call must degrade gracefully, never crash the session.** If body-language analysis fails, the interview continues and the report just shows that section as unavailable. See [PRD](docs/InterviewMe_PRD.md) Section 8 (Non-Functional Requirements) and [Security doc](docs/InterviewMe_Security_and_Access.md) Section 4.
- **Frontend never calls the LLM, Faster-Whisper, or MediaPipe directly** — those only run through the backend. The frontend only talks directly to Clerk (auth) and Cloudinary (file upload). See [Frontend Spec](docs/InterviewMe_Frontend_Specification.md), Part 2.
- **No API keys in frontend code, ever**, except the ones explicitly meant to be public (`VITE_CLERK_PUBLISHABLE_KEY`, `VITE_CLOUDINARY_CLOUD_NAME`). If a secret key ever needs a `VITE_` prefix to work, that's a sign something is architected wrong — stop and flag it.

---

## 7. Getting Help / Flagging Issues

- If a ticket's acceptance criteria seem wrong or outdated relative to what you've learned while building, flag it in the team channel rather than silently building something different — the docs should stay a source of truth, which means updating them when reality changes them.
- If you hit a genuine ambiguity the docs don't answer, default to the safer/more conservative choice (stricter security check, more explicit error message) and flag it for the team to confirm rather than guessing and moving on.

Welcome aboard — build from the tickets, check against the docs, and ask when something's unclear rather than assuming.
