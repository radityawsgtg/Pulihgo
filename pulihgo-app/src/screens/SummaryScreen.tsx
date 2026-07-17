// src/screens/SummaryScreen.tsx
// OWNER: Radit (taken over from Sulthan) · STATUS: ✅ working
//
// Redesigned to match a premium Whoop app post-workout summary.
// Displays detailed metrics grid, animated circular smoothness gauge,
// a highly structured, medical-grade physical therapy report card,
// theme toggles, and dynamic styling colors.

import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Dimensions, Animated, Easing, Pressable } from 'react-native';
import { useSessions } from '../storage/sessionStore';
import { usePrescription } from '../sync/usePrescription';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function when(ms: number): string {
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}, ${hh}:${mm}`;
}

function formatDuration(startedAt: number, endedAt: number): string {
  const diffMs = endedAt - startedAt;
  const mins = Math.floor(diffMs / 60000);
  const secs = Math.round((diffMs % 60000) / 1000);
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface SummaryScreenProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export default function SummaryScreen({ theme, toggleTheme }: SummaryScreenProps) {
  const sessions = useSessions();
  const { rx } = usePrescription();
  const last = sessions[0];

  // The therapist's safe limit, not a hardcoded 90. ExerciseScreen already
  // measures against this — the summary has to agree with it, or the app
  // warns at one number and reports against another.
  const ceilingDeg = rx.romCeilingDeg;

  const size = 150;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Determine percentages for animation. If stopped for pain, display a full (100%) red indicator gauge
  const smoothnessPercent = last ? Math.round(last.avgSmoothness * 100) : 0;
  const finalPercent = last && last.pain === 'stopped' ? 100 : smoothnessPercent;

  // Animated value for circle entry
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!last) return;
    Animated.timing(animValue, {
      toValue: finalPercent,
      duration: 1000,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [finalPercent]);

  // Dynamic colors based on active theme
  const isDark = theme === 'dark';
  const colors = {
    bg: isDark ? '#0b0e11' : '#f0f2f5',
    cardBg: isDark ? '#121417' : '#ffffff',
    cardBorder: isDark ? '#1c1f22' : '#e2e8f0',
    title: isDark ? '#ffffff' : '#0b0e11',
    body: isDark ? '#8e9aa0' : '#64748b',
    highlight: isDark ? '#cfe6ea' : '#334155',
    borderStyle: isDark ? '#1c1f22' : '#e2e8f0',
  };

  if (!last) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.bg }]}>
        <Ionicons name="stats-chart-outline" size={60} color={isDark ? "#3a424a" : "#cbd5e1"} style={styles.emptyIcon} />
        <Text style={[styles.emptyTitle, { color: colors.title }]}>No sessions yet</Text>
        <Text style={[styles.emptyText, { color: colors.body }]}>
          Finish a forearm rotation exercise to see your session analytics and coach insight here.
        </Text>
      </View>
    );
  }

  const strokeDashoffset = animValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  // Gauge color based on smoothness and pain logs
  let gaugeColor = "#00e676"; // green
  if (last.pain === 'stopped') {
    gaugeColor = "#ff5252"; // red if stopped for pain
  } else if (last.avgSmoothness < 0.6) {
    gaugeColor = "#ffb020"; // orange if shaky
  } else if (last.avgSmoothness < 0.8) {
    gaugeColor = "#00e5ff"; // cyan for good
  }

  // Session feedback.
  //
  // GUARDRAIL 1 (no diagnostic claims) + GUARDRAIL 2 (no unsourced clinical
  // statements). This card reports WHAT WAS MEASURED and suggests how to move
  // next time. It must never name a condition ("tremor", "spasticity"), and it
  // must never explain a physiological mechanism — we have no source for any of
  // that, and PulihGo measures and motivates, it does not diagnose.
  //
  // Coaching cues ("slow down", "keep your elbow at your side") are fine: they
  // describe the movement we asked for, not a clinical judgement about the body.
  let feedbackTitle = "Good, controlled session";
  let feedbackColor = "#00e676";
  let feedbackIcon = "checkmark-circle-outline";
  let assessment = "";
  let nextCue = "";

  if (last.pain === 'stopped') {
    feedbackTitle = "You stopped this session";
    feedbackColor = "#ff5252";
    feedbackIcon = "alert-circle-outline";
    assessment = "You ended this session because it hurt. That's recorded for your therapist, and it still counts towards your streak.";
    nextCue = "Rest the arm. Next session, stay well inside the range that feels comfortable — there's no target worth pushing through pain for.";
  } else if (last.peakRomDeg > ceilingDeg) {
    feedbackTitle = "Above your safe range";
    feedbackColor = "#ffb020";
    feedbackIcon = "warning-outline";
    assessment = `Your furthest rotation was ${last.peakRomDeg.toFixed(0)}°, past the ${ceilingDeg}° safe limit your therapist set.`;
    nextCue = `Keep your rotations under ${ceilingDeg}°. Controlled movement inside the range counts for more here than going further.`;
  } else if (last.avgSmoothness < 0.60) {
    feedbackTitle = "Less steady than a smooth sweep";
    feedbackColor = "#ffb020";
    feedbackIcon = "pulse-outline";
    assessment = `Your smoothness score was ${smoothnessPercent}% — this session's rotations changed speed more than a steady, even sweep would.`;
    nextCue = "Try it at about half this speed, and keep your elbow resting against your side.";
  } else {
    feedbackTitle = "Good, controlled session";
    feedbackColor = "#00e676";
    feedbackIcon = "ribbon-outline";
    assessment = `Smoothness ${smoothnessPercent}%, furthest rotation ${last.peakRomDeg.toFixed(0)}° — inside your ${ceilingDeg}° safe limit.`;
    nextCue = "Keep this pace. Try holding for one second at the furthest point of each rotation.";
  }

  const painTextMap = {
    none: 'No pain',
    mild: 'Mild discomfort',
    stopped: 'Stopped for pain',
    unknown: 'Not asked',
  };

  // Whoop-style comparison bar calculation
  let showBar = false;
  let barSafeWidth = 0;
  let barWarnWidth = 0;
  let barMarkerPosition = 0;
  let barValueText = "";
  let barLabelText = "";
  let barFooterLeft = "";
  let barFooterRight = "";
  let barFooterMarker = "";
  let showWarningStats = false;
  let statVal1 = "";
  let statVal2 = "";
  let statVal3 = "";
  let statLbl1 = "";
  let statLbl2 = "";
  let statLbl3 = "";
  let statVal1Color = colors.title;
  let statVal3Color = colors.title;

  if (last) {
    if (last.peakRomDeg > ceilingDeg) {
      showBar = true;
      const peak = last.peakRomDeg;
      // Scale the bar to the overshoot so it stays readable however far past
      // the limit the reading went (a stray 173° would otherwise blow it out).
      const barMax = Math.max(peak, ceilingDeg) * 1.15;
      barSafeWidth = (Math.min(peak, ceilingDeg) / barMax) * 100;
      barWarnWidth = ((peak - ceilingDeg) / barMax) * 100;
      barMarkerPosition = (ceilingDeg / barMax) * 100;
      barValueText = `${peak.toFixed(0)}° / ${ceilingDeg}° limit`;
      barLabelText = "FURTHEST ROTATION";
      barFooterLeft = "0°";
      barFooterMarker = `${ceilingDeg}° LIMIT`;
      barFooterRight = `${barMax.toFixed(0)}°`;

      showWarningStats = true;
      statVal1 = `${peak.toFixed(0)}°`;
      statVal2 = `${ceilingDeg}°`;
      statVal3 = `+${(peak - ceilingDeg).toFixed(0)}°`;
      statLbl1 = "FURTHEST";
      statLbl2 = "SAFE LIMIT";
      statLbl3 = "OVER LIMIT";
      statVal1Color = "#ff5252"; // red
      statVal3Color = "#ffb020"; // orange
    } else if (last.pain === 'stopped') {
      showBar = true;
      barSafeWidth = 0;
      barWarnWidth = 100; // full red bar
      barValueText = "SAFETY HALT TRIGGERED";
      barLabelText = "DISCOMFORT LEVEL";
      barFooterLeft = "COMFORTABLE";
      barFooterRight = "MAX DISCOMFORT";
      
      showWarningStats = true;
      statVal1 = "HALT";
      statVal2 = `${last.reps.length}`;
      statVal3 = `${last.peakRomDeg.toFixed(0)}°`;
      statLbl1 = "SAFETY STATUS";
      statLbl2 = "REPS COMPLETED";
      statLbl3 = "PEAK ANGLE";
      statVal1Color = "#ff5252";
    } else {
      // Show smoothness progress bar
      showBar = true;
      barSafeWidth = smoothnessPercent;
      barWarnWidth = 0;
      barValueText = `${smoothnessPercent}%`;
      barLabelText = "MOVEMENT SMOOTHNESS";
      barFooterLeft = "0%";
      barFooterMarker = "80% TARGET";
      barMarkerPosition = 80;
      barFooterRight = "100%";
      
      showWarningStats = true;
      statVal1 = `${last.reps.length}`;
      statVal2 = `${last.peakRomDeg.toFixed(0)}°`;
      statVal3 = `${smoothnessPercent}%`;
      statLbl1 = "TOTAL REPS";
      statLbl2 = "PEAK ROM";
      statLbl3 = "SMOOTHNESS";
      statVal3Color = smoothnessPercent >= 80 ? '#00e676' : (smoothnessPercent >= 60 ? '#00e5ff' : '#ffb020');
    }
  }

  // Whoop-style chart configurations
  const chartWidth = Dimensions.get('window').width - 72;
  const chartHeight = 160;
  const paddingTop = 15;
  const paddingBottom = 20;
  const paddingLeft = 30;
  const paddingRight = 30;

  const reps = last ? (last.reps || []) : [];
  const numReps = reps.length;
  
  let romPoints = "";
  let smoothnessPoints = "";
  
  const maxValROM = reps.length ? Math.max(100, ...reps.map(r => r.peakRomDeg), 90) : 100;
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;
  
  const romNodeCoords: {x: number, y: number, val: number}[] = [];
  const smoothNodeCoords: {x: number, y: number, val: number}[] = [];

  if (numReps > 0) {
    reps.forEach((r, idx) => {
      const x = paddingLeft + (numReps > 1 ? (idx / (numReps - 1)) * plotWidth : plotWidth / 2);
      const yRom = chartHeight - paddingBottom - (r.peakRomDeg / maxValROM) * plotHeight;
      romNodeCoords.push({ x, y: yRom, val: r.peakRomDeg });
      
      const sVal = Math.min(1, Math.max(0, r.smoothness));
      const ySmooth = chartHeight - paddingBottom - sVal * plotHeight;
      smoothNodeCoords.push({ x, y: ySmooth, val: sVal });
    });
    
    romPoints = romNodeCoords.map(n => `${n.x},${n.y}`).join(" ");
    smoothnessPoints = smoothNodeCoords.map(n => `${n.x},${n.y}`).join(" ");
  }

  const gridLines = [0.25, 0.5, 0.75].map(ratio => {
    const y = chartHeight - paddingBottom - ratio * plotHeight;
    return y;
  });

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.scroll}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerLabel}>POST-SESSION ANALYTICS</Text>
        <View style={styles.headerTitleRow}>
          <Text style={[styles.title, { color: colors.title }]}>Session Summary</Text>
          <Pressable onPress={toggleTheme} style={[styles.themeBtn, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Ionicons name={isDark ? "sunny-outline" : "moon-outline"} size={14} color={colors.title} />
          </Pressable>
        </View>
        <Text style={[styles.when, { color: colors.body }]}>{when(last.startedAt)}</Text>
      </View>

      {/* SVG Smoothness Gauge */}
      <View style={styles.gaugeSection}>
        <View style={styles.svgWrapper}>
          <Svg width={size} height={size}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={isDark ? '#1c1f22' : '#e2e8f0'}
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            <AnimatedCircle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={gaugeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </Svg>
          <View style={styles.gaugeValueWrapper}>
            <Text style={[styles.gaugeValue, { color: colors.title }, last.pain === 'stopped' && { color: '#ff5252' }]}>
              {last.pain === 'stopped' ? 'STOP' : `${smoothnessPercent}%`}
            </Text>
            <Text style={[styles.gaugeLabel, { color: colors.body }]}>
              {last.pain === 'stopped' ? 'DISCOMFORT' : 'SMOOTHNESS'}
            </Text>
          </View>
        </View>
      </View>

      {/* Whoop-style Session Repetition Chart Card */}
      <View style={[styles.chartCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <View style={styles.chartHeader}>
          <Text style={[styles.chartTitle, { color: colors.title }]}>Repetition Analysis</Text>
          <Text style={[styles.chartSub, { color: colors.body }]}>Peak ROM vs. Movement Smoothness</Text>
        </View>
        
        {/* SVG Drawing */}
        <View style={{ width: '100%', height: chartHeight, position: 'relative' }}>
          {numReps === 0 ? (
            <View style={styles.emptyChartOverlay}>
              <Text style={{ color: colors.body, fontSize: 11 }}>No repetitions logged in this session.</Text>
            </View>
          ) : (
            <Svg width={chartWidth} height={chartHeight}>
              {/* Horizontal grid lines */}
              {gridLines.map((y, idx) => (
                <Line key={idx} x1={paddingLeft} y1={y} x2={chartWidth - paddingRight} y2={y} stroke="rgba(142, 154, 160, 0.1)" strokeWidth={1} strokeDasharray="3 3" />
              ))}
              
              {/* Vertical grids for reps */}
              {romNodeCoords.map((n, idx) => (
                <Line key={idx} x1={n.x} y1={paddingTop} x2={n.x} y2={chartHeight - paddingBottom} stroke="rgba(142, 154, 160, 0.05)" strokeWidth={1} />
              ))}
              
              {/* Left Y Axis label */}
              <SvgText x={10} y={chartHeight - paddingBottom} fill={colors.body} fontSize={8} fontWeight="bold">0°</SvgText>
              <SvgText x={10} y={chartHeight - paddingBottom - 0.5 * plotHeight + 3} fill={colors.body} fontSize={8} fontWeight="bold">{(maxValROM / 2).toFixed(0)}°</SvgText>
              <SvgText x={10} y={paddingTop + 3} fill={colors.body} fontSize={8} fontWeight="bold">{(maxValROM).toFixed(0)}°</SvgText>
              
              {/* Right Y Axis label */}
              <SvgText x={chartWidth - 25} y={chartHeight - paddingBottom} fill={colors.body} fontSize={8} fontWeight="bold">0%</SvgText>
              <SvgText x={chartWidth - 25} y={chartHeight - paddingBottom - 0.5 * plotHeight + 3} fill={colors.body} fontSize={8} fontWeight="bold">50%</SvgText>
              <SvgText x={chartWidth - 25} y={paddingTop + 3} fill={colors.body} fontSize={8} fontWeight="bold">100%</SvgText>
              
              {/* X Axis labels (R1, R2...) */}
              {romNodeCoords.map((n, idx) => (
                <SvgText key={idx} x={n.x} y={chartHeight - 4} fill={colors.body} fontSize={8} textAnchor="middle" fontWeight="bold">R{idx + 1}</SvgText>
              ))}
              
              {/* Lines */}
              {romPoints ? <Polyline points={romPoints} fill="none" stroke="#00e5ff" strokeWidth={2.5} /> : null}
              {smoothnessPoints ? <Polyline points={smoothnessPoints} fill="none" stroke="#00e676" strokeWidth={2.5} /> : null}
              
              {/* ROM dots */}
              {romNodeCoords.map((n, idx) => (
                <Circle key={idx} cx={n.x} cy={n.y} r={4.5} fill="#00e5ff" stroke={colors.cardBg} strokeWidth={1.5} />
              ))}
              
              {/* Smoothness dots */}
              {smoothNodeCoords.map((n, idx) => (
                <Circle key={idx} cx={n.x} cy={n.y} r={4.5} fill="#00e676" stroke={colors.cardBg} strokeWidth={1.5} />
              ))}
            </Svg>
          )}
        </View>

        {/* Legend */}
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#00e5ff' }]} />
            <Text style={[styles.legendLabel, { color: colors.title }]}>Peak ROM (Deg)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#00e676' }]} />
            <Text style={[styles.legendLabel, { color: colors.title }]}>Smoothness (%)</Text>
          </View>
        </View>
      </View>

      {/* Upgraded Clinical Coach Card */}
      <View style={[styles.coachCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <View style={styles.coachHeader}>
          <Ionicons name={feedbackIcon as any} size={20} color={feedbackColor} style={styles.coachIcon} />
          <Text style={[styles.coachTitle, { color: colors.title }]}>{feedbackTitle}</Text>
        </View>

        {/* Dynamic Comparison Bar (Whoop/Sleep Ranges Style) */}
        {showBar && (
          <View style={styles.warningBarContainer}>
            <View style={styles.warningBarHeader}>
              <Text style={[styles.warningBarLabel, { color: colors.body }]}>{barLabelText}</Text>
              <Text style={[styles.warningBarValue, { color: feedbackColor }]}>{barValueText}</Text>
            </View>
            
            <View style={[styles.warningBarTrack, { backgroundColor: isDark ? '#1c1f22' : '#e2e8f0' }]}>
              {barSafeWidth > 0 && (
                <View style={[styles.warningBarSafe, { width: `${barSafeWidth}%`, backgroundColor: last.avgSmoothness < 0.6 ? '#ffb020' : '#00e676' }]} />
              )}
              {barWarnWidth > 0 && (
                <View style={[styles.warningBarExceeded, { width: `${barWarnWidth}%` }]} />
              )}
              {barMarkerPosition > 0 && (
                <View style={[styles.warningBarLimitMarker, { left: `${barMarkerPosition}%` }]} />
              )}
            </View>
            
            <View style={styles.warningBarFooter}>
              <Text style={[styles.warningBarFooterText, { color: colors.body }]}>{barFooterLeft}</Text>
              {barFooterMarker ? (
                <Text style={[styles.warningBarFooterText, { color: feedbackColor, textAlign: 'center', fontWeight: '800' }]}>{barFooterMarker}</Text>
              ) : null}
              <Text style={[styles.warningBarFooterText, { color: colors.body, textAlign: 'right' }]}>{barFooterRight}</Text>
            </View>
          </View>
        )}

        {/* Dynamic Summary Stats Grid (Whoop Stats Style) */}
        {showWarningStats && (
          <View style={[styles.warningStatsGrid, { borderColor: colors.borderStyle }]}>
            <View style={styles.warningStatCol}>
              <Text style={[styles.warningStatVal, { color: statVal1Color }]}>{statVal1}</Text>
              <Text style={[styles.warningStatLbl, { color: colors.body }]}>{statLbl1}</Text>
            </View>
            <View style={[styles.warningStatDivider, { backgroundColor: colors.borderStyle }]} />
            <View style={styles.warningStatCol}>
              <Text style={[styles.warningStatVal, { color: colors.title }]}>{statVal2}</Text>
              <Text style={[styles.warningStatLbl, { color: colors.body }]}>{statLbl2}</Text>
            </View>
            <View style={[styles.warningStatDivider, { backgroundColor: colors.borderStyle }]} />
            <View style={styles.warningStatCol}>
              <Text style={[styles.warningStatVal, { color: statVal3Color }]}>{statVal3}</Text>
              <Text style={[styles.warningStatLbl, { color: colors.body }]}>{statLbl3}</Text>
            </View>
          </View>
        )}

        {/* Session feedback. Labelled "THIS SESSION", not "CLINICAL
            ASSESSMENT" — we report measurements, we don't assess anyone.
            The old "NEUROLOGICAL IMPACT" section is gone: every line in it was
            an invented mechanism with no source (guardrail 2). */}
        <View style={styles.insightSection}>
          <View style={styles.insightSectionHeader}>
            <Ionicons name="pulse" size={14} color={feedbackColor} style={{ marginRight: 6 }} />
            <Text style={[styles.reportSectionLabel, { color: colors.body }]}>THIS SESSION</Text>
          </View>
          <Text style={[styles.reportSectionText, { color: colors.highlight }]}>{assessment}</Text>
        </View>

        <View style={styles.insightSection}>
          <View style={styles.insightSectionHeader}>
            <Ionicons name="flag-outline" size={14} color="#00e5ff" style={{ marginRight: 6 }} />
            <Text style={[styles.reportSectionLabel, { color: colors.body }]}>NEXT PRACTICE CUE</Text>
          </View>
          <Text style={[styles.reportSectionText, { color: colors.highlight }]}>{nextCue}</Text>
        </View>
      </View>

      {/* Detailed Grid Card Metrics */}
      <Text style={[styles.sectionHeader, { color: colors.title }]}>Session Stats</Text>
      <View style={styles.metricsGrid}>
        <View style={[styles.metricCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <Text style={[styles.metricLabel, { color: colors.body }]}>REPETITIONS</Text>
          <Text style={[styles.metricValue, { color: colors.title }]}>{last.reps.length}</Text>
        </View>
        <View style={[styles.metricCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <Text style={[styles.metricLabel, { color: colors.body }]}>PEAK ROM</Text>
          <Text style={[styles.metricValue, { color: colors.title }]}>{last.peakRomDeg.toFixed(0)}°</Text>
        </View>
        <View style={[styles.metricCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <Text style={[styles.metricLabel, { color: colors.body }]}>DURATION</Text>
          <Text style={[styles.metricValue, { color: colors.title }]}>{formatDuration(last.startedAt, last.endedAt)}</Text>
        </View>
        <View style={[styles.metricCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <Text style={[styles.metricLabel, { color: colors.body }]}>JOINT COMFORT</Text>
          <Text style={[
            styles.metricValue, 
            last.pain === 'none' && { color: '#00e676' },
            last.pain === 'mild' && { color: '#ffb020' },
            last.pain === 'stopped' && { color: '#ff5252' }
          ]}>
            {painTextMap[last.pain]}
          </Text>
        </View>
      </View>

      {last.pain === 'stopped' && (
        <View style={[styles.stoppedNoteBox, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <Ionicons name="shield-checkmark" size={16} color={colors.body} style={{ marginRight: 8 }} />
          <Text style={[styles.stoppedNoteText, { color: colors.body }]}>
            Stopping due to discomfort is the right clinical decision and holds your streak consistency.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 40 },
  
  header: {
    alignItems: 'center',
    marginBottom: 20,
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
  when: {
    fontSize: 11.5,
    marginTop: 4,
  },

  gaugeSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
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
  gaugeValue: {
    fontSize: 28,
    fontWeight: '900',
  },
  gaugeLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 4,
  },

  coachCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  coachIcon: { marginRight: 8 },
  coachTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  
  warningBarContainer: {
    marginBottom: 20,
    width: '100%',
  },
  warningBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  warningBarLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  warningBarValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  warningBarTrack: {
    height: 10,
    width: '100%',
    borderRadius: 5,
    flexDirection: 'row',
    position: 'relative',
    overflow: 'hidden',
  },
  warningBarSafe: {
    height: '100%',
  },
  warningBarExceeded: {
    height: '100%',
    backgroundColor: '#ff5252',
  },
  warningBarLimitMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#ffffff',
  },
  warningBarFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  warningBarFooterText: {
    fontSize: 8.5,
    fontWeight: '800',
    flex: 1,
  },
  
  warningStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  warningStatCol: {
    flex: 1,
    alignItems: 'center',
  },
  warningStatVal: {
    fontSize: 18,
    fontWeight: '900',
  },
  warningStatLbl: {
    fontSize: 8,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  warningStatDivider: {
    width: 1,
    height: '100%',
  },
  
  insightSection: {
    marginBottom: 16,
  },
  insightSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  reportSectionLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  reportSectionText: {
    fontSize: 12.5,
    lineHeight: 18,
  },

  chartCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  chartHeader: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  chartSub: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
  },
  emptyChartOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendColor: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendLabel: {
    fontSize: 9.5,
    fontWeight: '800',
  },

  sectionHeader: {
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  metricLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },

  stoppedNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
  },
  stoppedNoteText: {
    fontSize: 11.5,
    lineHeight: 16,
    flex: 1,
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    minHeight: Dimensions?.get('window')?.height ? Dimensions.get('window').height - 180 : 500,
  },
  emptyIcon: { marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
