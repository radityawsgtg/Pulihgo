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

There are **two apps**, and they need **two terminals**. They never talk to each
other directly — both talk to Supabase.

Full setup + the errors we hit are in [`docs/07-getting-started.md`](./docs/07-getting-started.md).

### Terminal 1 — the patient app 📱

```bash
cd pulihgo-app        # NOT the repo root — the root has no package.json
npm install           # .npmrc already sets legacy-peer-deps
npx expo start        # scan the QR with Expo Go on your phone
```

### Terminal 2 — the therapist dashboard 💻

```bash
cd therapist-dashboard
npm install
npm run dev           # → http://localhost:5173
```

> ### ⛔ Read this before you lose an hour to it
>
> **After every `git pull`, run `npm install` in the folder you're working in.**
> Whenever a teammate adds a dependency, your `node_modules` is out of date and
> the error you get says nothing about installing. Both of these have already
> bitten us:
>
> - `Unable to resolve module expo-av` → someone added the audio player
> - `Cannot find module '@supabase/supabase-js'` → someone added sync
>
> The fix is always `npm install`, never a code change.

### Environment variables (both apps need their own)

Sync is off until you fill these in. **The app still runs without them** — it
just stays local-only, warning once in the console.

| File | Variables | Copy from |
|------|-----------|-----------|
| `pulihgo-app/.env` | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `pulihgo-app/.env.example` |
| `therapist-dashboard/.env` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | `therapist-dashboard/.env.example` |

**Same Supabase project, same URL, same anon key — different variable names.**
Expo only inlines vars prefixed `EXPO_PUBLIC_`; Vite only inlines `VITE_`. Put
the dashboard's `VITE_*` names in the phone's `.env` and **every phone sync dies
silently** — no error, sessions simply never upload. That has happened once
already. Restart the dev server after editing `.env`; neither tool hot-reloads it.

Never commit a `.env` — both are gitignored. The anon key is public by design
(it ships in the app bundle); the `service_role` key must never go in either file.

> **This project targets Expo SDK 54.** Install the **Expo Go** app from the
> App Store / Play Store — as of writing, the App Store build of Expo Go only
> supports up to SDK 54 (newer SDKs lag behind in Apple's review queue), so
> **don't** bump the `expo` package past `~54.x` unless you've confirmed Expo
> Go's App Store release has caught up. See
> [`docs/07-getting-started.md`](./docs/07-getting-started.md) if you hit
> "Project is incompatible with this version of Expo Go".

Your laptop and phone must be on the **same wifi** — Expo Go loads the JS bundle
from Metro over the local network. Conference wifi often blocks device-to-device
traffic; tethering the laptop to your phone's hotspot fixes it.

You'll land on the **Home** tab. The **Gyro test** tab shows raw axes — it's how
`EXERCISE_AXIS` was confirmed as `roll` (see `src/exercises/exerciseLibrary.ts`),
and how you'd re-check it if the strap position or phone model changes.

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
GARUDA7.0/
├── pulihgo-app/            # 📱 the patient app (Expo / React Native)
│   ├── App.tsx             # entry — tabs: Home / Exercise / Summary / Gyro test
│   ├── src/
│   │   ├── types.ts        # shared types (single source of truth)
│   │   ├── sensors/        # ✅ angle reading + calibration (Radit)
│   │   ├── metrics/        # rep detection, ROM, smoothness (Pradipta)
│   │   ├── progress/       # streak + adherence metrics, local only (Radit)
│   │   ├── safety/         # ROM ceiling + pain check (Radit)
│   │   ├── storage/        # local session storage — AsyncStorage (Radit)
│   │   ├── sync/           # ⬆ uploadSession · ⬇ fetchPrescription (Supabase)
│   │   ├── exercises/      # exercise catalogue — ships exactly one
│   │   └── screens/        # the UI screens
│   └── docs/               # everything above
└── therapist-dashboard/    # 💻 the therapist web app (React + Vite + Recharts)
    └── src/lib/supabase.ts # every query lives here
```

Both halves talk **only** through Supabase — never to each other. See
[`docs/02-architecture.md`](./docs/02-architecture.md).

## End goal

A clinician-prescribed home-rehab tool that measurably increases practice dose and
gives therapists objective remote progress data — starting from this one honest,
gyroscope-measured exercise. See boundaries + roadmap in the concept brief and
feature spec.
