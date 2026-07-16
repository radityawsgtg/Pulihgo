# 08 — Sprint Plan (30 hours)

The goal of the sprint: **prove the gyroscope MVP** — measure ROM and count reps for
one rotational exercise, safely. Everything else is a later phase.

## Team & ownership

| Person | Role | Owns (mostly edits here) |
|--------|------|--------------------------|
| **Raditya** | Tech Lead + core | `src/sensors/`, `src/types.ts`, `App.tsx`, `src/progress/`, + `src/screens/`, `src/storage/`, `src/safety/` (taken over), PR reviews, keeps `main` runnable |
| **Pradipta** | Tech — metrics | `src/metrics/` (rep detection, ROM, smoothness) |
| **Sulthan** | Research | clinician interview (`docs/05-…`) + `docs/04-research-references.md` |
| **Adnan** | Pitch | deck, demo script, backup demo video, presenting (uses `docs/`) |

Owning separate folders = building in parallel without merge conflicts. The
**mock** (`src/sensors/mockAngle.ts`) lets Pradipta & Sulthan work even when they
don't have the phone.

## Definition of Done (the MVP)

- [ ] Live, **calibrated** forearm-rotation angle on the phone
- [ ] **Reps counted** correctly for one exercise (supination/pronation)
- [ ] **Peak ROM** in degrees shown and tracked
- [ ] **Smoothness** score computed (rough is OK)
- [ ] **Safety:** ROM ceiling warning + a pain check/stop
- [ ] **Session summary** saved + shown after finishing
- [ ] Demo-able live in under a minute + a **backup video** exists

## 30-hour timeline

| Window | Focus |
|--------|-------|
| **H0–2 · all** | Expo running on the phone; pick the exercise axis; commit sensors + mock |
| **H2–10 · parallel** | Radit: calibration + clean angle · Pradipta: reps + ROM on the mock · Sulthan: exercise/summary UI + storage + safety · Adnan: deck skeleton from docs |
| **✅ H10 checkpoint** | Real angle → reps → summary works end-to-end (rough is fine) |
| **H10–20** | Add smoothness + feedback cues; wire safety in; Adnan drafts full deck + demo script |
| **✅ H20 checkpoint** | **Feature freeze.** Record the **backup demo video** now |
| **H20–28** | Bug-fix; seed a fake progress chart; polish the ONE demo exercise; rehearse mentor Q&A (stroke types + "could it make things worse") |
| **H28–30** | Final rehearsal + buffer |

## The rule that protects the sprint

If any task drifts toward the **therapist dashboard, cloud sync, ML, or a second
exercise** → stop. Those are Phase 2/3 (see `docs/06-feature-spec.md`). Depth on the
gyroscope core wins the demo; breadth on five half-broken features loses it.

## Demo day

**Hero moment:** rotate arm → number climbs + reps count live → (seeded) progress
chart shows a week of improvement. Recovery is slow, so the drama is the
*interaction + the data*, not an on-stage cure — and that's the honest, winning story.

Have the **Risks & Limitations** answer ready: "clinician-prescribed,
proof-of-concept, one exercise, safe ROM cap + pain stop; compensation detection and
clinical validation are later phases — we measure and motivate, we don't diagnose or
replace a therapist."
