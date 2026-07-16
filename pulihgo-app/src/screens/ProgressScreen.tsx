// src/screens/ProgressScreen.tsx
// OWNER: Radit (taken over from Sulthan) · STATUS: ✅ working
//
// The patient's own progress view — feature 15 in docs/06-feature-spec.md.
// Local only: no API, no cloud, no account. Works with the phone in aeroplane mode.

import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSessions } from '../storage/sessionStore';
import { computeStreak, bestRomDeg, totalReps } from '../progress/streak';
import type { SessionSummary } from '../types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Hand-rolled rather than toLocaleDateString: Intl support varies across Hermes
// builds, and a date that renders as "Invalid Date" on one phone is not worth it.
function shortDate(ms: number): string {
  const d = new Date(ms);
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export default function ProgressScreen() {
  const sessions = useSessions();
  const streak = computeStreak(sessions);

  if (sessions.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.title}>Your progress</Text>
        <Text style={styles.emptyText}>
          Finish your first session and your streak starts here.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>Your progress</Text>

      <View style={styles.streakBlock}>
        <Text style={styles.streakNum}>{streak.current}</Text>
        <Text style={styles.streakLabel}>{streak.current === 1 ? 'day' : 'days'} in a row</Text>
        <Text style={[styles.today, streak.practicedToday && styles.todayDone]}>
          {streak.practicedToday ? '✓ Practised today' : 'Not practised yet today'}
        </Text>
      </View>

      <View style={styles.stats}>
        <Stat label="Best streak" value={`${streak.best}`} />
        <Stat label="Sessions" value={`${sessions.length}`} />
        <Stat label="Best ROM" value={`${bestRomDeg(sessions).toFixed(0)}°`} />
      </View>

      <Text style={styles.totalReps}>{totalReps(sessions)} reps practised in total</Text>

      <Text style={styles.section}>Recent sessions</Text>
      {sessions.slice(0, 7).map((s: SessionSummary) => (
        <View key={s.id} style={styles.row}>
          <Text style={styles.rowDate}>{shortDate(s.startedAt)}</Text>
          <Text style={styles.rowStat}>{s.reps.length} reps</Text>
          <Text style={styles.rowStat}>{s.peakRomDeg.toFixed(0)}°</Text>
          {s.pain === 'stopped' && <Text style={styles.painFlag}>stopped</Text>}
        </View>
      ))}
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statV}>{value}</Text>
      <Text style={styles.statL}>{label}</Text>
    </View>
  );
}

// Minimal in structure, NOT in legibility: stroke patients are often older with
// vision changes, so text stays large and high-contrast (see FEATURE_IDEAS.md).
const styles = StyleSheet.create({
  scroll: { padding: 24, paddingTop: 60 },
  empty: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { color: '#12a5b8', fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  emptyText: { color: '#9fb3ba', fontSize: 17, lineHeight: 24 },

  streakBlock: { alignItems: 'center', marginBottom: 32 },
  streakNum: { color: '#fff', fontSize: 88, fontWeight: 'bold', lineHeight: 96 },
  streakLabel: { color: '#9fb3ba', fontSize: 17 },
  today: { color: '#6b8891', fontSize: 15, marginTop: 10 },
  todayDone: { color: '#12a5b8', fontWeight: 'bold' },

  stats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  stat: { alignItems: 'center' },
  statV: { color: '#fff', fontSize: 30, fontWeight: 'bold' },
  statL: { color: '#9fb3ba', fontSize: 13, marginTop: 2 },

  totalReps: { color: '#6b8891', fontSize: 14, textAlign: 'center', marginBottom: 32 },

  section: { color: '#cfe6ea', fontSize: 16, fontWeight: '600', marginBottom: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#12303a',
  },
  rowDate: { color: '#fff', fontSize: 16, flex: 1 },
  rowStat: { color: '#9fb3ba', fontSize: 16, marginLeft: 16 },
  painFlag: { color: '#ffb020', fontSize: 12, marginLeft: 12 },
});
