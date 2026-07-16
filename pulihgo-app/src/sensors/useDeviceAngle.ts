// src/sensors/useDeviceAngle.ts
// OWNER: Radit · STATUS: ✅ working (this is what you already tested)
// Reads iOS's already-fused orientation (no filter needed — iOS does it).
// Returns live angles in degrees + whether motion permission was granted.

import { useEffect, useRef, useState } from 'react';
import { DeviceMotion } from 'expo-sensors';
import type { Angles } from '../types';

const toDeg = (rad: number) => (rad * 180) / Math.PI;

export function useDeviceAngle(updateMs = 50) {
  const [angles, setAngles] = useState<Angles>({ pitch: 0, roll: 0, yaw: 0 });
  const [granted, setGranted] = useState<boolean | null>(null);
  const subRef = useRef<{ remove: () => void }>();

  useEffect(() => {
    (async () => {
      const res = await DeviceMotion.requestPermissionsAsync();
      setGranted(res.granted);
      if (!res.granted) return;
      DeviceMotion.setUpdateInterval(updateMs);
      subRef.current = DeviceMotion.addListener(({ rotation }) => {
        if (!rotation) return;
        setAngles({
          pitch: toDeg(rotation.beta),  // alpha=yaw, beta=pitch, gamma=roll
          roll: toDeg(rotation.gamma),
          yaw: toDeg(rotation.alpha),
        });
      });
    })();
    return () => subRef.current?.remove();
  }, [updateMs]);

  return { angles, granted };
}
