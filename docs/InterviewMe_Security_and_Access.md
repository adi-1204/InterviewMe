# Security and Access Document: InterviewMe

**Document Owner:** Security
**Status:** Draft v1.0
**Last Updated:** July 18, 2026
**Audience note:** This document is written so a non-technical founder can read it end-to-end and understand exactly what's being protected, from whom, and why. Technical terms are explained the first time they appear.

---

## 1. Authentication Method

### 1.1 What "authentication" means here
Authentication is just the system's way of answering: "who is this person, and can they prove it?" Every time someone logs in, the system checks their proof (usually a password, or a login through a trusted provider) before letting them see anything.

### 1.2 Recommended approach: use a managed auth provider (Clerk), not a homemade login system
For InterviewMe, I recommend using a third-party authentication service — specifically **Clerk** (which has a free tier suitable for an early-stage product) — rather than building your own login system from scratch.

**Why this fits InterviewMe specifically:**
- InterviewMe handles genuinely sensitive personal data: resumes (which contain names, contact info, education, work history) and recorded video/audio of the candidate's face and voice. This is a higher sensitivity bar than a typical to-do app, so getting login security wrong is more costly here than it would be elsewhere.
- Password handling — storing them safely, resetting them securely, detecting compromised passwords — is a well-known source of security mistakes in early-stage products. A managed provider has already solved this problem and keeps solving it (they patch new attack techniques faster than a small team can).
- It's not where InterviewMe's differentiation lives. Your time is best spent on the interview/scoring engine, not rebuilding login infrastructure.

**What this looks like in practice:**
- Users sign up with email + password, or optionally a "Sign in with Google" button (recommended — most students already have a Google account, and it removes a password to manage entirely).
- The auth provider issues a secure token after login, which the app checks on every request to confirm the person is who they say they are.
- Session length: recommend requiring re-login after **14 days of inactivity**, and immediate logout on password change — this balances convenience (students won't log in daily) against risk (recorded interview data shouldn't stay accessible on a lost/shared device indefinitely).

### 1.3 What NOT to do
- Do not store passwords yourself, even temporarily, even during testing. If you ever see a raw password in your own database or logs, something is wrong and needs fixing before launch.
- Do not skip email verification. An unverified email means anyone could sign up with someone else's email address and receive that person's sensitive interview reports by mistake (e.g., a typo'd email during signup).

---

## 2. User Roles: What Each Role Can and Cannot Do

InterviewMe in v1 is a single-user, self-practice product — there is no recruiter, admin dashboard, or placement-cell viewer built into the product itself. That said, "roles" still matter because a few different types of access exist even in a single-user product: the everyday user, and the people who run the system behind the scenes.

### 2.1 Role: Candidate (the everyday user)
This is the only role a person signs up for.

**Can do:**
- Create an account, log in, log out.
- Upload their own resume, and edit/re-upload it.
- Start a new interview session, using their own uploaded resume.
- View their own interview reports, past sessions, and progress trends.
- Delete their own account, resume, and session data.
- Update their own account details (email, password).

**Cannot do:**
- View, edit, or delete another candidate's resume, session, recordings, or report — under any circumstance, including by guessing a link or ID.
- See any other user's data in any list, search, or dashboard view.
- Access another user's session even if they are somehow in possession of a link to it (e.g., a shared screenshot with a URL visible) — the system must independently verify the session belongs to the logged-in user, not just that a valid-looking ID was provided.

### 2.2 Role: System/Service Account (backend-to-backend only — not a human role)
This isn't a person — it's the identity the backend itself uses when it calls external services (the LLM API, Cloudinary, the transcription service).

**Can do:**
- Read and write data on behalf of a specific candidate's request, but only for the duration of that one request.
- Call external AI/storage services using the app's own credentials (never the candidate's credentials).

**Cannot do:**
- Persist access beyond a single request-response cycle.
- Be exposed to the frontend or to the candidate directly — API keys for the LLM, transcription, and storage services must never appear in any code, response, or error message visible to the browser.

### 2.3 Role: Admin/Developer (you and your team, during build and operation)
**Can do:**
- Access the database directly for debugging, support requests, or data-deletion compliance (e.g., "a user asked us to delete their data").
- View system-level logs and error reports (which should be scrubbed of personal content — see Section 4).

**Cannot do (or should not, even though technically able to):**
- Casually browse candidate videos, resumes, or reports without a specific, logged reason (a support ticket, a bug investigation). Treat "I have database access" and "I should look at this" as two separate permissions, not one — this is a trust norm to set now, before it's a habit to break later.
- Should never need to know a candidate's plaintext password — if your system design ever makes this possible, that's a sign the password handling is broken (see Section 1.3).

### 2.4 Why no "Recruiter" or "Institution" role exists yet
The product's non-goals explicitly exclude multi-user or recruiter-facing features in v1. This is a security-relevant decision too: adding a second viewer role later (e.g., letting a college placement cell see student reports) means designing consent flows (does the candidate control who sees their score?) before that role is ever built — not bolting on visibility after the fact. Flag this now so future scope decisions don't accidentally create a data-sharing feature without a matching consent design.

---

## 3. Row-Level Security Rules

"Row-level security" means: for every single row of data in the database (one resume, one session, one report), the system checks *who owns it* before deciding whether to show it, change it, or delete it — every single time, not just once at login.

Here's the rule for every major table, explained in plain English:

### 3.1 `users` table
- A candidate can only read and edit their own row.
- No candidate can ever query or list other users' rows (no "browse all users" capability should exist in candidate-facing code, ever).

### 3.2 `resumes` table
- A candidate can only see, edit, or delete resumes where `user_id` matches their own logged-in identity.
- Rule to enforce in code, not just assume: every database query for a resume must include "and this resume's `user_id` equals the currently logged-in user's ID" — never just "get resume by ID" alone, since a resume ID could otherwise be guessed or shared.

### 3.3 `sessions` table
- A candidate can only see or resume sessions where `user_id` matches their own identity.
- A session cannot be started using a `resume_id` that doesn't belong to the same candidate — this prevents one account from starting an interview "as if" using someone else's resume.

### 3.4 `questions` table
- Questions are only ever visible in the context of a session that belongs to the requesting candidate. There's no reason a question should ever be fetched independently of its parent session's ownership check.

### 3.5 `responses` table (contains video/audio/transcript — the most sensitive table)
- Same rule: only visible if the parent question's parent session belongs to the requesting candidate.
- This table deserves extra caution because it contains recorded video and audio of a real person's face and voice — the single most sensitive data type in the whole system. Any bug here isn't just "user sees wrong data," it's "user sees someone else's face and voice," which is a materially different severity of incident.

### 3.6 `report_scores` table
- Same ownership rule via the parent session.
- Reports should never be accessible via a guessable or sequential URL (e.g., `/report/104`, `/report/105`) — use non-sequential, hard-to-guess identifiers for anything shareable via URL, and still enforce the ownership check regardless.

### 3.7 File storage (Cloudinary — resumes, audio, video)
- Files should not be stored under public, guessable URLs. Use signed URLs (temporary, expiring links) so that even if a URL is somehow exposed, it stops working after a short window rather than being permanently accessible to anyone who has it.
- Deleting a candidate's account or data must also delete their files from Cloudinary — not just the database rows referencing them. A common early-stage mistake is deleting the "pointer" but leaving the actual sensitive file live in storage.

### 3.8 The one universal rule underneath all of the above
**Every single read, write, or delete operation must independently verify that the data belongs to the person making the request — every time, on every request, with no exceptions for "trusted" internal calls.** This is worth stating as a hard rule your team agrees on before writing the first line of database-access code, because it's much cheaper to build this way from day one than to retrofit it after a data-exposure incident.

---

## 4. Error Handling Guide for Major Failure Points

The guiding principle throughout: **fail honestly and safely, never fail silently, and never expose sensitive internals in an error message shown to the user.**

### 4.1 Resume Upload & Parsing Failures

| What can go wrong | What the user should see | What the system should do internally |
|---|---|---|
| File isn't a valid PDF | "That file doesn't look like a valid PDF — please upload a PDF resume." | Reject before any parsing is attempted; don't waste an LLM call on a broken file. |
| File is a scanned image with no extractable text | "We couldn't read text from this resume — please make sure it's a text-based PDF, not a scanned image." | Detect near-empty extraction result and stop before generating garbage-personalized questions from empty data. |
| File exceeds size limit | "This file is larger than we can accept ([X]MB max) — please upload a smaller version." | Reject at both the frontend (before upload starts) and backend (in case frontend check is bypassed). |
| LLM parsing step fails or times out | "We're having trouble processing your resume right now — please try again in a moment." | Retry a limited number of times (per your configured retry count); if it still fails, don't silently proceed with an empty profile — block progress and show the honest message. |

### 4.2 Interview Session Failures

| What can go wrong | What the user should see | What the system should do internally |
|---|---|---|
| Webcam/mic permission denied | "We can't access your camera or microphone — you can continue with audio-only feedback, or check your browser permissions to enable video." | Continue the session using speech + content scoring only, and clearly mark in the eventual report that body-language scoring wasn't available. Never fail the whole session over this. |
| Recording fails mid-answer (browser crash, connection drop) | "That recording didn't save properly — you can re-record this answer." | Don't silently discard the question; give the candidate a clear retry path rather than forcing them to restart the entire interview. |
| Upload of audio/video to storage fails | "We couldn't save your answer — please check your connection and try again." | Don't advance to the next question until the current answer is confirmed saved — advancing on a failed save silently loses that answer forever. |
| LLM follow-up generation fails or times out | (No visible error — the system should just move to the next scripted question instead.) | This should degrade silently *to the user* but be logged internally, since a missing follow-up isn't a blocking failure — it's a reduced-quality outcome, and interrupting the interview over it would be worse than just continuing. |
| Transcription (Faster-Whisper) fails on one answer | The report should show "Transcript unavailable for this answer" rather than an empty or broken section. | Score what can still be scored (e.g., body language) and flag the content/speech scores for that one answer as unavailable rather than silently giving a 0 or fabricated score. |
| Rate limit hit on LLM API (Gemini/OpenRouter) mid-interview | "Our AI service is briefly overloaded — retrying automatically." (with a visible retry indicator) | Retry per your configured `LLM_MAX_RETRIES`/`LLM_TIMEOUT_SECONDS`; if retries are exhausted, fall back to a pre-written generic question rather than freezing the interview entirely. |

### 4.3 Report Generation Failures

| What can go wrong | What the user should see | What the system should do internally |
|---|---|---|
| Scoring service fails partway through aggregation | "Your report is taking longer than expected — we'll notify you when it's ready" (or a retry option). | Don't show a partially-aggregated, misleading score. Either complete the full aggregation or show nothing yet — never show a "72% overall" that's actually missing a whole dimension's data. |
| One question's data is missing (e.g., that one transcription failure from 4.2) | The specific section for that question shows "data unavailable for this response" — the rest of the report renders normally. | Design the report to render per-question and per-dimension independently, so one missing piece doesn't block the entire report from generating. |

### 4.4 Authentication Failures

| What can go wrong | What the user should see | What the system should do internally |
|---|---|---|
| Wrong password | "Incorrect email or password." (deliberately vague — see note below) | Never say "that email doesn't exist" vs. "wrong password" as two different messages — this lets an attacker discover which emails have accounts. Always use the same generic message for both cases. |
| Too many failed login attempts | "Too many attempts — please try again in [X] minutes." | Temporarily lock the account or add increasing delays after repeated failures, to slow down automated password-guessing attempts. |
| Expired session/token | Silently redirect to login with a "please log in again" message — no scary error language. | Treat this as a routine, expected event (sessions expire by design), not an error to alarm the user over. |

### 4.5 General Rule for All Error Messages Shown to Users
Never include: raw database errors, stack traces, internal file paths, API keys, or technical jargon a student wouldn't understand. Every user-facing error should answer two questions in plain language: *what happened*, and *what can I do about it right now*.

---

## 5. Edge Cases to Handle Before Launch

Grouped by where they're most likely to bite.

### 5.1 Around Resume Upload
- A resume with no clearly extractable skills/projects section (e.g., a very unconventional format) — the system should still generate *some* reasonable role-standard questions rather than failing outright or generating nonsense questions from garbled data.
- A resume containing a photo, table-heavy layout, or multi-column design that confuses text extraction — worth testing against a handful of real, messy student resumes early, not just clean templates.
- A user re-uploading a new resume mid-way through an in-progress session — decide explicitly whether this is allowed (recommend: no, lock the resume to the session once started, to avoid mismatched questions/context).

### 5.2 Around the Interview Session
- A candidate closes the browser tab or loses internet connection mid-interview — the session should be resumable or at minimum cleanly marked "abandoned" rather than left in a permanent, confusing "in progress" state that blocks starting a new session.
- A candidate answers a question in under 2-3 seconds (likely an accidental click, not a real answer) — consider a minimum-duration check before accepting a recording as a real answer, so the report isn't unfairly dragged down by an accidental empty submission.
- A candidate's answer runs extremely long (e.g., a 10-minute ramble) — enforce the `MAX_UPLOAD_DURATION_SECONDS` cap from the configuration, and tell the candidate clearly when they're approaching the limit rather than silently cutting them off.
- Multiple faces visible in the webcam frame (e.g., someone else walks into frame) — vision analysis should handle this without crashing; at minimum, don't let a second face silently corrupt the eye-contact/posture scoring for the actual candidate.
- No face detected at all for a stretch of the recording (candidate steps out of frame) — score what's available and flag the gap, rather than either crashing or averaging in a false "0% eye contact" that isn't really representative.

### 5.3 Around Accounts and Data
- A candidate requests account/data deletion mid-session or before a report finishes generating — decide and document the behavior (recommend: allow the delete request, but let any already-in-progress processing complete or cleanly cancel, rather than leaving orphaned files in storage).
- A candidate signs up twice with slightly different emails (typo) and is confused why their old data doesn't appear — not a security bug, but worth a clear "forgot which email you used?" support path.
- A candidate wants a copy of all their own data (a increasingly common privacy expectation, and required in some jurisdictions) — plan a straightforward "export my data" path even if it's just a downloadable file for now, rather than building this reactively after the first request.

### 5.4 Around External Service Dependencies
- The LLM provider (Gemini/OpenRouter) has a full outage, not just a rate limit — the app should communicate this plainly ("Our AI service is temporarily unavailable — please try again later") rather than hanging indefinitely or showing a generic crash.
- Cloudinary (file storage) free-tier bandwidth/storage cap is reached — decide in advance what happens next (recommend: block new uploads with a clear message, rather than silently failing uploads with no explanation) — this is a real risk given the free-tier-first stack.
- Faster-Whisper or MediaPipe processing takes unusually long on a particular file (e.g., poor audio quality, unusual lighting) — set a hard timeout per analysis step so one slow file doesn't stall the entire session indefinitely for that candidate.

### 5.5 Around Trust and Misuse
- A candidate attempts to reuse another person's resume (e.g., uploading a friend's resume to "practice for them") — not strictly a security bug, but worth deciding whether this matters to your product's integrity, and whether any messaging or friction should exist around it.
- Automated/bot signups (someone scripting account creation to abuse free-tier LLM calls at your expense) — plan for basic bot protection (e.g., a CAPTCHA on signup) before launch, since your LLM costs are the resource most exposed to this kind of abuse.
- A candidate tries to directly hit a backend API endpoint (bypassing the frontend UI entirely) to access another session's data by guessing or incrementing an ID — this is exactly what Section 3's row-level security rules exist to prevent; worth an explicit test pass before launch where someone tries to do exactly this on purpose.

---

## 6. Summary: The Five Things to Get Right Before Launch

1. **Use a managed auth provider** (Clerk) rather than building login yourself — this is the highest-leverage security decision available to you.
2. **Enforce ownership checks on every single database query**, with no exceptions — this is what actually prevents one candidate from ever seeing another's resume, video, or report.
3. **Never expose raw technical errors to users** — every failure needs a plain-language message and a clear next step.
4. **Design every pipeline step to fail gracefully, not silently and not by crashing** — a missing eye-contact score should degrade the report, never break it.
5. **Test the edge cases in Section 5 deliberately, before launch** — most of these won't show up in a clean demo, but will show up in the first week of real student use.
