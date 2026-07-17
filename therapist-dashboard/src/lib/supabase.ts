// src/lib/supabase.ts
// OWNER: shared · STATUS: read-only client for the dashboard
//
// Reads the SAME `sessions` table pulihgo-app/ (the patient app) writes to
// via its own src/sync/uploadSession.ts. This file only ever reads — the
// dashboard never writes to `sessions`.
//
// Credentials come from env, never hardcoded here. Vite inlines any VITE_*
// var from `.env` at build time — see .env.example for what to fill in.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// `null` when credentials aren't configured — fetchSessions() throws a
// friendly error in that case instead of this module crashing at import time.
export const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

if (!supabase) {
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set — ' +
      'Reports/Dashboard cannot load real sessions. See .env.example.'
  );
}

/** Shape of one row in the `sessions` table, as written by pulihgo-app's uploadSession.ts. */
export interface DbSession {
  patient_id: string;
  reps: number;
  peak_rom: number;
  duration_ms: number;
  pain_flag: 'none' | 'mild' | 'stopped';
  created_at: string; // ISO timestamp (Postgres timestamptz)
}

/**
 * Fetch every session for one patient, oldest first (charts/tables below
 * assume chronological order). Throws on any failure — missing config,
 * offline, or a Supabase/Postgres error — so callers can show a proper error
 * state instead of silently rendering stale or empty data.
 */
export async function fetchSessions(patientId: string): Promise<DbSession[]> {
  if (!supabase) {
    throw new Error('Supabase belum dikonfigurasi (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY kosong)');
  }

  const { data, error } = await supabase
    .from('sessions')
    .select('patient_id, reps, peak_rom, duration_ms, pain_flag, created_at')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}
