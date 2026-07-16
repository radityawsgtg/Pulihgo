// src/screens/ExerciseScreen.tsx
// OWNER: Sulthan (UI) + Pradipta (metrics) · STATUS: ✅ working MVP loop
//
// This is the whole MVP in one screen: calibrate → rotate forearm → it counts
// reps, tracks peak ROM, and warns if you go past the safe range.
// Build the game + summary + persistence on top of this.

import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useCalibratedAngle } from '../sensors/useCalibratedAngle';
import { RepDetector } from '../metrics/repDetector';
import { DEFAULT_ROM_CEILING_DEG, isPastCeiling } from '../safety/safety';
import type { Axis } from '../types';

// 👉 TODO: set this to whichever axis moved MOST in your GyroTest forearm test.
const EXERCISE_AXIS: Axis = 'roll';

export default function ExerciseScreen() {
  const { angles, granted, calibrate } = useCalibratedAngle(50);
  const [reps, setReps] = useState(0);
  const [peak, setPeak] = useState(0);
  const detector = useRef(new RepDetector());

  const value = angles[EXERCISE_AXIS];

  useEffect(() => {
    detector.current.onRep = (rep) => {
      setReps(rep.index);
      setPeak((p) => Math.max(p, rep.peakRomDeg));
    };
  }, []);

  // feed every new sample into the rep detector
  useEffect(() => {
    detector.current.push(value, Date.now());
  }, [value]);

  const past = isPastCeiling(value);

  const onCalibrate = () => {
    calibrate();
    detector.current.reset();
    setReps(0);
    setPeak(0);
  };

  if (granted === false) {
    return (
      <View style={styles.c}>
        <Text style={styles.warn}>⚠️ Enable Motion access in Settings → Expo Go</Text>
      </View>
    );
  }

  return (
    <View style={styles.c}>
      <Text style={styles.title}>Supination / Pronation</Text>
      <Text style={styles.axis}>measuring: {EXERCISE_AXIS}</Text>

      <Text style={styles.big}>{value.toFixed(0)}°</Text>
      <Text style={[styles.cap, past && styles.capWarn]}>
        {past ? '⚠️ Slow down — past safe range' : `safe range ±${DEFAULT_ROM_CEILING_DEG}°`}
      </Text>

      <View style={styles.stats}>
        <Stat label="Reps" value={`${reps}`} />
        <Stat label="Peak ROM" value={`${peak.toFixed(0)}°`} />
      </View>

      <Pressable style={styles.btn} onPress={onCalibrate}>
        <Text style={styles.btnText}>Calibrate / Reset</Text>
      </Pressable>
      <Text style={styles.help}>Hold your arm in the neutral start position, then tap.</Text>
    </View>
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

const styles = StyleSheet.create({
  c: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { color: '#12a5b8', fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  axis: { color: '#6b8891', textAlign: 'center', marginBottom: 10 },
  big: { color: '#fff', fontSize: 72, fontWeight: 'bold', textAlign: 'center' },
  cap: { color: '#7fb8c4', textAlign: 'center', marginBottom: 24 },
  capWarn: { color: '#ffb020', fontWeight: 'bold' },
  stats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 30 },
  stat: { alignItems: 'center' },
  statV: { color: '#fff', fontSize: 34, fontWeight: 'bold' },
  statL: { color: '#9fb3ba', fontSize: 13 },
  btn: { backgroundColor: '#12a5b8', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#04262b', fontWeight: 'bold', fontSize: 16 },
  help: { color: '#6b8891', textAlign: 'center', marginTop: 8, fontSize: 12 },
  warn: { color: '#ffb020', textAlign: 'center', fontSize: 16 },
});
