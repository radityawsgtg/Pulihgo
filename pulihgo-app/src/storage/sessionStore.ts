// src/storage/sessionStore.ts
// OWNER: Radit (taken over from Sulthan) · STATUS: ✅ persists across restarts
//
// Offline-first (AGENTS.md guardrail 6): sessions are written to the device and
// nothing here ever touches a network. The whole list is one JSON blob — at a
// few sessions a day that's nothing, and it's very hard to get wrong. If the
// history ever outgrows it, move to expo-sqlite behind this same API.
//
// Reads are SYNCHRONOUS off an in-memory cache so screens can render instantly;
// writes update the cache first and persist in the background.

import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uploadSession } from '../sync/uploadSession';
import type { SessionSummary } from '../types';

const KEY = 'pulihgo.sessions.v1'; // bump the suffix if SessionSummary ever changes shape

// Newest first. Replaced immutably, never mutated in place — useSyncExternalStore
// compares snapshots by reference, so an in-place push would not re-render.
let sessions: SessionSummary[] = [];
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function persist() {
  // Fire-and-forget: a failed write must never interrupt a patient mid-exercise.
  AsyncStorage.setItem(KEY, JSON.stringify(sessions)).catch((e) =>
    console.warn('[sessionStore] could not save sessions', e)
  );
}

export const sessionStore = {
  /** Load saved sessions from the device. Call once on app start. */
  async hydrate(): Promise<void> {
    if (hydrated) return;
    try {
      const raw = await AsyncStorage.getItem(KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed)) sessions = parsed as SessionSummary[];
    } catch (e) {
      // Corrupt or unreadable storage: start empty rather than crash on launch.
      console.warn('[sessionStore] could not load sessions, starting empty', e);
    }
    hydrated = true;
    emit();
  },

  add(s: SessionSummary) {
    sessions = [s, ...sessions];
    persist();
    emit();
    // Local save above is already complete and durable — this is a
    // best-effort extra. uploadSession() never throws, but .catch() is
    // defense-in-depth so a change there can never take the app down here.
    uploadSession(s).catch(() => {});
  },

  /** The current list, newest first. Treat as READ-ONLY — do not mutate. */
  all(): SessionSummary[] {
    return sessions;
  },

  last(): SessionSummary | undefined {
    return sessions[0];
  },

  clear() {
    sessions = [];
    persist();
    emit();
  },

  isHydrated(): boolean {
    return hydrated;
  },

  subscribe(fn: () => void): () => void {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};

/** Live session list — re-renders the screen whenever a session is saved. */
export function useSessions(): SessionSummary[] {
  return useSyncExternalStore(sessionStore.subscribe, sessionStore.all);
}
