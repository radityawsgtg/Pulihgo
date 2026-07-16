// src/screens/ExerciseScreen.tsx
// OWNER: Radit (taken over from Sulthan) + Pradipta (metrics) · STATUS: ✅ full MVP loop
//
// Redesigned to match a premium Whoop app activity tracker.
// Displays live SVG angle gauge, dynamic velocity/pain safety states,
// onboarding/calibration guide, a clean pain check questionnaire, and global themes.

import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, ScrollView } from 'react-native';
import { useCalibratedAngle } from '../sensors/useCalibratedAngle';
import { RepDetector } from '../metrics/repDetector';
import { smoothness } from '../metrics/smoothness';
import { DEFAULT_ROM_CEILING_DEG, isPastCeiling, PAIN_OPTIONS } from '../safety/safety';
import { sessionStore } from '../storage/sessionStore';
import type { Axis, PainLevel, RepMetric, SessionSummary } from '../types';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

const EXERCISE_AXIS: Axis = 'roll';
const EXERCISE_ID = 'forearm_supination';
const SAMPLE_MS = 50;

const PAIN_LABEL: Record<PainLevel, string> = {
  none: 'No pain',
  mild: 'Mild pain',
  stopped: 'Stopped due to pain',
  unknown: 'Not asked',
};

const DUMMY_TARGET_ROM_DEG = 70;

// 👉 TODO(therapist-setup): same as above — hardcoded until it comes from
// ExerciseConfig.romCeilingDeg. Kept separate from safety.ts's
// DEFAULT_ROM_CEILING_DEG (that one drives the existing real-time "past safe
// range" warning off the LIVE angle; this one drives the target/ceiling
// progress cue below, ALSO off the LIVE angle — both need to react while the
// patient is mid-movement, not after the fact). Invariant: must stay
// greater than DUMMY_TARGET_ROM_DEG — the ceiling is the hard stop, the
// target is what we nudge toward, never past.
const DUMMY_CEILING_ROM_DEG = 90;

// Fixed size for the circular SVG gauge — not per-patient config, just layout.
const GAUGE_SIZE = 220;
const GAUGE_STROKE = 14;

type CueTone = 'push' | 'positive' | 'stop';

/**
 * Progress cue based on the LIVE angle right now (not peak ROM): peak is
 * only final once a rep completes (limb back near neutral), which would make
 * this cue land after the movement is already over — too late to be useful
 * as real-time feedback, and too late as a safety cue for the ceiling case.
 * Pass Math.abs(value) in so this works the same for both directions
 * (supination and pronation).
 *  - below target       -> push the patient a bit further
 *  - target..ceiling     -> positive, and the push turns off (never nudge
 *                           past the target once it's reached)
 *  - at/past ceiling     -> neutral stop message — this is a safety limit,
 *                           NOT a reward, so the tone must not read as praise
 */
function romCue(liveDeg: number, targetDeg: number, ceilingDeg: number): { text: string; tone: CueTone } {
  if (liveDeg >= ceilingDeg) return { text: 'Cukup — jangan lebih', tone: 'stop' };
  if (liveDeg >= targetDeg) return { text: 'Bagus! Target tercapai', tone: 'positive' };
  return { text: 'Ayo, sedikit lagi', tone: 'push' };
}

interface ExerciseScreenProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export default function ExerciseScreen({ theme, toggleTheme }: ExerciseScreenProps) {
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
      avgSmoothness: list.length ? list.reduce((s, r) => s + r.smoothness, 0) / list.length : 0,
      pain,
    };
    sessionStore.add(summary);
    setStartedAt(null);
    setAsking(false);
    setJustSaved(pain);
  };

  // Theme support colors
  const isDark = theme === 'dark';
  const colors = {
    bg: isDark ? '#0b0e11' : '#f0f2f5',
    cardBg: isDark ? '#121417' : '#ffffff',
    cardBorder: isDark ? '#1c1f22' : '#e2e8f0',
    title: isDark ? '#ffffff' : '#0b0e11',
    body: isDark ? '#8e9aa0' : '#64748b',
    highlight: isDark ? '#cfe6ea' : '#334155',
  };

  const past = isPastCeiling(value);

  // Drives the SVG gauge + Feedback Coach Box below — see romCue() doc
  // comment for why this reads the live angle, not peak ROM.
  const liveAbs = Math.abs(value);
  const cue = romCue(liveAbs, DUMMY_TARGET_ROM_DEG, DUMMY_CEILING_ROM_DEG);
  const gaugeRadius = (GAUGE_SIZE - GAUGE_STROKE) / 2;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const gaugeProgress = Math.min(liveAbs / DUMMY_CEILING_ROM_DEG, 1);
  const gaugeStrokeDashoffset = gaugeCircumference * (1 - gaugeProgress);
  // Deliberately not green-for-success at the ceiling — reaching it is a
  // safety stop, never a reward (AGENTS.md guardrail 3).
  const gaugeColor = cue.tone === 'stop' ? '#ff5252' : cue.tone === 'positive' ? '#00e676' : '#00e5ff';
  const feedbackSub = `${liveAbs.toFixed(0)}° now · target ${DUMMY_TARGET_ROM_DEG}° · ceiling ${DUMMY_CEILING_ROM_DEG}°`;

  if (granted === false) {
    return (
      <View style={[styles.permissionContainer, { backgroundColor: colors.bg }]}>
        <Ionicons name="warning-outline" size={48} color="#ffb020" style={{ marginBottom: 16 }} />
        <Text style={[styles.warnText, { color: colors.title }]}>⚠️ Motion Access Required</Text>
        <Text style={[styles.warnSubText, { color: colors.body }]}>
          Please enable Motion & Fitness access in Settings → Expo Go on your mobile device to capture gyroscope data.
        </Text>
      </View>
    );
  }

  if (asking) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={[styles.questionnaireCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <Ionicons name="heart-circle-outline" size={54} color="#00e5ff" style={{ marginBottom: 12, alignSelf: 'center' }} />
          <Text style={[styles.questionTitle, { color: colors.title }]}>How did that feel?</Text>
          <Text style={[styles.questionSub, { color: colors.body }]}>Please report any joint pain experienced during forearm rotation.</Text>

          {PAIN_OPTIONS.filter((p) => p !== 'stopped').map((p) => (
            <Pressable key={p} style={[styles.painBtn, { backgroundColor: isDark ? '#1c1f22' : '#f8fafc', borderColor: colors.cardBorder }]} onPress={() => save(p)}>
              <View style={styles.painBtnContent}>
                <Text style={[styles.painBtnText, { color: colors.title }]}>{PAIN_LABEL[p]}</Text>
                <Ionicons
                  name={p === 'none' ? 'shield-checkmark-outline' : 'warning-outline'}
                  size={20}
                  color={p === 'none' ? '#00e676' : '#ffb020'}
                />
              </View>
            </Pressable>
          ))}

          <Pressable style={styles.btnGhost} onPress={() => setAsking(false)}>
            <Text style={[styles.btnGhostText, { color: colors.body }]}>Return to Session</Text>
          </Pressable>
        </View>
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

      {running ? (
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Active Header */}
          <View style={styles.activeHeader}>
            <View style={styles.activeHeaderTop}>
              <Text style={styles.activeLabel}>SESSION IN PROGRESS</Text>
              <Pressable onPress={toggleTheme} style={[styles.themeBtn, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                <Ionicons name={isDark ? "sunny-outline" : "moon-outline"} size={14} color={colors.title} />
              </Pressable>
            </View>
            <Text style={[styles.exerciseName, { color: colors.title }]}>Forearm Supination / Pronation</Text>
          </View>

          {/* Large Interactive SVG Gauge */}
          <View style={styles.gaugeContainer}>
            <View style={styles.svgWrapper}>
              <Svg width={GAUGE_SIZE} height={GAUGE_SIZE}>
                <Circle
                  cx={GAUGE_SIZE / 2}
                  cy={GAUGE_SIZE / 2}
                  r={gaugeRadius}
                  stroke={isDark ? '#1c1f22' : '#e2e8f0'}
                  strokeWidth={GAUGE_STROKE}
                  fill="transparent"
                />
                <Circle
                  cx={GAUGE_SIZE / 2}
                  cy={GAUGE_SIZE / 2}
                  r={gaugeRadius}
                  stroke={gaugeColor}
                  strokeWidth={GAUGE_STROKE}
                  strokeDasharray={gaugeCircumference}
                  strokeDashoffset={gaugeStrokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  transform={`rotate(-90 ${GAUGE_SIZE / 2} ${GAUGE_SIZE / 2})`}
                />
              </Svg>
              <View style={styles.gaugeValueWrapper}>
                <Text style={[styles.angleText, { color: colors.title }, cue.tone === 'stop' && { color: '#ff5252' }]}>
                  {value.toFixed(0)}°
                </Text>
                <Text style={[styles.angleLabel, { color: colors.body }]}>FOREARM ANGLE</Text>
              </View>
            </View>
          </View>

          {/* Feedback Coach Box — driven by romCue(), see top of file */}
          <View style={[styles.feedbackBox, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }, cue.tone === 'stop' && styles.feedbackBoxWarn]}>
            <Text style={[styles.feedbackText, { color: colors.title }, cue.tone === 'stop' && styles.feedbackTextWarn]}>
              {cue.text}
            </Text>
            <Text style={[styles.feedbackSubText, { color: colors.body }]}>
              {feedbackSub}
            </Text>
          </View>

          {/* Real-time stats grid */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <Text style={[styles.statLabel, { color: colors.body }]}>REPETITIONS</Text>
              <Text style={[styles.statValue, { color: colors.title }]}>{reps}</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <Text style={[styles.statLabel, { color: colors.body }]}>PEAK ANGLE</Text>
              <Text style={[styles.statValue, { color: colors.title }]}>{peak.toFixed(0)}°</Text>
            </View>
          </View>

          {/* Large interactive controls */}
          <View style={styles.controls}>
            <Pressable style={styles.btnPrimary} onPress={() => setAsking(true)}>
              <Ionicons name="checkmark" size={20} color="#0b0e11" style={{ marginRight: 6 }} />
              <Text style={styles.btnPrimaryText}>Finish Practice</Text>
            </Pressable>
            <Pressable style={styles.btnStop} onPress={() => save('stopped')}>
              <Ionicons name="alert-circle" size={20} color="#ff5252" style={{ marginRight: 6 }} />
              <Text style={styles.btnStopText}>Stop — it hurts</Text>
            </Pressable>
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Onboarding / Setup State */}
          <View style={styles.onboardHeaderRow}>
            <Text style={[styles.brandHeader, { color: colors.title }]}>P U L I H G O</Text>
            <Pressable onPress={toggleTheme} style={[styles.themeBtn, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <Ionicons name={isDark ? "sunny-outline" : "moon-outline"} size={14} color={colors.title} />
            </Pressable>
          </View>

          <View style={[styles.onboardingCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Ionicons name="shield-checkmark" size={40} color="#00e5ff" style={styles.onboardIcon} />
            <Text style={[styles.onboardTitle, { color: colors.title }]}>Ready to Practice?</Text>
            <Text style={[styles.onboardSub, { color: colors.body }]}>Please follow the guidelines to ensure safety and accurate measurements:</Text>

            <View style={styles.step}>
              <View style={[styles.stepNum, { backgroundColor: isDark ? '#1c1f22' : '#f1f5f9' }]}>
                <Text style={styles.stepNumText}>1</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.title }]}>Strap the phone screen-up along your affected forearm.</Text>
            </View>
            <View style={styles.step}>
              <View style={[styles.stepNum, { backgroundColor: isDark ? '#1c1f22' : '#f1f5f9' }]}>
                <Text style={styles.stepNumText}>2</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.title }]}>Sit upright with your elbow bent at a comfortable 90° angle.</Text>
            </View>
            <View style={styles.step}>
              <View style={[styles.stepNum, { backgroundColor: isDark ? '#1c1f22' : '#f1f5f9' }]}>
                <Text style={styles.stepNumText}>3</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.title }]}>Hold your forearm flat in a neutral starting position.</Text>
            </View>

            <Pressable style={styles.btnStart} onPress={start}>
              <Ionicons name="options" size={20} color="#0b0e11" style={{ marginRight: 8 }} />
              <Text style={styles.btnStartText}>Calibrate & Start</Text>
            </Pressable>

            <Text style={[styles.onboardHint, { color: colors.body }]}>
              Tapping starts session calibration. This sets your current position as 0° (neutral).
            </Text>
          </View>

          {justSaved && (
            <View style={[styles.savedBanner, justSaved === 'stopped' && styles.savedBannerWarn]}>
              <Ionicons
                name={justSaved === 'stopped' ? 'alert-circle' : 'checkmark-circle'}
                size={20}
                color={justSaved === 'stopped' ? '#ff5252' : '#00e676'}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.savedText, justSaved === 'stopped' && { color: '#ff5252' }]}>
                {justSaved === 'stopped'
                  ? 'Session saved and flagged for joint discomfort.'
                  : `Session saved successfully (${PAIN_LABEL[justSaved].toLowerCase()}).`}
              </Text>
            </View>
          )}
        </ScrollView>
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
  stats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 30 },
  stat: { alignItems: 'center' },
  statV: { color: '#fff', fontSize: 34, fontWeight: 'bold' },
  statL: { color: '#9fb3ba', fontSize: 13 },

  permissionContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  warnText: { fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  warnSubText: { fontSize: 13, textAlign: 'center', lineHeight: 19 },

  container: { flex: 1, justifyContent: 'center', padding: 24 },
  scroll: { padding: 20, paddingTop: 60, paddingBottom: 40 },

  activeHeader: { marginBottom: 20 },
  activeHeaderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activeLabel: { color: '#00e5ff', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  themeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseName: { fontSize: 20, fontWeight: '800', marginTop: 6 },

  gaugeContainer: { alignItems: 'center', marginVertical: 24 },
  svgWrapper: { width: GAUGE_SIZE, height: GAUGE_SIZE, alignItems: 'center', justifyContent: 'center' },
  gaugeValueWrapper: {
    position: 'absolute',
    width: GAUGE_SIZE,
    height: GAUGE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  angleText: { fontSize: 44, fontWeight: '800' },
  angleLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: 4 },

  // Deliberately NOT a "success" color — reaching the ceiling is a safety
  // stop, never a reward (AGENTS.md guardrail 3).
  feedbackBox: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 20, alignItems: 'center' },
  feedbackBoxWarn: { backgroundColor: 'rgba(255, 82, 82, 0.08)', borderColor: '#ff5252' },
  feedbackText: { fontSize: 15, fontWeight: '800', textAlign: 'center' },
  feedbackTextWarn: { color: '#ff5252' },
  feedbackSubText: { fontSize: 12, textAlign: 'center', marginTop: 6 },

  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  statCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  statLabel: { fontSize: 10.5, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  statValue: { fontSize: 24, fontWeight: '800' },

  controls: { marginTop: 4 },
  btnPrimary: {
    backgroundColor: '#00e5ff',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  btn: {
    backgroundColor: '#12a5b8',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  btnPrimaryText: {
    color: '#0b0e11',
    fontWeight: '800',
    fontSize: 15.5,
  },
  btnStop: {
    borderWidth: 1.5,
    borderColor: '#ff5252',
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnStopText: {
    color: '#ff5252',
    fontWeight: '800',
    fontSize: 15.5,
  },

  onboardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
    marginBottom: 20,
  },
  brandHeader: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  onboardingCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  onboardIcon: { alignSelf: 'center', marginBottom: 12 },
  onboardTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  onboardSub: { fontSize: 12, textAlign: 'center', lineHeight: 18, marginBottom: 20 },

  step: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingRight: 8 },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumText: { color: '#00e5ff', fontSize: 11, fontWeight: '800' },
  stepText: { fontSize: 12.5, lineHeight: 18, flex: 1 },

  btnStart: {
    backgroundColor: '#00e5ff',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  btnStartText: { color: '#0b0e11', fontWeight: '800', fontSize: 15.5 },
  onboardHint: { fontSize: 10.5, lineHeight: 16, textAlign: 'center' },

  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
    borderWidth: 1,
    borderColor: '#00e676',
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
  },
  savedBannerWarn: {
    backgroundColor: 'rgba(255, 82, 82, 0.08)',
    borderColor: '#ff5252',
  },
  savedText: { color: '#00e676', fontSize: 12, fontWeight: '600', flex: 1 },

  questionnaireCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    marginHorizontal: 16,
  },
  questionTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  questionSub: { fontSize: 12.5, textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  painBtn: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  painBtnContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  painBtnText: { fontSize: 14, fontWeight: '800' },
  btnGhost: { alignSelf: 'center', marginTop: 10, paddingVertical: 8 },
  btnGhostText: { fontSize: 13, fontWeight: '700' },
});
