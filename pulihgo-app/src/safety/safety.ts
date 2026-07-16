// src/safety/safety.ts
// OWNER: Sulthan · STATUS: ✅ working baseline
// The features that answer the mentor's "could it make symptoms worse?" concern.
// NEVER reward maximum angle or maximum reps — only correct, safe movement.

import type { PainLevel } from '../types';

// TODO(clinical): a therapist should set this per patient (Phase 3).
export const DEFAULT_ROM_CEILING_DEG = 90;

export const PAIN_OPTIONS: PainLevel[] = ['none', 'mild', 'stopped'];

/** True if the patient has rotated past the safe ceiling. */
export function isPastCeiling(angleDeg: number, ceiling = DEFAULT_ROM_CEILING_DEG) {
  return Math.abs(angleDeg) > ceiling;
}
