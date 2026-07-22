# Product Requirements Document: InterviewMe

**Document Owner:** Product
**Status:** Draft v1.0
**Last Updated:** July 18, 2026

---

## 1. Overview

### 1.1 What the App Does
InterviewMe is a web platform that runs a full, end-to-end mock interview for a candidate — personalized to their resume, target role, and target company style — and evaluates their performance the way a real interview panel would: on the content of their answers, how they communicate, and how they present themselves on camera.

The candidate uploads a resume, picks a target role and interviewer style, then goes through a live, conversational interview conducted by AI. Each answer is recorded, transcribed, and scored across three dimensions — content, speech delivery, and body language — with adaptive follow-up questions generated in real time based on what the candidate actually said. At the end, the candidate receives a single report with scores, an improved version of their weakest answer, and a short list of topics to revise.

### 1.2 Who It's For
**Primary user:** Final-year engineering students preparing for campus placements or off-campus interviews, who have a resume ready but limited or no access to realistic mock-interview practice.

**Secondary users (not primary focus for v1, but plausible near-term expansion):** early-career job seekers doing technical or behavioral interview prep more broadly.

**Persona snapshot — "Aditi, final-year CS student":**
- Has a resume with 2-3 projects and one internship
- Has done LeetCode practice but never a live mock interview
- Anxious specifically about follow-up questions and about "freezing" on camera
- Wants to know concretely what to fix, not just a pass/fail score

### 1.3 The Problem It Solves
Existing placement-prep tools fall into two camps, and neither addresses the actual failure mode students report:

- **Static Q&A banks / DSA judges** (LeetCode, GfG, InterviewBit) test whether the candidate *knows* the material, but never observe or evaluate *how* they'd perform it live, under interview conditions, in front of a person.
- **Generic AI chatbots** can talk through interview questions, but ask the same questions to everyone regardless of what's on the candidate's resume, don't adapt based on the candidate's actual answers, and give zero feedback on delivery — pace, filler words, eye contact, posture — all of which a real interviewer is silently scoring.

The result: students prepare *what* to say but never practice *how* they come across saying it, and no tool prepares them for the resume-specific drill-down that every real interviewer does ("walk me through this project," "why did you choose X").

**Core problem statement:** there is no accessible tool that simulates a real interview end-to-end — personalized to the candidate's resume, conversationally adaptive to their actual answers, and evaluated across content, communication, and body language simultaneously.

---

## 2. Goals and Non-Goals

### 2.1 Goals
- **G1:** Close the gap between "knows the answer" and "performs well live" by forcing practice under interview-like conditions (webcam, live follow-ups, time pressure).
- **G2:** Personalize every session to the candidate's actual resume and target role — no generic question banks.
- **G3:** Deliver multimodal feedback (content + speech + body language) in one coherent, evaluator-readable report.
- **G4:** Keep the system cheap to run and fast to demo — buildable on free-tier infra, no dependency on training custom models for the core experience.

### 2.2 Non-Goals (v1)
- Not a DSA/coding practice platform. No code judge, no problem streaks, no leaderboards.
- Not a multi-week structured course or roadmap product.
- Not a replacement for human mock interviews — positioned as a practice supplement, not a certified assessment.
- Not a general-purpose career coaching or resume-writing tool.

---

## 3. Core Features: Must-Have vs Nice-to-Have

Features are grouped by what they do for the user, then classified. "Must-have" = required for the product to deliver on its core problem statement and be demoable end-to-end. "Nice-to-have" = strengthens the product but the core loop survives without it in v1.

### 3.1 Onboarding & Personalization

| Feature | Classification | Why |
|---|---|---|
| Resume upload (PDF) + parsing into skills/projects/experience | **Must-have** | Personalization is the product's central differentiator; without it, InterviewMe is just another chatbot. |
| Target role + domain selection | **Must-have** | Needed to scope question generation to something relevant. |
| Target company style selection (e.g., "FAANG," "startup," "service-based") | **Must-have** | Core to the uniqueness claim; changes question tone/difficulty. |
| Interviewer personality mode (e.g., friendly, strict, rapid-fire) | **Nice-to-have** | Adds realism and replay value but the interview functions without it — a single neutral default persona is enough for MVP. |

### 3.2 Interview Session

| Feature | Classification | Why |
|---|---|---|
| Resume-personalized question generation | **Must-have** | This is the core value proposition — questions must reference the candidate's actual projects/skills. |
| Webcam + mic recording per answer | **Must-have** | Required input for both speech and body-language analysis; no recording, no multimodal evaluation. |
| Live adaptive follow-up questions | **Must-have** | This is the single biggest differentiator vs. static Q&A tools and generic chatbots — it's what makes the interview feel real rather than scripted. |
| STAR-method evaluation for behavioral questions | **Nice-to-have** | Valuable and well-scoped, but content scoring can ship without a dedicated STAR breakdown in the very first release; STAR adds precision, not the core loop. |
| Domain-specific question tuning (e.g., web dev vs ML vs core CS) | **Nice-to-have** | Improves relevance but role + resume personalization already gets most of the value. |

### 3.3 Evaluation & Feedback

| Feature | Classification | Why |
|---|---|---|
| Content scoring (relevance, correctness, depth) | **Must-have** | One of the three evaluation dimensions promised in the core value prop. |
| Speech analysis (WPM, filler words, pause ratio) | **Must-have** | Second of the three dimensions; this is what generic chatbots categorically cannot do. |
| Body-language analysis (eye contact, posture) | **Must-have** | Third dimension; without it the product collapses into "AI interview chatbot with a transcript scorer," losing its core uniqueness claim. |
| Eye-contact **timeline** (not just a final score) | **Nice-to-have** | A meaningfully better version of the must-have eye-contact metric, but a single aggregate eye-contact score is an acceptable MVP substitute. |
| Final report: per-dimension scores + overall score | **Must-have** | The deliverable the entire session builds toward. |
| Improved-answer suggestion (rewritten version of weakest answer) | **Nice-to-have** | High perceived value, but the product still "works" as an evaluator without generating rewritten answers. |
| Weak-topic pointers (3-5 topics to revise) | **Nice-to-have** | Useful summary but derivable manually by the student from the per-question scores; not load-bearing for MVP. |
| Model-answer generator (beginner/strong/expert tiers) | **Nice-to-have** | Polish feature, clearly scoped as Phase 3 in the source material. |

### 3.4 Progress & History

| Feature | Classification | Why |
|---|---|---|
| Session history storage | **Must-have** | Needed minimally so a user's data and reports persist across a login session — without this, feedback is unusable after the tab closes. |
| Progress trend line across multiple sessions | **Nice-to-have** | Valuable for retention but requires multiple completed sessions to have any value at all — irrelevant for a first-time user's first session. |

### 3.5 Explicitly Excluded from v1 (see Section 6)
- Standalone DSA/coding practice hub
- Full week-by-week roadmap/course planner
- Custom-trained ML model for hire-likelihood prediction (optional future add-on only)

---

## 4. User Flow (Start to Finish)

```
1. LANDING → SIGN UP / LOG IN
      │
2. ONBOARDING
      • Upload resume (PDF)
      • Select target role + domain
      • Select target company style
      │
3. RESUME PARSING (system, ~few seconds)
      • Text extracted from PDF
      • LLM identifies skills, projects, experience
      • Candidate sees a quick confirmation/edit screen
        ("Here's what we found — correct anything wrong")
      │
4. PRE-INTERVIEW SUMMARY
      • Candidate sees: role, company style, estimated
        number of questions, camera/mic permission prompt
      • Candidate clicks "Start Interview"
      │
5. INTERVIEW LOOP (repeats per question)
      ┌─────────────────────────────────────────┐
      │ a. Question displayed/spoken by system    │
      │ b. Webcam + mic recording starts           │
      │ c. Candidate answers; recording stops      │
      │    (manually or after silence timeout)     │
      │ d. Short processing indicator shown        │
      │    (transcription + scoring running)       │
      │ e. System decides: ask a follow-up on this │
      │    answer, or move to the next question    │
      └─────────────────────────────────────────┘
      • Loop continues until question set is exhausted
      │
6. INTERVIEW END SCREEN
      • "Interview complete" confirmation
      • Short wait while final report is generated
      │
7. REPORT DASHBOARD
      • Overall score
      • Per-dimension breakdown (content / speech / body language)
      • Improved-answer suggestion for weakest response
      • Weak-topic pointers
      • Option to view individual question-by-question detail
      │
8. POST-REPORT ACTIONS
      • Start a new session
      • (If returning user) View past sessions / progress trend
      • Delete session data
```

**Key flow decisions:**
- The candidate should be able to correct the auto-parsed resume data before questions are generated — bad extraction shouldn't silently produce irrelevant questions.
- If webcam/vision analysis fails or is denied, the flow must continue with content + speech scoring only, and the report should say so plainly rather than showing a broken or missing body-language score.
- The candidate should never be blocked from finishing a session because of a single failed analysis step (e.g., a transcription error on one question) — a degraded but complete report beats a stalled session.

---

## 5. MVP Definition

The MVP is the smallest version of InterviewMe that can run one full, real, personalized, multimodal interview end-to-end and produce a report a student would actually find useful — nothing more.

### 5.1 MVP Includes
- Account creation and login
- Resume upload (PDF) and parsing into skills/projects/experience, with a manual correction step
- Target role + domain + company-style selection (single default interviewer personality — no persona switching yet)
- Resume-personalized question generation (mix of resume-specific + role-standard questions)
- Webcam + mic recording per question
- Live adaptive follow-up questions (this is non-negotiable — it's the core differentiator)
- Content scoring (relevance, correctness, depth) — STAR-specific breakdown can wait
- Speech analysis: WPM, filler word count, pause ratio
- Body-language analysis: a single aggregate eye-contact score and posture stability score (timeline view deferred)
- Final report: overall score + per-dimension scores, viewable once per session
- Graceful degradation if camera/mic access fails partway through
- Basic session storage so a candidate can revisit their most recent report

### 5.2 MVP Explicitly Excludes
- Interviewer personality modes beyond one default
- STAR-method flagged breakdown
- Eye-contact timeline (aggregate score only)
- Improved-answer rewriting
- Weak-topic pointers
- Model-answer generator tiers
- Progress trend line across sessions
- Any ML add-on

### 5.3 MVP Success Condition
A first-time user can go from resume upload to a completed, personalized, multimodal interview report in one sitting, with no manual intervention required, and the questions asked are demonstrably different from what a generic chatbot or static question bank would produce for the same resume.

---

## 6. What We Are Deliberately NOT Building in Version 1

- **A DSA/coding practice platform.** No code judge, no problem sets, no streaks or leaderboards. Students have LeetCode/GfG/InterviewBit for this already; duplicating it dilutes the product's identity.
- **A full week-by-week roadmap or course product.** InterviewMe is a practice-and-evaluate tool, not a placement curriculum.
- **A certified or clinically precise assessment tool.** Speech and vision analysis are framed explicitly as coaching aids ("good enough for feedback"), not as a certified or legally defensible evaluation of a candidate's employability.
- **A replacement for human mock interviews.** Positioned as a supplement a student uses before a real mock interview or real interview, not a substitute for either.
- **Custom-trained ML models.** All AI components in v1 call pretrained/hosted models. A custom classifier for hire-likelihood prediction is an optional, clearly-labeled future add-on that depends on having enough self-collected session data — not a v1 commitment.
- **Multi-user / recruiter-facing features.** No feature in v1 assumes a second type of user (e.g., a college placement cell or a recruiter) viewing candidate reports. This is a single-user, self-practice tool only.
- **Interviewer personality and domain-mode variety at launch.** These are real, valuable differentiators (see Section 3), but they are explicitly sequenced *after* the MVP core loop is working, not bundled into v1.

---

## 7. Success Metrics

Because this is an early-stage / evaluator-facing build rather than a live product with an existing user base, success is measured differently at each stage:

### 7.1 Functional Success (v1 / MVP)
- A candidate can complete the full flow — resume upload → personalized interview → multimodal report — without the session stalling or requiring a workaround.
- Questions generated are verifiably tied to the candidate's actual resume content (spot-checkable: does the question reference a real project/skill from the uploaded resume?).
- The report is clear and readable without explanation — a first-time viewer should understand their score breakdown without a walkthrough.

### 7.2 Product Quality Metrics (post-MVP, once there are real users)
- **Session completion rate:** % of started interviews that reach a finished report (proxy for whether the flow is too long, too buggy, or too frustrating).
- **Follow-up relevance:** qualitative/manual spot-check rate of whether generated follow-up questions actually relate to the candidate's prior answer (this is the feature most likely to feel "broken" if the LLM prompting is weak).
- **Report usefulness (self-reported):** simple in-app rating ("Was this report useful?") after each session.
- **Repeat usage:** % of users who start a second session (signals the report was valuable enough to come back for more practice).
- **Time-to-report:** wall-clock time from "interview ends" to "report shown" — this is a real user-experience risk given reliance on free-tier APIs, and should be tracked explicitly.

### 7.3 Differentiation Metric
- Demonstrable and describable difference from existing tools: no direct competitor currently combines resume personalization, adaptive follow-up questioning, and tri-modal (content/speech/body-language) scoring in a single flow. This claim should remain true and checkable as the market moves — worth periodically re-verifying against new entrants.

---

## 8. Non-Functional Requirements

- **Latency:** per-question analysis pipeline (transcription + scoring + follow-up generation) should complete in well under 20 seconds on free-tier APIs; anything longer materially hurts the "feels like a real interview" experience.
- **Graceful degradation:** if webcam/vision analysis is unavailable or fails, the system must still produce a report using content + speech signals only, and must say so in the report rather than silently omitting the body-language section.
- **Data handling:** resumes, audio, and video are treated as sensitive candidate data — stored securely, and deletable by the user on request.
- **Cost constraints:** built primarily on free-tier LLM, storage, and database services in v1; must include basic error handling and user-facing fallback messaging for rate-limit failures rather than opaque errors.

---

## 9. Assumptions & Constraints

- Vision and speech analysis accuracy is "good enough to coach on," not clinically or legally precise — this should be communicated to users, not just held internally.
- Free-tier LLM and infrastructure dependencies mean the system will occasionally hit rate limits; this must be handled with visible, honest error states rather than silent failures or hangs.
- Any future ML add-on (e.g., a hire-likelihood classifier trained on collected session data) depends on having sufficient self-collected data and should be framed as a demonstration of applied ML, not a production-grade predictive system.

---

## 10. Open Questions for Future Iteration

- What's the right default number of questions per session — fixed count, or does it flex based on resume/role complexity?
- Should interviewer personality/company-style modes be unlocked progressively (e.g., after first session) rather than all exposed at once, to avoid overwhelming a first-time user during onboarding?
- At what point (if any) does session history need multi-device sync, versus being acceptable as single-session/local for early versions?
- How should the product handle a candidate who wants to redo a single question mid-interview rather than the whole session?
