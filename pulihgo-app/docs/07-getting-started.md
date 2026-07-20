# 07 — Getting Started

Get PulihGo running on your phone in ~5–10 minutes. Includes the exact fixes for
the errors we already hit, so you don't lose time to them.

## Prerequisites
- **Node.js LTS** — install from nodejs.org
- **Expo Go** app on your phone (App Store / Play Store) — must be the **latest**
  available build. This project is pinned to **Expo SDK 54** to match — Apple's
  review queue lags behind npm, so the App Store's Expo Go build is often a
  version or two older than whatever `npx create-expo-app` would give you.
  Don't bump the `expo` package in `package.json` past `~54.x` without first
  checking that Expo Go's App Store release has caught up (see the fix below).
- Laptop + phone on the **same wifi** (or use the phone's hotspot)

## Run the project

Two apps, two terminals. They only meet at Supabase — the phone never talks to
the dashboard directly.

### Terminal 1 — the patient app 📱

```bash
cd pulihgo-app       # the repo ROOT has no package.json — this trips everyone up
npm install          # .npmrc already sets legacy-peer-deps=true
npx expo start       # a QR code appears
```
Scan the QR with **Expo Go** (iPhone: use the Camera app). The app loads with hot
reload — save a file and it updates on the phone in ~1 second.

Handy keys in the Expo terminal: **`r`** reload · **`j`** open debugger console ·
**`c`** show the QR again · **`i`** iOS simulator (no real gyroscope though).

### Terminal 2 — the therapist dashboard 💻

```bash
cd therapist-dashboard
npm install
npm run dev          # → http://localhost:5173
```

React + Vite + Recharts. Vite hot-reloads on save. Refresh in the dashboard is
**manual** — there's no realtime subscription, so hit **Refresh** after finishing
a session on the phone to see it appear.

---

## Environment variables

Both apps read the **same Supabase project** with the **same anon key** — but the
variable names differ, because the two build tools inline different prefixes.

| File | Variables |
|------|-----------|
| `pulihgo-app/.env` | `EXPO_PUBLIC_SUPABASE_URL`<br/>`EXPO_PUBLIC_SUPABASE_ANON_KEY` |
| `therapist-dashboard/.env` | `VITE_SUPABASE_URL`<br/>`VITE_SUPABASE_ANON_KEY` |

Copy each project's `.env.example`, fill in the values from Supabase → Project
Settings → API, and **restart the dev server** — neither Expo nor Vite picks up
`.env` changes on hot reload.

### ⚠️ The prefix trap — this has already cost us hours

Expo only inlines `EXPO_PUBLIC_*`. Vite only inlines `VITE_*`. If you paste the
dashboard's `VITE_*` names into `pulihgo-app/.env`:

- `supabase` resolves to `null`
- **every phone sync dies silently** — sessions never upload, prescriptions never
  download
- **no error is shown anywhere**, because sync is deliberately best-effort and
  swallows failures (that's what keeps the app working offline)

The app looks completely fine and quietly stops talking to the cloud. If sync
"just stops working", check the **prefixes in `.env` first**, before the code.

Without a `.env` the app still runs, fully local, warning once in the console.
That's by design — Supabase is never required to practise.

### Key safety

Never commit a `.env` — both are gitignored. The **anon** key is public by design
(it ships inside the app bundle and the dashboard's JS). The **`service_role`**
key is a real secret and must never appear in either file.

---

## After every `git pull`: `npm install`

When a teammate adds a dependency, your `node_modules` goes stale and the error
you get **never mentions installing**. Both of these have already happened here:

```
Unable to resolve module expo-av from src/audio/soundManager.ts   → someone added audio
Cannot find module '@supabase/supabase-js'                        → someone added sync
```

The fix is always `npm install` in that project's folder — never a code change.

**Adding a dependency yourself?** Use `npx expo install <pkg>` in `pulihgo-app`,
not `npm install <pkg>` — Expo picks the version matching SDK 54. Plain npm will
happily install a version that breaks Expo Go. In `therapist-dashboard`, plain
`npm install` is correct.

> **Note on `expo-audio` / `expo-video`:** these are **not** bundled inside the
> `expo` package — install them separately (`npx expo install expo-audio`). The
> native side already ships inside Expo Go, so no rebuild is needed, but the JS
> package must be in `package.json`. Only `@expo/vector-icons`, `expo-asset`,
> `expo-constants`, `expo-file-system`, `expo-font` and `expo-keep-awake` come
> with `expo` automatically. `expo-av` (which `src/audio/soundManager.ts` uses)
> is **deprecated in SDK 54** — it still works, but `expo-audio` is its
> replacement when someone has time to migrate.

---

## Fixes for errors we already saw

### "Project is incompatible with this version of Expo Go" (SDK mismatch)
iOS only lets you install the **latest** Expo Go from the App Store, and that
build supports a specific max SDK (currently **54** — check
[expo.dev/changelog](https://expo.dev/changelog) if this project ever bumps
past it). Match the **project** to whatever Expo Go can actually open:
```bash
npx expo install expo@^54   # or whatever SDK Expo Go's App Store build supports
npx expo install --fix
npx expo start -c        # -c clears the cache (important after an SDK change)
```
Everyone on the team must be on the **same SDK** and have **updated Expo Go**, or
they'll hit this wall. Don't jump to the newest SDK just because it's newest —
`npx create-expo-app` and `npx expo install expo@latest` will happily give you
an SDK that hasn't reached the App Store yet, which reproduces this exact error.

### npm `ERESOLVE ... @types/react` peer dependency error
It's just npm being strict about a `@types` version — not a real code problem.
```bash
npx expo install @types/react   # installs the version the SDK expects
npx expo install --fix
npx expo start -c
```
If it still complains, `.npmrc` in this repo already contains `legacy-peer-deps=true`,
which tells npm to stop blocking on it. Just run `npm install` again.

### Numbers stuck at 0.0 / sensor not moving
Shake the phone once to wake the sensor, then press **`r`** to reload. Make sure you
tapped **Allow** on the Motion permission prompt (iPhone: Settings → Expo Go →
Motion & Fitness).

---

## First thing to do after it runs
1. Open the **Gyro test** tab.
2. Strap the phone to a forearm, rotate the palm up/down (supination/pronation).
3. Note which value moves most — **pitch, roll, or yaw**.
4. Set that axis as `EXERCISE_AXIS` in `src/screens/ExerciseScreen.tsx`.
5. Open the **Exercise** tab, tap **Calibrate**, and do a few reps — it should count
   them and show peak ROM.

That's the MVP loop working end-to-end. From here, tune the rep thresholds
(`src/metrics/repDetector.ts`) to your phone's real numbers.
