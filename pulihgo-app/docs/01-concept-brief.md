# PulihGo — Concept Brief

*A one-read overview to align the team. Working name; rename freely.*

---

## 1. Problem background

Stroke is one of the largest causes of long-term disability on earth. Roughly
**13.7 million** new strokes happen every year, and about **87%** of stroke
deaths fall on low- and middle-income countries — Indonesia squarely among them.
More than **80%** of hospitalized stroke patients are left with weakness on one
side of the body (hemiparesis), and for most survivors the arm recovers less
than the leg.

Three facts from the clinical literature define the opportunity:

**(a) There is a short window when the brain heals fastest.** Neuroplasticity is
highest in roughly the **first 3 months** post-stroke. Extra, well-timed motor
practice in this subacute window measurably changes the recovery trajectory.
Miss it and gains come far slower.

**(b) Recovery is a numbers game, and the numbers aren't being hit.** Motor
recovery requires *intensive, repetitive, task-specific* practice — hundreds of
repetitions. But real-world therapy delivers a fraction of that: a typical
outpatient session in one analysis involved only about **12 purposeful arm
movements**, and sessions run ~36 minutes. Home practice is supposed to fill the
gap, but it usually fails — it's boring, patients get no feedback on whether
they're doing it right, and nobody is watching.

**(c) Confidence drives outcomes.** Quality of life after stroke correlates
strongly with **self-efficacy** (the survivor's belief they can perform tasks)
and **functional ability**, and *negatively* with dependence on a caregiver.
When a survivor can see their own progress, self-efficacy rises — which itself
improves recovery. Today, home practice offers no visible progress at all.

**The gap in one sentence:** survivors need high-dose, well-formed, motivating
practice during a narrow window, but home rehab today is low-dose, unguided,
invisible to the therapist, and demoralizing.

## 2. Solution

**PulihGo turns any Android phone into a rehab sensor, a coach, and a therapist's
remote eyes.** The patient straps the phone to their forearm. During each
prescribed exercise, the phone's **gyroscope** measures how far the limb rotates
(range of motion, in degrees) and how smoothly it moves.

Three pillars:

1. **Objective measurement.** The gyroscope quantifies range of motion in
   degrees — replacing the physical goniometer and giving both patient and
   therapist a hard number that moves over time. Smartphone angle measurement
   has been validated against clinical instruments to within a few degrees.

2. **Gamified, guided practice (the adherence engine).** Each rep drives a simple
   game — rotate your forearm to steer, reach the target angle to score. Real-time
   feedback tells the patient *"good rep / go a bit further / slow down"*. This is
   what fights the boredom that kills home practice, and it directly builds
   self-efficacy by making progress visible every session.

3. **Therapist dashboard (tele-rehab).** The therapist prescribes exercises,
   then sees adherence (did they practice?), dose (how many reps?), and progress
   (is ROM climbing?) remotely — the clinic's paying feature.

**Why the gyroscope, not the accelerometer** (the question every judge asks):
rehab exercises are fundamentally *rotational* — shoulder internal/external
rotation, forearm supination/pronation, elbow flexion. Rotation is angular
velocity, which the gyroscope measures directly and the accelerometer barely
sees. We fuse both sensors for a stable joint angle, but the gyroscope is the
star.

## 3. Tech stack (summary)

Full flowchart in [`02-architecture.md`](./02-architecture.md); schema in
[`03-database.md`](./03-database.md).

| Layer | Choice | Why |
|-------|--------|-----|
| Patient app | **React Native (Expo)** + `expo-sensors` | High-rate gyroscope access, runs on judges' phones via QR, TypeScript |
| Sensor fusion | **Complementary / Madgwick filter** | Gyro + accel → drift-free pitch/roll/yaw angle |
| On-device DSP | Rep detection, peak-ROM, jerk-based smoothness | The "measurement" works fully offline |
| Game / feedback | React Native Skia (or Canvas) | Lightweight real-time visuals driven by live angle |
| Backend API | **Hono on Cloudflare Workers** | Edge, cheap, and the team already knows it (SPARTA) |
| Structured DB | **Cloudflare D1** (SQLite) | Patients, prescriptions, sessions, ROM history |
| Raw signals | **Cloudflare R2** | Bulk gyro/accel time-series blobs, keyed by session id |
| Dashboard | **React + Vite + Recharts + Tailwind** | Fast to build, great charts for progress lines |
| Shared types | `packages/shared` (TypeScript) | One source of truth across all three apps |

**Design principle: offline-first.** A full session records with no connectivity
and syncs later — essential for the semi-rural, patchy-network reality of the
target user.

## 4. Business plan

**Model: B2B2C.** The clinic/physiotherapist is the paying customer; the patient
uses the app free.

- **Who pays:** rehabilitation clinics, physiotherapy practices, and hospital
  rehab units — for the therapist dashboard (remote monitoring + adherence +
  more patients managed per therapist). In Indonesia, longer-term the tele-rehab
  angle fits national-insurance (BPJS) pressure to extend care beyond scarce
  in-person sessions.
- **Why they'd pay:** one therapist can only see a patient for ~36 min at a time;
  PulihGo lets them supervise the *other* 6 days a week, catch drop-off early,
  and show insurers objective outcome data.
- **Pricing sketch:** per-seat monthly SaaS for therapists, or per-active-patient.
  A freemium single-clinic tier to seed adoption.
- **Wedge:** start with **one** exercise family (forearm/shoulder rotation) and
  **one** partner clinic. Prove adherence + ROM gains on a handful of patients,
  then expand the exercise library.
- **Moat over time:** the longitudinal movement dataset (with consent) becomes a
  recovery-prediction asset no goniometer can match.
- **Cost base:** near-zero infra (Cloudflare edge + cheap Android phones patients
  already own). The expensive part is clinical validation, which is the roadmap,
  not the MVP.

## 5. Boundaries (scope — what PulihGo is and is NOT)

Being explicit here is what makes the pitch credible. Judges reward a team that
knows its own limits.

**In scope:**
- **Upper limb, gross rotational movements** (shoulder rotation, elbow flexion,
  forearm supination/pronation) — the motions a single phone can sense well.
- **Mild-to-moderate impairment** — patients who can move the limb enough to
  strap and rotate a phone.
- **Subacute + chronic home phase** — supplementing outpatient/home programs.
- **A therapist-in-the-loop model** — a clinician prescribes and reviews.

**Explicitly NOT (yet):**
- ❌ **Not a diagnostic device.** It's a therapy-support + monitoring aid. It
  never diagnoses stroke, severity, or recovery.
- ❌ **Not fine-motor / hand & finger** rehab — a wrist-worn phone can't sense
  individual finger movement.
- ❌ **Not for severe plegia** (no voluntary movement at all) or the acute
  hospital phase — those need supervised/robotic therapy first.
- ❌ **Not full-body kinematics** — one phone = one limb segment, not a whole
  motion-capture chain.
- ❌ **Not a replacement for a therapist** — it extends them, it doesn't remove
  them.
- ❌ **Not a clinical FMA/ARAT score** — we report our own ROM + smoothness
  metrics and correlate with clinical scores; we don't claim to compute them.

**Key assumptions to validate** (→ see the doctor interview guide):
patients/caregivers can position the phone correctly; rotational ROM is a metric
therapists actually value; unsupervised practice is safe enough with the right
guardrails (compensatory-movement and pain warnings).

## 6. Hackathon build order (so a demo exists on stage)

1. Sensor loop — prove the gyroscope reads a clean forearm-rotation angle live.
2. On-device rep + peak-ROM detection with a number on screen.
3. Minimal game reacting to the live angle (the "wow").
4. API + D1 + a session-sync call.
5. Dashboard with a progress line + adherence view (seed demo history — say so).
6. Polish the one exercise you'll demo. Depth over breadth.

**The hero demo moment:** rotate your arm → the game responds + live
"forearm rotation: 62°" ticks up → cut to the therapist dashboard showing a week
of climbing progress. Recovery is slow, so the drama is the *interaction and the
data*, not an on-stage cure — and that's fine.
