// src/screens/ExerciseScreen.tsx
import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, ScrollView } from 'react-native';
import { useCalibratedAngle } from '../sensors/useCalibratedAngle';
import { RepDetector } from '../metrics/repDetector';
import { smoothness } from '../metrics/smoothness';
import { isPastCeiling, PAIN_OPTIONS } from '../safety/safety';
import { sessionStore } from '../storage/sessionStore';
import type { Axis, PainLevel, RepMetric, SessionSummary, ExerciseConfig } from '../types';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

const SAMPLE_MS = 50;

const PAIN_LABEL: Record<PainLevel, string> = {
  none: 'No pain',
  mild: 'Mild pain',
  stopped: 'Stopped due to pain',
  unknown: 'Not asked',
};

interface ExerciseScreenProps {
  config: ExerciseConfig;
  onExit: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export default function ExerciseScreen({ config, onExit, theme, toggleTheme }: ExerciseScreenProps) {
  const { angles, granted, calibrate } = useCalibratedAngle(SAMPLE_MS);
  const [reps, setReps] = useState(0);
  const [peak, setPeak] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [asking, setAsking] = useState(false);
  const [justSaved, setJustSaved] = useState<PainLevel | null>(null);
  
  // Initialize RepDetector with config-driven target ROM
  const detector = useRef(new RepDetector({ targetRomDeg: config.targetRomDeg }));
  const repsRef = useRef<RepMetric[]>([]);

  const value = angles[config.axis];
  const running = startedAt !== null;

  // Re-initialize detector when exercise changes
  useEffect(() => {
    detector.current = new RepDetector({ targetRomDeg: config.targetRomDeg });
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
  }, [config]);

  // Feed samples to the detector only while a session is running
  useEffect(() => {
    if (running) {
      detector.current.push(value, Date.now());
    }
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
      exerciseId: config.id,
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

  // Accessible light/dark design tokens
  const isDark = theme === 'dark';
  const colors = {
    bg: isDark ? '#0b0e11' : '#FAFAF7',
    cardBg: isDark ? '#121417' : '#FFFFFF',
    cardBorder: isDark ? '#1c1f22' : '#E2E4DE',
    title: isDark ? '#FFFFFF' : '#1A1D1A',
    body: isDark ? '#8e9aa0' : '#5B5F58',
    accent: isDark ? '#00C2C2' : '#0E7C7B',
    accentSoft: isDark ? 'rgba(0,194,194,0.12)' : '#E1F4F7',
    safe: isDark ? '#00e676' : '#1E9E5A',
    safeSoft: isDark ? 'rgba(0,230,118,0.1)' : '#E2F4EB',
    danger: isDark ? '#ff5252' : '#D64545',
    dangerSoft: isDark ? 'rgba(255,82,82,0.1)' : '#FBE6E4',
    caution: isDark ? '#ffb020' : '#C77800',
  };

  // Safety ceiling check using config properties
  const past = isPastCeiling(value, config.romCeilingDeg);
  const absAngle = Math.abs(value);
  const romPercent = Math.min(100, Math.round((absAngle / config.targetRomDeg) * 100));

  // Determine feedback messaging
  let gaugeColor = colors.accent;
  let feedbackMessage = 'Move slowly and with control.';
  let feedbackSub = `Aim for your target ROM of ${config.targetRomDeg}`;

  if (past) {
    gaugeColor = colors.danger;
    feedbackMessage = 'WARNING: SLOW DOWN & RETURN';
    feedbackSub = `Exceeded safe range limit of ${config.romCeilingDeg}`;
  } else if (absAngle >= config.targetRomDeg) {
    gaugeColor = colors.safe;
    feedbackMessage = 'TARGET HIT!';
    feedbackSub = 'Now rotate slowly back to the starting point.';
  } else if (absAngle > 10) {
    feedbackMessage = 'Good movement, keep going...';
    feedbackSub = `Push toward the ${config.targetRomDeg} target ring`;
  }

  // SVG math for angle visual gauge
  const gaugeSize = 200;
  const gaugeStroke = 12;
  const radius = (gaugeSize - gaugeStroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (romPercent / 100) * circumference;

  // On-device instructions depending on selected exercise config
  const getSteps = () => {
    if (config.id === 'elbow_flexion_extension') {
      return [
        { n: '1', text: 'Strap the phone screen-up along your affected forearm.' },
        { n: '2', text: 'Sit upright, arm relaxed at your side, elbow straight.' },
        { n: '3', text: 'Slowly bend your elbow, then straighten it back out.' },
      ];
    }
    // Default forearm rotation
    return [
      { n: '1', text: 'Strap the phone screen-up along your affected forearm.' },
      { n: '2', text: 'Sit upright with your elbow bent at a comfortable 90 angle.' },
      { n: '3', text: 'Hold your forearm flat in a neutral starting position.' },
    ];
  };

  if (granted === false) {
    return (
      <View style={[styles.permissionContainer, { backgroundColor: colors.bg }]}>
        <Ionicons name="warning-outline" size={48} color={colors.caution} style={{ marginBottom: 16 }} />
        <Text style={[styles.warnText, { color: colors.title }]}>WARNING: Motion Access Required</Text>
        <Text style={[styles.warnSubText, { color: colors.body }]}>
          Please enable Motion & Fitness access in Settings - Expo Go on your mobile device to capture gyroscope data.
        </Text>
        <Pressable onPress={onExit} style={[styles.btnStart, { backgroundColor: colors.accent, marginTop: 24, width: '100%' }]}>
          <Text style={styles.btnStartText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  if (asking) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg, justifyContent: 'center' }]}>
        <View style={[styles.questionnaireCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <Ionicons name="heart-circle-outline" size={54} color={colors.accent} style={{ marginBottom: 12, alignSelf: 'center' }} />
          <Text style={[styles.questionTitle, { color: colors.title }]}>How did that feel?</Text>
          <Text style={[styles.questionSub, { color: colors.body }]}>Please report any joint pain experienced during your exercise.</Text>
          
          {PAIN_OPTIONS.filter((p) => p !== 'stopped').map((p) => (
            <Pressable
              key={p}
              style={[styles.painBtn, { backgroundColor: isDark ? '#1c1f22' : '#FFFFFF', borderColor: colors.cardBorder }]}
              onPress={() => save(p)}
              accessibilityRole="button"
            >
              <View style={styles.painBtnContent}>
                <Text style={[styles.painBtnText, { color: colors.title }]}>{PAIN_LABEL[p]}</Text>
                <Ionicons 
                  name={p === 'none' ? 'shield-checkmark-outline' : 'warning-outline'} 
                  size={20} 
                  color={p === 'none' ? colors.safe : colors.caution} 
                />
              </View>
            </Pressable>
          ))}
          
          <Pressable style={styles.btnGhost} onPress={() => setAsking(false)} accessibilityRole="button">
            <Text style={[styles.btnGhostText, { color: colors.accent }]}>Return to Session</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {running ? (
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Active Header */}
          <View style={styles.activeHeader}>
            <View style={styles.activeHeaderTop}>
              <Pressable
                onPress={() => save('none')}
                style={[styles.backIconBtn, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Ionicons name="chevron-back-outline" size={24} color={colors.title} />
              </Pressable>
              <Text style={[styles.activeLabel, { color: colors.accent }]}>SESSION IN PROGRESS</Text>
              <Pressable
                onPress={toggleTheme}
                style={[styles.themeBtn, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
                accessibilityRole="button"
                accessibilityLabel="Toggle Theme"
              >
                <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={18} color={colors.title} />
              </Pressable>
            </View>
            <Text style={[styles.exerciseName, { color: colors.title }]}>{config.name}</Text>
          </View>

          {/* Large Interactive SVG Gauge */}
          <View style={styles.gaugeContainer}>
            <View style={styles.svgWrapper}>
              <Svg width={gaugeSize} height={gaugeSize}>
                <Circle
                  cx={gaugeSize / 2}
                  cy={gaugeSize / 2}
                  r={radius}
                  stroke={isDark ? '#1c1f22' : '#E2E4DE'}
                  strokeWidth={gaugeStroke}
                  fill="transparent"
                />
                <Circle
                  cx={gaugeSize / 2}
                  cy={gaugeSize / 2}
                  r={radius}
                  stroke={gaugeColor}
                  strokeWidth={gaugeStroke}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  transform={`rotate(-90 ${gaugeSize / 2} ${gaugeSize / 2})`}
                />
              </Svg>
              <View style={styles.gaugeValueWrapper}>
                <Text style={[styles.angleText, { color: colors.title }, past && { color: colors.danger }]}>
                  {value.toFixed(0)}
                </Text>
              </View>
            </View>
          </View>

          {/* Feedback Coach Box */}
          <View
            style={[
              styles.feedbackBox,
              { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
              past && { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
            ]}
          >
            <Text style={[styles.feedbackText, { color: colors.title }, past && { color: colors.danger }]}>
              {feedbackMessage}
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
              <Text style={[styles.statValue, { color: colors.title }]}>{peak.toFixed(0)}</Text>
            </View>
          </View>

          {/* Large interactive controls */}
          <View style={styles.controls}>
            <Pressable onPress={() => setAsking(true)} style={[styles.btnPrimary, { backgroundColor: colors.accent }]} accessibilityRole="button">
              <Ionicons name="checkmark" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.btnPrimaryText}>Finish Practice</Text>
            </Pressable>
            <Pressable onPress={() => save('stopped')} style={[styles.btnStop, { borderColor: colors.danger, backgroundColor: colors.dangerSoft }]} accessibilityRole="button">
              <Ionicons name="alert-circle" size={20} color={colors.danger} style={{ marginRight: 6 }} />
              <Text style={[styles.btnStopText, { color: colors.danger }]}>Stop, it hurts</Text>
            </Pressable>
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Onboarding / Setup State */}
          <View style={styles.onboardHeaderRow}>
            <Pressable
              onPress={onExit}
              style={[styles.backIconBtn, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
              accessibilityRole="button"
              accessibilityLabel="Exit to library"
            >
              <Ionicons name="chevron-back-outline" size={24} color={colors.title} />
            </Pressable>
            <Text style={[styles.brandHeader, { color: colors.title }]}>P U L I H G O</Text>
            <Pressable
              onPress={toggleTheme}
              style={[styles.themeBtn, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
              accessibilityRole="button"
              accessibilityLabel="Toggle Theme"
            >
              <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={18} color={colors.title} />
            </Pressable>
          </View>
          
          <View style={[styles.onboardingCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Ionicons name="shield-checkmark" size={40} color={colors.accent} style={styles.onboardIcon} />
            <Text style={[styles.onboardTitle, { color: colors.title }]}>Ready to Practice?</Text>
            <Text style={[styles.onboardSub, { color: colors.body }]}>Please follow the guidelines to ensure safety and accurate measurements:</Text>
            
            {getSteps().map((step) => (
              <View key={step.n} style={styles.step}>
                <View style={[styles.stepNum, { backgroundColor: colors.accentSoft }]}>
                  <Text style={[styles.stepNumText, { color: colors.accent }]}>{step.n}</Text>
                </View>
                <Text style={[styles.stepText, { color: colors.title }]}>{step.text}</Text>
              </View>
            ))}

            <Pressable onPress={start} style={[styles.btnStart, { backgroundColor: colors.accent }]} accessibilityRole="button">
              <Ionicons name="options" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.btnStartText}>Calibrate & Start</Text>
            </Pressable>
            
            <Text style={[styles.onboardHint, { color: colors.body }]}>
              Tapping starts session calibration. This sets your current position as 0 (neutral).
            </Text>
          </View>
          
          {justSaved && (
            <View style={[styles.savedBanner, justSaved === 'stopped' ? { borderColor: colors.danger, backgroundColor: colors.dangerSoft } : { borderColor: colors.safe, backgroundColor: colors.safeSoft }]}>
              <Ionicons 
                name={justSaved === 'stopped' ? 'alert-circle' : 'checkmark-circle'} 
                size={20} 
                color={justSaved === 'stopped' ? colors.danger : colors.safe} 
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.savedText, { color: justSaved === 'stopped' ? colors.danger : colors.safe }]}>
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 40 },
  
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  warnText: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  warnSubText: { fontSize: 13, textAlign: 'center', lineHeight: 20 },

  activeHeader: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  activeHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: 48,
    marginBottom: 8,
  },
  activeLabel: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  exerciseName: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 26,
  },
  themeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  backIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },

  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  svgWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeValueWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  angleText: {
    fontSize: 52,
    fontWeight: '900',
  },
  angleLabel: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 4,
  },

  feedbackBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  feedbackBoxWarn: {
    borderColor: '#D64545',
    backgroundColor: 'rgba(214, 69, 69, 0.05)',
  },
  feedbackText: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  feedbackTextWarn: {
    color: '#D64545',
  },
  feedbackSubText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },

  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
  },

  controls: {
    gap: 12,
  },
  btnPrimary: {
    minHeight: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },
  btnStop: {
    borderWidth: 2,
    minHeight: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnStopText: {
    fontWeight: '900',
    fontSize: 16,
  },

  onboardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: 48,
    marginBottom: 24,
  },
  brandHeader: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  onboardingCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  onboardIcon: { alignSelf: 'center', marginBottom: 12 },
  onboardTitle: { fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 6 },
  onboardSub: { fontSize: 13, textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  
  step: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingRight: 8 },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumText: { fontSize: 13, fontWeight: '800' },
  stepText: { fontSize: 14, lineHeight: 20, flex: 1 },

  btnStart: {
    minHeight: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  btnStartText: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
  onboardHint: { fontSize: 13, lineHeight: 18, textAlign: 'center' },

  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginTop: 20,
  },
  savedText: { fontSize: 13, fontWeight: '800', flex: 1, lineHeight: 18 },

  questionnaireCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  questionTitle: { fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 6 },
  questionSub: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  painBtn: {
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  painBtnContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  painBtnText: { fontSize: 16, fontWeight: '800' },
  btnGhost: { alignSelf: 'center', marginTop: 10, paddingVertical: 12, minHeight: 44, justifyContent: 'center' },
  btnGhostText: { fontSize: 14, fontWeight: '800' },
});
