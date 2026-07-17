// src/audio/soundManager.ts
// Preloads and plays exercise-zone transition sounds.
// Owner: Radit | Branch: feat/additional-sound
//
// SAFETY: ceiling-warning is a WARNING tone, NOT a reward.
// Both sounds fire EXACTLY ONCE per zone transition (see ExerciseScreen).

import { Audio, type AVPlaybackSource } from 'expo-av';

// ---------------------------------------------------------------------------
// Asset references (loaded once at module level so the first trigger is lag-free)
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-var-requires */
const TARGET_REACHED_ASSET: AVPlaybackSource = require('../../assets/sounds/target-reached.mp3');
const CEILING_WARNING_ASSET: AVPlaybackSource = require('../../assets/sounds/ceiling-warning.mp3');
/* eslint-enable @typescript-eslint/no-var-requires */

let targetSound: Audio.Sound | null = null;
let ceilingSound: Audio.Sound | null = null;
let initialized = false;

// ---------------------------------------------------------------------------
// Initialization — called lazily on first play, not at import (avoids
// crashing on web/test where Audio may not be available).
// ---------------------------------------------------------------------------

async function ensureInitialized(): Promise<void> {
  if (initialized) return;
  initialized = true;

  try {
    // WAJIB: supaya sound tetap terdengar saat iPhone di silent switch
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      // Don't interrupt background music / other audio sessions
      shouldDuckAndroid: true,
    });

    const [targetResult, ceilingResult] = await Promise.all([
      Audio.Sound.createAsync(TARGET_REACHED_ASSET, { shouldPlay: false, volume: 0.15 }),
      Audio.Sound.createAsync(CEILING_WARNING_ASSET, { shouldPlay: false, volume: 1.0, isLooping: true }),
    ]);

    targetSound = targetResult.sound;
    ceilingSound = ceilingResult.sound;
  } catch (err) {
    // Audio failing must never crash the app — the exercise still works without sound.
    console.warn('[soundManager] Failed to initialize audio:', err);
  }
}

// ---------------------------------------------------------------------------
// Replay helper — rewinds to 0 then plays, so the same Sound instance can
// be triggered repeatedly without re-creating it.
// ---------------------------------------------------------------------------

async function replaySound(sound: Audio.Sound | null): Promise<void> {
  if (!sound) return;
  try {
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch (err) {
    console.warn('[soundManager] Playback error (non-fatal):', err);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Play the short positive "ding" when the patient reaches their target ROM. */
export async function playTargetReached(): Promise<void> {
  await ensureInitialized();
  await replaySound(targetSound);
}

/** Play the neutral warning tone (looping) when the patient exceeds the safe ROM ceiling. */
export async function playCeilingWarning(): Promise<void> {
  await ensureInitialized();
  await replaySound(ceilingSound);
}

/** Stop the ceiling warning loop when the patient returns to a safe zone. */
export async function stopCeilingWarning(): Promise<void> {
  if (!ceilingSound) return;
  try {
    await ceilingSound.stopAsync();
    await ceilingSound.setPositionAsync(0);
  } catch (err) {
    console.warn('[soundManager] Stop ceiling error (non-fatal):', err);
  }
}
