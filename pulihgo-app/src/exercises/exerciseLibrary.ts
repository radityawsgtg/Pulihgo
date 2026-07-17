// src/exercises/exerciseLibrary.ts
import type { ExerciseConfig } from '../types';

export const EXERCISES: ExerciseConfig[] = [
  {
    id: 'forearm_supination',
    name: 'Forearm Supination / Pronation',
    axis: 'roll',
    targetRomDeg: 70,       // unchanged from current DUMMY_TARGET_ROM_DEG
    romCeilingDeg: 90,      // unchanged from safety.ts DEFAULT_ROM_CEILING_DEG
  },
];
