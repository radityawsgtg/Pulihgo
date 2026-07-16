// src/screens/SummaryScreen.tsx
// OWNER: Sulthan · STATUS: 🟡 stub — build this next
// Show the last saved session: reps, peak ROM, avg smoothness, pain flag.
// Reads from sessionStore. Wire ExerciseScreen to save a SessionSummary on "finish".

import { View, Text, StyleSheet } from 'react-native';
import { sessionStore } from '../storage/sessionStore';

export default function SummaryScreen() {
  const last = sessionStore.last();

  if (!last) {
    return (
      <View style={styles.c}>
        <Text style={styles.title}>No sessions yet</Text>
        <Text style={styles.sub}>Finish an exercise to see your summary here.</Text>
      </View>
    );
  }

  return (
    <View style={styles.c}>
      <Text style={styles.title}>Session summary</Text>
      <Text style={styles.row}>Reps: {last.reps.length}</Text>
      <Text style={styles.row}>Peak ROM: {last.peakRomDeg.toFixed(0)}°</Text>
      <Text style={styles.row}>Avg smoothness: {(last.avgSmoothness * 100).toFixed(0)}%</Text>
      <Text style={styles.row}>Pain: {last.pain}</Text>
      {/* TODO: add a small progress chart across past sessions (Phase 2) */}
    </View>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { color: '#12a5b8', fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  sub: { color: '#9fb3ba' },
  row: { color: '#fff', fontSize: 18, marginVertical: 4 },
});
