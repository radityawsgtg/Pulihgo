// src/lib/supabase.ts
// OWNER: shared · STATUS: reads `sessions`, reads+writes `prescriptions`
//
// Reads the SAME `sessions` table pulihgo-app/ (the patient app) writes to
// via its own src/sync/uploadSession.ts. The dashboard NEVER writes to
// `sessions` — sessions are measured on the phone, and only the phone may
// author them.
//
// `prescriptions` is the other direction: the therapist SETS the plan here,
// and the phone reads it. App measures · therapist prescribes · patient does.
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

/* ─────────────────────────── prescriptions ─────────────────────────── */

/** One row of `prescriptions`. The phone reads this to know its target/ceiling. */
export interface DbPrescription {
  patient_id: string;
  target_rom: number;
  rom_ceiling: number;
  target_reps: number;
  exercise: string;
  updated_at: string;
}

/** What the therapist can set. `exercise` is left to the table default — the
 *  MVP measures exactly one movement, so there is nothing to choose yet. */
export interface PrescriptionInput {
  patient_id: string;
  target_rom: number;
  rom_ceiling: number;
  target_reps: number;
}

/**
 * The active prescription for one patient, or `null` if the therapist hasn't
 * set one yet. Throws on real failures (missing config, offline, Postgres
 * error) so the caller can show an error state — "no row yet" is NOT a
 * failure, hence maybeSingle() + null rather than a throw.
 */
export async function fetchPrescription(patientId: string): Promise<DbPrescription | null> {
  if (!supabase) {
    throw new Error('Supabase belum dikonfigurasi (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY kosong)');
  }

  const { data, error } = await supabase
    .from('prescriptions')
    .select('patient_id, target_rom, rom_ceiling, target_reps, exercise, updated_at')
    .eq('patient_id', patientId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

/**
 * Insert-or-update the patient's single active prescription.
 *
 * `patient_id` is UNIQUE, so onConflict upserts in place — editing and
 * re-submitting must UPDATE the existing row, never append a second one.
 *
 * `updated_at` is set explicitly on purpose: the column's `default now()`
 * only fires on INSERT, so without this an edited prescription would keep
 * reporting the time it was first created.
 */
export async function upsertPrescription(rx: PrescriptionInput): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase belum dikonfigurasi (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY kosong)');
  }

  const { error } = await supabase
    .from('prescriptions')
    .upsert({ ...rx, updated_at: new Date().toISOString() }, { onConflict: 'patient_id' });

  if (error) throw error;
}
