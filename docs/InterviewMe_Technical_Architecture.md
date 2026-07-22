# Technical Architecture Document: InterviewMe

**Document Owner:** Engineering
**Status:** Draft v1.0
**Last Updated:** July 18, 2026

---

## 1. Recommended Tech Stack (With Reasoning)

### 1.1 Frontend

| Choice | Reasoning |
|---|---|
| **React (Vite)** | Fast dev server, minimal config, well-suited to a small team shipping a media-heavy SPA. Vite's HMR speed matters here because you'll be iterating on webcam/recording UI constantly. |
| **Tailwind CSS** | Lets one or two people build a polished, consistent UI (report dashboards, charts, forms) without a design system team. Utility classes reduce CSS sprawl in a fast-moving codebase. |
| **Recharts** | You need radar charts (content/communication/body-language) and line/timeline charts (eye contact, progress trend). Recharts covers both out of the box with a React-native API, avoiding a heavier library like D3 for what is fundamentally standard charting. |
| **Browser `MediaRecorder` API (WebRTC)** | No third-party video SDK needed for a single-user, non-real-time-multiparty use case — you're recording locally and uploading a file, not doing live peer-to-peer streaming. Keeps cost and complexity down versus something like Twilio/Agora, which solve a problem you don't have. |

### 1.2 Backend

| Choice | Reasoning |
|---|---|
| **Flask + Flask-SQLAlchemy + Flask-CORS** | Lightweight, Python-native, and Python is the natural language for the AI/ML-heavy service layer (Whisper, MediaPipe, Librosa all have first-class Python support). Avoids the overhead of a heavier framework (Django) when you don't need its batteries — no admin panel or ORM migrations complexity beyond what SQLAlchemy + Alembic already gives you. |
| **Service-layer separation** (resume/llm/speech/vision/scoring services) | Each AI capability (parsing, question gen, transcription, vision) is independently swappable and testable. If you later replace Faster-Whisper with a hosted STT API, only `speech_service.py` changes — nothing else in the codebase needs to know. |

### 1.3 AI / ML Components

| Choice | Reasoning |
|---|---|
| **Gemini API / OpenRouter for LLM tasks** | Free-tier friendly, and OpenRouter specifically gives you a fallback path across multiple model providers if one hits rate limits — important given the whole stack leans on free tiers. Avoids vendor lock-in to a single LLM provider this early. |
| **PyMuPDF for resume parsing** | Mature, fast, pure-Python PDF text extraction with layout awareness — good enough to get clean text out of a resume without needing OCR (resumes are near-universally text-based PDFs, not scanned images). |
| **Faster-Whisper for transcription** | Whisper's accuracy with a much lower resource/latency footprint than vanilla `openai-whisper` — matters directly for your ~15-20s per-question latency target. Runs locally, so no per-request cost or API dependency for the highest-volume operation in the pipeline. |
| **Librosa for audio analysis** | Standard, well-documented Python audio-analysis library for extracting pace (WPM via timing), pause/silence detection, and volume/energy features — pairs naturally with Faster-Whisper's timestamped output. |
| **MediaPipe (Face Mesh + Pose)** | Google's pretrained, on-device-capable models for eye/gaze approximation and posture landmarks — no training required, runs fast enough for near-real-time frame sampling, and is free. This is what makes the body-language dimension buildable without a computer-vision research effort. |

### 1.4 Data & Storage

| Choice | Reasoning |
|---|---|
| **PostgreSQL (Neon/Supabase free tier) for production, SQLite for local dev** | Postgres gives you proper relational integrity (foreign keys, JSON columns for flexible resume-parsed data) at effectively zero cost on Neon/Supabase's free tier. SQLite as the local dev default means new contributors can run the whole backend with zero external setup. |
| **Cloudinary (free tier) for file storage** | Resumes, audio, and video files should never live on the app server's disk — Flask app servers are usually stateless/ephemeral (especially on free-tier hosts), so any local file storage risks silent data loss on redeploy. Cloudinary gives you a CDN-backed store with a generous free tier and direct upload support from the frontend, offloading bandwidth from your own server. |
| **JWT (or Clerk free tier) for auth** | JWT is the simplest path if you want full control and zero external dependency; Clerk is the better choice if you'd rather not hand-roll session/password-reset flows. Recommendation: start with Clerk's free tier — auth bugs are a disproportionately common source of early-stage security issues, and it's not the differentiated part of your product. |

### 1.5 What's Deliberately Not in the Stack (v1)
- **No dedicated message queue (e.g., Celery/Redis)** — with per-question synchronous processing under a ~15-20s target, a queue adds operational overhead you don't need yet. Revisit if/when you need background batch reprocessing or the pipeline gets too slow to run inline.
- **No custom-trained ML models** — every AI component above is pretrained/hosted; this keeps the initial build's timeline and cost predictable. A custom classifier (hire-likelihood prediction) is a clearly-scoped Phase 4 add-on, not a v1 dependency.
- **No microservices split** — the service-layer pattern inside a single Flask app gives you most of the maintainability benefit of microservices (clear boundaries, swappable implementations) without the operational cost of running/deploying multiple services for what is currently a single-team, single-deploy project.

---

## 2. Project File & Folder Structure

```
interviewme/
├── frontend/
│   ├── public/
│   │   └── favicon.ico
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── routes/
│   │   │   ├── Landing.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Onboarding.jsx          # resume upload + role/company selection
│   │   │   ├── ResumeReview.jsx        # confirm/edit parsed resume data
│   │   │   ├── InterviewSession.jsx    # webcam UI + question loop
│   │   │   ├── ReportDashboard.jsx     # radar chart, timelines, breakdown
│   │   │   └── SessionHistory.jsx      # past sessions / progress trend
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   └── PageContainer.jsx
│   │   │   ├── interview/
│   │   │   │   ├── WebcamRecorder.jsx  # MediaRecorder wrapper
│   │   │   │   ├── QuestionCard.jsx
│   │   │   │   └── ProcessingIndicator.jsx
│   │   │   ├── report/
│   │   │   │   ├── RadarChart.jsx
│   │   │   │   ├── EyeContactTimeline.jsx
│   │   │   │   ├── STARBreakdown.jsx
│   │   │   │   └── ImprovedAnswerCard.jsx
│   │   │   └── shared/
│   │   │       ├── Button.jsx
│   │   │       ├── FileUpload.jsx
│   │   │       └── LoadingSpinner.jsx
│   │   ├── hooks/
│   │   │   ├── useWebcamRecorder.js
│   │   │   ├── useAuth.js
│   │   │   └── useSessionPolling.js    # polls processing status per answer
│   │   ├── services/
│   │   │   └── api.js                  # centralized REST client
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   └── styles/
│   │       └── index.css               # Tailwind entry
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   └── .env.example
│
├── backend/
│   ├── app/
│   │   ├── __init__.py                 # app factory, extension init
│   │   ├── config.py                   # env-based config classes
│   │   ├── extensions.py               # db, cors, jwt instances
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── resume.py
│   │   │   ├── session.py
│   │   │   ├── question.py
│   │   │   ├── response.py
│   │   │   ├── follow_up.py
│   │   │   └── report_score.py
│   │   ├── routes/
│   │   │   ├── __init__.py             # blueprint registration
│   │   │   ├── auth_routes.py
│   │   │   ├── resume_routes.py
│   │   │   ├── session_routes.py
│   │   │   ├── response_routes.py
│   │   │   └── report_routes.py
│   │   ├── services/
│   │   │   ├── resume_service.py       # PyMuPDF extraction + LLM structuring
│   │   │   ├── llm_service.py          # question gen, follow-ups, STAR, improvement
│   │   │   ├── speech_service.py       # Faster-Whisper + Librosa
│   │   │   ├── vision_service.py       # MediaPipe eye-contact + posture
│   │   │   └── scoring_service.py      # aggregates signals into final report
│   │   ├── schemas/                    # request/response validation (marshmallow or pydantic)
│   │   │   ├── resume_schema.py
│   │   │   ├── session_schema.py
│   │   │   └── report_schema.py
│   │   ├── utils/
│   │   │   ├── file_storage.py         # Cloudinary upload/delete helpers
│   │   │   ├── error_handlers.py
│   │   │   └── rate_limit_fallback.py  # graceful LLM/API failure handling
│   │   └── prompts/
│   │       ├── question_generation.py
│   │       ├── follow_up_generation.py
│   │       ├── star_evaluation.py
│   │       └── answer_improvement.py
│   ├── migrations/                     # Alembic migration files
│   ├── tests/
│   │   ├── test_resume_service.py
│   │   ├── test_llm_service.py
│   │   ├── test_speech_service.py
│   │   ├── test_vision_service.py
│   │   └── test_scoring_service.py
│   ├── wsgi.py                         # entrypoint for gunicorn/deployment
│   ├── requirements.txt
│   └── .env.example
│
├── docs/
│   ├── product_requirements.md
│   └── technical_architecture.md
│
├── .gitignore
└── README.md
```

**Structure notes:**
- The `services/` folder is the most important architectural boundary in this project — it's what lets you swap Faster-Whisper for a hosted API, or Gemini for another LLM provider, without touching routes or models. Keep route handlers thin; all real logic belongs in services.
- `prompts/` is separated from `llm_service.py` deliberately — prompt engineering will churn constantly during development, and isolating prompt text from calling logic makes diffs (and A/B testing of prompt versions) much easier to review.
- `schemas/` enforces that malformed requests (e.g., a resume upload missing a required field) fail fast with a clear error, rather than causing a confusing failure three layers deep in `resume_service.py`.

---

## 3. Database Schema

All tables use an auto-incrementing integer or UUID primary key (`id`). Timestamps (`created_at`, `updated_at`) are omitted from the table below for brevity but should exist on every table.

### 3.1 `users`
Stores account/login information.

| Field | Type | Notes |
|---|---|---|
| id | PK | |
| email | string, unique | |
| password_hash | string | null if using Clerk/OAuth instead of local auth |
| full_name | string | |
| created_at | timestamp | |

**In plain English:** one row per registered candidate. Everything else in the schema hangs off a `user_id` foreign key back to this table.

### 3.2 `resumes`
Stores the uploaded resume file reference and its parsed structured data.

| Field | Type | Notes |
|---|---|---|
| id | PK | |
| user_id | FK → users.id | |
| file_url | string | Cloudinary URL to the original PDF |
| raw_text | text | Extracted plain text (PyMuPDF output) |
| parsed_json | JSON | Structured skills/projects/experience (LLM output) |
| target_role | string | e.g., "Backend Developer" |
| target_domain | string | e.g., "Web Development" |
| company_style | string | e.g., "FAANG", "Startup", "Service-based" |
| created_at | timestamp | |

**In plain English:** one row per resume upload. A user could in theory upload multiple resumes/target different roles over time, so this is one-to-many from `users`, not one-to-one. `parsed_json` is what the question-generation step actually reads from — it's the structured version of "what's on this candidate's resume."

### 3.3 `sessions`
Stores one mock interview session.

| Field | Type | Notes |
|---|---|---|
| id | PK | |
| user_id | FK → users.id | |
| resume_id | FK → resumes.id | Which resume/role config this session used |
| interviewer_personality | string | nullable in MVP (single default persona) |
| status | enum | `in_progress`, `completed`, `abandoned` |
| started_at | timestamp | |
| completed_at | timestamp | nullable until finished |

**In plain English:** one row per "attempt" at a mock interview. A single user will have many sessions over time — this is the table the progress-trend feature reads from. `status` matters for handling interrupted sessions (e.g., browser closed mid-interview) gracefully rather than leaving orphaned data with no clear state.

### 3.4 `questions`
Stores each question asked within a session.

| Field | Type | Notes |
|---|---|---|
| id | PK | |
| session_id | FK → sessions.id | |
| question_text | text | |
| question_type | enum | `resume_specific`, `role_standard`, `behavioral` |
| order_index | integer | Position within the session |
| is_follow_up | boolean | True if generated as a follow-up rather than part of the initial set |
| parent_question_id | FK → questions.id, nullable | Links a follow-up back to the question it followed up on |

**In plain English:** one row per question actually asked, including follow-ups. The self-referencing `parent_question_id` is what lets the report reconstruct "this follow-up was asked because of that earlier answer" — important for showing a coherent conversational thread in the report rather than a flat list.

### 3.5 `responses`
Stores the candidate's recorded answer to a question, plus all derived signals.

| Field | Type | Notes |
|---|---|---|
| id | PK | |
| question_id | FK → questions.id | |
| audio_url | string | Cloudinary URL |
| video_url | string | Cloudinary URL |
| transcript | text | Faster-Whisper output |
| content_score | float | LLM-scored relevance/correctness/depth |
| star_breakdown | JSON | nullable; `{situation: bool, task: bool, action: bool, result: bool, feedback: string}` for behavioral questions |
| wpm | float | Words per minute |
| filler_word_count | integer | |
| pause_ratio | float | Proportion of silence/pause time |
| eye_contact_score | float | Aggregate score (MVP); timeline data stored separately (see 3.6) |
| posture_stability_score | float | |

**In plain English:** this is the busiest table — one row per answer, and it's where every analysis pipeline (LLM, speech, vision) writes its output. Nullable fields (like `star_breakdown`) exist because not every question type produces every signal (a technical question has no STAR breakdown; a question answered with camera off has no vision scores).

### 3.6 `eye_contact_timelines`
Stores the frame-by-frame eye-contact data for a response (kept separate from `responses` because it's a variable-length time series, not a single scalar).

| Field | Type | Notes |
|---|---|---|
| id | PK | |
| response_id | FK → responses.id | |
| timestamp_seconds | float | Offset into the answer |
| eye_contact_value | float | 0-1 confidence/estimate at that timestamp |

**In plain English:** one row per sampled frame, not per answer — this is what powers the timeline graph on the report dashboard rather than a single number. This table is a Phase 2/nice-to-have addition; in MVP, `responses.eye_contact_score` alone is sufficient and this table can be deferred.

### 3.7 `follow_ups`
Optional dedicated table if you want follow-up generation metadata separate from the `questions` table itself (alternative to the `is_follow_up`/`parent_question_id` fields above — pick one approach, not both, to avoid duplicating the same relationship two ways).

| Field | Type | Notes |
|---|---|---|
| id | PK | |
| original_question_id | FK → questions.id | |
| follow_up_question_id | FK → questions.id | |
| reason | text | LLM's stated reason for the follow-up (e.g., "probing a gap in the answer") |

**In plain English:** if you want to store *why* the AI decided to ask a follow-up (useful for debugging prompt quality, and a nice transparency feature for the user — "here's why we asked this"), it lives here. **Recommendation:** use the `parent_question_id` approach in `questions` for MVP; only add this table if you specifically need the `reason` field surfaced somewhere.

### 3.8 `report_scores`
Stores the final aggregated report for a completed session.

| Field | Type | Notes |
|---|---|---|
| id | PK | |
| session_id | FK → sessions.id, unique | One report per session |
| overall_score | float | |
| content_score | float | Aggregated across all responses |
| communication_score | float | Aggregated across all responses |
| body_language_score | float | Aggregated across all responses |
| improved_answer_response_id | FK → responses.id, nullable | Which response the improved-answer suggestion is for |
| improved_answer_text | text | nullable |
| weak_topics | JSON | array of strings, e.g., `["DBMS transactions", "System Design basics"]` |
| created_at | timestamp | |

**In plain English:** one row per finished session — the thing the report dashboard actually renders. It's a one-to-one relationship with `sessions` (a session either has a final report or it doesn't, once completed). This table exists separately from `sessions` rather than adding these columns directly to `sessions` because the aggregation logic (Scoring Service) is a distinct, potentially-recomputed step — keeping it separate means you could re-run scoring against the same raw responses without mutating the session record itself.

### 3.9 Relationships Summary (Plain English)

- A **user** has many **resumes** (they might target different roles over time).
- A **user** has many **sessions** (one per practice attempt).
- A **session** belongs to one **resume** (the role/company config it was run against) and has many **questions**.
- A **question** has one **response** (the candidate's answer) and may have one **follow-up question** linked back to it as its parent.
- A **response** has many **eye-contact timeline** rows (Phase 2) and belongs to exactly one **question**.
- A **session**, once completed, has exactly one **report_scores** row.

```
users ──< resumes
users ──< sessions ──< questions ──> responses ──< eye_contact_timelines
  │                        │
  │                        └──(self-referencing parent_question_id for follow-ups)
  │
  └──< sessions >── report_scores (1:1, once completed)
```

---

## 4. Environment Variables & Configuration Notes

### 4.1 Backend `.env`

```
# Flask
FLASK_ENV=development                # development | production
SECRET_KEY=                          # Flask session/signing secret — generate a strong random value
FRONTEND_ORIGIN=http://localhost:5173 # for Flask-CORS allowlist

# Database
DATABASE_URL=                        # postgresql://... in prod, sqlite:///dev.db locally

# Auth
JWT_SECRET_KEY=                      # if using local JWT auth
CLERK_SECRET_KEY=                    # if using Clerk instead
CLERK_PUBLISHABLE_KEY=

# LLM
GEMINI_API_KEY=
OPENROUTER_API_KEY=                  # fallback provider
LLM_PROVIDER=gemini                  # gemini | openrouter — lets you switch without code changes

# File Storage
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Speech/Vision (usually no keys needed — run locally — but flag resource limits)
WHISPER_MODEL_SIZE=small             # tiny/base/small/medium — trade off speed vs accuracy
MAX_UPLOAD_DURATION_SECONDS=180      # cap per-answer recording length

# Rate limit / fallback behavior
LLM_MAX_RETRIES=2
LLM_TIMEOUT_SECONDS=15
```

### 4.2 Frontend `.env`

```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_CLERK_PUBLISHABLE_KEY=          # if using Clerk on the frontend too
VITE_MAX_RECORDING_SECONDS=180       # should match backend MAX_UPLOAD_DURATION_SECONDS
```

### 4.3 Configuration Notes to Be Aware Of Before Building

- **Never commit real values** — commit only `.env.example` files with placeholder values; add `.env` to `.gitignore` immediately, before the first real key is ever generated.
- **`LLM_PROVIDER` as a config switch, not a hardcoded import**: since you're relying on free-tier LLM access, build `llm_service.py` to read this env var and route to the right client. This is the difference between "one line of code" and "an afternoon of refactoring" the first time Gemini rate-limits you mid-demo.
- **`WHISPER_MODEL_SIZE` is a real latency/accuracy trade-off, not a cosmetic setting**: `small` is a reasonable default for the ~15-20s target; `medium`/`large` will likely blow past that budget on free-tier compute. Benchmark this early rather than assuming.
- **CORS must be explicitly scoped** to `FRONTEND_ORIGIN` — don't leave Flask-CORS wide open (`*`) even in development, since you're handling resume/video uploads; get in the habit of correct config now rather than retrofitting security later.
- **File size limits**: set explicit max upload sizes for resume PDFs and recorded video/audio at both the frontend (before upload) and backend (reject oversized payloads) — Cloudinary's free tier has bandwidth/storage caps that are easy to blow through with a handful of untrimmed video uploads.
- **Secrets rotation reminder**: because this project is likely to pass through multiple hands (teammates, evaluators, demo environments), treat `SECRET_KEY` and `JWT_SECRET_KEY` as things to rotate before any public/demo deployment, not just at initial setup.
- **Database URL switching**: keep `DATABASE_URL` as the single source of truth read by `config.py`, so moving from SQLite (dev) to Postgres (prod/Neon/Supabase) is a one-line env change, not a code change. Run an Alembic migration check against Postgres before your first real deploy — SQLite is lenient about type constraints in ways Postgres is not, and schema issues (e.g., JSON column handling) can surface only at that point.
- **Graceful LLM failure is a config-driven behavior, not an afterthought**: `LLM_MAX_RETRIES` and `LLM_TIMEOUT_SECONDS` should back real fallback logic (e.g., "if the LLM call fails after retries, mark this response's content_score as null and flag it in the report" rather than crashing the whole session) — build this from day one given the explicit free-tier rate-limit risk called out in the product doc.

---

## 5. Open Architectural Questions for Later

- At what point does the synchronous per-question pipeline (transcribe → score → follow-up decide) need to move to an async/background job model — likely once you add real users hitting it concurrently, not before.
- Should `eye_contact_timelines` be stored as one row per sampled frame (current recommendation) or as a single JSON array column on `responses` — worth revisiting once you know real query patterns for the report dashboard (are you ever querying across timelines, or only ever rendering one response's timeline at a time?).
- Whether to formalize the `follow_ups` table (Section 3.7) now or defer it — recommend deferring until you actually need to surface "why was this follow-up asked" in the UI.
