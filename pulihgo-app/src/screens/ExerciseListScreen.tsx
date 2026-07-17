// src/screens/ExerciseListScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { EXERCISES } from '../exercises/exerciseLibrary';
import { usePrescription } from '../sync/usePrescription';
import type { ExerciseConfig } from '../types';
import { Ionicons } from '@expo/vector-icons';

interface ExerciseListScreenProps {
  onSelect: (exercise: ExerciseConfig) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export default function ExerciseListScreen({ onSelect, theme, toggleTheme }: ExerciseListScreenProps) {
  const isDark = theme === 'dark';
  const { rx } = usePrescription();

  const colors = {
    bg: isDark ? '#0b0e11' : '#FAFAF7',
    cardBg: isDark ? '#121417' : '#FFFFFF',
    border: isDark ? '#1c1f22' : '#E2E4DE',
    title: isDark ? '#FFFFFF' : '#1A1D1A',
    body: isDark ? '#8e9aa0' : '#5B5F58',
    accent: isDark ? '#00C2C2' : '#0E7C7B',
    accentSoft: isDark ? 'rgba(0, 194, 194, 0.12)' : '#E1F4F7',
  };

  const getExerciseDescription = (id: string) => {
    switch (id) {
      case 'forearm_supination':
        return 'Twist your forearm palm-up and palm-down to measure forearm rotation.';
      case 'elbow_flexion_extension':
        return 'Bend and straighten your elbow to measure joint range of motion.';
      default:
        return 'Rehabilitation movement exercise using phone sensors.';
    }
  };

  const getExerciseIcon = (id: string): keyof typeof Ionicons.glyphMap => {
    switch (id) {
      case 'forearm_supination':
        return 'refresh-circle-outline';
      case 'elbow_flexion_extension':
        return 'trending-up-outline';
      default:
        return 'fitness-outline';
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={[styles.logo, { color: colors.title }]}>PULIHGO</Text>
        <Pressable
          onPress={toggleTheme}
          style={[styles.themeBtn, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
          accessibilityRole="button"
          accessibilityLabel="Toggle Theme"
        >
          <Ionicons
            name={isDark ? 'sunny-outline' : 'moon-outline'}
            size={22}
            color={colors.title}
          />
        </Pressable>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.accent }]}>CHOOSE EXERCISE</Text>

      {/* Exercise Options */}
      <View style={styles.list}>
        {EXERCISES.map((ex) => {
          const targetRom = ex.id === 'forearm_supination' ? rx.targetRomDeg : ex.targetRomDeg;
          return (
            <Pressable
              key={ex.id}
              onPress={() => onSelect({ ...ex, targetRomDeg: targetRom })}
              style={[
                styles.exerciseCard,
                { backgroundColor: colors.cardBg, borderColor: colors.border },
              ]}
              accessibilityRole="button"
            >
              <View style={[styles.iconWrapper, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name={getExerciseIcon(ex.id)} size={28} color={colors.accent} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardTitle, { color: colors.title }]}>{ex.name}</Text>
                <Text style={[styles.cardDesc, { color: colors.body }]}>
                  {getExerciseDescription(ex.id)}
                </Text>
                <View style={styles.targetRow}>
                  <Ionicons name="checkmark-circle-outline" size={14} color="#1E9E5A" />
                  <Text style={[styles.targetText, { color: colors.body }]}>
                    Target ROM: {targetRom}
                  </Text>
                </View>
              </View>
              <View style={styles.arrowWrapper}>
                <Ionicons name="chevron-forward-outline" size={20} color={colors.body} />
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Context info for safety */}
      <View style={[styles.infoBox, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#FFFFFF', borderColor: colors.border }]}>
        <Ionicons name="shield-outline" size={24} color={colors.accent} style={styles.infoIcon} />
        <Text style={[styles.infoText, { color: colors.body }]}>
          All exercises are calibrated to your neutral resting position. If you feel any discomfort or pain, stop immediately by tapping the red emergency button on the screen.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    height: 48,
  },
  logo: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
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
  sectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  list: {
    gap: 16,
    marginBottom: 24,
  },
  exerciseCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 16,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  targetText: {
    fontSize: 12,
    fontWeight: '600',
  },
  arrowWrapper: {
    justifyContent: 'center',
  },
  infoBox: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  infoIcon: {
    flexShrink: 0,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
