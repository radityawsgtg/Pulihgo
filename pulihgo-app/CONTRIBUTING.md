# Contributing to PulihGo

Short and practical — we have a sprint to run.

## The golden rule: own your folder

Each person works mostly inside **their own folder** (see `AGENTS.md` §3). That's how
4 people build in parallel without merge conflicts:

- **Radit** → `src/sensors/`, `src/types.ts`, `App.tsx`, reviews + merges
- **Pradipta** → `src/metrics/`
- **Sulthan** → `src/screens/`, `src/storage/`, `src/safety/`
- **Adnan** → pitch deck + demo (uses `docs/`, little code)

If you need a shape another folder owns, add it to `src/types.ts` and tell the owner.

## Git flow (simple)

```bash
git checkout -b feat/rep-detector      # branch per feature
# ...work...
git add -A && git commit -m "feat(metrics): count reps from calibrated angle"
git push -u origin feat/rep-detector
# open a Pull Request → Radit reviews → merge to main
```

- Branch names: `feat/...`, `fix/...`, `docs/...`, `chore/...`
- Commit style: `type(scope): message` (e.g. `fix(sensors): handle null rotation`)
- **`main` must always run.** Don't push broken code to `main` — use a branch + PR.
- Pull `main` before starting each session so you're not building on stale code.

## Before you open a PR

- [ ] `npx expo start` runs with no red error
- [ ] The app still loads on a phone (Exercise + Gyro test tabs open)
- [ ] No `any` without a `// reason:` comment
- [ ] Unvalidated numbers marked `// TODO(tune)` / `// TODO(clinical)`
- [ ] You imported shared types from `src/types.ts` (didn't redefine them)

## Suggesting a feature

Don't just add it — propose it first in [`FEATURE_IDEAS.md`](./FEATURE_IDEAS.md) so we
can check it fits the MVP scope and boundaries. (During the sprint, most new ideas are
Phase 2/3 — capture them, don't build them.)

## Using AI agents

This repo is AI-ready: point Claude Code / Cursor at `AGENTS.md` first. The guardrails
there (no clinical claims, no invented stats, safety-first gamification, mark
unvalidated constants) apply to AI-written code too — review it against them before merging.
