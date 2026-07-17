// src/screens/SummaryScreen.tsx
import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Dimensions, Animated, Easing, Pressable } from 'react-native';
import { useSessions } from '../storage/sessionStore';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
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
  const last = sessions[0];

  const size = 150;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Determine percentages for animation
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
    bg: isDark ? '#0b0e11' : '#FAFAF7',
    cardBg: isDark ? '#121417' : '#FFFFFF',
    cardBorder: isDark ? '#1c1f22' : '#E2E4DE',
    title: isDark ? '#FFFFFF' : '#1A1D1A',
    body: isDark ? '#8e9aa0' : '#5B5F58',
    highlight: isDark ? '#cfe6ea' : '#1A1D1A',
    borderStyle: isDark ? '#1c1f22' : '#E2E4DE',
    accent: isDark ? '#00C2C2' : '#0E7C7B',
    safe: isDark ? '#00e676' : '#1E9E5A',
    caution: isDark ? '#ffb020' : '#C77800',
    danger: isDark ? '#ff5252' : '#D64545',
  };

  if (!last) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.bg }]}>
        <Ionicons name="stats-chart-outline" size={60} color={isDark ? "#3a424a" : "#E2E4DE"} style={styles.emptyIcon} />
        <Text style={[styles.emptyTitle, { color: colors.title }]}>No sessions yet</Text>
        <Text style={[styles.emptyText, { color: colors.body }]}>
          Finish an exercise to see your session analytics and coach insight here.
        </Text>
      </View>
    );
  }

  const strokeDashoffset = animValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  // Gauge color based on smoothness and pain logs
  let gaugeColor = colors.safe;
  if (last.pain === 'stopped') {
    gaugeColor = colors.danger;
  } else if (last.avgSmoothness < 0.6) {
    gaugeColor = colors.caution;
  } else if (last.avgSmoothness < 0.8) {
    gaugeColor = colors.accent;
  }

  // Simplified 1-sentence explanations
  let feedbackTitle = 'Optimal Practice Quality';
  let feedbackColor = colors.safe;
  let feedbackIcon: keyof typeof Ionicons.glyphMap = 'checkmark-circle-outline';
  let assessment = '';
  let neuroImpact = '';
  let nextCue = '';

  if (last.pain === 'stopped') {
    feedbackTitle = 'Discomfort Hold Triggered';
    feedbackColor = colors.danger;
    feedbackIcon = 'alert-circle-outline';
    assessment = 'You stopped due to pain — rest the arm for now.';
    neuroImpact = 'Stopping for pain prevents muscle spasm and joint strain.';
    nextCue = 'Rest, then try extremely small, gentle movements next session.';
  } else if (last.peakRomDeg > 90) {
    feedbackTitle = 'Ceiling Warning';
    feedbackColor = colors.caution;
    feedbackIcon = 'warning-outline';
    assessment = 'You moved past the safe ceiling limit.';
    neuroImpact = 'Moving too far too early can cause joint strain.';
    nextCue = 'Keep your movement smaller next session, focusing on control.';
  } else if (last.avgSmoothness < 0.60) {
    feedbackTitle = 'Coordination Alert';
    feedbackColor = colors.caution;
    feedbackIcon = 'pulse-outline';
    assessment = 'Your movement was a bit shaky today.';
    neuroImpact = 'Jerky movements recruit wrong muscles and reduce practice quality.';
    nextCue = 'Slow down and focus on clean, steady movements.';
  } else {
    feedbackTitle = 'Optimal Practice Quality';
    feedbackColor = colors.safe;
    feedbackIcon = 'ribbon-outline';
    assessment = 'Excellent, smooth practice session today.';
    neuroImpact = 'Controlled movement strengthens clean brain-to-muscle pathways.';
    nextCue = 'Keep up this steady pace in your next practice.';
  }

  const painTextMap = {
    none: 'No pain',
    mild: 'Mild discomfort',
    stopped: 'Stopped for pain',
    unknown: 'Not asked',
  };

  // Comparison bar calculation
  let showBar = false;
  let barSafeWidth = 0;
  let barWarnWidth = 0;
  let barMarkerPosition = 0;
  let barValueText = '';
  let barLabelText = '';
  let barFooterLeft = '';
  let barFooterRight = '';
  let barFooterMarker = '';
  let showWarningStats = false;
  let statVal1 = '';
  let statVal2 = '';
  let statVal3 = '';
  let statLbl1 = '';
  let statLbl2 = '';
  let statLbl3 = '';
  let statVal1Color = colors.title;
  let statVal3Color = colors.title;

  if (last) {
    if (last.peakRomDeg > 90) {
      showBar = true;
      const peak = last.peakRomDeg;
      barSafeWidth = (Math.min(peak, 90) / 120) * 100;
      barWarnWidth = peak > 90 ? ((peak - 90) / 120) * 100 : 0;
      barMarkerPosition = 75; // (90 / 120) * 100
      barValueText = `${peak.toFixed(0)}° / 90° limit`;
      barLabelText = 'PEAK ROTATION RANGE';
      barFooterLeft = '0°';
      barFooterMarker = '90° LIMIT';
      barFooterRight = '120°';
      
      showWarningStats = true;
      statVal1 = `${peak.toFixed(0)}°`;
      statVal2 = '90°';
      statVal3 = `+${(peak - 90).toFixed(0)}°`;
      statLbl1 = 'PEAK ROTATION';
      statLbl2 = 'SAFE LIMIT';
      statLbl3 = 'OVER LIMIT';
      statVal1Color = colors.danger;
      statVal3Color = colors.caution;
    } else if (last.pain === 'stopped') {
      showBar = true;
      barSafeWidth = 0;
      barWarnWidth = 100;
      barValueText = 'SAFETY HALT';
      barLabelText = 'DISCOMFORT LEVEL';
      barFooterLeft = 'COMFORTABLE';
      barFooterRight = 'MAX PAIN';
      
      showWarningStats = true;
      statVal1 = 'HALT';
      statVal2 = `${last.reps.length}`;
      statVal3 = `${last.peakRomDeg.toFixed(0)}°`;
      statLbl1 = 'SAFETY STATUS';
      statLbl2 = 'REPS COMPLETED';
      statLbl3 = 'PEAK ANGLE';
      statVal1Color = colors.danger;
    } else {
      showBar = true;
      barSafeWidth = smoothnessPercent;
      barWarnWidth = 0;
      barValueText = `${smoothnessPercent}%`;
      barLabelText = 'MOVEMENT SMOOTHNESS';
      barFooterLeft = '0%';
      barFooterMarker = '80% TARGET';
      barMarkerPosition = 80;
      barFooterRight = '100%';
      
      showWarningStats = true;
      statVal1 = `${last.reps.length}`;
      statVal2 = `${last.peakRomDeg.toFixed(0)}°`;
      statVal3 = `${smoothnessPercent}%`;
      statLbl1 = 'TOTAL REPS';
      statLbl2 = 'PEAK ROM';
      statLbl3 = 'SMOOTHNESS';
      statVal3Color = smoothnessPercent >= 80 ? colors.safe : (smoothnessPercent >= 60 ? colors.accent : colors.caution);
    }
  }

  // Chart configs
  const chartWidth = Dimensions.get('window').width - 72;
  const chartHeight = 160;
  const paddingTop = 15;
  const paddingBottom = 20;
  const paddingLeft = 30;
  const paddingRight = 30;

  const repsList = last.reps || [];
  const numReps = repsList.length;
  
  let romPoints = '';
  let smoothnessPoints = '';
  
  const maxValROM = repsList.length ? Math.max(100, ...repsList.map((r) => r.peakRomDeg), 90) : 100;
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  const romDots: { x: number; y: number }[] = [];
  const smoothDots: { x: number; y: number }[] = [];

  repsList.forEach((r, idx) => {
    const x = paddingLeft + (idx / Math.max(1, numReps - 1)) * plotWidth;
    
    // ROM mapping
    const yRom = paddingTop + plotHeight - (r.peakRomDeg / maxValROM) * plotHeight;
    romDots.push({ x, y: yRom });
    romPoints += `${idx === 0 ? '' : ' '}${x},${yRom}`;

    // Smoothness mapping
    const ySmooth = paddingTop + plotHeight - r.smoothness * plotHeight;
    smoothDots.push({ x, y: ySmooth });
    smoothnessPoints += `${idx === 0 ? '' : ' '}${x},${ySmooth}`;
  });

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.scroll}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.kicker, { color: colors.accent }]}>POST SESSION</Text>
          <Text style={[styles.title, { color: colors.title }]}>Summary Report</Text>
          <Text style={[styles.timestamp, { color: colors.body }]}>{when(last.endedAt)}</Text>
        </View>
        <Pressable
          onPress={toggleTheme}
          style={[styles.themeBtn, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
          accessibilityRole="button"
          accessibilityLabel="Toggle Theme"
        >
          <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={18} color={colors.title} />
        </Pressable>
      </View>

      {/* Main Fluid Gauge Card */}
      <View style={[styles.mainReportCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <View style={styles.gaugeContainer}>
          <View style={styles.svgWrapper}>
            <Svg width={size} height={size}>
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={isDark ? '#1c1f22' : '#E2E4DE'}
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
            <View style={styles.gaugeTextWrapper}>
              <Ionicons name={feedbackIcon} size={30} color={feedbackColor} style={{ marginBottom: 4 }} />
              <Text style={[styles.gaugeValText, { color: colors.title }]}>
                {last.pain === 'stopped' ? 'HALT' : `${smoothnessPercent}%`}
              </Text>
              <Text style={[styles.gaugeLabel, { color: colors.body }]}>
                {last.pain === 'stopped' ? 'PAIN STOP' : 'SMOOTHNESS'}
              </Text>
            </View>
          </View>
        </View>

        {/* Coach Banner */}
        <View style={styles.coachHeader}>
          <Ionicons name="ribbon-outline" size={24} color={feedbackColor} style={styles.coachIcon} />
          <Text style={[styles.coachTitle, { color: colors.title }]}>{feedbackTitle}</Text>
        </View>

        {/* Dynamic Comparison Bar */}
        {showBar && (
          <View style={styles.warningBarContainer}>
            <View style={styles.warningBarHeader}>
              <Text style={[styles.warningBarLabel, { color: colors.body }]}>{barLabelText}</Text>
              <Text style={[styles.warningBarValue, { color: feedbackColor }]}>{barValueText}</Text>
            </View>
            
            <View style={[styles.warningBarTrack, { backgroundColor: isDark ? '#1c1f22' : '#E2E4DE' }]}>
              {barSafeWidth > 0 && (
                <View style={[styles.warningBarSafe, { width: `${barSafeWidth}%`, backgroundColor: last.avgSmoothness < 0.6 ? colors.caution : colors.safe }]} />
              )}
              {barWarnWidth > 0 && (
                <View style={[styles.warningBarExceeded, { width: `${barWarnWidth}%`, backgroundColor: colors.danger }]} />
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

        {/* Dynamic Summary Stats Grid */}
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

        {/* Simplified 1-Sentence Insight Sections */}
        <View style={styles.insightSection}>
          <View style={styles.insightSectionHeader}>
            <Ionicons name="pulse" size={16} color={feedbackColor} style={{ marginRight: 8 }} />
            <Text style={[styles.reportSectionLabel, { color: colors.body }]}>CLINICAL ASSESSMENT</Text>
          </View>
          <Text style={[styles.reportSectionText, { color: colors.highlight }]}>{assessment}</Text>
        </View>

        <View style={styles.insightSection}>
          <View style={styles.insightSectionHeader}>
            <Ionicons name="git-network-outline" size={16} color={feedbackColor} style={{ marginRight: 8 }} />
            <Text style={[styles.reportSectionLabel, { color: colors.body }]}>NEUROLOGICAL IMPACT</Text>
          </View>
          <Text style={[styles.reportSectionText, { color: colors.highlight }]}>{neuroImpact}</Text>
        </View>

        <View style={styles.insightSection}>
          <View style={styles.insightSectionHeader}>
            <Ionicons name="flag-outline" size={16} color={colors.accent} style={{ marginRight: 8 }} />
            <Text style={[styles.reportSectionLabel, { color: colors.body }]}>NEXT PRACTICE CUE</Text>
          </View>
          <Text style={[styles.reportSectionText, { color: colors.highlight }]}>{nextCue}</Text>
        </View>
      </View>

      {/* Repetition Analysis Chart */}
      <View style={[styles.chartCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <View style={styles.chartHeader}>
          <Text style={[styles.chartTitle, { color: colors.title }]}>Repetition Analysis</Text>
          <Text style={[styles.chartSub, { color: colors.body }]}>Shows ROM (teal) and smoothness (green) per rep.</Text>
        </View>

        {repsList.length > 0 ? (
          <View style={{ width: chartWidth, height: chartHeight }}>
            <Svg width={chartWidth} height={chartHeight}>
              {/* Horizontal Grid lines */}
              <Line x1={paddingLeft} y1={paddingTop} x2={chartWidth - paddingRight} y2={paddingTop} stroke={colors.borderStyle} strokeWidth="1" strokeDasharray="3 3" />
              <Line x1={paddingLeft} y1={paddingTop + plotHeight / 2} x2={chartWidth - paddingRight} y2={paddingTop + plotHeight / 2} stroke={colors.borderStyle} strokeWidth="1" strokeDasharray="3 3" />
              <Line x1={paddingLeft} y1={paddingTop + plotHeight} x2={chartWidth - paddingRight} y2={paddingTop + plotHeight} stroke={colors.borderStyle} strokeWidth="1" strokeDasharray="3 3" />
              
              {/* Paths */}
              {romPoints ? <Polyline points={romPoints} fill="none" stroke={colors.accent} strokeWidth="2.5" /> : null}
              {smoothnessPoints ? <Polyline points={smoothnessPoints} fill="none" stroke={colors.safe} strokeWidth="2.5" /> : null}
              
              {/* Dots */}
              {romDots.map((dot, i) => (
                <Circle key={`rom-${i}`} cx={dot.x} cy={dot.y} r="4" fill={colors.accent} stroke={colors.cardBg} strokeWidth="1.5" />
              ))}
              {smoothDots.map((dot, i) => (
                <Circle key={`smooth-${i}`} cx={dot.x} cy={dot.y} r="4" fill={colors.safe} stroke={colors.cardBg} strokeWidth="1.5" />
              ))}
            </Svg>
          </View>
        ) : (
          <View style={[styles.emptyChartOverlay, { width: chartWidth, height: chartHeight }]}>
            <Text style={{ color: colors.body, fontSize: 13 }}>No repetitions completed</Text>
          </View>
        )}

        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: colors.accent }]} />
            <Text style={[styles.legendLabel, { color: colors.title }]}>Peak ROM</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: colors.safe }]} />
            <Text style={[styles.legendLabel, { color: colors.title }]}>Smoothness</Text>
          </View>
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
            last.pain === 'none' && { color: colors.safe },
            last.pain === 'mild' && { color: colors.caution },
            last.pain === 'stopped' && { color: colors.danger }
          ]}>
            {painTextMap[last.pain]}
          </Text>
        </View>
      </View>

      {last.pain === 'stopped' && (
        <View style={[styles.stoppedNoteBox, { backgroundColor: colors.cardBg, borderColor: colors.danger }]}>
          <Ionicons name="alert-circle-outline" size={24} color={colors.danger} style={{ marginRight: 8 }} />
          <Text style={[styles.stoppedNoteText, { color: colors.title }]}>
            This session ended early due to pain. Ensure you rest the limb before next practice.
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    height: 64,
  },
  headerTitleContainer: {
    flex: 1,
  },
  kicker: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  timestamp: {
    fontSize: 13,
    marginTop: 2,
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

  mainReportCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  svgWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeTextWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  gaugeValText: {
    fontSize: 32,
    fontWeight: '900',
  },
  gaugeLabel: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 2,
  },

  coachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  coachIcon: { marginRight: 8 },
  coachTitle: {
    fontSize: 16,
    fontWeight: '900',
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
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  warningBarValue: {
    fontSize: 13,
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
  },
  warningBarLimitMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#FFFFFF',
  },
  warningBarFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  warningBarFooterText: {
    fontSize: 13,
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
    fontSize: 13,
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
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  reportSectionText: {
    fontSize: 15,
    lineHeight: 22,
  },

  chartCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  chartHeader: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  chartSub: {
    fontSize: 13,
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
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendLabel: {
    fontSize: 13,
    fontWeight: '800',
  },

  sectionHeader: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },

  stoppedNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
  },
  stoppedNoteText: {
    fontSize: 13,
    lineHeight: 18,
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
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
