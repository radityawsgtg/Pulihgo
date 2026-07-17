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
  {
    id: 'elbow_flexion_extension',
    name: 'Elbow Flexion / Extension',
    axis: 'pitch',
    // TODO(clinical/tune): placeholder, same status as the existing
    // DUMMY_TARGET_ROM_DEG=70 ΓÇö needs a therapist-set value per patient
    // (see 06-feature-spec.md feature 20). 90 is a conservative fraction of
    // typical elbow flexion ROM, not a claimed clinical target.
    targetRomDeg: 90,
    // TODO(clinical/tune): placeholder ceiling, mirrors safety.ts's own
    // DEFAULT_ROM_CEILING_DEG=90 TODO comment. Full active elbow flexion
    // can reach ~140-150┬░ in healthy adults; this cap is intentionally
    // conservative until a clinician sets a per-patient limit.
    romCeilingDeg: 130,
  },
];
