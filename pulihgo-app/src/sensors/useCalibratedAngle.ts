// src/sensors/useCalibratedAngle.ts
// OWNER: Radit · STATUS: ✅ working
// Wraps useDeviceAngle and adds a "zero" so every session measures from the
// SAME start position (like pressing tare on a scale). Fixes strap-angle drift.

import { useCallback, useRef, useState } from 'react';
import { useDeviceAngle } from './useDeviceAngle';
import type { Angles } from '../types';

// Wrap a degree value into (-180, 180]. Subtracting the calibration offset
// can push a raw angle past +-180 (e.g. raw=170, offset=-170 -> 340), which
// would otherwise show up as a sudden jump instead of the true short-way
// rotation (-20). This is a modulo wrap, not a clamp — no data is discarded,
// values just get mapped onto their equivalent angle in the normal range.
// (ROM ceiling/target comparisons downstream assume a jump-free angle, so
// this has to happen here, before anything reads the calibrated value.)
function wrapDeg180(deg: number): number {
  const mod360 = ((deg % 360) + 360) % 360; // normalize to [0, 360)
  return mod360 > 180 ? mod360 - 360 : mod360; // shift to (-180, 180]
}

export function useCalibratedAngle(updateMs = 50) {
  const { angles, granted } = useDeviceAngle(updateMs);
  const [offset, setOffset] = useState<Angles>({ pitch: 0, roll: 0, yaw: 0 });

  const latest = useRef(angles);
  latest.current = angles;

  // Call while the patient holds the neutral start position.
  const calibrate = useCallback(() => setOffset({ ...latest.current }), []);

  const calibrated: Angles = {
    pitch: wrapDeg180(angles.pitch - offset.pitch),
    roll: wrapDeg180(angles.roll - offset.roll),
    yaw: wrapDeg180(angles.yaw - offset.yaw),
  };

  return { angles: calibrated, raw: angles, granted, calibrate };
}
