// src/sensors/useCalibratedAngle.ts
// OWNER: Radit · STATUS: ✅ working
// Wraps useDeviceAngle and adds a "zero" so every session measures from the
// SAME start position (like pressing tare on a scale). Fixes strap-angle drift.

import { useCallback, useRef, useState } from 'react';
import { useDeviceAngle } from './useDeviceAngle';
import type { Angles } from '../types';

export function useCalibratedAngle(updateMs = 50) {
  const { angles, granted } = useDeviceAngle(updateMs);
  const [offset, setOffset] = useState<Angles>({ pitch: 0, roll: 0, yaw: 0 });

  const latest = useRef(angles);
  latest.current = angles;

  // Call while the patient holds the neutral start position.
  const calibrate = useCallback(() => setOffset({ ...latest.current }), []);

  const calibrated: Angles = {
    pitch: angles.pitch - offset.pitch,
    roll: angles.roll - offset.roll,
    yaw: angles.yaw - offset.yaw,
  };

  return { angles: calibrated, raw: angles, granted, calibrate };
}
