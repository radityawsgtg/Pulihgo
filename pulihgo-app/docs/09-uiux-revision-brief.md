# 09 — UI/UX Revision Brief: Elderly-Accessible Redesign, Onboarding, Exercise Library

**Purpose of this doc:** a self-contained brief you can hand directly to a coding
agent (Claude Code) to execute. It assumes no prior conversation — every claim
about current code cites a real file/line, and every new clinical claim traces to
[`04-research-references.md`](./04-research-references.md), per
[`AGENTS.md`](../AGENTS.md) guardrail #2.

**Status:** 📝 proposal — not yet built. Read this fully before changing code.

---

## 1. Why this revision

PulihGo's primary user is a stroke survivor practicing alone at home. Stroke
incidence rises sharply with age, and the app must work for a patient who may
have low vision, reduced fine motor control, and low tolerance for cognitive
load — even though the app doesn't exclude younger patients. The current build
was iterated toward a "premium Whoop-style fitness dashboard" look: dense stat
grids, 7.5–9px labels, five simultaneous accent colors, and clinical jargon
headings ("REHAB STRAIN", "NEUROLOGICAL IMPACT"). That aesthetic is fine for a
demo-day judge; it is a poor fit for the actual end user. This doc scopes the
fix.

This is a **UI/UX and information-architecture change only.** It does not touch
sensor fusion, rep detection math, or safety thresholds (`src/metrics/`,
`src/safety/`) — see §9 Non-goals.

---

## 2. Current state (audit — grounded in the actual code)

| Area | File | Observed issue |
|---|---|---|
| Default theme | [`App.tsx:38`](../App.tsx) | `useState<'dark'\|'light'>('dark')` — app opens in dark mode by default. |
| Type scale | [`ProgressScreen.tsx`](../src/screens/ProgressScreen.tsx) styles | Caption/label text as small as `7.5–9px` (`strainScoreLbl`, `zoneLabel`, `miniStatLbl`, `gridLabel`) — below comfortable reading size for older or low-vision users. |
| Information density | `ProgressScreen.tsx` | One scroll view stacks: date strip → 3 animated rings → "Rehab Strain" score + zone slider + mini-stats → streak banner + modal → 4-card all-time grid → activity log. All visible by default, no progressive disclosure. |
| Color load | `ProgressScreen.tsx` rings (`#00e5ff`, `#00e676`, `#a052ff`) + strain zones (`#00e676/#ffb020/#ff5252`) + streak (`#ffb020`) | Up to 5 non-safety accent colors on screen simultaneously; safety colors (amber/red) lose their "this means danger" salience when surrounded by equally saturated decorative colors. |
| Jargon | `ProgressScreen.tsx:320` "REHAB STRAIN", `SummaryScreen.tsx:465` "NEUROLOGICAL IMPACT", `SummaryScreen.tsx:123` "Ceiling Warning: Hyperextension" | Clinical/gamer register copy a lay elderly user won't parse quickly. |
| First run | [`App.tsx`](../App.tsx) | No onboarding. App boots straight into the `Home` (Progress) tab; the only "how to use this" guidance lives *inside* the Exercise tab's onboarding card ([`ExerciseScreen.tsx:273-305`](../src/screens/ExerciseScreen.tsx)), never explains the other 3 tabs (Home, Summary, Gyro test). |
| Exercise count | [`App.tsx:20-34`](../App.tsx), [`ExerciseScreen.tsx:19-20`](../src/screens/ExerciseScreen.tsx) | The `exercise` tab hardcodes exactly one movement (`EXERCISE_AXIS='roll'`, `EXERCISE_ID='forearm_supination'`). `types.ts:39-45` already defines an `ExerciseConfig` interface for exactly this generalization, but nothing constructs more than one. |
| Dev-only screen in main nav | `App.tsx:33` | "Gyro test" (raw axis readout, console-logging) is a developer tool but sits in the patient-facing tab bar as a 4th tab. |

---

## 3. Goals

1. **Simplify for an older, possibly low-vision/low-tech-literacy audience** —
   fewer things on screen at once, larger text/touch targets, plain language.
2. **Light mode by default**, with shorter copy throughout.
3. **A "Get Started" walkthrough after first load** — a short, skippable
   highlight of what each part of the app does, so a first-time user doesn't
   have to guess.
4. **An Exercise Library with 2 exercises** instead of one hardcoded screen:
   - Forearm **Supination/Pronation** (existing, unchanged sensor logic)
   - Elbow **Flexion/Extension** (new)

Each goal below has its own spec section and acceptance criteria.

---

## 4. Design tokens — light-first, accessible

Replace the current dark-first Whoop palette with this as the **default**
(light) theme. Keep a dark variant for users who prefer it (the toggle already
exists — just flip the default and soften the accent count), but light is what
loads on first run and after onboarding.

### 4.1 Color

| Token | Light (default) | Dark (opt-in) | Notes |
|---|---|---|---|
| `bg` | `#FAFAF7` | `#0b0e11` (existing) | Warm off-white, not stark `#FFFFFF` — reduces glare for light-sensitive users. |
| `cardBg` | `#FFFFFF` | `#121417` (existing) | |
| `cardBorder` | `#E2E4DE` | `#1c1f22` (existing) | |
| `textPrimary` | `#1A1D1A` | `#FFFFFF` | Target contrast ratio **≥ 7:1** against `bg`/`cardBg` (WCAG AAA) — current app's `#64748b` "body" gray on `#f0f2f5` bg is closer to AA-minimum; raise it for this audience. |
| `textSecondary` | `#5B5F58` | `#8e9aa0` (existing) | Used only for true secondary info (timestamps), not for anything the user must act on. |
| `accentPrimary` (all primary buttons/CTAs) | `#0E7C7B` (calm teal) | `#00C2C2` | **One** accent color for actionable elements. Replace the current 3-way split (`#00e5ff` cyan / `#00e676` green / `#a052ff` purple) used simultaneously across rings — that split is decorative, not semantic. |
| `safe` | `#1E9E5A` | `#00e676` (existing) | Reserve green **only** for "safe / good", never decorative. |
| `caution` | `#C77800` | `#ffb020` (existing) | |
| `danger` | `#D64545` | `#ff5252` (existing) | |

Rule going forward: **a color may only appear if it means something** (safe /
caution / danger / the one accent). Delete purely decorative color variety
(e.g. the 3rd "DAILY DOSE" ring currently colored purple for no safety reason
— recolor it to `accentPrimary` or fold it into the primary card).

### 4.2 Type scale (replace ad-hoc per-screen sizes)

| Role | Current (examples) | New minimum |
|---|---|---|
| Big numeric readout (angle, reps) | 28–72px (fine, keep) | unchanged |
| Body / instructions | 11–13px | **16px**, line-height 1.5 |
| Card headings | 14–18px | **18px** |
| Captions / stat labels | **7.5–9px** (too small) | **13px** minimum, no smaller |
| Buttons | 14–16px | **16px**, min height **52px** (was 44–48px implicit) |

### 4.3 Touch targets & spacing

- Minimum tappable area **48×48dp** (iOS/Android accessibility baseline); the
  theme-toggle button (`width:28-32, height:28-32` in every screen's
  `themeBtn` style) is currently under this — bump to 44–48.
- Increase spacing between stacked interactive cards from the current 8–20px
  to a consistent **16px** rhythm minimum, so mis-taps are less likely.

---

## 5. Spec A — Simplify the information architecture

**Principle: one primary thing per screen, everything else behind a tap.**

### Home / Progress (`src/screens/ProgressScreen.tsx`)
Current: date strip + 3 rings + strain score/zone-slider + streak banner +
4-stat all-time grid + activity log, all rendered at once (~600 lines of JSX
for one screen).

Redesign to a **two-tier layout**:
- **Tier 1 (always visible, top of screen):** one greeting line ("Good
  morning" / day name), one big primary card = *"Today"*: whether they've
  practiced today (yes/no, plain language, not a 0–21 "strain" score), and a
  single prominent **"Start Exercise"** button. This is the screen's one job.
- **Tier 2 (below, or behind a "See my progress" button):** the rings,
  streak, and all-time stats move here. Keep them — this data matters for
  motivation — but they are not the first thing an anxious first-time user
  has to parse.

Rename "Rehab Strain" → **"Today's Effort"** (or similar plain phrase) and
drop the 0.0–21.0 pseudo-clinical score in the primary view; keep the
safe/caution/halt zone concept (it's useful and already safety-grounded) but
express it as one of three short states: *"Safe pace" / "Take it a bit
easier" / "Time to rest"* rather than a decimal score + slider a first-time
user has to decode via a separate "?" modal.

### Session Summary (`src/screens/SummaryScreen.tsx`)
Keep the ROM/smoothness chart (it's genuinely useful for self-efficacy —
[C1] in research-references.md ties visible progress to confidence). Shorten
the three "CLINICAL ASSESSMENT / NEUROLOGICAL IMPACT / NEXT PRACTICE CUE"
paragraph blocks (`SummaryScreen.tsx:454-476`) from multi-sentence clinical
prose to one short plain-language sentence each, e.g.:
- Before: *"Rapid or jerky rotations recruit secondary compensatory muscle
  groups (e.g. shoulder hiking) instead of isolating the primary forearm
  rotator muscles."*
- After: *"You moved a bit fast — try slower, smoother turns next time."*

### Gyro Test tab
Remove from the patient-facing tab bar (`App.tsx:29-34`). It's a developer
calibration tool (`GyroTestScreen.tsx`), not a patient feature — leaving it
in a 4-tab bar adds a confusing item with no clear purpose for an elderly
user. Keep the screen/file for internal dev use; gate it behind a hidden
long-press on the app title or a debug build flag instead of a visible tab.

**Acceptance criteria:**
- No screen shows more than 1 "primary" numeric/score readout above the fold
  without a scroll or tap.
- No caption/label text under 13px anywhere in the app.
- Gyro test is not a visible tab for normal app launches.

---

## 6. Spec B — Light mode default + text reduction

1. `App.tsx:38` — change `useState<'dark' | 'light'>('dark')` to
   `useState<'dark' | 'light'>('light')`.
2. Apply the light palette from §4.1 as the default color set in every
   screen's `colors = { ... }` object (each screen currently derives its own
   `colors` from `isDark` inline — update the light-branch values, keep dark
   as the alternate branch, don't delete the toggle).
3. Copy pass: every screen has at least one paragraph-length string. Apply
   this rule — **one instruction = one short sentence.** Concretely:
   - `ExerciseScreen.tsx:276` onboarding subtitle, `288/294` step text: keep,
     already short — good model to copy elsewhere.
   - `SummaryScreen.tsx` `assessment`/`neuroImpact`/`nextCue` strings: shorten
     per §5's Summary section.
   - `ProgressScreen.tsx:286-289` coach messages and `297-317` per-state
     coach messages: cut to one sentence each; move any "why" explanation
     behind a tap (an info icon → modal), don't put it inline by default.

**Acceptance criteria:** default launch is light theme; no body paragraph in
the patient-facing flow exceeds ~2 short sentences without being behind a
"more info" tap.

---

## 7. Spec C — "Get Started" onboarding flow

### Behavior
- On **first launch only**, before the tab bar appears, show a short,
  swipeable/skippable walkthrough. Persist a flag with the
  `@react-native-async-storage/async-storage` dependency already in
  `package.json` (`AsyncStorage.getItem('pulihgo_onboarding_seen')`) so it
  never shows again automatically after the first time.
- Add a way to replay it later (small "?" / "How this app works" entry
  point somewhere persistent, e.g. a header icon on the Home tab) — elderly
  users forget a one-time tutorial; don't make it a one-shot secret.

### Content (4 short slides, each: 1 big icon/illustration, 1 short
headline, 1 short sentence, big "Next"/"Skip" buttons)
1. **Welcome** — "PulihGo helps you practice your arm exercises at home,
   safely." (no diagnostic claim — matches `AGENTS.md` guardrail #1)
2. **Home tab** — "See if you've practiced today and start your exercise
   here."
3. **Exercise tab** — "Pick an exercise, follow the steps, and the app
   counts your reps automatically."
4. **Safety** — "If anything hurts, tap 'Stop — it hurts' any time. It's
   always visible during an exercise, and stopping is never a bad thing."
   (grounds directly in the existing safety design, `safety.ts` +
   `ExerciseScreen.tsx:257-260`, and reflects `06-feature-spec.md` feature
   11's explicit "a pain-stopped session still counts towards the streak"
   design decision — don't contradict it.)

End with a single **"Get Started"** button that sets the AsyncStorage flag
and lands the user on the (now light-mode, simplified) Home tab.

### Implementation notes
- New file: `src/screens/OnboardingScreen.tsx`.
- `App.tsx` changes: on mount, read the AsyncStorage flag before rendering
  tabs; if unseen, render `<OnboardingScreen onDone={...} />` instead of the
  tab shell. This mirrors the existing `sessionStore.hydrate()` on-mount
  pattern at `App.tsx:43-45`.
- No navigation library needed — same plain `useState` pattern already used
  for tabs (`App.tsx:37`), e.g. `const [showOnboarding, setShowOnboarding] =
  useState<boolean | null>(null)` (null = "checking storage", to avoid a
  flash of the wrong screen).

**Acceptance criteria:** fresh install shows onboarding before any tab;
reinstalling/clearing storage shows it again; a returning user with the flag
set skips straight to Home; there's a way to reopen the walkthrough on
demand.

---

## 8. Spec D — Exercise Library (2 exercises)

### 8.1 What changes structurally

Today, the `exercise` tab *is* `ExerciseScreen.tsx`, hardcoded to one
movement via two module-level constants (`ExerciseScreen.tsx:19-20`):
```ts
const EXERCISE_AXIS: Axis = 'roll';
const EXERCISE_ID = 'forearm_supination';
```
and a hardcoded target (`ExerciseScreen.tsx:30`):
```ts
const DUMMY_TARGET_ROM_DEG = 70;
```

Change the `exercise` tab into a **two-step flow**:
1. New `ExerciseListScreen.tsx` — a small library/hub showing exercise
   cards (icon, name, one-line description, target ROM). Tapping a card
   opens that exercise.
2. `ExerciseScreen.tsx` — **generalize** to accept an `ExerciseConfig` prop
   (the interface already exists, unused, at `types.ts:39-45`) instead of
   reading module-level constants. Replace every reference to
   `EXERCISE_AXIS`, `EXERCISE_ID`, `DUMMY_TARGET_ROM_DEG` with
   `config.axis`, `config.id`, `config.targetRomDeg`. Also thread
   `config.romCeilingDeg` into the safety check currently hardcoded to
   `DEFAULT_ROM_CEILING_DEG` (`safety.ts:9`, used at
   `ExerciseScreen.tsx:13,110`) — pass it through instead of relying on the
   global default so each exercise can define its own safe ceiling.

`App.tsx` gets a small piece of local state for which exercise is selected
within the `exercise` tab (same `useState` pattern as the tab bar itself —
no navigation library needed):
```ts
const [selectedExercise, setSelectedExercise] = useState<ExerciseConfig | null>(null);
// tab === 'exercise' && (
//   selectedExercise
//     ? <ExerciseScreen config={selectedExercise} onExit={() => setSelectedExercise(null)} theme={theme} toggleTheme={toggleTheme} />
//     : <ExerciseListScreen exercises={EXERCISES} onSelect={setSelectedExercise} theme={theme} toggleTheme={toggleTheme} />
// )
```

### 8.2 The exercise list

New file, e.g. `src/exercises/exerciseLibrary.ts`:
```ts
import type { ExerciseConfig } from '../types';

export const EXERCISES: ExerciseConfig[] = [
  {
    id: 'forearm_supination',
    name: 'Forearm Supination / Pronation',
    axis: 'roll',
    targetRomDeg: 70,       // unchanged from current DUMMY_TARGET_ROM_DEG
    romCeilingDeg: 90,      // unchanged from safety.ts DEFAULT_ROM_CEILING_DEG
  },
  {
    id: 'elbow_flexion_extension',
    name: 'Elbow Flexion / Extension',
    axis: 'pitch',
    // TODO(clinical/tune): placeholder, same status as the existing
    // DUMMY_TARGET_ROM_DEG=70 — needs a therapist-set value per patient
    // (see 06-feature-spec.md feature 20). 90 is a conservative fraction of
    // typical elbow flexion ROM, not a claimed clinical target.
    targetRomDeg: 90,
    // TODO(clinical/tune): placeholder ceiling, mirrors safety.ts's own
    // DEFAULT_ROM_CEILING_DEG=90 TODO comment. Full active elbow flexion
    // can reach ~140-150° in healthy adults; this cap is intentionally
    // conservative until a clinician sets a per-patient limit.
    romCeilingDeg: 130,
  },
];
```

### 8.3 Why elbow flexion/extension is the right 2nd exercise (not wrist)

- **Same hardware, same honesty rule.** The MVP strap keeps the phone on the
  forearm (`06-feature-spec.md` feature 2). With the phone still there,
  bending/straightening the elbow *is* the forearm segment's pitch angle
  changing relative to gravity — no ambiguity from other joints, same
  single-sensor honesty argument the concept brief already makes for
  forearm supination/pronation (`01-concept-brief.md:65-71`, which
  explicitly lists "elbow flexion" alongside forearm rotation as an
  in-scope, single-sensor-honest movement). No new strap or hardware needed.
- **Independently validated in literature**, not just inferred from the
  existing rotational-exercise argument: see new reference
  **[T6]** in [`04-research-references.md`](./04-research-references.md) —
  Behnoush et al. (2016, *Asian Journal of Sports Medicine*) directly
  compared a smartphone inclinometer against a universal goniometer for
  elbow flexion across 60 adults (ages 22–72): inter-rater ICC 0.95 for the
  smartphone vs. 0.77 for the goniometer, concluding smartphones are a
  viable substitute. A broader systematic review (Pourahmadi et al., 2019,
  PLOS ONE, cited in the same T6 entry) confirms adequate reliability across
  joints including the elbow. This is a stronger, joint-specific citation
  than the general upper-limb framing T1/T2 already provide.
- **Axis mapping needs on-device verification, same as the original
  exercise.** `types.ts:9-13` defines `pitch` as "tilt forward/back," which
  is the natural axis for a hinge (flexion/extension) motion, vs. `roll`
  ("tilt left/right") already used for the twisting supination/pronation
  motion. Confirm this is actually the axis that moves most during elbow
  bending using the existing `GyroTestScreen.tsx` CSV-logging flow
  (`README.md:32-34`'s documented workflow: *"use it to confirm which axis
  your forearm rotation drives"*) before shipping — do not assume `pitch`
  is correct without that on-device check, exactly as the original
  `ExerciseScreen.tsx` comment (pre-refactor) warned for `roll`.
- **Wrist flexion/extension was considered and rejected for the MVP add:**
  it appears as an "Upcoming" mock row in
  `therapist-dashboard/src/App.tsx:99`, but it requires repositioning the
  phone to the back of the hand — a second strap point, i.e. new hardware
  UX, which belongs to `06-feature-spec.md` feature 14 ("Exercise library
  (multi-segment via strap)," tagged 🔵 Phase 2), not this UI/UX pass.

### 8.4 Exercise onboarding copy (per exercise, inside `ExerciseScreen.tsx`)

Reuse the existing onboarding-card pattern (`ExerciseScreen.tsx:273-305`),
parameterized per exercise instead of hardcoded to forearm steps. Suggested
copy for the new exercise, same 3-step format:
1. "Strap the phone screen-up along your affected forearm."  (unchanged —
   same strap position)
2. "Sit upright, arm relaxed at your side, elbow straight."
3. "Slowly bend your elbow, then straighten it back out."

**Acceptance criteria:**
- Exercise tab shows a library of 2 cards, not a single exercise directly.
- Selecting either card runs the *same* `ExerciseScreen` component
  parameterized by `ExerciseConfig` — no duplicated screen code.
- `pitch` axis choice for elbow flexion/extension is verified on a real
  device via Gyro Test before shipping (flag as a `TODO(verify-axis)` in
  code if shipped before verification is done).
- New exercise's target/ceiling values are marked `TODO(clinical/tune)`,
  matching the existing convention in `safety.ts:8-9` and
  `repDetector.ts:44-47` — do not present them as clinically validated
  numbers in any user-facing copy.

---

## 9. Non-goals / guardrails (do not cross)

Carried over from [`AGENTS.md`](../AGENTS.md) — this doc does not override
them:
1. No diagnostic or clinical-accuracy claims anywhere in new copy (onboarding,
   exercise cards, etc.) — "practice support," never "treatment" or
   "diagnosis."
2. No new clinical numbers without a source in `04-research-references.md`
   (this doc added [T6] for exactly this reason before proposing elbow
   flexion/extension).
3. Don't touch `src/metrics/`, `src/safety/safety.ts`'s core logic, or
   `src/sensors/` — this is a UI/IA/copy/theming pass plus the
   `ExerciseConfig` parameterization needed for a 2nd exercise. Rep
   detection, ROM math, and the pain-stop rule are unchanged.
4. Don't remove the pain-stop button, the "still counts toward streak" rule,
   or make stopping-for-pain feel like a failure state — simplification must
   not erode the existing safety design (feature 11 in
   `06-feature-spec.md`).
5. Keep offline-first — onboarding's "seen" flag and exercise selection are
   local (`AsyncStorage`/`useState`), no network dependency introduced.

---

## 10. Implementation checklist (suggested order)

```
1. [ ] Add [T6] reference — DONE (this doc's authoring session already
       appended it to 04-research-references.md).
2. [ ] Design tokens: introduce the §4 palette/type-scale as each screen's
       light-branch values in `colors = {...}` objects (Progress, Exercise,
       Summary, GyroTest screens + App.tsx tab bar).
3. [ ] App.tsx: flip default theme to 'light' (§6.1).
4. [ ] Copy pass: shorten paragraph strings per §5/§6.3 across
       ProgressScreen.tsx and SummaryScreen.tsx.
5. [ ] Remove Gyro Test from the visible tab bar (§5); keep the file for dev
       use.
6. [ ] Build OnboardingScreen.tsx + App.tsx wiring + AsyncStorage flag (§7).
7. [ ] Refactor ExerciseScreen.tsx to accept an ExerciseConfig prop instead
       of module constants (§8.1).
8. [ ] Add src/exercises/exerciseLibrary.ts with both ExerciseConfig entries
       (§8.2).
9. [ ] Build ExerciseListScreen.tsx + App.tsx wiring for the two-step
       exercise flow (§8.1).
10.[ ] Verify the elbow exercise's axis on a real device via Gyro Test
       before removing any TODO(verify-axis) marker (§8.3).
11.[ ] Simplify ProgressScreen.tsx into the tier-1/tier-2 layout (§5).
12.[ ] Re-run through the full flow on a real phone: fresh install →
       onboarding → Home → Exercise Library → each exercise → Summary,
       checking touch targets and text size on an actual small screen.
```

## 11. Definition of Done

- [ ] Fresh install opens in light mode and shows onboarding before any tab.
- [ ] Onboarding can be replayed later; it's not a permanent one-shot.
- [ ] Home tab shows one primary action above the fold; detailed stats are
      one tap away, not stacked by default.
- [ ] No visible text under 13px; no touch target under 44–48dp.
- [ ] Gyro Test is not in the patient-facing tab bar.
- [ ] Exercise tab shows 2 exercises via a shared, parameterized
      `ExerciseScreen`; no duplicated per-exercise screen code.
- [ ] Elbow flexion/extension's axis has been confirmed on a real device.
- [ ] Every new clinical/technical claim in code comments or copy traces to
      `04-research-references.md`.
- [ ] Pain-stop button and "stopping keeps your streak" behavior are
      unchanged and still visible/functional in both exercises.
