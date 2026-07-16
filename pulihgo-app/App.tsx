// App.tsx — PulihGo gyroscope test + laptop logging
import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DeviceMotion } from 'expo-sensors';

const toDeg = (r: number) => (r * 180) / Math.PI;

export default function App() {
  const [angles, setAngles] = useState({ pitch: 0, roll: 0, yaw: 0 });
  const [ok, setOk] = useState<boolean | null>(null);
  const lastLog = useRef(0);

  useEffect(() => {
    let sub: ReturnType<typeof DeviceMotion.addListener> | undefined;
    (async () => {
      const { granted } = await DeviceMotion.requestPermissionsAsync();
      setOk(granted);
      if (!granted) return;

      DeviceMotion.setUpdateInterval(50); // 20x per second
      sub = DeviceMotion.addListener(({ rotation }) => {
        if (!rotation) return;
        const a = {
          pitch: toDeg(rotation.beta),  // tilt forward/back
          roll: toDeg(rotation.gamma),  // tilt left/right
          yaw: toDeg(rotation.alpha),   // twist flat
        };
        setAngles(a);

        // log to the laptop terminal ~4x per second
        const now = Date.now();
        if (now - lastLog.current > 250) {
          lastLog.current = now;
          // CSV format: time,pitch,roll,yaw  (easy to copy into a spreadsheet)
          console.log(
            `${now},${a.pitch.toFixed(2)},${a.roll.toFixed(2)},${a.yaw.toFixed(2)}`
          );
        }
      });
    })();
    return () => sub?.remove();
  }, []);

  const Bar = ({ label, value }: { label: string; value: number }) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value.toFixed(1)}°</Text>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${Math.min((Math.abs(value) / 180) * 100, 100)}%` },
          ]}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PulihGo — Gyroscope test</Text>
      <Text style={styles.hint}>
        {ok === false
          ? '⚠️ Permission denied — enable Motion access in Settings'
          : 'Rotate the phone and watch the numbers move'}
      </Text>
      <Bar label="Pitch" value={angles.pitch} />
      <Bar label="Roll" value={angles.roll} />
      <Bar label="Yaw" value={angles.yaw} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1b1e', justifyContent: 'center', padding: 24 },
  title: { color: '#12a5b8', fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  hint: { color: '#9fb3ba', textAlign: 'center', marginBottom: 30, marginTop: 6 },
  row: { marginVertical: 12 },
  label: { color: '#cfe6ea', fontSize: 14 },
  value: { color: '#fff', fontSize: 30, fontWeight: 'bold' },
  track: { height: 14, backgroundColor: '#12303a', borderRadius: 7, marginTop: 6, overflow: 'hidden' },
  fill: { height: 14, backgroundColor: '#12a5b8', borderRadius: 7 },
});