// src/screens/ProgressScreen.tsx
// OWNER: Radit (taken over from Sulthan) · STATUS: ✅ working
//
// Redesigned to match a premium Whoop app dashboard.
// Incorporates date navigation, animated progress gauges, a flickering streak flame,
// and a custom interactive morphing fire-to-mascot transition modal.

import { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, Pressable, Animated, Easing, Modal, Image } from 'react-native';
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
  const size = 86;
  const strokeWidth = 7;
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

  return (
    <View style={[styles.ringCard, { backgroundColor: isDark ? '#121417' : '#ffffff', borderColor: isDark ? '#1c1f22' : '#e2e8f0' }]}>
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
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={styles.ringValueWrapper}>
          <Text style={[styles.ringValue, { color: isDark ? '#ffffff' : '#0b0e11' }]}>{subLabel}</Text>
        </View>
      </View>
      <Text style={[styles.ringLabel, { color: isDark ? '#8e9aa0' : '#64748b' }]}>{label}</Text>
    </View>
  );
}

// Flickering flame inside the streak banner card
function FlickeringFlame({ active, onPressTrigger }: { active: boolean; onPressTrigger: () => void }) {
  const outerScale = useRef(new Animated.Value(1)).current;
  const middleScale = useRef(new Animated.Value(1)).current;
  const flameContainerScale = useRef(new Animated.Value(1)).current;

  const sparks = [
    { x: useRef(new Animated.Value(0)).current, y: useRef(new Animated.Value(0)).current, opacity: useRef(new Animated.Value(0)).current, color: '#ff5252' },
    { x: useRef(new Animated.Value(0)).current, y: useRef(new Animated.Value(0)).current, opacity: useRef(new Animated.Value(0)).current, color: '#ffb020' },
    { x: useRef(new Animated.Value(0)).current, y: useRef(new Animated.Value(0)).current, opacity: useRef(new Animated.Value(0)).current, color: '#ffd700' },
    { x: useRef(new Animated.Value(0)).current, y: useRef(new Animated.Value(0)).current, opacity: useRef(new Animated.Value(0)).current, color: '#ff5252' },
    { x: useRef(new Animated.Value(0)).current, y: useRef(new Animated.Value(0)).current, opacity: useRef(new Animated.Value(0)).current, color: '#ffb020' },
  ];

  useEffect(() => {
    if (!active) return;

    const outerFlicker = Animated.loop(
      Animated.sequence([
        Animated.timing(outerScale, { toValue: 1.08, duration: 250, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(outerScale, { toValue: 0.94, duration: 250, easing: Easing.linear, useNativeDriver: true }),
      ])
    );

    const middleFlicker = Animated.loop(
      Animated.sequence([
        Animated.timing(middleScale, { toValue: 0.88, duration: 180, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(middleScale, { toValue: 1.12, duration: 180, easing: Easing.linear, useNativeDriver: true }),
      ])
    );

    outerFlicker.start();
    middleFlicker.start();

    return () => {
      outerFlicker.stop();
      middleFlicker.stop();
    };
  }, [active]);

  const handlePress = () => {
    onPressTrigger();

    Animated.sequence([
      Animated.timing(flameContainerScale, { toValue: 1.45, duration: 100, useNativeDriver: true }),
      Animated.spring(flameContainerScale, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
    ]).start();

    const sparkDestinations = [
      { x: -28, y: -26 },
      { x: -8, y: -38 },
      { x: 12, y: -34 },
      { x: -22, y: -8 },
      { x: 24, y: -12 },
    ];

    sparks.forEach((s, i) => {
      s.x.setValue(0);
      s.y.setValue(0);
      s.opacity.setValue(1);

      Animated.parallel([
        Animated.timing(s.x, { toValue: sparkDestinations[i].x, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(s.y, { toValue: sparkDestinations[i].y, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(s.opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    });
  };

  return (
    <Pressable onPress={handlePress} style={styles.flameTouchZone}>
      <View style={styles.flameContainer}>
        {sparks.map((s, idx) => (
          <Animated.View
            key={idx}
            style={[
              styles.sparkDot,
              {
                backgroundColor: s.color,
                opacity: s.opacity,
                transform: [{ translateX: s.x }, { translateY: s.y }],
              },
            ]}
          />
        ))}

        <Animated.View style={[styles.flameScaleWrapper, { transform: [{ scale: flameContainerScale }] }]}>
          <Animated.View style={[styles.flameTeardrop, styles.flameOuter, { transform: [{ rotate: '-45deg' }, { scale: outerScale }] }]} />
          <Animated.View style={[styles.flameTeardrop, styles.flameMiddle, { transform: [{ rotate: '-45deg' }, { scale: middleScale }] }]} />
          <View style={[styles.flameTeardrop, styles.flameInner, { transform: [{ rotate: '-45deg' }] }]} />
        </Animated.View>
      </View>
    </Pressable>
  );
}

// Special high-fidelity morphing fire mascot component inside the streak modal
function MorphingFlameMascot({ trigger, theme }: { trigger: boolean; theme: 'dark' | 'light' }) {
  const rotateAnim = useRef(new Animated.Value(0)).current;      // 0 to 1
  const translateYAnim = useRef(new Animated.Value(0)).current;  // 0 to -80 to 0
  const fireOpacity = useRef(new Animated.Value(1)).current;     // 1 to 0
  const mascotOpacity = useRef(new Animated.Value(0)).current;   // 0 to 1
  
  // Idle breathing loops
  const idleBob = useRef(new Animated.Value(0)).current;
  const idleScaleY = useRef(new Animated.Value(1)).current;
  const bgPulse = useRef(new Animated.Value(1)).current;

  // Flicker loops for regular fire
  const outerScale = useRef(new Animated.Value(1)).current;
  const middleScale = useRef(new Animated.Value(1)).current;

  const [hasFinishedTransform, setHasFinishedTransform] = useState(false);

  useEffect(() => {
    // Flamy background heat waves pulsation loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgPulse, { toValue: 1.22, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(bgPulse, { toValue: 0.94, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Small flickering loops for the regular fire during preparation
    const outerFlicker = Animated.loop(
      Animated.sequence([
        Animated.timing(outerScale, { toValue: 1.05, duration: 200, useNativeDriver: true }),
        Animated.timing(outerScale, { toValue: 0.95, duration: 200, useNativeDriver: true }),
      ])
    );
    const middleFlicker = Animated.loop(
      Animated.sequence([
        Animated.timing(middleScale, { toValue: 0.92, duration: 150, useNativeDriver: true }),
        Animated.timing(middleScale, { toValue: 1.08, duration: 150, useNativeDriver: true }),
      ])
    );
    outerFlicker.start();
    middleFlicker.start();

    return () => {
      outerFlicker.stop();
      middleFlicker.stop();
    };
  }, []);

  const runTransformAnimation = () => {
    setHasFinishedTransform(false);
    
    // Reset layout transition values
    rotateAnim.setValue(0);
    translateYAnim.setValue(0);
    fireOpacity.setValue(1);
    mascotOpacity.setValue(0);

    // Stop idle loops
    idleBob.setValue(0);
    idleScaleY.setValue(1);

    // Jump-spin choreography sequence
    Animated.parallel([
      // A. Jump translation (goes up by 80px and falls down with spring landing)
      Animated.sequence([
        Animated.timing(translateYAnim, {
          toValue: -80,
          duration: 400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          friction: 4.5,
          tension: 25,
          useNativeDriver: true,
        }),
      ]),

      // B. Rotation (spins 1080 degrees = 3 full spins)
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      // C. Cross-fade (morphs fire to mascot at the peak of the jump)
      Animated.sequence([
        Animated.delay(300),
        Animated.parallel([
          Animated.timing(fireOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
          Animated.timing(mascotOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]),
      ]),
    ]).start(() => {
      // Transformation complete, enter bobbing breathing loop
      setHasFinishedTransform(true);
    });
  };

  useEffect(() => {
    if (trigger) {
      runTransformAnimation();
    }
  }, [trigger]);

  // Breathing loop after landing
  useEffect(() => {
    if (!hasFinishedTransform) return;

    const bobAnim = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(idleBob, { toValue: 4, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(idleScaleY, { toValue: 1.03, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(idleBob, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(idleScaleY, { toValue: 0.97, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ])
    );
    
    bobAnim.start();
    return () => bobAnim.stop();
  }, [hasFinishedTransform]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '1080deg'],
  });

  const isDark = theme === 'dark';
  const colors = {
    body: isDark ? '#8e9aa0' : '#64748b',
    title: isDark ? '#ffffff' : '#0b0e11',
  };

  return (
    <Pressable onPress={runTransformAnimation} style={styles.animPressContainer}>
      <View style={styles.mascotAreaContainer}>
        {/* Flamy Glowing Radial Backgrounds */}
        <Animated.View style={[
          styles.flamyBackgroundPulse, 
          { 
            transform: [{ scale: bgPulse }],
            opacity: isDark ? 0.25 : 0.15 
          }
        ]} />
        <Animated.View style={[
          styles.flamyBackgroundPulseInner, 
          { 
            transform: [{ scale: bgPulse }],
            opacity: isDark ? 0.35 : 0.25 
          }
        ]} />

        {/* Morphing Jumping Container */}
        <Animated.View style={[
          styles.transformingWrapper,
          {
            transform: [
              { translateY: translateYAnim },
              { rotate: spin },
              { translateY: hasFinishedTransform ? idleBob : 0 },
              { scaleY: hasFinishedTransform ? idleScaleY : 1 }
            ]
          }
        ]}>
          {/* Layer 1: Regular flickering flame (Fades out) */}
          <Animated.View style={[styles.modalRegularFireContainer, { opacity: fireOpacity }]}>
            <Animated.View style={[styles.flameTeardrop, styles.flameOuterLarge, { transform: [{ rotate: '-45deg' }, { scale: outerScale }] }]} />
            <Animated.View style={[styles.flameTeardrop, styles.flameMiddleLarge, { transform: [{ rotate: '-45deg' }, { scale: middleScale }] }]} />
            <View style={[styles.flameTeardrop, styles.flameInnerLarge, { transform: [{ rotate: '-45deg' }] }]} />
          </Animated.View>

          {/* Layer 2: Mascot Flame Character (Fades in) */}
          <Animated.View style={[styles.modalMascotContainer, { opacity: mascotOpacity }]}>
            <Image
              source={require('../../assets/flame_character.png')}
              style={styles.modalMascotImage}
              resizeMode="contain"
            />
          </Animated.View>
        </Animated.View>
      </View>
      
      {!hasFinishedTransform && (
        <Text style={[styles.tapToReplayHint, { color: colors.body }]}>Transforming...</Text>
      )}
      {hasFinishedTransform && (
        <Text style={[styles.tapToReplayHint, { color: colors.body, opacity: 0.7 }]}>
          <Ionicons name="refresh" size={10} /> Tap character to spin & jump again!
        </Text>
      )}
    </Pressable>
  );
}

interface ProgressScreenProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export default function ProgressScreen({ theme, toggleTheme }: ProgressScreenProps) {
  const sessions = useSessions();
  const streak = computeStreak(sessions);
  
  const [showStreakModal, setShowStreakModal] = useState(false);

  const [selectedDate, setSelectedDate] = useState<number>(Date.now());
  const selectedKey = dayKey(selectedDate);
  const isSelectedToday = dayKey(Date.now()) === selectedKey;

  const daySessions = sessions.filter((s) => dayKey(s.startedAt) === selectedKey);
  const hasSelectedPractice = daySessions.length > 0;

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

  const isDark = theme === 'dark';
  const colors = {
    bg: isDark ? '#0b0e11' : '#f0f2f5',
    cardBg: isDark ? '#121417' : '#ffffff',
    cardBorder: isDark ? '#1c1f22' : '#e2e8f0',
    title: isDark ? '#ffffff' : '#0b0e11',
    body: isDark ? '#8e9aa0' : '#64748b',
    highlight: isDark ? '#cfe6ea' : '#334155',
    tabActive: '#00e676',
    borderStyle: isDark ? '#1c1f22' : '#e2e8f0',
  };

  let coachTitle = "No Activity Logged";
  let coachMessage = isSelectedToday
    ? "Welcome to PulihGo. Complete your first forearm rotation session today to calibrate and unlock your recovery stats."
    : "No practice was recorded for this day. Consistent daily practice is essential to drive motor neuroplasticity.";
  let coachIcon = isSelectedToday ? "sparkles-outline" : "calendar-outline";
  let coachColor = isDark ? "#8e9aa0" : "#64748b";

  if (hasSelectedPractice) {
    const worstDiscomfort = daySessions.some(s => s.pain === 'stopped');
    const bestSmoothness = daySessions.reduce((max, s) => Math.max(max, s.avgSmoothness), 0);
    const bestRom = daySessions.reduce((max, s) => Math.max(max, s.peakRomDeg), 0);

    if (worstDiscomfort) {
      coachTitle = "Listening to Your Body";
      coachMessage = "You did the right thing by halting practice when discomfort triggered. Rest is key to joint recovery; your streak remains locked.";
      coachIcon = "heart-half-outline";
      coachColor = "#ff5252";
    } else if (bestSmoothness < 0.6) {
      coachTitle = "Prioritize Movement Control";
      coachMessage = `Average smoothness was ${(dayAvgSmoothness * 100).toFixed(0)}%. To best stimulate neural pathways, focus on slow, controlled loops instead of speed.`;
      coachIcon = "speedometer-outline";
      coachColor = "#ffb020";
    } else if (bestRom < 55) {
      coachTitle = "Developing Rotation Range";
      coachMessage = `You achieved ${bestRom.toFixed(0)}° peak rotation. Maintain practice to slowly restore joint reach. Hold gently at full stretch for 1 second.`;
      coachIcon = "trending-up-outline";
      coachColor = "#00e5ff";
    } else {
      coachTitle = "Optimal Practice Day";
      coachMessage = `Superb coordination! Forearm movement was highly smooth (${(dayAvgSmoothness * 100).toFixed(0)}%) with safe extension ranges. Maintain this controlled pace.`;
      coachIcon = "checkmark-circle-outline";
      coachColor = "#00e676";
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

  const showBurstFeedback = () => {
    setShowStreakModal(true);
  };

  return (
    <View style={[styles.flexRoot, { backgroundColor: colors.bg }]}>
      <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.scroll}>
        {/* Premium Spaced Whoop Header */}
        <View style={styles.header}>
          <Text style={[styles.brandTitle, { color: colors.title }]}>P U L I H G O</Text>
          
          <View style={styles.headerRight}>
            <View style={[styles.dateSelector, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <Pressable onPress={() => shiftDate(-1)} style={styles.chevronTouch}>
                <Ionicons name="chevron-back" size={16} color={colors.body} />
              </Pressable>
              
              <Text style={[styles.dateText, { color: colors.title }]}>
                {isSelectedToday ? 'TODAY' : shortDate(selectedDate)}
              </Text>
              
              <Pressable 
                onPress={() => shiftDate(1)} 
                disabled={isSelectedToday} 
                style={[styles.chevronTouch, isSelectedToday && { opacity: 0.3 }]}
              >
                <Ionicons name="chevron-forward" size={16} color={isSelectedToday ? (isDark ? "#464d52" : "#cbd5e1") : colors.body} />
              </Pressable>
            </View>

            <Pressable onPress={toggleTheme} style={[styles.themeBtn, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <Ionicons name={isDark ? "sunny-outline" : "moon-outline"} size={16} color={colors.title} />
            </Pressable>
          </View>
        </View>

        {/* Horizontal Weekly Calendar Strip */}
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
                  isActive && { backgroundColor: isDark ? '#ffffff' : '#0b0e11' }
                ]}>
                  <Text style={[
                    styles.dayNumber, 
                    { color: isDark ? '#ffffff' : '#0b0e11' },
                    isActive && { color: isDark ? '#0b0e11' : '#ffffff' }
                  ]}>
                    {d.getDate()}
                  </Text>
                </View>
                {hasActivity && <View style={styles.activeGreenDot} />}
              </Pressable>
            );
          })}
        </View>

        {/* Three Animated Progress Gauges */}
        <View style={styles.ringsContainer}>
          <CircularProgress
            percentage={romPercent}
            color="#00e5ff"
            label="PEAK ROM"
            subLabel={hasSelectedPractice ? `${dayBestRom.toFixed(0)}°` : '0°'}
            theme={theme}
          />
          <CircularProgress
            percentage={smoothnessPercent}
            color="#00e676"
            label="SMOOTH"
            subLabel={hasSelectedPractice ? `${smoothnessPercent}%` : '0%'}
            theme={theme}
          />
          <CircularProgress
            percentage={dosePercent}
            color="#a052ff"
            label="DAILY DOSE"
            subLabel={`${sessionsToday}/${dailyTarget}`}
            theme={theme}
          />
        </View>

        {/* PulihGo Coach Card */}
        <View style={[styles.coachCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, borderLeftColor: coachColor }]}>
          <View style={styles.coachHeader}>
            <Ionicons name={coachIcon as any} size={20} color={coachColor} style={styles.coachIcon} />
            <Text style={[styles.coachTitle, { color: colors.title }]}>{coachTitle}</Text>
          </View>
          <Text style={[styles.coachMessage, { color: colors.body }]}>{coachMessage}</Text>
        </View>

        {/* Practice Streak Banner (Burstable Flame animation + click trigger popup modal) */}
        <Pressable 
          onPress={() => setShowStreakModal(true)}
          style={[styles.streakBanner, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
        >
          <FlickeringFlame active={streak.current > 0} onPressTrigger={showBurstFeedback} />
          <View style={styles.streakInfo}>
            <Text style={[styles.streakValue, { color: colors.title }]}>{streak.current} {streak.current === 1 ? 'day' : 'days'} streak</Text>
            <Text style={[styles.streakSub, { color: colors.body }]}>
              {streak.practicedToday ? 'Streak locked today • Tap flame!' : 'Not practiced yet today'}
            </Text>
          </View>
          <View style={styles.streakBest}>
            <Text style={[styles.streakBestLabel, { color: colors.body }]}>BEST RUN</Text>
            <Text style={styles.streakBestValue}>{streak.best}d</Text>
          </View>
        </Pressable>

        {/* Rehabilitation Metrics Grid (All-Time Career Stats) */}
        <Text style={[styles.sectionHeader, { color: colors.title }]}>Rehab Career Stats</Text>
        <View style={styles.metricsGrid}>
          <View style={[styles.gridCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Text style={[styles.gridValue, { color: colors.title }]}>{bestRomDeg(sessions).toFixed(0)}°</Text>
            <Text style={[styles.gridLabel, { color: colors.body }]}>BEST ROM (ALL-TIME)</Text>
          </View>
          <View style={[styles.gridCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Text style={[styles.gridValue, { color: colors.title }]}>{totalReps(sessions)}</Text>
            <Text style={[styles.gridLabel, { color: colors.body }]}>TOTAL REPS</Text>
          </View>
          <View style={[styles.gridCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Text style={[styles.gridValue, { color: colors.title }]}>{sessions.length}</Text>
            <Text style={[styles.gridLabel, { color: colors.body }]}>SESSIONS</Text>
          </View>
          <View style={[styles.gridCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Text style={[styles.gridValue, { color: colors.title }]}>
              {Math.round(sessions.reduce((sum, s) => sum + (s.endedAt - s.startedAt), 0) / 60000)}m
            </Text>
            <Text style={[styles.gridLabel, { color: colors.body }]}>ACTIVE TIME</Text>
          </View>
        </View>

        {/* Today's / Recent Activities */}
        <Text style={[styles.sectionHeader, { color: colors.title }]}>Practice Logs for {isSelectedToday ? 'Today' : shortDate(selectedDate)}</Text>
        {daySessions.length === 0 ? (
          <View style={[styles.noHistoryCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Ionicons name="file-tray-outline" size={32} color={isDark ? "#3a424a" : "#cbd5e1"} style={{ marginBottom: 8 }} />
            <Text style={[styles.noHistoryText, { color: colors.body }]}>No sessions recorded on this day.</Text>
          </View>
        ) : (
          daySessions.map((s: SessionSummary) => (
            <View key={s.id} style={[styles.activityCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <View style={styles.activityHeader}>
                <View style={styles.activityTitleRow}>
                  <Ionicons name="pulse" size={18} color="#00e5ff" style={styles.activityIcon} />
                  <Text style={[styles.activityTitle, { color: colors.title }]}>Forearm Rotation</Text>
                </View>
                <Text style={[styles.activityTime, { color: colors.body }]}>{formatTime(s.startedAt)}</Text>
              </View>
              <View style={[styles.activityDivider, { backgroundColor: colors.borderStyle }]} />
              <View style={styles.activityStatsRow}>
                <View style={styles.activityStat}>
                  <Text style={[styles.activityStatValue, { color: colors.title }]}>{s.reps.length}</Text>
                  <Text style={[styles.activityStatLabel, { color: colors.body }]}>REPS</Text>
                </View>
                <View style={[styles.activityStatDivider, { backgroundColor: colors.borderStyle }]} />
                <View style={styles.activityStat}>
                  <Text style={[styles.activityStatValue, { color: colors.title }]}>{s.peakRomDeg.toFixed(0)}°</Text>
                  <Text style={[styles.activityStatLabel, { color: colors.body }]}>PEAK ROM</Text>
                </View>
                <View style={[styles.activityStatDivider, { backgroundColor: colors.borderStyle }]} />
                <View style={styles.activityStat}>
                  <Text style={[styles.activityStatValue, { color: colors.title }]}>{(s.avgSmoothness * 100).toFixed(0)}%</Text>
                  <Text style={[styles.activityStatLabel, { color: colors.body }]}>SMOOTH</Text>
                </View>
              </View>
              {s.pain === 'stopped' && (
                <View style={styles.activityPainBadge}>
                  <Ionicons name="alert-circle" size={14} color="#ff5252" />
                  <Text style={styles.activityPainText}>Stopped due to pain</Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Mascot Streak Modal Popout (Figma style) */}
      <Modal
        visible={showStreakModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStreakModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <Pressable onPress={() => setShowStreakModal(false)} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={24} color={colors.title} />
            </Pressable>

            <Text style={[styles.modalStreakNum, { color: colors.title }]}>{streak.current}</Text>
            <Text style={[styles.modalStreakLabel, { color: colors.title }]}>
              {streak.current === 1 ? 'day streak' : 'days streak'}
            </Text>

            {/* Morphing transition fire mascot component */}
            <MorphingFlameMascot trigger={showStreakModal} theme={theme} />

            {/* Weekly Checklist Tracker (Figma style) */}
            <View style={[
              styles.modalCalendarCard, 
              { 
                backgroundColor: isDark ? '#1c1f22' : '#f8fafc', 
                borderColor: colors.cardBorder 
              }
            ]}>
              <View style={styles.modalWeekRow}>
                {weekDays.map((d, index) => {
                  const hasActivity = dayHasSessions(d);
                  const dayLabel = WEEKDAYS_SHORT[index];
                  
                  return (
                    <View key={index} style={styles.modalWeekDayItem}>
                      <Text style={[styles.modalWeekDayLabel, { color: colors.body }]}>{dayLabel}</Text>
                      {hasActivity ? (
                        <View style={styles.checkedCircle}>
                          <Ionicons name="checkmark" size={12} color="#0b0e11" />
                        </View>
                      ) : (
                        <View style={[
                          styles.uncheckedCircle, 
                          { borderColor: isDark ? '#464d52' : '#cbd5e1' }
                        ]} />
                      )}
                    </View>
                  );
                })}
              </View>
              
              <Text style={[styles.modalExplanation, { color: colors.body }]}>
                A streak counts how many days you've practiced in a row. Keep practicing daily to grow your recovery flame!
              </Text>
            </View>

            <Pressable 
              onPress={() => setShowStreakModal(false)} 
              style={styles.modalGotItBtn}
            >
              <Text style={styles.modalGotItText}>Got it</Text>
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
  scroll: { padding: 20, paddingTop: Platform.OS === 'ios' ? 50 : 30, paddingBottom: 40 },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  chevronTouch: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 11,
    fontWeight: '800',
    marginHorizontal: 4,
    minWidth: 70,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  themeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  weekStripContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  weekDayItem: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayLetter: {
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 4,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  dayNumber: {
    fontSize: 12,
    fontWeight: '800',
  },
  activeGreenDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#00e676',
    marginTop: 4,
    shadowColor: '#00e676',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },

  ringsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  ringCard: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 6,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
  },
  svgWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringValueWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  ringValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  ringLabel: {
    fontSize: 9,
    fontWeight: '800',
    marginTop: 10,
    letterSpacing: 0.5,
  },

  coachCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderWidth: 1,
  },
  coachHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  coachIcon: { marginRight: 8 },
  coachTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  coachMessage: {
    fontSize: 12,
    lineHeight: 18,
  },

  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
  },
  flameTouchZone: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flameContainer: {
    width: 32,
    height: 38,
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  flameScaleWrapper: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  flameTeardrop: {
    position: 'absolute',
    borderTopLeftRadius: 0,
    bottom: 0,
  },
  flameOuter: {
    width: 24,
    height: 24,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: '#ff5252',
    opacity: 0.85,
  },
  flameMiddle: {
    width: 16,
    height: 16,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: '#ffb020',
    opacity: 0.9,
  },
  flameInner: {
    width: 10,
    height: 10,
    borderTopRightRadius: 5,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    backgroundColor: '#ffd700',
  },
  sparkDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    zIndex: 99,
  },
  streakInfo: { flex: 1, marginLeft: 16 },
  streakValue: { fontSize: 15, fontWeight: '800' },
  streakSub: { fontSize: 11, marginTop: 2 },
  streakBest: { alignItems: 'flex-end' },
  streakBestLabel: { fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  streakBestValue: { color: '#ffb020', fontSize: 15, fontWeight: '800', marginTop: 2 },

  sectionHeader: {
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  gridCard: {
    width: '48%',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  gridValue: { fontSize: 20, fontWeight: '900' },
  gridLabel: { fontSize: 8.5, fontWeight: '800', marginTop: 4, letterSpacing: 0.5, textAlign: 'center' },

  activityCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityTitleRow: { flexDirection: 'row', alignItems: 'center' },
  activityIcon: { marginRight: 8 },
  activityTitle: { fontSize: 14, fontWeight: '800' },
  activityTime: { fontSize: 11 },
  activityDivider: { height: 1, marginVertical: 12 },
  activityStatsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10 },
  activityStat: { flex: 1, alignItems: 'center' },
  activityStatValue: { fontSize: 16, fontWeight: '800' },
  activityStatLabel: { fontSize: 8, fontWeight: '800', marginTop: 2, letterSpacing: 0.5 },
  activityStatDivider: { width: 1, height: '100%' },
  activityPainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 12,
  },
  activityPainText: { color: '#ff5252', fontSize: 10, fontWeight: 'bold', marginLeft: 4 },

  noHistoryCard: {
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 20,
  },
  noHistoryText: {
    fontSize: 12.5,
    textAlign: 'center',
  },

  // Modal Popout styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  modalStreakNum: {
    fontSize: 48,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 10,
  },
  modalStreakLabel: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  modalMascot: {
    width: 140,
    height: 140,
    marginVertical: 16,
  },
  modalCalendarCard: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
  },
  modalWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalWeekDayItem: {
    alignItems: 'center',
    flex: 1,
  },
  modalWeekDayLabel: {
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  checkedCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#00e676',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uncheckedCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  modalExplanation: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  modalGotItBtn: {
    backgroundColor: '#00e5ff',
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  modalGotItText: {
    color: '#0b0e11',
    fontWeight: '800',
    fontSize: 14.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Morphing Mascot Styles
  animPressContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginVertical: 12,
  },
  mascotAreaContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  flamyBackgroundPulse: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#ff5252',
    shadowColor: '#ff5252',
    shadowRadius: 25,
    shadowOpacity: 1,
    elevation: 4,
  },
  flamyBackgroundPulseInner: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#ffb020',
    shadowColor: '#ffb020',
    shadowRadius: 15,
    shadowOpacity: 1,
  },
  transformingWrapper: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  modalRegularFireContainer: {
    position: 'absolute',
    width: 80,
    height: 100,
    alignItems: 'center',
    justifyContent: 'flex-end',
    bottom: 20,
  },
  modalMascotContainer: {
    position: 'absolute',
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalMascotImage: {
    width: 140,
    height: 140,
  },
  tapToReplayHint: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  flameOuterLarge: {
    width: 44,
    height: 44,
    borderTopRightRadius: 22,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    backgroundColor: '#ff5252',
    opacity: 0.85,
  },
  flameMiddleLarge: {
    width: 28,
    height: 28,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    backgroundColor: '#ffb020',
    opacity: 0.9,
  },
  flameInnerLarge: {
    width: 16,
    height: 16,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: '#ffd700',
  },
});
