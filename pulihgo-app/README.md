# PulihGo 🩺📱

> Gyroscope-based home stroke rehabilitation. Turn a phone into an objective
> range-of-motion sensor and a rehab coach — no extra hardware.
> **Working name — rename freely.** "Pulih" = *recover* (Indonesian) + "Go".

**Status:** 🟢 Gyroscope core is working on-device. Building the MVP: measure
range of motion + count reps for one rotational exercise (forearm
supination/pronation), with built-in safety limits.

---

## The idea in 20 seconds

Motor recovery after a stroke needs **hundreds of repetitions during a short
window**, but real outpatient sessions deliver ~12 useful movements and home
practice fails from boredom + no feedback. PulihGo straps a phone to the forearm,
uses the **gyroscope** to measure how far the limb rotates (in degrees) and count
reps, gamifies it to keep patients practicing, and (later) streams progress to a
therapist. Because rehab exercises are *rotational*, the gyroscope is the perfect,
underused sensor for the job.

## Run it (5 min)

Full setup + the errors we hit are in [`docs/07-getting-started.md`](./docs/07-getting-started.md). Short version:

```bash
npm install            # .npmrc already sets legacy-peer-deps
npx expo start         # scan the QR with Expo Go on your phone
```

> **This project targets Expo SDK 54.** Install the **Expo Go** app from the
> App Store / Play Store — as of writing, the App Store build of Expo Go only
> supports up to SDK 54 (newer SDKs lag behind in Apple's review queue), so
> **don't** bump the `expo` package past `~54.x` unless you've confirmed Expo
> Go's App Store release has caught up. See
> [`docs/07-getting-started.md`](./docs/07-getting-started.md) if you hit
> "Project is incompatible with this version of Expo Go".

You'll land on the **Exercise** tab (the MVP loop). The **Gyro test** tab shows
raw axes — use it to confirm which axis your forearm rotation drives, then set
`EXERCISE_AXIS` in `src/screens/ExerciseScreen.tsx`.

## What to read, in order

| File | What it is |
|------|-----------|
| [`AGENTS.md`](./AGENTS.md) | **AI agents + new teammates start here.** Glossary, guardrails, conventions. |
| [`docs/07-getting-started.md`](./docs/07-getting-started.md) | Install, run on your phone, the SDK/npm fixes. |
| [`docs/08-sprint-plan.md`](./docs/08-sprint-plan.md) | Roles, folder ownership, the 30-hour plan + checkpoints. |
| [`docs/01-concept-brief.md`](./docs/01-concept-brief.md) | Problem, solution, business, **boundaries**. |
| [`docs/06-feature-spec.md`](./docs/06-feature-spec.md) | Every feature + how each works. |
| [`docs/02-architecture.md`](./docs/02-architecture.md) | Tech-stack + data-flow diagrams. |
| [`docs/04-research-references.md`](./docs/04-research-references.md) | Every claim, with its source. |
| [`docs/05-doctor-interview-guide.md`](./docs/05-doctor-interview-guide.md) | Questions to validate with a clinician. |
| [`docs/03-database.md`](./docs/03-database.md) | Phase-3 backend schema (later). |
| [`FEATURE_IDEAS.md`](./FEATURE_IDEAS.md) | 💡 **Friends: drop feature suggestions here.** |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md) | How we branch, split work, and merge. |

## Code map

```
pulihgo-app/
├── App.tsx                 # entry — tabs: Exercise / Gyro test / Progress / Summary
├── src/
│   ├── types.ts            # shared types (single source of truth)
│   ├── sensors/            # ✅ angle reading + calibration (Radit)
│   ├── metrics/            # rep detection, ROM, smoothness (Pradipta)
│   ├── progress/           # streak + adherence metrics, local only (Radit)
│   ├── safety/             # ROM ceiling + pain check (Sulthan)
│   ├── storage/            # local session storage (Sulthan)
│   └── screens/            # the UI screens
└── docs/                   # everything above
```

## End goal

A clinician-prescribed home-rehab tool that measurably increases practice dose and
gives therapists objective remote progress data — starting from this one honest,
gyroscope-measured exercise. See boundaries + roadmap in the concept brief and
feature spec.
