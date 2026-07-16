// src/screens/SummaryScreen.tsx
// OWNER: Radit (taken over from Sulthan) · STATUS: ✅ working
// The last saved session: reps, peak ROM, avg smoothness, pain flag, duration.
// Updates live via useSessions() — no need to leave and re-enter the tab.

import { View, Text, StyleSheet } from 'react-native';
import { useSessions } from '../storage/sessionStore';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function when(ms: number): string {
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}, ${hh}:${mm}`;
}

export default function SummaryScreen() {
  const sessions = useSessions();
  const last = sessions[0];

  if (!last) {
    return (
      <View style={styles.c}>
        <Text style={styles.title}>No sessions yet</Text>
        <Text style={styles.sub}>Finish an exercise to see your summary here.</Text>
      </View>
    );
  }

  const durationMin = Math.max(1, Math.round((last.endedAt - last.startedAt) / 60000));

  return (
    <View style={styles.c}>
      <Text style={styles.title}>Session summary</Text>
      <Text style={styles.when}>{when(last.startedAt)}</Text>

      <Row label="Reps" value={`${last.reps.length}`} />
      <Row label="Peak ROM" value={`${last.peakRomDeg.toFixed(0)}°`} />
      <Row label="Avg smoothness" value={`${(last.avgSmoothness * 100).toFixed(0)}%`} />
      <Row label="Duration" value={`${durationMin} min`} />
      <Row label="Pain" value={last.pain} highlight={last.pain === 'stopped'} />

      {last.pain === 'stopped' && (
        <Text style={styles.stopNote}>
          You stopped this session — that's the right call. It still counts towards your streak.
        </Text>
      )}
      {/* TODO: add a small progress chart across past sessions (Phase 2) */}
    </View>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowL}>{label}</Text>
      <Text style={[styles.rowV, highlight && styles.rowVWarn]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { color: '#12a5b8', fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  when: { color: '#6b8891', fontSize: 14, marginBottom: 20 },
  sub: { color: '#9fb3ba', fontSize: 16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#12303a',
  },
  rowL: { color: '#9fb3ba', fontSize: 16 },
  rowV: { color: '#fff', fontSize: 18, fontWeight: '600' },
  rowVWarn: { color: '#ffb020' },
  stopNote: { color: '#6b8891', fontSize: 13, marginTop: 18, lineHeight: 19 },
});
