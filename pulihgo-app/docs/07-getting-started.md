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
```bash
# from the pulihgo-app folder
npm install          # .npmrc already sets legacy-peer-deps=true
npx expo start       # a QR code appears
```
Scan the QR with **Expo Go** (iPhone: use the Camera app). The app loads with hot
reload — save a file and it updates on the phone in ~1 second.

Handy keys in the Expo terminal: **`r`** reload · **`j`** open debugger console ·
**`c`** show the QR again · **`i`** iOS simulator (no real gyroscope though).

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
