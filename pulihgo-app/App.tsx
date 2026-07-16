// App.tsx — PulihGo shell: the three tabs (Exercise / Gyro test / Summary)
// OWNER: Radit · STATUS: ✅ working
//
// Plain useState tabs on purpose — no navigation library, so nothing new to
// install and nothing to break in Expo Go. Swap for react-navigation only if a
// screen ever needs real history/deep links.
//
// The screens set no background of their own, so the dark background lives here.

import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import ExerciseScreen from './src/screens/ExerciseScreen';
import GyroTestScreen from './src/screens/GyroTestScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import SummaryScreen from './src/screens/SummaryScreen';

type Tab = 'exercise' | 'gyro' | 'progress' | 'summary';

const TABS: { key: Tab; label: string }[] = [
  { key: 'exercise', label: 'Exercise' },
  { key: 'gyro', label: 'Gyro test' },
  { key: 'progress', label: 'Progress' },
  { key: 'summary', label: 'Summary' },
];

export default function App() {
  // Land on Exercise — the MVP loop (docs/07-getting-started.md).
  const [tab, setTab] = useState<Tab>('exercise');

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Only the active screen is mounted, so the inactive tabs don't hold a
          second DeviceMotion subscription open. Note: leaving Exercise ends the
          in-progress set — re-calibrate when you come back. */}
      <View style={styles.screen}>
        {tab === 'exercise' && <ExerciseScreen />}
        {tab === 'gyro' && <GyroTestScreen />}
        {tab === 'progress' && <ProgressScreen />}
        {tab === 'summary' && <SummaryScreen />}
      </View>

      <View style={styles.tabBar}>
        {TABS.map(({ key, label }) => {
          const active = tab === key;
          return (
            <Pressable
              key={key}
              style={styles.tab}
              onPress={() => setTab(key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d1b1e' },
  screen: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#12303a',
    paddingTop: 10,
    // clears the iPhone home indicator so the buttons aren't under the swipe area
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  tabText: { color: '#6b8891', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#12a5b8' },
});
