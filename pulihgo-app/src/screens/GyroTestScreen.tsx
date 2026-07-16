// src/screens/GyroTestScreen.tsx
// OWNER: Radit · STATUS: ✅ working (this is your gyro test, kept for axis-checking)
//
// Redesigned to support global light/dark theme variables and Whoop-style card elements.

import { useEffect, useRef } from 'react';
import { useDeviceAngle } from '../sensors/useDeviceAngle';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface GyroTestScreenProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export default function GyroTestScreen({ theme, toggleTheme }: GyroTestScreenProps) {
  const { angles, granted } = useDeviceAngle(50);
  const lastLog = useRef(0);

  // Log CSV to the laptop terminal ~4x/sec: time,pitch,roll,yaw
  useEffect(() => {
    const now = Date.now();
    if (now - lastLog.current < 250) return;
    lastLog.current = now;
    console.log(
      `${now},${angles.pitch.toFixed(2)},${angles.roll.toFixed(2)},${angles.yaw.toFixed(2)}`
    );
  }, [angles]);

  // Theme support colors
  const isDark = theme === 'dark';
  const colors = {
    bg: isDark ? '#0b0e11' : '#f0f2f5',
    cardBg: isDark ? '#121417' : '#ffffff',
    cardBorder: isDark ? '#1c1f22' : '#e2e8f0',
    title: isDark ? '#ffffff' : '#0b0e11',
    body: isDark ? '#8e9aa0' : '#64748b',
    highlight: isDark ? '#cfe6ea' : '#334155',
    track: isDark ? '#1c1f22' : '#cbd5e1',
  };

  const Bar = ({ label, value }: { label: string; value: number }) => (
    <View style={[styles.row, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
      <View style={styles.barTextRow}>
        <Text style={[styles.label, { color: colors.body }]}>{label}</Text>
        <Text style={[styles.value, { color: colors.title }]}>{value.toFixed(1)}°</Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.track }]}>
        <View
          style={[styles.fill, { width: `${Math.min((Math.abs(value) / 180) * 100, 100)}%` }]}
        />
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerLabel}>DEVELOPER TELEMETRY</Text>
        <View style={styles.headerTitleRow}>
          <Text style={[styles.title, { color: colors.title }]}>Gyroscope test</Text>
          <Pressable onPress={toggleTheme} style={[styles.themeBtn, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Ionicons name={isDark ? "sunny-outline" : "moon-outline"} size={14} color={colors.title} />
          </Pressable>
        </View>
        <Text style={[styles.hint, { color: colors.body }]}>
          {granted === false
            ? '⚠️ Motion permission denied — enable it in Settings'
            : 'Strap to forearm, rotate palm up/down, note which moves most'}
        </Text>
      </View>

      <Bar label="Pitch" value={angles.pitch} />
      <Bar label="Roll" value={angles.roll} />
      <Bar label="Yaw" value={angles.yaw} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  
  header: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
    width: '100%',
  },
  headerLabel: {
    color: '#00e5ff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
    marginTop: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
  },
  themeBtn: {
    position: 'absolute',
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 6,
    fontSize: 12.5,
    lineHeight: 18,
  },

  row: { 
    marginVertical: 8, 
    borderRadius: 12, 
    borderWidth: 1, 
    padding: 16 
  },
  barTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  label: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 24, fontWeight: '900' },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, backgroundColor: '#00e5ff', borderRadius: 4 },
});
