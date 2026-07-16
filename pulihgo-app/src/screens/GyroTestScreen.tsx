// src/screens/GyroTestScreen.tsx
// OWNER: Radit · STATUS: ✅ working (this is your gyro test, kept for axis-checking)
// Shows all 3 raw angles + bars. Use it to find which axis moves most during
// forearm supination/pronation, then set EXERCISE_AXIS in ExerciseScreen.

import { useDeviceAngle } from '../sensors/useDeviceAngle';
import { View, Text, StyleSheet } from 'react-native';

export default function GyroTestScreen() {
  const { angles, granted } = useDeviceAngle(50);

  const Bar = ({ label, value }: { label: string; value: number }) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value.toFixed(1)}°</Text>
      <View style={styles.track}>
        <View
          style={[styles.fill, { width: `${Math.min((Math.abs(value) / 180) * 100, 100)}%` }]}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gyroscope test</Text>
      <Text style={styles.hint}>
        {granted === false
          ? '⚠️ Motion permission denied — enable it in Settings'
          : 'Strap to forearm, rotate palm up/down, note which moves most'}
      </Text>
      <Bar label="Pitch" value={angles.pitch} />
      <Bar label="Roll" value={angles.roll} />
      <Bar label="Yaw" value={angles.yaw} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { color: '#12a5b8', fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  hint: { color: '#9fb3ba', textAlign: 'center', marginBottom: 24, marginTop: 6 },
  row: { marginVertical: 10 },
  label: { color: '#cfe6ea', fontSize: 14 },
  value: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  track: { height: 12, backgroundColor: '#12303a', borderRadius: 6, marginTop: 6, overflow: 'hidden' },
  fill: { height: 12, backgroundColor: '#12a5b8', borderRadius: 6 },
});
