# PulihGo — Complete Feature Spec (for the team)

This is the full list of everything PulihGo does (and will do), explained so anyone
on the team can understand it — including *how* each piece actually works.

**How to read the tags:**
- 🟢 **MVP** — build in the 30-hour sprint. This is the gyroscope core.
- 🔵 **Phase 2** — adherence engine (after MVP works).
- 🟣 **Phase 3** — tele-rehab (cloud + therapist dashboard).
- ⚪ **Phase 4** — clinical validation + advanced.

**Owner** = which part of the system the feature lives in:
`mobile` (patient app) · `api` (backend) · `dashboard` (therapist web) · `hardware`.

---

## Features at a glance

| # | Feature | Phase | Owner |
|---|---------|-------|-------|
| 1 | Sensor capture (gyroscope + accelerometer) | 🟢 MVP | mobile |
| 2 | Adjustable strap / phone holder | 🟢 MVP | hardware |
| 3 | Calibration ("zero") step | 🟢 MVP | mobile |
| 4 | Sensor fusion → joint angle | 🟢 MVP | mobile |
| 5 | The one MVP exercise: forearm supination/pronation | 🟢 MVP | mobile |
| 6 | Repetition detection | 🟢 MVP | mobile |
| 7 | Range-of-motion (ROM) measurement in degrees | 🟢 MVP | mobile |
| 8 | Movement smoothness (quality) score | 🟢 MVP | mobile |
| 9 | Real-time feedback cues | 🟢 MVP | mobile |
| 10 | Safety: ROM ceiling | 🟢 MVP | mobile |
| 11 | Safety: pain check + stop rule | 🟢 MVP | mobile |
| 12 | Session recording + summary (offline-first) | 🟢 MVP | mobile |
| 13 | Gamified exercise loop | 🔵 Phase 2 | mobile |
| 14 | Exercise library (multi-segment via strap) | 🔵 Phase 2 | mobile |
| 15 | Patient progress view | 🔵 Phase 2 | mobile |
| 16 | Practice reminders / scheduling | 🔵 Phase 2 | mobile |
| 17 | Basic compensation warning | 🔵 Phase 2 | mobile |
| 18 | Accounts + auth | 🟣 Phase 3 | api |
| 19 | Cloud sync | 🟣 Phase 3 | mobile + api |
| 20 | Prescription system | 🟣 Phase 3 | dashboard + api |
| 21 | Therapist dashboard | 🟣 Phase 3 | dashboard |
| 22 | Raw signal storage | 🟣 Phase 3 | api |
| 23 | Two-sensor true joint angle | ⚪ Phase 4 | mobile + hardware |
| 24 | Clinical accuracy validation | ⚪ Phase 4 | — |
| 25 | Recovery-prediction analytics | ⚪ Phase 4 | api/dashboard |

---

# 🟢 Phase 1 — The MVP (the gyroscope core)

Everything here must exist for the demo. This proves the one hard claim: *a phone
gyroscope can reliably measure rehab range-of-motion and count reps for one
exercise.*

## 1. Sensor capture (gyroscope + accelerometer)
**What:** Continuously read the phone's motion sensors while the patient exercises.
**How it works:** The **gyroscope** reports *angular velocity* — how fast the phone
is rotating, on three axes (x, y, z), many times per second (~50 Hz). The
**accelerometer** reports acceleration, including gravity (so it always "knows which
way is down"). We subscribe to both via Expo's `expo-sensors`. Everything else in the
MVP is built on this raw stream.
**Owner:** `mobile`

## 2. Adjustable strap / phone holder
**What:** A soft armband/holder that fastens the phone to a body segment (forearm for
the MVP), and can be repositioned to other segments later.
**How it works:** Purely physical — no code. It keeps the phone rigidly attached to
the limb so the phone's rotation = the limb's rotation. For the MVP, any running
phone-armband works; the strap must be **wide, soft, and one-hand fastenable**
(stroke patients usually have only one working hand, and the affected arm may have
reduced sensation/fragile skin).
**Owner:** `hardware`
**Team note:** The strap is what lets *one* phone become a *multi-exercise* device
later (feature 14). But moving it does **not** by itself fix the two-segment problem
(see feature 23) — that's why the MVP stays on the one exercise where a single sensor
is honest.

## 3. Calibration ("zero") step
**What:** Before each session, the patient holds a defined start position and taps
"calibrate."
**How it works:** We record the current orientation and treat it as **0°**. Every
angle after that is measured *relative* to this zero. Analogy: it's like pressing
"tare" on a kitchen scale before weighing — so it doesn't matter that the strap sits
at a slightly different angle each day; every session measures from the same start.
**Why it matters:** Without this, your degrees drift and become meaningless. It's
cheap to build and closes a big credibility gap.
**Owner:** `mobile`

## 4. Sensor fusion → joint angle
**What:** Turn the two noisy raw streams into one stable, trustworthy angle.
**How it works:** Neither sensor is good enough alone:
- The **gyroscope** is accurate over short bursts but *drifts* over time (integrating
  its velocity slowly accumulates error) — like a fast compass that slowly wanders.
- The **accelerometer** always knows "down" (gravity) but is *jittery* during motion.

A **complementary filter** (or Madgwick filter) blends them: trust the gyroscope for
quick movements, and gently use the accelerometer's gravity reference to correct the
gyro's drift. Output = a clean **pitch / roll / yaw** angle.
**Why it matters:** This is the single most novel piece of engineering — budget the
most time here. If this works, the product works.
**Owner:** `mobile`

## 5. The one MVP exercise: forearm supination/pronation
**What:** Rotating the forearm so the palm turns up (supination) and down (pronation).
**How it works:** With the phone on the forearm, *the forearm itself is the thing
rotating* — so the phone's measured rotation **is** the true movement, with no
ambiguity from other joints. That's why this exercise is the honest choice for a
single-sensor MVP (unlike elbow/shoulder, where other joints can contaminate the
reading).
**Owner:** `mobile`

## 6. Repetition detection
**What:** Automatically count each completed repetition.
**How it works:** Watch the angle go up and back down like a wave. Each time the
angular velocity crosses zero, the limb changed direction — one peak-and-return =
one rep. We segment the continuous stream into individual reps this way.
**Owner:** `mobile`

## 7. Range-of-motion (ROM) measurement in degrees
**What:** The headline number — how far the limb rotated, in degrees.
**How it works:** Within each detected rep, take the maximum angle reached (relative
to the calibrated zero). That's `peak_rom_deg`. Over many sessions this number should
climb as the patient recovers — that's the progress story.
**Owner:** `mobile`

## 8. Movement smoothness (quality) score
**What:** Not just *how far*, but *how well* the movement was performed.
**How it works:** A healthy movement is one smooth arc; an impaired one is shaky and
stuttery. We measure **jerk** (how abruptly the acceleration changes) across the rep
and sum it — lower jerk = smoother = better. Output is a 0–1 score.
**Why it matters:** Quantity (reps) plus quality (smoothness) is a much richer signal
than reps alone, and it's a strong "we thought about this" point for judges.
**Owner:** `mobile`

## 9. Real-time feedback cues
**What:** Immediate guidance while the patient moves.
**How it works:** Using the live angle + smoothness, show simple cues: *"good rep"*,
*"go a little further"*, *"slow down, keep it controlled."* This is the difference
between blind home practice and guided practice.
**Owner:** `mobile`

## 10. Safety: ROM ceiling
**What:** A cap on how far the app encourages the patient to push.
**How it works:** A maximum safe angle is set (therapist-defined later; a sensible
default in the MVP). The app **never rewards going past it** — so gamification can't
push a patient into overexertion or injury. Critically: reward *correct, consistent*
movement, never *maximum* angle or *maximum* reps.
**Why it matters:** This is a direct answer to "could the app make things worse?"
**Owner:** `mobile`

## 11. Safety: pain check + stop rule
**What:** A quick check-in that can end a session.
**How it works:** A one-tap pain check ("any pain? none / mild") on **finish**, plus a
persistent **"Stop — it hurts"** button visible for the whole session, which ends it
immediately and saves it flagged `pain: 'stopped'`.
**Decision (build):** the check is on *finish only*, not before-and-after. A gate
before every session is friction in an app whose entire purpose is adherence — the
stop button covers the during-session risk, which is the one that matters.
A pain-stopped session **still counts towards the streak** (see feature 15): the
patient did the right thing, and the app must never make stopping feel like a loss.
**Owner:** `mobile`

## 12. Session recording + summary (offline-first)
**What:** Save what happened, with no internet needed.
**How it works:** At session end, store a summary locally: reps completed, peak ROM,
average smoothness, duration, pain flag. Show it on a summary screen. "Offline-first"
means the full session records with zero connectivity and can sync later — essential
for patchy-network, semi-rural users.
**Owner:** `mobile`

---

# 🔵 Phase 2 — The adherence engine

Once the core measures reliably, make patients *want* to practice.

## 13. Gamified exercise loop
**What:** Turn reps into a game.
**How it works:** Map the live angle to an on-screen action — e.g. rotate your
forearm to steer a boat through gates; hit the target angle to score. The game is
driven directly by the fused angle (feature 4), so the "measurement" and the "game"
are the same signal. This is the boredom-killer that fixes home-practice drop-off.
**Owner:** `mobile`

## 14. Exercise library (multi-segment via strap)
**What:** More than one exercise, by repositioning the phone.
**How it works:** Using the strap (feature 2): phone on **upper arm** → shoulder
moves; on **forearm** → elbow/rotation; on **back of hand** → wrist. Each exercise
defines which fused axis (pitch/roll/yaw) to score. **Honesty rule:** only ship an
exercise once we've confirmed a single sensor measures it validly, or we pair it with
a stabilization instruction (keep the upper segment still).
**Owner:** `mobile`

## 15. Patient progress view (+ practice streak)
**What:** Let the patient see their own improvement, and a streak that rewards showing up.
**How it works:** A simple chart of ROM/reps over time on the phone, plus a **streak**
= consecutive calendar days with at least one session. All computed on-device from
saved sessions (`src/progress/streak.ts`) — **no account, no cloud, no API**. This
directly targets **self-efficacy** — the research shows visible progress raises a
survivor's confidence, which itself improves recovery [C1].
**Safety rule (guardrail 3):** the streak counts *days practised*, never reps and
never angle — and a session the patient ended with **"stopped" for pain still holds
the streak**. Otherwise the streak becomes a reason to push through pain, which
inverts the safety model. Not practising *yet* today doesn't break the run either;
the day isn't over.
**Depends on:** feature 12 persisting sessions across restarts — a streak that resets
on reload is worse than no streak.
**Owner:** `mobile`

## 16. Practice reminders / scheduling
**What:** Nudge the patient to do their prescribed sessions.
**How it works:** Local notifications on the schedule the therapist set (e.g. "2
sessions today"). Boosts adherence without needing the cloud.
**Owner:** `mobile`

## 17. Basic compensation warning
**What:** A first, lightweight guard against "cheating" the movement.
**How it works:** If a rep is done too fast or too jerky (a common sign of a
compensatory lurch rather than a controlled movement), nudge: *"keep it slow and
controlled."* This is a *heuristic*, not true compensation detection (that needs a
second sensor — feature 23). Ship only if time allows; don't oversell it.
**Owner:** `mobile`

---

# 🟣 Phase 3 — Tele-rehab (the paying side)

Connect patient practice to the therapist. This is what a clinic pays for.

## 18. Accounts + auth
**What:** Patients and therapists sign in.
**How it works:** JWT-based auth via the Hono API. Links a patient to a therapist and
clinic.
**Owner:** `api`

## 19. Cloud sync
**What:** Move sessions from the phone to the cloud.
**How it works:** The offline queue (feature 12) uploads session summaries + per-rep
metrics to the API (`POST /sessions`) whenever a connection is available. Last-write
wins; nothing is lost if offline.
**Owner:** `mobile` + `api`

## 20. Prescription system
**What:** The therapist assigns exercises and doses.
**How it works:** In the dashboard, a therapist creates a **prescription** (which
exercise, reps/sets, sessions per day, days per week, safe ROM ceiling). The patient
app pulls its plan (`GET /prescriptions`). The therapist is the eligibility filter —
they decide the app is appropriate for this specific patient.
**Owner:** `dashboard` + `api`

**Implementation note — wiring the mobile app to a real prescription (current
gap):** `RepDetector` (`src/metrics/repDetector.ts`) already accepts an optional
`targetRomDeg` and derives its rep-detection thresholds from it
(`enterDeg = targetRomDeg * 0.45`, `exitDeg = targetRomDeg * 0.10` — both
placeholder ratios, `TODO(clinical/tune)`), instead of a fixed 40°/15° for every
patient. This exists because a severe-stroke patient's realistic ROM can be far
below what a fixed threshold assumes, and a fixed threshold would just never
register their reps.

Right now `src/screens/ExerciseScreen.tsx` passes a **hardcoded**
`DUMMY_TARGET_ROM_DEG = 70` — there is no prescription to pull yet. Once
`GET /prescriptions` exists, that constant gets replaced by the value from the
patient's active prescription for this exercise. Two things still needed for that
to be real, not just wired:
1. **Mobile:** fetch/cache the active prescription, read its target ROM, pass it
   into `new RepDetector({ targetRomDeg })` instead of the dummy constant.
2. **Schema gap:** the `PRESCRIPTION` table in
   [`03-database.md`](./03-database.md) does **not** currently have a
   `target_rom_deg` column — only `EXERCISE.target_rom_deg` exists, which is one
   generic value per exercise, not per patient. That defeats the point of
   per-patient severity-based thresholds. `PRESCRIPTION` needs its own
   (nullable) `target_rom_deg` that overrides `EXERCISE.target_rom_deg` when a
   therapist sets one — see the note in `03-database.md`.

## 21. Therapist dashboard
**What:** Remote monitoring of every patient.
**How it works:** A React web app showing, per patient: **adherence** (did they
practice, vs prescribed), **dose** (how many reps), and **progress** (ROM trend line,
via Recharts). Lets one therapist supervise the 6 days/week the patient isn't in
clinic and catch drop-off early.
**Owner:** `dashboard`

## 22. Raw signal storage
**What:** Keep the full sensor time-series for research/validation.
**How it works:** The heavy raw data (50 Hz × 3 axes) is uploaded as a blob to
Cloudflare **R2**, keyed by an opaque `session_id` (never by patient name). The light
per-rep summaries stay in D1 for fast queries. This raw archive becomes the dataset
for feature 24/25.
**Owner:** `api`

---

# ⚪ Phase 4 — Validation & advanced (roadmap / defensibility)

You won't build these soon, but naming them shows judges you understand the real path.

## 23. Two-sensor true joint angle
**What:** Actually solve the single-segment ambiguity.
**How it works:** Put a sensor on *both* sides of a joint (e.g. upper arm + forearm)
and subtract their angles → the true joint angle, immune to compensation from other
joints. Enables honest elbow/shoulder measurement and real compensation detection.
**Owner:** `mobile` + `hardware`

## 24. Clinical accuracy validation
**What:** Prove the app's degrees match clinical instruments.
**How it works:** A pilot comparing PulihGo's ROM against a therapist's goniometer/
inclinometer across real patients. Until this exists, we say "proof-of-concept
measurement," **never** "clinically accurate." This is the gate before any real
patient use.
**Owner:** — (research + clinical partner)

## 25. Recovery-prediction analytics
**What:** Use the longitudinal dataset to forecast recovery.
**How it works:** With enough consented ROM/smoothness histories, train a model to
flag who's improving, plateauing, or dropping off — a prediction asset no goniometer
can match. The long-term moat.
**Owner:** `api` / `dashboard`

---

## The one-paragraph summary to tell your team

> "For the hackathon we build **one thing well**: the gyroscope reads a *calibrated*
> forearm-rotation angle, counts reps, and reports range-of-motion in degrees for
> **one exercise (supination/pronation)** — with a safe ROM cap and a pain-stop rule
> so we can't make anyone worse. The game, the exercise library (via the strap), the
> therapist dashboard, and clinical validation are all real, planned phases — but not
> in the 30 hours. Depth on the core beats breadth on five broken features."
