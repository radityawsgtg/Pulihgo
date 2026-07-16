# AGENTS.md — context for AI agents & new teammates

Read this fully before changing anything. It orients AI coding agents (Claude Code,
Cursor, Copilot) and humans alike. If you change a convention, update this file in
the same commit.

> Using Claude Code? Symlink so it's auto-loaded: `ln -s AGENTS.md CLAUDE.md`

## 1. What this is (one paragraph)

PulihGo is a home stroke-rehab app. A patient straps an Android/iOS phone to their
forearm; the phone's **gyroscope** (fused with the accelerometer by the OS)
measures how far and how smoothly the arm rotates during a prescribed exercise.
Exercises are gamified to keep the patient practicing; results sync to a therapist
dashboard later. It **supplements, never replaces** a therapist.

## 2. Current state

- 🟢 **Working:** reading the fused angle on-device (`src/sensors/useDeviceAngle.ts`),
  calibration/zero, a baseline rep detector + peak-ROM, and a live Exercise screen.
- 🟡 **In progress:** tuning rep thresholds, smoothness, session persistence, the
  summary screen.
- ⚪ **Later (do NOT build now):** the game layer, cloud sync, therapist dashboard.

## 3. Where things live

| Path | Purpose | Owner |
|------|---------|-------|
| `src/types.ts` | Shared types — the contract. Import from here; never redefine. | Radit |
| `src/sensors/` | Angle reading (`useDeviceAngle`), calibration (`useCalibratedAngle`), `mockAngle` | Radit |
| `src/metrics/` | `repDetector`, `rom`, `smoothness` | Pradipta |
| `src/progress/` | `streak` — adherence metrics over saved sessions (pure, local) | Radit |
| `src/safety/` | ROM ceiling + pain check | Sulthan |
| `src/storage/` | local session storage | Sulthan |
| `src/screens/` | `ExerciseScreen` (MVP loop), `GyroTestScreen`, `ProgressScreen`, `SummaryScreen` | Sulthan |

## 4. Glossary (use these exact terms in code + comments)

- **ROM** — Range of Motion; the joint angle reached, in **degrees**. Headline metric.
- **Rep** — one repetition (e.g. one forearm supination).
- **Session** — one prescribed practice bout.
- **Smoothness** — 0..1 movement-quality score from jerk; higher = smoother.
- **Axis** — which fused angle (pitch/roll/yaw) an exercise is scored on.
- **Calibrate / zero** — set the current position as 0° so sessions start the same.
- **Affected side** — the arm impaired by the stroke.

## 5. Hard guardrails (do NOT cross)

1. **No diagnostic/clinical claims** in code, copy, or docs. It's a therapy-support +
   monitoring aid, never a diagnosis or a therapist replacement.
2. **Never invent research numbers.** Every clinical stat traces to
   `docs/04-research-references.md`. No source → don't state it.
3. **Safety first in gamification.** Never reward maximum angle or maximum reps —
   only correct, controlled movement. Respect `safety.ts` (ROM ceiling, pain stop).
4. **Unvalidated constants must be marked** `// TODO(clinical/tune): ...` — rep
   thresholds, ROM ceiling, and smoothness scale are placeholders until validated.
5. **`src/types.ts` is the single source of truth.** Don't redefine a shared shape.
6. **Offline-first.** A session must record with no network.

## 6. Conventions

- **TypeScript**, `strict`. No `any` without a `// reason:` note.
- Naming: `camelCase` vars/functions, `PascalCase` types/components.
- **Units:** angles in **degrees**, time in **ms**; suffix ambiguous fields
  (`peakRomDeg`, `durationMs`).
- One person edits mostly within their folder (§3) → few merge conflicts.

## 7. How to run

```bash
npm install
npx expo start        # scan QR with Expo Go
# press r = reload · j = open debugger console · i = iOS simulator
```

## 8. Build order (protect the sprint)

Sensors ✅ → metrics (rep/ROM/smoothness) → session save + summary → safety wiring →
game LAST. If a change drifts toward the dashboard, cloud, or a 2nd exercise: stop —
that's a later phase. Depth on the one exercise beats breadth on five broken ones.
