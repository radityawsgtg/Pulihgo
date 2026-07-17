// src/screens/OnboardingScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface OnboardingScreenProps {
  onDone: () => void;
}

const SLIDES = [
  {
    kicker: 'WELCOME',
    title: 'PulihGo',
    body: 'PulihGo helps you practice your arm exercises at home, safely.',
    icon: 'medical-outline' as const,
    accent: '#0E7C7B',
    ringBg: '#E1F4F7',
  },
  {
    kicker: 'DAILY TRACKING',
    title: 'See Your Day',
    body: "See if you've practiced today and start your exercise here.",
    icon: 'home-outline' as const,
    accent: '#0E7C7B',
    ringBg: '#E1F4F7',
  },
  {
    kicker: 'EASY PRACTICE',
    title: 'Exercise Library',
    body: 'Pick an exercise, follow the steps, and the app counts your reps automatically.',
    icon: 'play-circle-outline' as const,
    accent: '#0E7C7B',
    ringBg: '#E1F4F7',
  },
  {
    kicker: 'ALWAYS SAFE',
    title: 'Safety First',
    body: "If anything hurts, tap 'Stop — it hurts' any time. Stopping is never a bad thing.",
    icon: 'shield-checkmark-outline' as const,
    accent: '#D64545',
    ringBg: '#FBE6E4',
  },
];

export default function OnboardingScreen({ onDone }: OnboardingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = async () => {
    if (currentStep < SLIDES.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await AsyncStorage.setItem('pulihgo_onboarding_seen', 'true');
      onDone();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('pulihgo_onboarding_seen', 'true');
    onDone();
  };

  const slide = SLIDES[currentStep];

  return (
    <View style={styles.container}>
      {/* Top Header Row */}
      <View style={styles.header}>
        <Text style={styles.logo}>PULIHGO</Text>
        <Pressable onPress={handleSkip} style={styles.skipButton} accessibilityRole="button">
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Main Illustration and Text Content */}
      <View style={styles.content}>
        {/* Animated outer ring and icon background */}
        <View style={styles.illustrationWrapper}>
          <View style={[styles.outerDashedRing, { borderColor: slide.accent }]} />
          <View style={[styles.iconCircle, { backgroundColor: slide.ringBg }]}>
            <Ionicons name={slide.icon} size={64} color={slide.accent} />
          </View>
        </View>

        {/* Text descriptions */}
        <Text style={[styles.kicker, { color: slide.accent }]}>{slide.kicker}</Text>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.body}>{slide.body}</Text>
      </View>

      {/* Slide Indicators */}
      <View style={styles.indicatorContainer}>
        {SLIDES.map((_, index) => {
          const isActive = index === currentStep;
          return (
            <View
              key={index}
              style={[
                styles.dot,
                isActive
                  ? { width: 24, backgroundColor: slide.accent }
                  : { width: 8, backgroundColor: '#E2E4DE' },
              ]}
            />
          );
        })}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.footerButtons}>
        {currentStep > 0 ? (
          <Pressable onPress={handlePrev} style={styles.backButton} accessibilityRole="button">
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={handleNext}
          style={[styles.nextButton, { backgroundColor: slide.accent }]}
          accessibilityRole="button"
        >
          <Text style={styles.nextButtonText}>
            {currentStep === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF7',
    paddingHorizontal: 24,
    paddingTop: 52,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 48,
  },
  logo: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
    color: '#1A1D1A',
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  skipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5B5F58',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  illustrationWrapper: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  outerDashedRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    opacity: 0.35,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1A1D1A',
    marginBottom: 16,
    lineHeight: 34,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#5B5F58',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E4DE',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1D1A',
  },
  nextButton: {
    flex: 2,
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
