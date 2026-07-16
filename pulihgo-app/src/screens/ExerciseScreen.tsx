// src/screens/ExerciseScreen.tsx
// OWNER: Radit (taken over from Sulthan) + Pradipta (metrics) · STATUS: ✅ full MVP loop
//
// The whole MVP in one screen: calibrate → rotate forearm → it counts reps,
// tracks peak ROM, warns past the safe range → finish → the session is saved.
//
// Session lifecycle: Calibrate starts it, Finish or Stop ends it. Nothing is
// recorded before Calibrate, because angles are meaningless without a zero.

import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useCalibratedAngle } from '../sensors/useCalibratedAngle';
import { RepDetector } from '../metrics/repDetector';
import { smoothness } from '../metrics/smoothness';
import { DEFAULT_ROM_CEILING_DEG, isPastCeiling, PAIN_OPTIONS } from '../safety/safety';
import { sessionStore } from '../storage/sessionStore';
import type { Axis, PainLevel, RepMetric, SessionSummary } from '../types';

// 👉 TODO: set this to whichever axis moved MOST in your GyroTest forearm test.
const EXERCISE_AXIS: Axis = 'roll';

// TODO(phase-3): comes from the therapist's prescription. One exercise for now.
const EXERCISE_ID = 'forearm_supination';

const SAMPLE_MS = 50; // must match what smoothness() assumes for its dt

const PAIN_LABEL: Record<PainLevel, string> = {
  none: 'No pain',
  mild: 'Mild',
  stopped: 'Stopped',
  unknown: 'Not asked',
};

// 👉 TODO(therapist-setup): hardcoded for now so the target-ROM threshold
// scaling can be tuned on a real phone. This should come from a therapist
// prescription / setup screen (ExerciseConfig.targetRomDeg in ../types)
// once that exists.
const DUMMY_TARGET_ROM_DEG = 70;

// 👉 TODO(therapist-setup): same as above — hardcoded until it comes from
// ExerciseConfig.romCeilingDeg. Kept separate from safety.ts's
// DEFAULT_ROM_CEILING_DEG (that one drives the existing real-time "past safe
// range" warning off the LIVE angle; this one drives the target/ceiling
// progress cue off the session's PEAK ROM below). Invariant: must stay
// greater than DUMMY_TARGET_ROM_DEG — the ceiling is the hard stop, the
// target is what we nudge toward, never past.
const DUMMY_CEILING_ROM_DEG = 90;

type CueTone = 'push' | 'positive' | 'stop';

/**
 * Progress cue based on the session's PEAK ROM so far (not the live angle):
 *  - below target       -> push the patient a bit further
 *  - target..ceiling     -> positive, and the push turns off (never nudge
 *                           past the target once it's reached)
 *  - at/past ceiling     -> neutral stop message — this is a safety limit,
 *                           NOT a reward, so the tone must not read as praise
 */
function romCue(peakDeg: number, targetDeg: number, ceilingDeg: number): { text: string; tone: CueTone } {
  if (peakDeg >= ceilingDeg) return { text: 'Cukup — jangan lebih', tone: 'stop' };
  if (peakDeg >= targetDeg) return { text: 'Bagus! Target tercapai', tone: 'positive' };
  return { text: 'Ayo, sedikit lagi', tone: 'push' };
}

export default function ExerciseScreen() {
  const { angles, granted, calibrate } = useCalibratedAngle(SAMPLE_MS);
  const [reps, setReps] = useState(0);
  const [peak, setPeak] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [asking, setAsking] = useState(false);
  const [justSaved, setJustSaved] = useState<PainLevel | null>(null);
  const detector = useRef(new RepDetector({ targetRomDeg: DUMMY_TARGET_ROM_DEG }));
  const repsRef = useRef<RepMetric[]>([]);

  const value = angles[EXERCISE_AXIS];
  const running = startedAt !== null;

  useEffect(() => {
    detector.current.onRep = (rep) => {
      repsRef.current.push({
        index: rep.index,
        peakRomDeg: rep.peakRomDeg,
        durationMs: rep.durationMs,
        smoothness: smoothness(rep.samples, SAMPLE_MS),
      });
      setReps(rep.index);
      setPeak((p) => Math.max(p, rep.peakRomDeg));
    };
  }, []);

  // Feed samples to the detector only while a session is running.
  useEffect(() => {
    if (running) detector.current.push(value, Date.now());
  }, [value, running]);

  const start = () => {
    calibrate();
    detector.current.reset();
    repsRef.current = [];
    setReps(0);
    setPeak(0);
    setJustSaved(null);
    setAsking(false);
    setStartedAt(Date.now());
  };

  const save = (pain: PainLevel) => {
    if (startedAt === null) return;
    const endedAt = Date.now();
    const list = repsRef.current;
    const summary: SessionSummary = {
      id: `ses_${endedAt}`,
      exerciseId: EXERCISE_ID,
      startedAt,
      endedAt,
      reps: list,
      peakRomDeg: list.reduce((m, r) => Math.max(m, r.peakRomDeg), 0),
      // Guard the empty case: 0/0 is NaN, and a session CAN legitimately have
      // zero reps if the patient stops immediately because it hurts.
      avgSmoothness: list.length ? list.reduce((s, r) => s + r.smoothness, 0) / list.length : 0,
      pain,
    };
    sessionStore.add(summary);
    setStartedAt(null);
    setAsking(false);
    setJustSaved(pain);
  };

  const past = isPastCeiling(value);
  const cue = romCue(peak, DUMMY_TARGET_ROM_DEG, DUMMY_CEILING_ROM_DEG);

  if (granted === false) {
    return (
      <View style={styles.c}>
        <Text style={styles.warn}>⚠️ Enable Motion access in Settings → Expo Go</Text>
      </View>
    );
  }

  // Pain check on finish. 'stopped' isn't offered here — that's the Stop button
  // during the session, so finishing normally can't be logged as a pain stop.
  if (asking) {
    return (
      <View style={styles.c}>
        <Text style={styles.title}>How did that feel?</Text>
        <Text style={styles.help}>Any pain during the exercise?</Text>
        {PAIN_OPTIONS.filter((p) => p !== 'stopped').map((p) => (
          <Pressable key={p} style={styles.btn} onPress={() => save(p)}>
            <Text style={styles.btnText}>{PAIN_LABEL[p]}</Text>
          </Pressable>
        ))}
        <Pressable style={styles.btnGhost} onPress={() => setAsking(false)}>
          <Text style={styles.btnGhostText}>Keep going</Text>
        </Pressable>
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
      <Text
        style={[
          styles.cue,
          cue.tone === 'positive' && styles.cuePositive,
          cue.tone === 'stop' && styles.cueStop,
        ]}
      >
        {cue.text}
      </Text>

      <View style={styles.stats}>
        <Stat label="Reps" value={`${reps}`} />
        <Stat label="Peak ROM" value={`${peak.toFixed(0)}° / ${DUMMY_TARGET_ROM_DEG}°`} />
      </View>

      {running ? (
        <>
          <Pressable style={styles.btn} onPress={() => setAsking(true)}>
            <Text style={styles.btnText}>Finish session</Text>
          </Pressable>
          {/* Always visible while practising — the pain stop must never be more
              than one tap away (feature 11). It saves the session, flagged. */}
          <Pressable style={styles.btnStop} onPress={() => save('stopped')}>
            <Text style={styles.btnStopText}>Stop — it hurts</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Pressable style={styles.btn} onPress={start}>
            <Text style={styles.btnText}>Calibrate & start</Text>
          </Pressable>
          <Text style={styles.help}>
            {justSaved
              ? `Session saved (${PAIN_LABEL[justSaved].toLowerCase()}) — see Summary or Progress.`
              : 'Hold your arm in the neutral start position, then tap.'}
          </Text>
        </>
      )}
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
  cue: { color: '#7fb8c4', textAlign: 'center', marginTop: -14, marginBottom: 24, fontSize: 15 },
  cuePositive: { color: '#12a5b8', fontWeight: 'bold' },
  // Deliberately NOT a "success" color — reaching the ceiling is a safety
  // stop, never a reward (AGENTS.md guardrail 3).
  cueStop: { color: '#ffb020', fontWeight: 'bold' },
  stats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 30 },
  stat: { alignItems: 'center' },
  statV: { color: '#fff', fontSize: 34, fontWeight: 'bold' },
  statL: { color: '#9fb3ba', fontSize: 13 },
  btn: {
    backgroundColor: '#12a5b8',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  btnText: { color: '#04262b', fontWeight: 'bold', fontSize: 17 },
  btnStop: {
    borderWidth: 1,
    borderColor: '#ffb020',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnStopText: { color: '#ffb020', fontWeight: 'bold', fontSize: 17 },
  btnGhost: { paddingVertical: 14, alignItems: 'center' },
  btnGhostText: { color: '#6b8891', fontSize: 15 },
  help: { color: '#6b8891', textAlign: 'center', marginTop: 8, fontSize: 13 },
  warn: { color: '#ffb020', textAlign: 'center', fontSize: 16 },
});
