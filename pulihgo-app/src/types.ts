// src/types.ts
// Single source of truth for shared types. Import from here everywhere ΓÇö
// never redefine Session/RepMetric/Angles locally in a screen or module.

/** The three rotation axes we get from the phone. */
export type Axis = 'pitch' | 'roll' | 'yaw';

/** Live orientation angles, in DEGREES. */
export interface Angles {
  pitch: number; // tilt forward/back
  roll: number;  // tilt left/right
  yaw: number;   // twist while flat
}

/** One completed repetition of an exercise. */
export interface RepMetric {
  index: number;       // 1, 2, 3...
  peakRomDeg: number;  // furthest angle reached in this rep (degrees)
  durationMs: number;  // how long the rep took
  smoothness: number;  // 0..1, higher = smoother movement
}

/** Patient's pain response for a session (safety). */
export type PainLevel = 'none' | 'mild' | 'stopped' | 'unknown';

/** A finished practice session, saved on the device. */
export interface SessionSummary {
  id: string;
  exerciseId: string;
  startedAt: number;   // epoch ms
  endedAt: number;     // epoch ms
  reps: RepMetric[];
  peakRomDeg: number;  // best ROM across the session
  avgSmoothness: number;
  pain: PainLevel;
}

/** Definition of one exercise (MVP ships exactly one). */
export interface ExerciseConfig {
  id: string;
  name: string;
  axis: Axis;            // which fused angle to measure/score
  targetRomDeg: number;  // the goal we nudge toward
  romCeilingDeg: number; // SAFETY cap ΓÇö never reward going past this
}
