// src/sync/usePrescription.ts
// OWNER: Radit · STATUS: ✅ working
//
// React wrapper around resolveActivePrescription(). Fetches ONCE on mount (no
// polling — per the sprint plan, a changed prescription is picked up on the
// next app start). While resolving, `rx` already holds the built-in defaults
// so nothing downstream ever sees undefined; `status` lets the UI say
// "loading your plan…" instead of flashing a number that may change.

import { useEffect, useState } from 'react';
import {
  resolveActivePrescription,
  FALLBACK_TARGET_ROM_DEG,
  FALLBACK_ROM_CEILING_DEG,
  type ActivePrescription,
} from './fetchPrescription';

interface PrescriptionState {
  rx: ActivePrescription;
  status: 'loading' | 'ready';
}

export function usePrescription(): PrescriptionState {
  const [state, setState] = useState<PrescriptionState>({
    rx: {
      targetRomDeg: FALLBACK_TARGET_ROM_DEG,
      romCeilingDeg: FALLBACK_ROM_CEILING_DEG,
      targetReps: 10,
      source: 'default',
    },
    status: 'loading',
  });

  useEffect(() => {
    let cancelled = false;
    // resolveActivePrescription never throws and resolves within its own
    // timeout, so no catch/finally is needed — but the cancelled flag guards
    // against setState after unmount (e.g. user switches tabs immediately).
    resolveActivePrescription().then((rx) => {
      if (!cancelled) setState({ rx, status: 'ready' });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
