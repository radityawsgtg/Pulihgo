// src/sync/fetchPrescription.ts
// OWNER: Radit · STATUS: best-effort read, offline-first
//
// The other half of the sync loop: uploadSession.ts sends results UP to the
// therapist; this reads the therapist's plan DOWN to the phone. Same rules as
// the upload side (AGENTS.md guardrail 6): none of this may ever block or
// crash a practice session. Every function here resolves — never throws, never
// hangs. Resolution order: server → last cached value → built-in defaults.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';
import { DEFAULT_ROM_CEILING_DEG } from '../safety/safety';

// Must match DUMMY_PATIENT_ID in uploadSession.ts — same TODO(auth): both
// become the real patient id once login exists. Deliberately duplicated
// rather than refactoring uploadSession, which is working and out of scope.
const PATIENT_ID = 'demo01';

const CACHE_KEY = 'pulihgo.prescription.v1';

// How long we let the server fetch run before giving up and falling back.
// Bounded on purpose: a hung request on flaky wifi must not leave the patient
// staring at a loading spinner — offline-first means *promptly* offline.
const FETCH_TIMEOUT_MS = 4000;

/** The plan the Exercise screen runs against, wherever it came from. */
export interface ActivePrescription {
  targetRomDeg: number;
  romCeilingDeg: number;
  targetReps: number;
  /** 'server' = live from Supabase · 'cache' = last value the therapist set,
   *  read from AsyncStorage while offline · 'default' = built-in fallback,
   *  never seen a therapist. Shown in the UI so the demo can prove which. */
  source: 'server' | 'cache' | 'default';
}

// Used when the phone is offline AND has never successfully fetched a plan.
// TODO(clinical): like everything else unvalidated, a therapist should own
// these numbers eventually.
export const FALLBACK_TARGET_ROM_DEG = 70;
export const FALLBACK_ROM_CEILING_DEG = DEFAULT_ROM_CEILING_DEG; // 90

const FALLBACK: ActivePrescription = {
  targetRomDeg: FALLBACK_TARGET_ROM_DEG,
  romCeilingDeg: FALLBACK_ROM_CEILING_DEG,
  targetReps: 10,
  source: 'default',
};

interface StoredRx {
  targetRomDeg: number;
  romCeilingDeg: number;
  targetReps: number;
}

/** Reject rows a buggy write or hand-edited table could produce. */
function isSane(rx: StoredRx): boolean {
  return (
    Number.isFinite(rx.targetRomDeg) && rx.targetRomDeg > 0 &&
    Number.isFinite(rx.romCeilingDeg) && rx.romCeilingDeg > 0 &&
    Number.isFinite(rx.targetReps) && rx.targetReps > 0
  );
}

/** One fetch from the `prescriptions` table. Null on ANY failure — missing
 *  config, offline, timeout, no row yet, malformed row. Never throws. */
export async function fetchPrescriptionFromServer(): Promise<StoredRx | null> {
  if (!supabase) return null; // supabaseClient already warned once

  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const query = supabase
      .from('prescriptions')
      .select('target_rom, rom_ceiling, target_reps')
      .eq('patient_id', PATIENT_ID)
      .maybeSingle();

    const timeout = new Promise<null>((resolve) => {
      timer = setTimeout(() => resolve(null), FETCH_TIMEOUT_MS);
    });

    const result = await Promise.race([query, timeout]);
    if (!result || result.error || !result.data) return null;

    const rx: StoredRx = {
      targetRomDeg: Number(result.data.target_rom),
      romCeilingDeg: Number(result.data.rom_ceiling),
      targetReps: Number(result.data.target_reps),
    };
    return isSane(rx) ? rx : null;
  } catch (e) {
    console.warn('[fetchPrescription] server fetch failed, will fall back', e);
    return null;
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

async function readCache(): Promise<StoredRx | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const rx = JSON.parse(raw) as StoredRx;
    return isSane(rx) ? rx : null;
  } catch {
    return null; // corrupt cache = no cache
  }
}

function writeCache(rx: StoredRx): void {
  // Fire-and-forget, same as sessionStore.persist(): a failed cache write
  // must never surface to the patient.
  AsyncStorage.setItem(CACHE_KEY, JSON.stringify(rx)).catch(() => {});
}

/**
 * The plan to practice against, resolved offline-first:
 *   1. live from Supabase (and re-cache it),
 *   2. else the last successfully fetched plan (offline after being online),
 *   3. else built-in defaults (fresh install, never online).
 * Always resolves within ~FETCH_TIMEOUT_MS. Never throws.
 */
export async function resolveActivePrescription(): Promise<ActivePrescription> {
  const server = await fetchPrescriptionFromServer();
  if (server) {
    writeCache(server);
    return { ...server, source: 'server' };
  }

  const cached = await readCache();
  if (cached) return { ...cached, source: 'cache' };

  return FALLBACK;
}
