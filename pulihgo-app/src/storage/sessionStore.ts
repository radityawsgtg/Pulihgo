// src/storage/sessionStore.ts
// OWNER: Sulthan · STATUS: 🟡 in-memory baseline
// MVP keeps sessions in memory. TODO(phase-1): persist across app restarts with
// expo-sqlite or @react-native-async-storage/async-storage (offline-first).

import type { SessionSummary } from '../types';

const sessions: SessionSummary[] = [];

export const sessionStore = {
  add(s: SessionSummary) {
    sessions.unshift(s);
  },
  all(): SessionSummary[] {
    return [...sessions];
  },
  last(): SessionSummary | undefined {
    return sessions[0];
  },
  clear() {
    sessions.length = 0;
  },
};
