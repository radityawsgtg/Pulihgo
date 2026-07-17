// App.tsx
import { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Pressable, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ProgressScreen from './src/screens/ProgressScreen';
import ExerciseListScreen from './src/screens/ExerciseListScreen';
import ExerciseScreen from './src/screens/ExerciseScreen';
import SummaryScreen from './src/screens/SummaryScreen';
import GyroTestScreen from './src/screens/GyroTestScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';

import { sessionStore } from './src/storage/sessionStore';
import type { ExerciseConfig } from './src/types';

type Tab = 'progress' | 'exercise' | 'summary' | 'gyro';

interface TabConfig {
  key: Tab;
  label: string;
  iconActive: keyof typeof Ionicons.glyphMap;
  iconInactive: keyof typeof Ionicons.glyphMap;
}

// 3 main patient-facing tabs
const TABS: TabConfig[] = [
  { key: 'progress', label: 'Home', iconActive: 'home', iconInactive: 'home-outline' },
  { key: 'exercise', label: 'Exercise', iconActive: 'play-circle', iconInactive: 'play-circle-outline' },
  { key: 'summary', label: 'Summary', iconActive: 'stats-chart', iconInactive: 'stats-chart-outline' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('progress');
  const [theme, setTheme] = useState<'dark' | 'light'>('light'); // default theme is now light
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseConfig | null>(null);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  // Load saved sessions on mount and check onboarding status
  useEffect(() => {
    sessionStore.hydrate();
    
    (async () => {
      try {
        const seen = await AsyncStorage.getItem('pulihgo_onboarding_seen');
        setShowOnboarding(seen !== 'true');
      } catch (e) {
        setShowOnboarding(true);
      }
    })();
  }, []);

  const isDark = theme === 'dark';
  const tabBg = isDark ? '#121417' : '#FFFFFF';
  const borderTopColor = isDark ? '#1c1f22' : '#E2E4DE';
  const activeColor = isDark ? '#00C2C2' : '#0E7C7B';
  const inactiveColor = isDark ? '#8e9aa0' : '#5B5F58';
  const activeText = isDark ? '#FFFFFF' : '#1A1D1A';

  // Fallback visual loader to prevent flickers while reading storage
  if (showOnboarding === null) {
    return <View style={{ flex: 1, backgroundColor: '#FAFAF7' }} />;
  }

  // First-run onboarding flow
  if (showOnboarding) {
    return <OnboardingScreen onDone={() => setShowOnboarding(false)} />;
  }

  // Determine whether to display the bottom tab bar
  // Hide it during an active exercise or on the developer telemetry screen
  const shouldShowTabBar = !(tab === 'gyro' || (tab === 'exercise' && selectedExercise !== null));

  return (
    <View style={[styles.root, { backgroundColor: isDark ? '#0b0e11' : '#FAFAF7' }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={styles.screen}>
        {tab === 'progress' && (
          <ProgressScreen
            onStartExercise={() => {
              setTab('exercise');
              setSelectedExercise(null);
            }}
            onReplayOnboarding={async () => {
              await AsyncStorage.removeItem('pulihgo_onboarding_seen');
              setShowOnboarding(true);
            }}
            onEnterDebug={() => {
              setTab('gyro');
            }}
            theme={theme}
            toggleTheme={toggleTheme}
          />
        )}
        
        {tab === 'exercise' && (
          selectedExercise ? (
            <ExerciseScreen
              config={selectedExercise}
              onExit={() => setSelectedExercise(null)}
              theme={theme}
              toggleTheme={toggleTheme}
            />
          ) : (
            <ExerciseListScreen
              onSelect={(ex) => setSelectedExercise(ex)}
              theme={theme}
              toggleTheme={toggleTheme}
            />
          )
        )}
        
        {tab === 'summary' && (
          <SummaryScreen theme={theme} toggleTheme={toggleTheme} />
        )}

        {tab === 'gyro' && (
          <GyroTestScreen
            theme={theme}
            toggleTheme={toggleTheme}
            onExit={() => setTab('progress')}
          />
        )}
      </View>

      {shouldShowTabBar && (
        <View style={[styles.tabBar, { backgroundColor: tabBg, borderTopColor: borderTopColor }]}>
          {TABS.map(({ key, label, iconActive, iconInactive }) => {
            const active = tab === key;
            return (
              <Pressable
                key={key}
                style={styles.tab}
                onPress={() => {
                  setTab(key);
                  if (key !== 'exercise') {
                    setSelectedExercise(null);
                  }
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Ionicons
                  name={active ? iconActive : iconInactive}
                  size={24}
                  color={active ? activeColor : inactiveColor}
                  style={styles.tabIcon}
                />
                <Text style={[styles.tabText, { color: active ? activeText : inactiveColor }]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  screen: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 12,
    minHeight: 64,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 4,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabIcon: { marginBottom: 4 },
  tabText: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
});
