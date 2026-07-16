// src/sync/uploadSession.ts
// OWNER: shared · STATUS: best-effort sync, additive only
//
// Sends one already-locally-saved session to Supabase for the (future)
// therapist dashboard. This is a LAYER ON TOP of sessionStore, never a
// replacement: the session is already safe on-device (AsyncStorage) before
// this ever runs, and this function must never throw — a failed/offline
// upload is swallowed and logged, not surfaced to the patient
// (AGENTS.md guardrail 6: offline-first, a session must record with no
// network).

import { supabase } from './supabaseClient';
import type { SessionSummary } from '../types';

// TODO(auth): replace with the real patient id once login / patient setup
// exists. Every session uploads under this one id until then.
const DUMMY_PATIENT_ID = 'demo01';

/**
 * Upload a session to the Supabase `sessions` table. Never throws — on any
 * failure (offline, RLS rejection, missing config) it logs a warning and
 * returns, leaving the local copy in sessionStore as the source of truth.
 */
export async function uploadSession(session: SessionSummary): Promise<void> {
  if (!supabase) return; // already warned once in supabaseClient.ts

  try {
    const { error } = await supabase.from('sessions').insert({
      patient_id: DUMMY_PATIENT_ID,
      reps: session.reps.length,
      peak_rom: session.peakRomDeg,
      duration_ms: session.endedAt - session.startedAt,
      pain_flag: session.pain,
      created_at: new Date(session.endedAt).toISOString(),
    });
    if (error) throw error;
  } catch (e) {
    console.warn('[uploadSession] sync to Supabase failed, session stays local-only', e);
  }
}
