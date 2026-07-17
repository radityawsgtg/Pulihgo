// src/screens/ProgressScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, Pressable, Animated, Easing, Modal } from 'react-native';
import { useSessions } from '../storage/sessionStore';
import { computeStreak, bestRomDeg, totalReps, dayKey } from '../progress/streak';
import type { SessionSummary } from '../types';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function shortDate(ms: number): string {
  const d = new Date(ms);
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function formatTime(ms: number): string {
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function getWeekDays(anchorMs: number): Date[] {
  const current = new Date(anchorMs);
  const dayOfWeek = current.getDay();
  const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(current);
  monday.setDate(current.getDate() + distanceToMonday);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

interface RingProps {
  percentage: number;
  color: string;
  label: string;
  subLabel: string;
  theme: 'dark' | 'light';
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function CircularProgress({ percentage, color, label, subLabel, theme }: RingProps) {
  const size = 96; // enlarged
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: percentage,
      duration: 900,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  const strokeDashoffset = animValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  const isDark = theme === 'dark';
  const colors = {
    cardBg: isDark ? '#121417' : '#FFFFFF',
    border: isDark ? '#1c1f22' : '#E2E4DE',
    title: isDark ? '#FFFFFF' : '#1A1D1A',
    body: isDark ? '#8e9aa0' : '#5B5F58',
  };

  return (
    <View style={[styles.ringCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
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
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={styles.ringCenterText}>
          <Text style={[styles.ringPercent, { color: colors.title }]}>{subLabel}</Text>
        </View>
      </View>
      <Text style={[styles.ringLabel, { color: colors.body }]}>{label}</Text>
    </View>
  );
}

interface ProgressScreenProps {
  onStartExercise: () => void;
  onReplayOnboarding: () => void;
  onEnterDebug: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export default function ProgressScreen({
  onStartExercise,
  onReplayOnboarding,
  onEnterDebug,
  theme,
  toggleTheme,
}: ProgressScreenProps) {
  const sessions = useSessions();
  
  // Date tracking
  const [selectedDate, setSelectedDate] = useState(Date.now());
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showStrainExplainer, setShowStrainExplainer] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [modalClickCount, setModalClickCount] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  const selectedKey = dayKey(selectedDate);
  const isSelectedToday = selectedKey === dayKey(Date.now());

  // Filter sessions for selected date
  const daySessions = sessions.filter((s) => dayKey(s.startedAt) === selectedKey);
  const hasSelectedPractice = daySessions.length > 0;

  // Streak calculations
  const streakInfo = computeStreak(sessions);
  const streak = streakInfo.current;
  const bestRun = sessions.length ? Math.max(streakInfo.best, 2) : 0; // Seeding mock or real streak

  const dailyTarget = 2;
  const sessionsToday = daySessions.length;
  const dosePercent = Math.min(100, Math.round((sessionsToday / dailyTarget) * 100));

  const targetRom = 70;
  const dayBestRom = daySessions.reduce((max, s) => Math.max(max, s.peakRomDeg), 0);
  const romPercent = Math.min(100, Math.round((dayBestRom / targetRom) * 100));

  const dayAvgSmoothness = daySessions.length
    ? daySessions.reduce((sum, s) => sum + s.avgSmoothness, 0) / daySessions.length
    : 0;
  const smoothnessPercent = Math.round(dayAvgSmoothness * 100);

  // Trigger modal helper
  useEffect(() => {
    if (showStreakModal) {
      const timer = setTimeout(() => {
        setModalClickCount((c) => c + 1);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [showStreakModal]);

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
    caution: isDark ? '#ffb020' : '#C77800',
    danger: isDark ? '#ff5252' : '#D64545',
  };

  // Simplified coach messaging - one short sentence each
  let coachTitle = 'Ready to Practice';
  let coachMessage = isSelectedToday
    ? 'Complete your first session today to get started.'
    : 'No practice was recorded for this day.';
  let coachIcon: keyof typeof Ionicons.glyphMap = isSelectedToday ? 'sparkles-outline' : 'calendar-outline';
  let coachColor = colors.accent;

  if (hasSelectedPractice) {
    const worstDiscomfort = daySessions.some((s) => s.pain === 'stopped');
    const bestSmoothness = daySessions.reduce((max, s) => Math.max(max, s.avgSmoothness), 0);
    const bestRom = daySessions.reduce((max, s) => Math.max(max, s.peakRomDeg), 0);

    if (worstDiscomfort) {
      coachTitle = 'Listening to Your Body';
      coachMessage = 'Good job stopping for discomfort; rest is essential for recovery.';
      coachIcon = 'heart-outline';
      coachColor = colors.danger;
    } else if (bestSmoothness < 0.6) {
      coachTitle = 'Focus on Control';
      coachMessage = 'Try to focus on slow, controlled movements next time.';
      coachIcon = 'speedometer-outline';
      coachColor = colors.caution;
    } else if (bestRom < 55) {
      coachTitle = 'Developing Range';
      coachMessage = 'Keep practicing to improve your range of motion over time.';
      coachIcon = 'trending-up-outline';
      coachColor = colors.accent;
    } else {
      coachTitle = 'Optimal Practice Day';
      coachMessage = 'Excellent, smooth movement today!';
      coachIcon = 'checkmark-circle-outline';
      coachColor = colors.safe;
    }
  }

  // Today's Effort (formerly Rehab Strain)
  let rehabStrain = 0.0;
  let indicatorPosition: any = '15%';
  let effortLabel = 'Safe pace';
  let effortColor = colors.safe;
  
  if (hasSelectedPractice) {
    const worstDiscomfort = daySessions.some((s) => s.pain === 'stopped');
    const worstMildPain = daySessions.some((s) => s.pain === 'mild');
    const bestRom = daySessions.reduce((max, s) => Math.max(max, s.peakRomDeg), 0);
    const bestSmoothness = daySessions.reduce((max, s) => Math.max(max, s.avgSmoothness), 0);

    if (worstDiscomfort) {
      rehabStrain = 18.8;
      indicatorPosition = '85%';
      effortLabel = 'Time to rest';
      effortColor = colors.danger;
    } else if (worstMildPain) {
      rehabStrain = 15.2;
      indicatorPosition = '50%';
      effortLabel = 'Take it a bit easier';
      effortColor = colors.caution;
    } else if (bestSmoothness < 0.6 || bestRom < 55) {
      rehabStrain = 11.4;
      indicatorPosition = '50%';
      effortLabel = 'Take it a bit easier';
      effortColor = colors.caution;
    } else {
      rehabStrain = 14.5;
      indicatorPosition = '15%';
      effortLabel = 'Safe pace';
      effortColor = colors.safe;
    }
  }

  const weekDays = getWeekDays(selectedDate);

  const shiftDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    if (newDate.getTime() > Date.now()) return;
    setSelectedDate(newDate.getTime());
  };

  const getDayLetterText = (index: number) => WEEKDAYS_SHORT[index];

  const dayHasSessions = (date: Date) => {
    const key = dayKey(date.getTime());
    return sessions.some((s) => dayKey(s.startedAt) === key);
  };

  const handleStreakBannerPress = () => {
    setShowStreakModal(true);
  };

  return (
    <View style={[styles.flexRoot, { backgroundColor: colors.bg }]}>
      <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onLongPress={onEnterDebug} delayLongPress={1500} accessibilityRole="none">
            <Text style={[styles.brandTitle, { color: colors.title }]}>PULIHGO</Text>
          </Pressable>
          
          <View style={styles.headerRight}>
            {/* Help Onboarding Replay Button */}
            <Pressable
              onPress={onReplayOnboarding}
              style={[styles.headerIconBtn, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
              accessibilityRole="button"
              accessibilityLabel="Help Tutorial"
            >
              <Ionicons name="help-circle-outline" size={24} color={colors.title} />
            </Pressable>
            <Pressable
              onPress={toggleTheme}
              style={[styles.headerIconBtn, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
              accessibilityRole="button"
              accessibilityLabel="Toggle Theme"
            >
              <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={22} color={colors.title} />
            </Pressable>
          </View>
        </View>

        {/* ============ TIER 1: PRIMARY TARGET ACTION (ALWAYS VISIBLE) ============ */}
        <View style={[styles.primaryCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <Text style={[styles.greetingText, { color: colors.body }]}>
            {isSelectedToday ? "Today's Practice" : shortDate(selectedDate)}
          </Text>
          
          {hasSelectedPractice ? (
            <View style={styles.statusRow}>
              <View style={[styles.statusIconCircle, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="checkmark-circle" size={32} color={colors.safe} />
              </View>
              <View style={styles.statusTextCol}>
                <Text style={[styles.statusTitle, { color: colors.title }]}>Practice Complete!</Text>
                <Text style={[styles.statusSub, { color: colors.body }]}>
                  You have logged {daySessions.length} session{daySessions.length > 1 ? 's' : ''} today.
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.statusRow}>
              <View style={[styles.statusIconCircle, { backgroundColor: isDark ? '#1c1f22' : '#f1f5f9' }]}>
                <Ionicons name="ellipse-outline" size={32} color={colors.body} />
              </View>
              <View style={styles.statusTextCol}>
                <Text style={[styles.statusTitle, { color: colors.title }]}>Not Practiced Yet</Text>
                <Text style={[styles.statusSub, { color: colors.body }]}>
                  Complete a scheduled range of motion activity.
                </Text>
              </View>
            </View>
          )}

          <Pressable onPress={onStartExercise} style={[styles.btnPrimaryStart, { backgroundColor: colors.accent }]} accessibilityRole="button">
            <Ionicons name="play" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.btnPrimaryStartText}>Start Exercise</Text>
          </Pressable>
        </View>

        {/* ============ TIER 2: PROGRESSIVE DISCLOSURE PROGRESS DETAIL ============ */}
        <Pressable
          onPress={() => setShowDetails(!showDetails)}
          style={[styles.showMoreBtn, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
          accessibilityRole="button"
        >
          <Text style={[styles.showMoreText, { color: colors.title }]}>
            {showDetails ? 'Hide Detailed Stats' : 'See My Progress'}
          </Text>
          <Ionicons
            name={showDetails ? 'chevron-up-outline' : 'chevron-down-outline'}
            size={18}
            color={colors.title}
            style={{ marginLeft: 6 }}
          />
        </Pressable>

        {showDetails && (
          <View style={styles.tier2Container}>
            {/* Horizontal Weekly Calendar Strip */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.title }]}>Weekly Activity</Text>
              <View style={[styles.dateSelector, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                <Pressable onPress={() => shiftDate(-7)} style={styles.chevronTouch}>
                  <Ionicons name="chevron-back" size={16} color={colors.body} />
                </Pressable>
                <Text style={[styles.dateText, { color: colors.title }]}>Week</Text>
                <Pressable onPress={() => shiftDate(7)} disabled={isSelectedToday} style={[styles.chevronTouch, isSelectedToday && { opacity: 0.3 }]}>
                  <Ionicons name="chevron-forward" size={16} color={colors.body} />
                </Pressable>
              </View>
            </View>

            <View style={[styles.weekStripContainer, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              {weekDays.map((d, index) => {
                const isActive = dayKey(d.getTime()) === selectedKey;
                const hasActivity = dayHasSessions(d);
                const isFuture = d.getTime() > Date.now() && dayKey(d.getTime()) !== dayKey(Date.now());
                
                return (
                  <Pressable
                    key={index}
                    disabled={isFuture}
                    onPress={() => setSelectedDate(d.getTime())}
                    style={[styles.weekDayItem, isFuture && { opacity: 0.25 }]}
                  >
                    <Text style={[styles.weekDayLetter, { color: colors.body }]}>{getDayLetterText(index)}</Text>
                    <View style={[
                      styles.dayCircle, 
                      isActive && { backgroundColor: colors.title }
                    ]}>
                      <Text style={[
                        styles.dayNumber, 
                        { color: colors.title },
                        isActive && { color: colors.cardBg }
                      ]}>
                        {d.getDate()}
                      </Text>
                    </View>
                    {hasActivity && <View style={[styles.activeGreenDot, { backgroundColor: colors.safe }]} />}
                  </Pressable>
                );
              })}
            </View>

            {/* Three Progress Rings */}
            <Text style={[styles.sectionTitle, { color: colors.title, marginBottom: 12 }]}>Today's Target Metrics</Text>
            <View style={styles.ringsContainer}>
              <CircularProgress
                percentage={romPercent}
                color={colors.accent}
                label="PEAK ROM"
                subLabel={hasSelectedPractice ? `${dayBestRom.toFixed(0)}°` : '0°'}
                theme={theme}
              />
              <CircularProgress
                percentage={smoothnessPercent}
                color={colors.safe}
                label="SMOOTHNESS"
                subLabel={hasSelectedPractice ? `${smoothnessPercent}%` : '0%'}
                theme={theme}
              />
              <CircularProgress
                percentage={dosePercent}
                color={colors.caution}
                label="DAILY DOSE"
                subLabel={`${sessionsToday}/${dailyTarget}`}
                theme={theme}
              />
            </View>

            {/* Coach Insights Card */}
            <View style={[styles.coachCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <View style={styles.coachHeaderRow}>
                <Ionicons name={coachIcon} size={24} color={coachColor} />
                <Text style={[styles.coachTitle, { color: colors.title }]}>{coachTitle}</Text>
              </View>
              <Text style={[styles.coachMessage, { color: colors.body }]}>{coachMessage}</Text>
            </View>

            {/* Today's Effort Card */}
            <Pressable
              onPress={() => setShowStrainExplainer(true)}
              style={[styles.effortCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
              accessibilityRole="button"
            >
              <View style={styles.effortHeaderRow}>
                <View style={styles.effortScoreBlock}>
                  <Text style={[styles.effortScore, { color: effortColor }]}>
                    {hasSelectedPractice ? effortLabel : 'No Data'}
                  </Text>
                  <Text style={[styles.effortLabelText, { color: colors.body }]}>TODAY'S EFFORT</Text>
                </View>
                <Ionicons name="information-circle-outline" size={20} color={colors.body} />
              </View>
              {hasSelectedPractice && (
                <View style={styles.sliderContainer}>
                  <View style={styles.sliderBar}>
                    <View style={[styles.sliderSegment, { backgroundColor: colors.safe }]} />
                    <View style={[styles.sliderSegment, { backgroundColor: colors.caution }]} />
                    <View style={[styles.sliderSegment, { backgroundColor: colors.danger }]} />
                  </View>
                  <View style={[styles.sliderIndicator, { left: indicatorPosition, backgroundColor: effortColor }]} />
                </View>
              )}
            </Pressable>

            {/* Streak Banner */}
            <Pressable
              onPress={handleStreakBannerPress}
              style={[styles.streakBanner, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
              accessibilityRole="button"
            >
              <View style={styles.streakLeft}>
                <Ionicons name="flame" size={32} color={colors.caution} />
                <View>
                  <Text style={[styles.streakTitle, { color: colors.title }]}>{streak} Day Streak</Text>
                  <Text style={[styles.streakSub, { color: colors.body }]}>Practice recorded daily.</Text>
                </View>
              </View>
              <View style={styles.streakRight}>
                <Text style={[styles.bestStreakLbl, { color: colors.body }]}>BEST RUN</Text>
                <Text style={[styles.bestStreakVal, { color: colors.caution }]}>{bestRun}d</Text>
              </View>
            </Pressable>

            {/* All-time Career Stats Grid */}
            <Text style={[styles.sectionTitle, { color: colors.title, marginBottom: 12 }]}>All-Time Stats</Text>
            <View style={styles.careerGrid}>
              <View style={[styles.careerCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                <Text style={[styles.careerValue, { color: colors.title }]}>
                  {sessions.length}
                </Text>
                <Text style={[styles.careerLabel, { color: colors.body }]}>TOTAL SESSIONS</Text>
              </View>
              <View style={[styles.careerCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                <Text style={[styles.careerValue, { color: colors.title }]}>
                  {totalReps(sessions)}
                </Text>
                <Text style={[styles.careerLabel, { color: colors.body }]}>TOTAL REPETITIONS</Text>
              </View>
              <View style={[styles.careerCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                <Text style={[styles.careerValue, { color: colors.title }]}>
                  {bestRomDeg(sessions).toFixed(0)}°
                </Text>
                <Text style={[styles.careerLabel, { color: colors.body }]}>BEST ROM REACHED</Text>
              </View>
              <View style={[styles.careerCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                <Text style={[styles.careerValue, { color: colors.title }]}>
                  {streak} days
                </Text>
                <Text style={[styles.careerLabel, { color: colors.body }]}>CURRENT STREAK</Text>
              </View>
            </View>

            {/* Activity Logs */}
            {hasSelectedPractice && (
              <View style={styles.logsSection}>
                <Text style={[styles.sectionTitle, { color: colors.title, marginBottom: 12 }]}>Today's Session Logs</Text>
                {daySessions.map((session, idx) => (
                  <View key={session.id} style={[styles.logCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }, idx > 0 && { marginTop: 12 }]}>
                    <View style={styles.logHeader}>
                      <View style={styles.logTitleRow}>
                        <Ionicons name="pulse-outline" size={18} color={colors.accent} />
                        <Text style={[styles.logName, { color: colors.title }]}>
                          {session.exerciseId === 'elbow_flexion_extension' ? 'Elbow Flexion' : 'Forearm Rotation'}
                        </Text>
                      </View>
                      <Text style={[styles.logTime, { color: colors.body }]}>{formatTime(session.startedAt)}</Text>
                    </View>
                    <View style={styles.logStatsRow}>
                      <View style={styles.logStat}>
                        <Text style={[styles.logStatValue, { color: colors.title }]}>{session.reps.length}</Text>
                        <Text style={[styles.logStatLabel, { color: colors.body }]}>REPS</Text>
                      </View>
                      <View style={styles.logStat}>
                        <Text style={[styles.logStatValue, { color: colors.title }]}>{session.peakRomDeg.toFixed(0)}°</Text>
                        <Text style={[styles.logStatLabel, { color: colors.body }]}>ROM</Text>
                      </View>
                      <View style={styles.logStat}>
                        <Text style={[styles.logStatValue, { color: colors.title }]}>{Math.round(session.avgSmoothness * 100)}%</Text>
                        <Text style={[styles.logStatLabel, { color: colors.body }]}>SMOOTHNESS</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ============ MODAL STREAK EXPLATION ============ */}
      <Modal visible={showStreakModal} transparent animationType="slide" onRequestClose={() => setShowStreakModal(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Ionicons name="flame" size={60} color={colors.caution} style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text style={[styles.modalTitle, { color: colors.title }]}>Consistent Practice</Text>
            <Text style={[styles.modalText, { color: colors.body }]}>
              Practice your movements every day to unlock your current streak. Keeping a streak helps stimulate brain pathways for consistent motor recovery.
            </Text>
            <Pressable onPress={() => setShowStreakModal(false)} style={[styles.btnStart, { backgroundColor: colors.accent, width: '100%', marginTop: 16 }]} accessibilityRole="button">
              <Text style={styles.btnStartText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ============ MODAL EFFORT EXPLAINER ============ */}
      <Modal visible={showStrainExplainer} transparent animationType="slide" onRequestClose={() => setShowStrainExplainer(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Ionicons name="information-circle-outline" size={54} color={colors.accent} style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text style={[styles.modalTitle, { color: colors.title }]}>Understanding Effort</Text>
            
            <View style={styles.explainZoneItem}>
              <View style={[styles.zoneDot, { backgroundColor: colors.safe }]} />
              <View style={styles.explainZoneTextCol}>
                <Text style={[styles.explainZoneTitle, { color: colors.title }]}>SAFE PACE</Text>
                <Text style={[styles.explainZoneDesc, { color: colors.body }]}>Controlled movements within safe, painless joint angles.</Text>
              </View>
            </View>

            <View style={styles.explainZoneItem}>
              <View style={[styles.zoneDot, { backgroundColor: colors.caution }]} />
              <View style={styles.explainZoneTextCol}>
                <Text style={[styles.explainZoneTitle, { color: colors.title }]}>EASIER PACE</Text>
                <Text style={[styles.explainZoneDesc, { color: colors.body }]}>Mild pain or fast movements. Consider slowing down.</Text>
              </View>
            </View>

            <View style={styles.explainZoneItem}>
              <View style={[styles.zoneDot, { backgroundColor: colors.danger }]} />
              <View style={styles.explainZoneTextCol}>
                <Text style={[styles.explainZoneTitle, { color: colors.title }]}>TIME TO REST</Text>
                <Text style={[styles.explainZoneDesc, { color: colors.body }]}>Discomfort was flagged. Take a break to recover.</Text>
              </View>
            </View>

            <Pressable onPress={() => setShowStrainExplainer(false)} style={[styles.btnStart, { backgroundColor: colors.accent, width: '100%', marginTop: 24 }]} accessibilityRole="button">
              <Text style={styles.btnStartText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flexRoot: { flex: 1 },
  container: { flex: 1 },
  scroll: { padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 40 },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    height: 48,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
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

  /* Tier 1 Primary Action Card */
  primaryCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  greetingText: {
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTextCol: {
    flex: 1,
    marginLeft: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: 4,
  },
  statusSub: {
    fontSize: 13,
    lineHeight: 18,
  },
  btnPrimaryStart: {
    minHeight: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  btnPrimaryStartText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },

  /* Show More Button */
  showMoreBtn: {
    width: '100%',
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '800',
  },

  /* Tier 2 Stats */
  tier2Container: {
    gap: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '800',
    marginHorizontal: 8,
  },
  chevronTouch: {
    padding: 4,
  },
  weekStripContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 20,
    padding: 12,
  },
  weekDayItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayLetter: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: 13,
    fontWeight: '900',
  },
  activeGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },

  ringsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  ringCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
  },
  svgWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenterText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPercent: {
    fontSize: 14,
    fontWeight: '900',
  },
  ringLabel: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginTop: 8,
    textAlign: 'center',
  },

  coachCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
  },
  coachHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  coachTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  coachMessage: {
    fontSize: 14,
    lineHeight: 20,
  },

  effortCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
  },
  effortHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  effortScoreBlock: {
    flex: 1,
  },
  effortScore: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  effortLabelText: {
    fontSize: 13,
    fontWeight: '800',
  },
  sliderContainer: {
    height: 16,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  sliderSegment: {
    flex: 1,
  },
  sliderIndicator: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },

  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  streakSub: {
    fontSize: 13,
  },
  streakRight: {
    alignItems: 'flex-end',
  },
  bestStreakLbl: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  bestStreakVal: {
    fontSize: 16,
    fontWeight: '900',
  },

  careerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  careerCard: {
    flex: 1,
    minWidth: '45%',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  careerValue: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  careerLabel: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  logsSection: {
    marginTop: 8,
  },
  logCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#E2E4DE',
    paddingBottom: 8,
  },
  logTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logName: {
    fontSize: 14,
    fontWeight: '800',
  },
  logTime: {
    fontSize: 13,
  },
  logStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  logStat: {
    alignItems: 'center',
    flex: 1,
  },
  logStatValue: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 2,
  },
  logStatLabel: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  /* Modals */
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  btnStart: {
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnStartText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },

  /* Effort modal details */
  explainZoneItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 12,
  },
  zoneDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
    marginRight: 12,
  },
  explainZoneTextCol: {
    flex: 1,
  },
  explainZoneTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  explainZoneDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
});
