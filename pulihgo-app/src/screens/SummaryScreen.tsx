// src/screens/SummaryScreen.tsx
import { View, Text, StyleSheet, ScrollView, Platform, Dimensions, Pressable } from 'react-native';
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



interface SummaryScreenProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export default function SummaryScreen({ theme, toggleTheme }: SummaryScreenProps) {
  const sessions = useSessions();
  const last = sessions[0];

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

  const painTextMap = {
    none: 'No pain',
    mild: 'Mild discomfort',
    stopped: 'Stopped for pain',
    unknown: 'Not asked',
  };

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
