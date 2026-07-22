# Feature Ticket List: InterviewMe

**Document Owner:** Engineering
**Status:** Draft v1.0
**Last Updated:** July 18, 2026

**How to use this document:** Each ticket is self-contained and written so it can be pasted directly into an AI coding tool (Claude Code, Cursor, etc.) as a build prompt. Tickets are grouped by epic and ordered so that dependencies are generally satisfied by the time you reach a given ticket. Priority labels: **Must-have** (required for launch/MVP), **Should-have** (strengthens the product, not launch-blocking), **Nice-to-have** (defer post-launch).

---

## Epic A: Authentication & Accounts

### TICKET A1 — User Signup & Login
**Priority:** Must-have
**Dependencies:** None (foundational)

**Description:** Implement account creation and login using Clerk as the authentication provider. Support email/password signup and login, and optionally "Sign in with Google." On successful login, the frontend should hold a valid session token and expose the current user to the rest of the app via a shared auth context.

**Build prompt:**
> Set up Clerk authentication in a React (Vite) frontend and a Flask backend. On the frontend, install and configure `@clerk/clerk-react`, wrap the app in `<ClerkProvider>`, and build Sign Up and Login pages using Clerk's prebuilt components. Expose the current user and session token via a custom `useAuth` hook. On the backend, add middleware that verifies the Clerk session token (from the `Authorization` header) on every protected route and rejects requests with an invalid or missing token with a 401 response. Do not implement custom password storage or handling anywhere.

**Acceptance Criteria:**
- A new user can sign up with email/password and is redirected into the app afterward.
- A returning user can log in and reach the same authenticated state.
- Every backend route other than health-check returns 401 if called without a valid token.
- No password or Clerk secret key ever appears in frontend code or browser network responses.

---

### TICKET A2 — Session Persistence & Logout
**Priority:** Must-have
**Dependencies:** A1

**Description:** Ensure a logged-in user stays logged in across page refreshes and browser restarts (within Clerk's session expiry), and can explicitly log out.

**Build prompt:**
> Using the existing Clerk setup, add a logout button in the app's navigation that calls Clerk's `signOut()` and redirects to the login page. Verify that refreshing the page while logged in does not require re-authentication, and that session expiry (14 days of inactivity) correctly redirects an expired session to the login page with a "please log in again" message rather than a raw error.

**Acceptance Criteria:**
- Refreshing any authenticated page keeps the user logged in.
- Clicking "Log out" clears the session and redirects to login.
- An expired session redirects to login with a friendly message, not a crash or blank page.

---

## Epic B: Resume Upload & Parsing

### TICKET B1 — Resume Upload UI
**Priority:** Must-have
**Dependencies:** A1

**Description:** Build the onboarding screen where a candidate uploads a resume PDF and selects target role, domain, and company style. File should upload directly to Cloudinary using a signed upload URL obtained from the backend.

**Build prompt:**
> Build an onboarding page with a drag-and-drop / click-to-browse file upload component that accepts only PDF files under a configurable size limit (e.g., 10MB). On file select, call a backend endpoint `POST /api/uploads/sign` to get a Cloudinary signed upload signature, then upload the file directly to Cloudinary from the browser using that signature. Show upload progress and handle failure states (wrong file type, file too large, upload failure) with clear inline messages. After successful upload, show dropdowns for target role, domain, and company style, and a "Continue" button that becomes enabled once all fields are filled.

**Acceptance Criteria:**
- Only PDF files are accepted; non-PDF files show a clear rejection message before any upload attempt.
- Files over the size limit are rejected client-side with a clear message.
- A successful upload returns a Cloudinary URL that gets passed to the next step.
- Role, domain, and company style selections are required before continuing.

---

### TICKET B2 — Backend Resume Text Extraction
**Priority:** Must-have
**Dependencies:** B1

**Description:** Implement the backend service that takes a resume's Cloudinary URL, downloads it, and extracts raw text using PyMuPDF.

**Build prompt:**
> In the Flask backend, create `resume_service.py` with a function `extract_text_from_pdf(file_url: str) -> str` that downloads the PDF from the given URL and extracts its raw text using PyMuPDF. Handle the case where extraction returns near-empty text (e.g., a scanned image PDF with no real text layer) by raising a specific `ResumeParsingError` that the calling route can catch and turn into a clear user-facing message. Add a corresponding route `POST /api/resumes` that accepts `{file_url, target_role, target_domain, company_style}`, calls this extraction function, and stores a new `resumes` row with the raw text.

**Acceptance Criteria:**
- Given a normal text-based resume PDF, extracted text is non-empty and roughly matches the visible content.
- Given a scanned/image-only PDF, the service raises a clear, catchable error rather than returning garbage or crashing.
- A new `resumes` row is created in the database with `user_id`, `file_url`, `raw_text`, `target_role`, `target_domain`, `company_style` populated.

---

### TICKET B3 — LLM-Based Resume Structuring
**Priority:** Must-have
**Dependencies:** B2

**Description:** Take the raw extracted resume text and use the LLM to produce structured JSON of skills, projects, and experience.

**Build prompt:**
> In `llm_service.py`, implement a function `structure_resume(raw_text: str) -> dict` that sends the resume's raw text to the configured LLM provider (Gemini or OpenRouter, selected via the `LLM_PROVIDER` env var) with a prompt instructing it to return only JSON with keys `skills` (array of strings), `projects` (array of `{name, description, technologies}`), and `experience` (array of `{role, company, description}`). Validate the LLM's response is valid JSON matching this shape before saving; if parsing fails, retry once with a stricter prompt, and if it still fails, raise a catchable error. Store the resulting JSON in the `resumes.parsed_json` column.

**Acceptance Criteria:**
- Given a real, well-formed resume's raw text, the function returns valid JSON matching the specified shape.
- If the LLM returns malformed JSON, the function retries once before failing.
- A parsing failure raises a specific, catchable exception rather than crashing the request or silently saving an empty object.

---

### TICKET B4 — Resume Review & Edit Screen
**Priority:** Must-have
**Dependencies:** B3

**Description:** Build the screen where the candidate reviews the auto-parsed resume data (skills, projects, experience) and can manually correct it before questions are generated.

**Build prompt:**
> Build a "Review your resume" page that fetches the `parsed_json` for the candidate's most recent resume upload and renders it as editable lists: skills as removable/addable chips, projects and experience as editable card entries (each with editable text fields). Include a "Confirm and continue" button that saves any edits back to the backend (`PATCH /api/resumes/{id}`) before proceeding to session setup. If parsing failed upstream (Ticket B3), show an empty state with a manual entry option instead of a broken screen.

**Acceptance Criteria:**
- Parsed skills, projects, and experience render as editable UI elements, not a raw JSON dump.
- Edits made on this screen are saved and reflected in subsequent question generation.
- If no parsed data exists (parsing failure), the user can still proceed by manually entering at least their skills.

---

## Epic C: Interview Session Core Loop

### TICKET C1 — Session Creation & Initial Question Set
**Priority:** Must-have
**Dependencies:** B4

**Description:** When a candidate confirms their resume and clicks "Start Interview," create a new session and generate the initial set of personalized questions.

**Build prompt:**
> Add a `POST /api/sessions` endpoint that accepts a `resume_id`, verifies it belongs to the requesting user, creates a new `sessions` row with `status='in_progress'`, and calls an `llm_service.generate_questions(parsed_resume_json, target_role, target_domain, company_style)` function. This function should prompt the LLM to return a mixed set of 6-8 questions: some referencing specific resume content (e.g., named projects/skills) and some standard for the target role/domain. Store each returned question as a row in the `questions` table linked to the new session, with `question_type` set appropriately, and return the first question to the frontend along with the new `session_id`.

**Acceptance Criteria:**
- Starting a session with a given resume creates a new `sessions` row and a set of `questions` rows tied to it.
- At least 2 of the generated questions directly reference a named project or skill from the candidate's resume (spot-checkable).
- The endpoint rejects attempts to start a session using a `resume_id` that doesn't belong to the requesting user (403).

---

### TICKET C2 — Webcam & Mic Recording Component
**Priority:** Must-have
**Dependencies:** A1

**Description:** Build the reusable recording component used throughout the interview screen — handles camera/mic permission requests, live preview, start/stop recording, and produces an uploadable file blob.

**Build prompt:**
> Build a React component `WebcamRecorder` that requests camera and microphone permission via `navigator.mediaDevices.getUserMedia`, shows a live video preview, and uses the `MediaRecorder` API to record video+audio into a blob on demand (start/stop controlled by props or an exposed ref API). Handle permission denial by exposing an `onPermissionDenied` callback rather than crashing, so the parent component can offer an audio-only or continue-without-video fallback. Auto-stop recording at a configurable max duration (`VITE_MAX_RECORDING_SECONDS`) and expose the resulting blob via an `onRecordingComplete(blob)` callback.

**Acceptance Criteria:**
- Component requests camera/mic permission on mount and shows a live preview once granted.
- Denying permission triggers `onPermissionDenied` without crashing the app.
- Recording automatically stops and returns a blob at the configured max duration.
- Manually stopping recording returns a valid, playable blob.

---

### TICKET C3 — Interview Screen: Question Display & Recording Flow
**Priority:** Must-have
**Dependencies:** C1, C2

**Description:** Build the core interview screen that displays the current question, records the candidate's answer, uploads it, and shows a processing state while waiting for the next question or follow-up.

**Build prompt:**
> Build the `InterviewSession` page. On load, fetch the session's current question. Display the question text prominently, show the `WebcamRecorder` component, and provide a "Start Answer" / "Submit Answer" control. On submit, upload the recorded blob to Cloudinary via a signed URL (reuse the pattern from Ticket B1), then call `POST /api/sessions/{id}/questions/{qid}/response` with the resulting file URL. While waiting for backend processing, show a "Processing your answer..." state and poll `GET /api/responses/{id}/status` every 2 seconds until it returns `complete` or `failed`, then display either the next question (follow-up or scripted) or navigate to the report screen if the session is finished.

**Acceptance Criteria:**
- The current question is fetched and displayed correctly on session load.
- Submitting an answer uploads the recording and transitions to a visible processing state.
- Polling correctly resumes the flow with the next question once processing completes.
- If polling exceeds a reasonable max duration (matching backend timeout config), the user sees a clear "taking longer than expected" message with a retry option, not an infinite spinner.

---

### TICKET C4 — Backend: Answer Processing Pipeline
**Priority:** Must-have
**Dependencies:** C1

**Description:** Implement the backend pipeline that runs when a candidate's answer is submitted: transcription, content scoring, speech analysis, body-language analysis, and follow-up decision.

**Build prompt:**
> Implement `POST /api/sessions/{id}/questions/{qid}/response` to accept a Cloudinary file URL, create a `responses` row with status `pending`, and kick off processing (synchronously is fine for MVP given free-tier scale). The pipeline should: (1) call `speech_service.transcribe(audio_url)` using Faster-Whisper to get a transcript with timestamps, (2) call `llm_service.score_content(transcript, question)` for a content score, (3) call `speech_service.analyze_speech(transcript_with_timestamps)` for WPM/filler-word-count/pause-ratio, (4) call `vision_service.analyze_video(video_url)` for eye-contact and posture scores, (5) call `llm_service.decide_follow_up(transcript, question)` to optionally generate a follow-up question. Each step should be wrapped so a failure in one (e.g., vision analysis) doesn't block the others — store `null` for any signal that failed and continue. Update the `responses` row with all available signals and mark status `complete` (or `failed` only if every signal failed).

**Acceptance Criteria:**
- A submitted answer produces a `responses` row with transcript, content_score, wpm, filler_word_count, pause_ratio, eye_contact_score, and posture_stability_score populated where available.
- If vision analysis fails (e.g., no video available), the response still completes with content and speech scores populated and vision fields null.
- A follow-up question, when generated, is correctly linked to its parent question via `parent_question_id` and appears as the next question in the session.
- The endpoint responds quickly with an initial "processing" acknowledgment rather than blocking the HTTP request for the full pipeline duration if latency exceeds a couple seconds (frontend polls for the real result).

---

### TICKET C5 — Response Status Polling Endpoint
**Priority:** Must-have
**Dependencies:** C4

**Description:** Implement the endpoint the frontend polls to check whether a submitted answer has finished processing, and what to show next.

**Build prompt:**
> Implement `GET /api/responses/{id}/status`, verifying the response belongs to a question in a session owned by the requesting user. Return `{status: 'pending'|'complete'|'failed', next_question: {...} | null, session_complete: boolean}`. If `status` is `complete` and a follow-up question was generated, `next_question` should be that follow-up; otherwise it should be the next scripted question, or null with `session_complete: true` if the question set is exhausted.

**Acceptance Criteria:**
- Polling before processing finishes returns `status: 'pending'` with no next question.
- Polling after processing finishes returns `status: 'complete'` and the correct next question (follow-up or scripted).
- Polling after the last question returns `session_complete: true` and no next question.
- Attempting to poll a response belonging to another user's session returns 403/404, not the data.

---

### TICKET C6 — Graceful Degradation for Denied Camera/Mic Access
**Priority:** Must-have
**Dependencies:** C2, C3

**Description:** Ensure a candidate who denies or lacks camera access can still complete an interview using audio (or text) only, with the report clearly reflecting the missing body-language data.

**Build prompt:**
> Update `InterviewSession` so that when `WebcamRecorder`'s `onPermissionDenied` fires, the UI switches to an audio-only recording mode (or, if mic is also denied, a clear message that video/audio is required to proceed) rather than blocking the interview. Ensure the backend pipeline (Ticket C4) already handles missing video gracefully by nulling vision fields — confirm this end-to-end and surface a small "Body language feedback unavailable for this session" notice on the eventual report.

**Acceptance Criteria:**
- Denying camera access allows the interview to continue in audio-only mode.
- The final report clearly indicates body-language scoring was unavailable, rather than showing a broken chart or a fabricated score.
- Denying both camera and mic shows a clear explanation of what's required, rather than a dead-end screen.

---

## Epic D: Follow-Up Questions & STAR Evaluation

### TICKET D1 — Adaptive Follow-Up Question Generation
**Priority:** Must-have
**Dependencies:** C4

**Description:** Implement the LLM logic that decides whether a follow-up question is warranted based on the candidate's answer, and generates it.

**Build prompt:**
> In `llm_service.py`, implement `decide_follow_up(transcript: str, original_question: str) -> dict | None` that prompts the LLM to evaluate whether the answer has a notable gap, vague claim, or interesting detail worth probing, and if so, return `{question_text, reason}`; otherwise return `None`. Ensure the prompt explicitly discourages generating a follow-up for every single answer (to avoid the interview feeling repetitive) — target roughly a follow-up on 40-60% of initial questions, not all of them. Store generated follow-ups as new `questions` rows with `is_follow_up=True` and `parent_question_id` set to the original question's ID.

**Acceptance Criteria:**
- Given an answer with an obvious unexplored detail (e.g., a vague claim like "I improved performance"), a follow-up is generated that specifically probes that detail.
- Given a thorough, complete answer, the function correctly returns `None` at least some of the time (not every answer triggers a follow-up).
- Generated follow-ups are correctly linked to their parent question in the database.

---

### TICKET D2 — STAR Method Evaluation for Behavioral Questions
**Priority:** Should-have
**Dependencies:** C4

**Description:** For behavioral questions specifically, evaluate the candidate's answer against the STAR framework (Situation/Task/Action/Result) and flag each component.

**Build prompt:**
> In `llm_service.py`, implement `evaluate_star(transcript: str, question: str) -> dict` that, only for questions tagged `question_type='behavioral'`, prompts the LLM to assess whether the answer clearly addresses Situation, Task, Action, and Result, returning `{situation: bool, task: bool, action: bool, result: bool, feedback: string}`. Store this in the `responses.star_breakdown` JSON column. Skip this step entirely for non-behavioral questions (leave `star_breakdown` null).

**Acceptance Criteria:**
- Behavioral questions produce a populated `star_breakdown` with all four boolean flags and a short feedback string.
- Non-behavioral (technical) questions leave `star_breakdown` null and are not sent through this evaluation step.
- Given an answer missing a clear "Result," the `result` flag is correctly false and feedback mentions the gap.

---

## Epic E: Speech & Vision Analysis

### TICKET E1 — Speech Transcription
**Priority:** Must-have
**Dependencies:** C4 (defines the pipeline this plugs into)

**Description:** Implement audio transcription using Faster-Whisper.

**Build prompt:**
> In `speech_service.py`, implement `transcribe(audio_url: str) -> dict` that downloads the audio/video file, extracts audio if needed, and runs Faster-Whisper (model size configurable via `WHISPER_MODEL_SIZE` env var) to produce a transcript with word-level or segment-level timestamps. Return `{text: str, segments: [{start, end, text}]}`. Handle corrupt or unreadable audio files by raising a specific catchable error rather than crashing the pipeline.

**Acceptance Criteria:**
- Given a clear spoken-word audio/video file, returns an accurate transcript with timestamped segments.
- Given a corrupt or silent file, raises a specific error the calling pipeline can catch and handle gracefully (per Ticket C4).
- Processing time for a ~2-minute answer stays within the project's latency target using the configured model size.

---

### TICKET E2 — Speech Delivery Analysis (WPM, Filler Words, Pauses)
**Priority:** Must-have
**Dependencies:** E1

**Description:** Compute pace, filler word count, and pause ratio from the transcript and its timestamps.

**Build prompt:**
> In `speech_service.py`, implement `analyze_speech(segments: list) -> dict` that computes: (1) words per minute from total word count and total duration, (2) a count of filler words (um, uh, like, you know, etc. — maintain this as a configurable list) found in the transcript text, (3) a pause ratio — the proportion of total answer duration that falls in silence gaps between segments longer than a defined threshold (e.g., 1 second), using Librosa or the segment timestamps directly. Return `{wpm: float, filler_word_count: int, pause_ratio: float}`.

**Acceptance Criteria:**
- WPM calculation matches manual verification on a sample transcript within reasonable rounding.
- Filler word detection correctly counts common filler words case-insensitively.
- Pause ratio correctly reflects silence gaps longer than the defined threshold, not just total segment gaps.

---

### TICKET E3 — Body Language Analysis (Eye Contact & Posture)
**Priority:** Must-have
**Dependencies:** None (parallel to E1/E2, plugs into C4)

**Description:** Analyze the recorded video using MediaPipe to produce an aggregate eye-contact score and posture stability score.

**Build prompt:**
> In `vision_service.py`, implement `analyze_video(video_url: str) -> dict` that downloads the video, samples frames at a reasonable interval (e.g., every 0.5s), and uses MediaPipe Face Mesh to estimate gaze/eye-contact per sampled frame, and MediaPipe Pose to estimate posture stability (variance in shoulder/head position across frames). Aggregate into a single `eye_contact_score` (0-1) and `posture_stability_score` (0-1) for the MVP (defer frame-by-frame timeline storage — see Ticket E4). Handle frames with no detected face (candidate out of frame) by excluding them from the aggregate rather than scoring them as zero, and handle multiple detected faces by using only the largest/most centered face.

**Acceptance Criteria:**
- Given a video with consistent eye contact, produces a high `eye_contact_score`; given a video where the candidate looks away frequently, produces a noticeably lower score.
- Frames with no detected face are excluded from the aggregate calculation rather than penalizing the score.
- A video with a second person briefly entering frame does not corrupt the primary candidate's score.
- Processing completes within the project's latency target for a typical ~2 minute answer.

---

### TICKET E4 — Eye-Contact Timeline (Frame-Level Detail)
**Priority:** Nice-to-have
**Dependencies:** E3

**Description:** Extend body-language analysis to store frame-level eye-contact data for the timeline visualization, rather than only the aggregate score.

**Build prompt:**
> Extend `vision_service.analyze_video` to additionally return a list of `{timestamp_seconds, eye_contact_value}` per sampled frame. Add a new endpoint or extend the existing response-saving logic to store these as rows in an `eye_contact_timelines` table linked to the `response_id`. Ensure this doesn't slow down the aggregate score calculation used in Ticket E3 — this should be additive, not a blocking dependency for MVP scoring.

**Acceptance Criteria:**
- Frame-level eye-contact data is stored correctly linked to its response.
- The aggregate `eye_contact_score` from Ticket E3 continues to work independently of whether this timeline data is present.
- Retrieving timeline data for a single response returns points in correct chronological order.

---

## Epic F: Scoring & Report Generation

### TICKET F1 — Score Aggregation Service
**Priority:** Must-have
**Dependencies:** C4, D2 (optional), E2, E3

**Description:** Implement the service that aggregates all per-response signals into final per-dimension and overall scores for a completed session.

**Build prompt:**
> In `scoring_service.py`, implement `aggregate_session_scores(session_id: str) -> dict` that fetches all `responses` for the session, computes a `content_score` (average of per-response content scores), a `communication_score` (derived from WPM/filler/pause metrics normalized to a 0-100 scale), and a `body_language_score` (derived from eye-contact and posture scores), then computes an `overall_score` as a weighted combination of the three. Handle missing signals gracefully — if body-language data is entirely absent for a session (camera denied throughout), compute the overall score from content + communication only and flag this explicitly in the returned data rather than treating missing data as zero.

**Acceptance Criteria:**
- Given a session with complete data across all responses, returns correctly computed scores for all three dimensions plus an overall score.
- Given a session with no body-language data at all, returns a valid overall score computed from the remaining two dimensions, with a flag indicating body-language was unavailable.
- Scores are deterministic given the same input data (re-running aggregation on unchanged data produces the same result).

---

### TICKET F2 — Improved-Answer Suggestion
**Priority:** Should-have
**Dependencies:** F1

**Description:** Generate a rewritten, improved version of the candidate's weakest-scoring answer, with an explanation.

**Build prompt:**
> In `llm_service.py`, implement `generate_improved_answer(question: str, transcript: str, content_score: float) -> dict` that prompts the LLM to rewrite the given answer as a stronger response, and briefly explain what changed and why. Identify the weakest-scoring response in a session within `scoring_service.py` and call this function only for that one response. Store the result in `report_scores.improved_answer_text` and `report_scores.improved_answer_response_id`.

**Acceptance Criteria:**
- The weakest-scoring response in a session is correctly identified before this function is called.
- The generated improved answer is a genuinely rewritten version, not a copy of the original transcript.
- The explanation clearly states what was weak about the original and what the rewrite addresses.

---

### TICKET F3 — Weak-Topic Pointers
**Priority:** Should-have
**Dependencies:** F1

**Description:** Generate a short list of 3-5 topics the candidate should revise, based on the full session's content.

**Build prompt:**
> In `llm_service.py`, implement `generate_weak_topics(session_responses: list) -> list[str]` that prompts the LLM with all questions and answers from a session and asks for a short list (3-5 items) of specific topics the candidate should revise, based on gaps or weak content scores. Store the result as `report_scores.weak_topics` (JSON array of strings).

**Acceptance Criteria:**
- Returns between 3 and 5 topic strings, each specific enough to be actionable (e.g., "DBMS transactions," not "study more").
- Topics are derived from actual weak points in the session's answers, not generic placeholder topics.

---

### TICKET F4 — Report Generation Endpoint
**Priority:** Must-have
**Dependencies:** F1, F2 (optional for MVP), F3 (optional for MVP)

**Description:** Implement the endpoint that returns the full report payload once a session is complete.

**Build prompt:**
> Implement `GET /api/sessions/{id}/report`, verifying the session belongs to the requesting user and has `status='completed'`. If a `report_scores` row doesn't yet exist for this session, trigger `scoring_service.aggregate_session_scores` (and, if enabled, the improved-answer and weak-topic generation) to create it, then return the full payload: overall score, per-dimension scores, per-question breakdown (including STAR flags where applicable), improved-answer text if available, and weak topics if available. If any optional signal (improved answer, weak topics, body-language) is missing, return null for that field rather than omitting the key, so the frontend can render a clear "unavailable" state.

**Acceptance Criteria:**
- Requesting a report for a completed session returns a full, correctly structured payload.
- Requesting a report for a session that isn't yet complete returns a clear error, not a partial or broken report.
- Requesting another user's session report returns 403/404.
- Missing optional fields (e.g., no improved answer generated) return explicit null values, not missing keys, so the frontend doesn't need to guess.

---

### TICKET F5 — Report Dashboard UI
**Priority:** Must-have
**Dependencies:** F4

**Description:** Build the frontend report screen showing overall score, per-dimension breakdown, and (where available) STAR breakdown, improved answer, and weak topics.

**Build prompt:**
> Build the `ReportDashboard` page that fetches `GET /api/sessions/{id}/report` and renders: an overall score headline, a radar chart (content/communication/body-language) using Recharts, a per-question expandable list showing transcript excerpts and per-question scores, a STAR breakdown badge set for behavioral questions where available, an "Improved Answer" card if present, and a "Weak Topics to Revise" list if present. Any field returned as null (e.g., body-language unavailable) should render a clear, non-alarming "not available for this session" state rather than a broken chart segment or blank space.

**Acceptance Criteria:**
- A completed session's report renders all available data correctly, matching the design system's color-coding for each dimension.
- A session missing body-language data (camera was denied) shows a clear explanatory note on the relevant chart section instead of a broken or misleading visual.
- The page handles a still-processing report state (if hit before Ticket F4's generation completes) with a loading state rather than an error.

---

## Epic G: Session History & Progress

### TICKET G1 — Session History List
**Priority:** Must-have
**Dependencies:** F4

**Description:** Build the screen showing a candidate's past sessions with quick access to each report.

**Build prompt:**
> Implement `GET /api/sessions` to return the requesting user's own past sessions (id, target role, company style, overall score, completed_at), ordered most-recent first. Build a `SessionHistory` page listing these as clickable cards (per the design system's compact card style) that navigate to the corresponding `ReportDashboard` on click. Show an empty state ("You haven't completed an interview yet — start your first one") if the list is empty.

**Acceptance Criteria:**
- Only the requesting user's own sessions are returned and displayed — verified by testing with two different accounts.
- Clicking a session card navigates to that session's report.
- An empty history state shows a clear call-to-action rather than a blank page.

---

### TICKET G2 — Progress Trend Line
**Priority:** Nice-to-have
**Dependencies:** G1

**Description:** Show a trend line of overall scores across a candidate's past sessions.

**Build prompt:**
> Extend the `SessionHistory` page with a line chart (Recharts) plotting `overall_score` against `completed_at` across all of the user's completed sessions, using the spotlight/teal duo-tone color from the design system. Only render this chart if the user has 2 or more completed sessions; otherwise show a short note ("Complete another session to see your progress trend").

**Acceptance Criteria:**
- With 2+ completed sessions, the trend line renders correctly ordered by date.
- With 0 or 1 completed sessions, the chart is replaced with the explanatory note, not an empty or broken chart.

---

## Epic H: Account & Data Management

### TICKET H1 — Account & Data Deletion
**Priority:** Must-have
**Dependencies:** A1, B1 through G1 (touches most tables)

**Description:** Allow a candidate to delete their account and all associated data, including files stored in Cloudinary.

**Build prompt:**
> Implement `DELETE /api/account` that, for the requesting user only: deletes all their `resumes`, `sessions`, `questions`, `responses`, `eye_contact_timelines`, and `report_scores` rows, deletes all associated files from Cloudinary using stored `public_id`s, deletes the user's Clerk account via Clerk's backend API, and finally removes the local `users` row. Wrap this in a transaction where possible so a partial failure doesn't leave orphaned data in one system but not another; log any partial failure clearly for manual follow-up rather than failing silently. Add a "Delete my account" option in account settings with an explicit, non-backdrop-dismissable confirmation modal per the design system's destructive-action pattern.

**Acceptance Criteria:**
- Deleting an account removes all of that user's rows across every table.
- Files previously stored in Cloudinary for that user are also deleted, not just the database references.
- The confirmation modal requires an explicit button click and cannot be dismissed accidentally via backdrop click or Escape.
- A partial failure (e.g., Cloudinary deletion fails) is logged clearly rather than silently reporting success.

---

## Epic I: Reliability & Error Handling (Cross-Cutting)

### TICKET I1 — LLM Rate-Limit & Timeout Fallback Handling
**Priority:** Must-have
**Dependencies:** C4, D1, F1-F3

**Description:** Implement consistent retry/fallback behavior across all LLM-dependent calls, per the configured retry and timeout settings.

**Build prompt:**
> Create a shared wrapper in `llm_service.py` (e.g., `call_llm_with_fallback(prompt, ...)`) that all LLM-calling functions route through, implementing retry up to `LLM_MAX_RETRIES` with the configured `LLM_TIMEOUT_SECONDS`, and a defined fallback behavior per call site (e.g., question generation falls back to a small set of pre-written generic questions for the role; follow-up generation falls back to `None`/no follow-up; scoring falls back to a null score with a flagged "unavailable" state rather than a fabricated number). Ensure no user-facing error ever surfaces a raw provider error message.

**Acceptance Criteria:**
- Simulating an LLM timeout results in the configured retry attempts before falling back, not an immediate failure.
- Each call site's fallback behavior matches its defined default (generic questions, no follow-up, or null score) rather than crashing the request.
- No raw API error text from the LLM provider ever reaches a frontend-visible error message.

---

### TICKET I2 — Global Frontend Error Boundary & Messaging
**Priority:** Must-have
**Dependencies:** None (can be built in parallel, wraps other tickets)

**Description:** Ensure every user-facing error across the app follows the plain-language, actionable-next-step pattern rather than showing raw technical errors.

**Build prompt:**
> Add a React error boundary at the app root that catches unhandled rendering errors and shows a friendly "Something went wrong — please refresh" screen instead of a blank page or stack trace. Additionally, create a shared `ApiError` handling utility used by all API calls that maps common backend error codes (401, 403, 404, 500, timeout) to consistent, plain-language toast/banner messages as defined in the Security and Access Document's error handling guide, ensuring no raw error text, stack traces, or internal identifiers are ever shown to the user.

**Acceptance Criteria:**
- An unhandled frontend rendering error shows the friendly fallback screen, not a blank page.
- A 401 response anywhere in the app triggers a consistent "please log in again" flow.
- A 403/404 on someone else's data shows a generic "not found" message, not information suggesting the resource exists but is restricted.
- No error message anywhere in the app displays a raw stack trace, database error, or internal file path.

---

## Priority Summary

| Priority | Ticket Count | Tickets |
|---|---|---|
| **Must-have** | 20 | A1, A2, B1, B2, B3, B4, C1, C2, C3, C4, C5, C6, D1, E1, E2, E3, F1, F4, F5, G1, H1, I1, I2 |
| **Should-have** | 3 | D2, F2, F3 |
| **Nice-to-have** | 2 | E4, G2 |

*(Note: count reflects 20 must-have tickets across the list above; verify against your own sprint planning tool as the source of truth if tickets are split or merged during implementation.)*
