# Frontend Specification Document: InterviewMe

**Document Owner:** Design / Frontend Architecture
**Status:** Draft v1.0
**Last Updated:** July 18, 2026

---

## Part 1: Design System

### 1.1 Design Direction — Why This Look

InterviewMe's core emotional job is to make a nervous student feel like they're in a real, focused interview room — not like they're filling out a form. The one moment worth designing around is **the interview itself**: a single question, a single face on camera, a quiet room, a light on you. Everything else in the product (dashboards, history, settings) should feel calmer and more utilitarian by comparison, so that the interview screen itself is where the product's personality lives.

The signature idea: **a "spotlight" motif.** A warm, focused light against a dark, calm surrounding — like the one light in an interview room that's on you when you're answering. This shows up literally (a soft radial highlight around the active question and the candidate's own video feed) and structurally (the interview screen dims everything non-essential — nav, chrome, past questions — so attention narrows to the current moment, the way a real interview does).

This deliberately avoids the generic "AI product" cream-and-terracotta look and the near-black-with-neon-accent look — instead pairing an ink-navy calm surface with a warm brass/amber spotlight accent, which reads as "focused room," not "AI tool."

### 1.2 Color Palette

| Token | Hex | Usage |
|---|---|---|
| `--ink-900` | `#0F1420` | Primary dark background (interview screen, nav) |
| `--ink-700` | `#1B2333` | Elevated dark surfaces (cards on dark bg, modals on dark bg) |
| `--paper-50` | `#F6F4EF` | Primary light background (dashboard, forms, report pages) |
| `--paper-100` | `#EBE8E0` | Secondary light surface (input backgrounds, subtle dividers) |
| `--spotlight-500` | `#E8A94B` | Primary accent — the "light on you" color. CTAs, active states, the live-recording indicator |
| `--spotlight-600` | `#CC8F35` | Spotlight accent hover/pressed state |
| `--signal-teal-500` | `#3E9C8F` | Positive/success — good scores, completed states, "content" dimension in charts |
| `--alert-coral-500` | `#D9634F` | Errors, warnings, "needs work" scores |
| `--ink-500` | `#5B6472` | Secondary text, muted labels, placeholder text |
| `--ink-300` | `#9AA2AF` | Disabled states, hairline borders on light backgrounds |
| `--ink-100` | `#DDE1E6` | Borders and dividers on light surfaces |

**Score-dimension color mapping** (used consistently across charts, badges, and report sections so a user learns the system once):
- **Content** → `--signal-teal-500`
- **Communication** → `--spotlight-500`
- **Body Language** → a fourth, distinct hue: `--focus-violet-500` (`#7B6EA8`) — introduced specifically so the radar chart's three axes are never ambiguous at a glance.

**Why not just accent + neutral:** three evaluation dimensions need three visually distinct, equally-weighted colors (none should look like "the important one" or "the error one") — this is why body language gets its own violet rather than reusing teal or spotlight, which are already claimed by content and communication respectively.

### 1.3 Typography

| Role | Typeface | Notes |
|---|---|---|
| **Display** (page titles, report headline score, the interview question itself) | **Fraunces** (serif, variable weight) | Used at large sizes, low frequency. A warm, slightly editorial serif — gives the "human interviewer" moments (the question prompt, the final score) a sense of gravity rather than looking like dashboard chrome. Used with restraint: only for the question text during an interview, the overall score, and section headlines. |
| **Body / UI** (buttons, labels, forms, nav, most report text) | **Inter** | Neutral, highly legible at small sizes, excellent number rendering — important given how many numeric scores/stats this product displays. This is the workhorse face for 90% of the UI. |
| **Data / Mono** (transcripts, timestamps, WPM/filler-word counts, code-like values) | **IBM Plex Mono** | Used specifically for the transcript view and any raw metric callouts — signals "this is a measured, literal reading," distinct from the more editorial Fraunces used for the question prompt itself. |

**Type scale (base 16px):**

| Token | Size | Weight | Usage |
|---|---|---|---|
| `display-xl` | 48px / Fraunces 500 | Overall report score, landing headline |
| `display-lg` | 32px / Fraunces 500 | Interview question text |
| `heading-lg` | 24px / Inter 600 | Section headers ("Your Report", "Session History") |
| `heading-md` | 18px / Inter 600 | Card titles, modal titles |
| `body-md` | 16px / Inter 400 | Default body text |
| `body-sm` | 14px / Inter 400 | Secondary text, form labels |
| `caption` | 12px / Inter 500, uppercase, letter-spacing 0.04em | Eyebrow labels, chart axis labels |
| `mono-sm` | 14px / IBM Plex Mono 400 | Transcript text, metric readouts |

### 1.4 Spacing & Layout Rules

**Base unit:** 4px. All spacing values are multiples of this — no arbitrary one-off pixel values.

| Token | Value | Usage |
|---|---|---|
| `space-1` | 4px | Icon-to-label gaps |
| `space-2` | 8px | Tight internal padding (badge, chip) |
| `space-3` | 12px | Input internal padding |
| `space-4` | 16px | Default component padding, gap between related elements |
| `space-6` | 24px | Card padding, gap between unrelated elements in a group |
| `space-8` | 32px | Section-to-section gap |
| `space-12` | 48px | Major page-section breaks |
| `space-16` | 64px | Hero/top-of-page breathing room |

**Layout grid:**
- **Desktop:** 12-column grid, max content width 1200px, 24px gutters, centered with auto margins.
- **Tablet (768-1024px):** 8-column grid, 16px gutters.
- **Mobile (<768px):** single column, 16px side margins — no grid needed below this breakpoint given the vertical, one-thing-at-a-time nature of most screens (this matters especially for the interview screen, which is fundamentally single-focus regardless of device).

**Radius scale:**
- `radius-sm` (6px): inputs, chips, small buttons
- `radius-md` (12px): cards, modals
- `radius-full`: avatar images, the live-recording pulse indicator

**Elevation (shadow) scale** — used sparingly, mainly to lift modals and the active question card above the interview screen's dimmed background:
- `shadow-sm`: `0 1px 2px rgba(15,20,32,0.08)` — default card
- `shadow-md`: `0 4px 16px rgba(15,20,32,0.12)` — modal, popover
- `shadow-spotlight`: `0 0 40px rgba(232,169,75,0.25)` — the specific glow used only around the active recording indicator and the current question card during a live interview; this is the one place a colored shadow is allowed, precisely because it's the signature moment

### 1.5 Component Styles

#### Buttons

| Variant | Background | Text | Border | Usage |
|---|---|---|---|---|
| **Primary** | `--spotlight-500` | `--ink-900` | none | Main CTA per screen only ("Start Interview," "Submit Answer," "View Report") — never more than one primary button visible at a time |
| **Secondary** | transparent | `--ink-900` (light bg) / `--paper-50` (dark bg) | 1px `--ink-300` | Supporting actions ("Cancel," "Edit Resume") |
| **Destructive** | transparent | `--alert-coral-500` | 1px `--alert-coral-500` | "Delete Session," "Delete Account" — filled solid coral only appears in the final confirmation step, never on the first click, to avoid one-click destructive actions |
| **Ghost/Text** | transparent | `--ink-500` | none | Tertiary, low-emphasis actions ("Skip," "Learn more") |

**States:** hover = 8% darken (light bg) or 8% lighten (dark bg); pressed = 12%; disabled = 40% opacity + `cursor: not-allowed`; focus = 2px `--spotlight-500` outline offset 2px (never remove focus outlines — keyboard accessibility is a hard requirement, not a nice-to-have, given this product's use by students who may rely on assistive tech).

**Sizing:** default height 44px (comfortable tap target), padding `space-3` vertical / `space-6` horizontal, `radius-sm`, `body-md` weight 600.

#### Inputs

- Height 44px, `radius-sm`, 1px border `--ink-100` (light) default, `--spotlight-500` on focus (2px), `--alert-coral-500` on validation error with an inline error message below in `body-sm` coral text.
- Placeholder text uses `--ink-500`, never the same weight as filled text — must always be visually distinguishable from real input.
- File upload input (resume PDF) is a distinct large drop-zone component, not a standard text input: dashed 1px `--ink-300` border, `radius-md`, centered icon + "Drag your resume here or click to browse" in `body-md`, transitions border to solid `--spotlight-500` on drag-over.

#### Cards

- Default: `--paper-50` background (on light pages) or `--ink-700` (on dark pages/interview screen), `radius-md`, `shadow-sm`, `space-6` internal padding.
- Report dimension cards (Content / Communication / Body Language) each carry a small color-coded left border (4px) matching their dimension color from Section 1.2 — this is the one place a strong color border is used structurally, reinforcing the chart's color mapping.
- Session-history cards: compact variant, `space-4` padding, show date, overall score as a small badge, and role/company targeted — clickable, hover state lifts to `shadow-md`.

#### Modals

- Centered overlay, `--ink-700` scrim at 60% opacity behind, modal itself `radius-md`, `shadow-md`, max-width 480px (confirmation dialogs) or 720px (larger content like the resume-review/edit modal).
- Always include a visible close (×) top-right and support closing via Escape key and backdrop click — except for destructive-confirmation modals, which require an explicit button choice (no backdrop-click dismiss) to avoid accidental cancellation of a delete-confirmation reading as a decision.
- Title uses `heading-md`, body uses `body-md`, action buttons bottom-right (secondary button left of primary, primary rightmost — consistent order throughout the app).

### 1.6 Interaction & Motion Principles

Given the explicit ask for a highly interactive frontend, motion here is not decorative — it's used to do three specific jobs:

1. **Narrowing attention during the interview.** When a question loads, the nav and page chrome fade to ~40% opacity over 300ms while the question card and webcam view scale up slightly (1.0 → 1.02) with the spotlight glow fading in — this is the signature moment described in 1.1, and it should only happen here, not be reused elsewhere as a generic transition.
2. **Confirming that recording is live.** A pulsing `radius-full` dot in `--spotlight-500` (scale 1.0 → 1.15 → 1.0 on a 1.5s loop) sits next to a "Recording" label whenever the mic/camera is active — this is a real trust signal (a student needs to visually confirm they're being recorded, not wonder), so it must be unmistakable, not subtle.
3. **Making the report feel earned, not instant.** The report's radar chart animates its three axes drawing outward from center over ~800ms on load, and the overall score counts up numerically rather than appearing instantly — small moment, but reinforces that a real evaluation happened rather than a number appearing from nowhere.

**Respect reduced motion:** every animation above must have a `prefers-reduced-motion` fallback that shows the end state immediately with no transition — required, not optional, given some users will have vestibular sensitivity to motion, especially in a webcam-heavy interface.

**No animation used:** page-to-page navigation transitions, list item stagger effects, decorative background motion. These are the "scattered effects" this product should specifically avoid — the three moments above are the whole motion budget.

---

## Part 2: Third-Party API & Integration Specification

This section documents every external service the frontend either calls directly or depends on indirectly through the backend, what each is for, and what data flows in each direction.

### 2.1 Overview: Direct vs. Backend-Proxied Calls

**Important architectural rule:** the frontend should never call the LLM provider, Faster-Whisper, or MediaPipe directly — all AI processing happens through your own backend, which holds the actual API keys. The only third-party services the frontend talks to directly are **Clerk** (auth) and **Cloudinary** (direct file upload, to avoid routing large video files through your own server unnecessarily). Everything else is backend-to-backend and the frontend only ever sees your own API's responses.

```
Frontend direct calls  →  Clerk (auth), Cloudinary (upload)
Frontend → your backend →  Gemini/OpenRouter (LLM), Faster-Whisper, MediaPipe (these run
                            server-side, not third-party network calls, but documented here
                            since they're external dependencies either way)
```

### 2.2 Clerk (Authentication)

**What it does:** Handles signup, login, session/token management, and (optionally) "Sign in with Google."

**Where the frontend calls it:**
- On app load, Clerk's React SDK (`@clerk/clerk-react`) checks for an existing valid session and provides the current user object to the whole app via a context provider — no manual endpoint call needed for this, the SDK handles it.
- **Sign up:** `<SignUp />` component (Clerk-hosted UI or embedded) — sends email/password (or OAuth handoff) to Clerk directly. Frontend never touches the password.
- **Sign in:** `<SignIn />` component — same pattern.
- **Get current session token:** `useAuth().getToken()` — returns a JWT the frontend attaches to every request to your own backend.

**Data sent:** email, password (only if using email/password — handled entirely inside Clerk's components, never touches your own code), or OAuth redirect data for Google sign-in.

**Data received:** a session token (JWT) and a user object (`userId`, `email`, `firstName`, etc.).

**What your backend does with it:** every request from the frontend to your backend includes the Clerk session token in the `Authorization` header; your backend verifies this token using Clerk's backend SDK before processing any request — this is the enforcement point for every row-level security rule described in the Security document.

**Failure handling:** if Clerk's service is unreachable, the frontend should show "We're having trouble signing you in — please try again in a moment," not a raw SDK error.

### 2.3 Cloudinary (File Storage — Resumes, Audio, Video)

**What it does:** Stores the uploaded resume PDF and the recorded audio/video files for each interview answer, and serves them back via CDN-backed URLs.

**Where the frontend calls it:**
- **Resume upload:** frontend requests a signed upload signature from your backend first (`POST /api/uploads/sign` — your backend, not Cloudinary directly), then uses that signature to upload the file directly to Cloudinary's upload endpoint (`POST https://api.cloudinary.com/v1_1/{cloud_name}/upload`), bypassing your own server for the actual file bytes.
- **Answer recording upload:** same signed-upload pattern, once per recorded answer, immediately after the candidate finishes answering.

**Data sent to Cloudinary directly:**
- The file itself (PDF, or recorded webm/mp4 audio-video blob from `MediaRecorder`).
- The signature, timestamp, and API key provided by your backend (never your Cloudinary API *secret* — that stays server-side only).

**Data received from Cloudinary:**
- A `secure_url` (the CDN URL to the stored file) and a `public_id` — the frontend then sends this URL back to your backend (`POST /api/resumes` or `POST /api/responses`) to associate it with the correct resume/response record.

**Why signed uploads instead of routing through your backend:** avoids doubling your own server's bandwidth and memory load for potentially large video files, and avoids ever exposing your Cloudinary API secret to the browser (only a short-lived signature is exposed, which is safe by design).

**Failure handling:** if a Cloudinary upload fails (network drop, size limit exceeded), show "We couldn't save your recording — please check your connection and try again," and do not let the interview advance to the next question until upload is confirmed (per the Error Handling Guide's rule against silently losing an answer).

### 2.4 Your Own Backend API (Primary Integration Surface)

Everything else the frontend needs — questions, scores, reports, session state — comes from your own Flask backend, not directly from any third-party AI service. Documenting the key endpoints here since this is the surface the frontend is built against most heavily:

| Endpoint | Method | What frontend sends | What frontend receives |
|---|---|---|---|
| `/api/resumes` | POST | Cloudinary URL of uploaded resume, target role/domain/company | Parsed resume JSON (skills/projects/experience) for the review/edit screen |
| `/api/sessions` | POST | resume_id, selected config | New session_id, first question set |
| `/api/sessions/{id}/questions/{qid}/response` | POST | Cloudinary URL of recorded answer | Immediate ack (202-style "processing") + a `response_id` to poll |
| `/api/responses/{id}/status` | GET (polled) | — | Processing status (`pending`/`complete`/`failed`) + scores once complete, and next question or follow-up if ready |
| `/api/sessions/{id}/report` | GET | — | Full report payload: overall score, per-dimension scores, improved-answer text, weak topics |
| `/api/sessions` | GET | — | List of past sessions for history/progress views |

**Polling pattern note:** because per-question processing (transcription + scoring + follow-up decision) takes several seconds, the frontend should poll `/api/responses/{id}/status` every ~2 seconds (with a reasonable max-attempts cutoff matching your backend's `LLM_TIMEOUT_SECONDS` configuration) rather than expecting an instant synchronous response — this directly drives the "processing" UI state (Section 1.6's animated states) shown between questions.

### 2.5 Environment Variables the Frontend Needs (Cross-Reference)

These were defined in the Technical Architecture Document's config section and are restated here because they directly affect frontend integration behavior:

```
VITE_API_BASE_URL=              # your backend's base URL
VITE_CLERK_PUBLISHABLE_KEY=     # safe to expose in frontend bundle — this is the public key
VITE_CLOUDINARY_CLOUD_NAME=     # needed to construct the direct upload URL
VITE_MAX_RECORDING_SECONDS=180  # must match backend cap, used to auto-stop recording client-side
```

**Note on what must never appear in frontend code or bundles:** Cloudinary API secret, Clerk secret key, Gemini/OpenRouter API keys — none of these have any legitimate reason to exist in frontend code; if any of them show up in a `VITE_`-prefixed variable, that's a bug to fix before shipping, since anything prefixed `VITE_` is publicly readable in the shipped JavaScript bundle.

---

## Part 3: Key Screens Summary (Where Design System Meets Flow)

Quick cross-reference between the design system above and the user flow from the PRD, so the design system's intent is traceable to actual screens:

| Screen | Background | Signature elements used |
|---|---|---|
| Landing / Sign up | `--paper-50` | Fraunces display headline, spotlight-accent primary CTA |
| Onboarding (resume upload) | `--paper-50` | Drop-zone input component, progress stepper |
| Resume review/edit | `--paper-50` | Editable card list of parsed skills/projects |
| **Interview session** | `--ink-900` | Full spotlight motif: dimmed chrome, glowing active question card, pulsing recording indicator |
| Processing (between questions) | `--ink-900` | Subtle loading state, no jarring transition out of the dimmed interview mood |
| Report dashboard | `--paper-50` | Color-coded dimension cards, animated radar chart, mono-styled transcript excerpts |
| Session history | `--paper-50` | Compact cards, progress trend line in spotlight/teal duo-tone |
