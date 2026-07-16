// App.tsx — PulihGo shell: the three tabs (Exercise / Gyro test / Summary)
// OWNER: Radit · STATUS: ✅ working
//
// Plain useState tabs on purpose — no navigation library, so nothing new to
// install and nothing to break in Expo Go. Swap for react-navigation only if a
// screen ever needs real history/deep links.
//
// The screens set no background of their own, so the dark background lives here.

import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import ExerciseScreen from './src/screens/ExerciseScreen';
import GyroTestScreen from './src/screens/GyroTestScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import SummaryScreen from './src/screens/SummaryScreen';
import { sessionStore } from './src/storage/sessionStore';

type Tab = 'progress' | 'exercise' | 'summary' | 'gyro';

interface TabConfig {
  key: Tab;
  label: string;
  iconActive: keyof typeof Ionicons.glyphMap;
  iconInactive: keyof typeof Ionicons.glyphMap;
}

const TABS: TabConfig[] = [
  { key: 'progress', label: 'Home', iconActive: 'home', iconInactive: 'home-outline' },
  { key: 'exercise', label: 'Exercise', iconActive: 'play-circle', iconInactive: 'play-circle-outline' },
  { key: 'summary', label: 'Summary', iconActive: 'stats-chart', iconInactive: 'stats-chart-outline' },
  { key: 'gyro', label: 'Gyro test', iconActive: 'analytics', iconInactive: 'analytics-outline' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('progress');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  // Load saved sessions off the device once, on launch.
  useEffect(() => {
    sessionStore.hydrate();
  }, []);

  const isDark = theme === 'dark';
  const tabBg = isDark ? '#121417' : '#ffffff';
  const borderTopColor = isDark ? '#1c1f22' : '#e2e8f0';
  const activeColor = '#00e676';
  const inactiveColor = isDark ? '#8e9aa0' : '#64748b';
  const activeText = isDark ? '#ffffff' : '#0b0e11';

  return (
    <View style={[styles.root, { backgroundColor: isDark ? '#0b0e11' : '#f0f2f5' }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Only the active screen is mounted, so the inactive tabs don't hold a
          second DeviceMotion subscription open. Note: leaving Exercise ends the
          in-progress set — re-calibrate when you come back. */}
      <View style={styles.screen}>
        {tab === 'exercise' && <ExerciseScreen theme={theme} toggleTheme={toggleTheme} />}
        {tab === 'gyro' && <GyroTestScreen theme={theme} toggleTheme={toggleTheme} />}
        {tab === 'progress' && <ProgressScreen theme={theme} toggleTheme={toggleTheme} />}
        {tab === 'summary' && <SummaryScreen theme={theme} toggleTheme={toggleTheme} />}
      </View>

      <View style={[styles.tabBar, { backgroundColor: tabBg, borderTopColor: borderTopColor }]}>
        {TABS.map(({ key, label, iconActive, iconInactive }) => {
          const active = tab === key;
          return (
            <Pressable
              key={key}
              style={styles.tab}
              onPress={() => setTab(key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Ionicons
                name={active ? iconActive : iconInactive}
                size={22}
                color={active ? activeColor : inactiveColor}
                style={styles.tabIcon}
              />
              <Text style={[styles.tabText, { color: active ? activeText : inactiveColor }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  screen: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 10,
    // clears the iPhone home indicator so the buttons aren't under the swipe area
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabIcon: { marginBottom: 3 },
  tabText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
});
