// src/progress/streak.ts
// OWNER: Radit · STATUS: ✅ working (pure logic — no sensors, no storage)
// Adherence metrics derived from saved sessions. Pure functions over
// SessionSummary[] so they can be reasoned about and tested without a phone.

import type { SessionSummary } from '../types';

export interface StreakInfo {
  current: number; // consecutive days practised, up to today
  best: number; // longest run ever recorded
  practicedToday: boolean;
}

/**
 * Local calendar day, e.g. "2026-07-16". Deliberately LOCAL, not UTC: a
 * patient's "today" is their own midnight, not Greenwich's.
 */
export function dayKey(ms: number): string {
  const d = new Date(ms);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function parseDayKey(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
}

/** Shift by whole calendar days. Uses setDate so DST and month ends stay correct. */
function addDays(ms: number, delta: number): number {
  const d = new Date(ms);
  d.setDate(d.getDate() + delta);
  return d.getTime();
}

/**
 * Streak = consecutive calendar days with at least one session.
 *
 * SAFETY (AGENTS.md guardrail 3): every session counts, including one the
 * patient ended with "stopped" for pain. Showing up is the behaviour we reward
 * — never rep count, never angle. Stopping because it hurts must never cost a
 * patient their streak, or the streak becomes a reason to push through pain.
 *
 * Not practising *yet* today does not break the streak: the day isn't over, so
 * the run stays alive until today actually passes without a session.
 */
export function computeStreak(sessions: SessionSummary[], now: number = Date.now()): StreakInfo {
  const days = new Set(sessions.map((s) => dayKey(s.startedAt)));
  if (days.size === 0) return { current: 0, best: 0, practicedToday: false };

  const practicedToday = days.has(dayKey(now));

  let cursor = practicedToday ? now : addDays(now, -1);
  let current = 0;
  while (days.has(dayKey(cursor))) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const key of [...days].sort()) {
    run = prev !== null && dayKey(addDays(parseDayKey(prev), 1)) === key ? run + 1 : 1;
    if (run > best) best = run;
    prev = key;
  }

  return { current, best, practicedToday };
}

/** Best peak ROM ever recorded, in degrees. 0 when there's nothing yet. */
export function bestRomDeg(sessions: SessionSummary[]): number {
  return sessions.reduce((max, s) => Math.max(max, s.peakRomDeg), 0);
}

/** Total reps completed across every session. */
export function totalReps(sessions: SessionSummary[]): number {
  return sessions.reduce((n, s) => n + s.reps.length, 0);
}
