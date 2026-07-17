// src/screens/OnboardingScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

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
    backgroundImage: require('../../assets/therapy2.png'),
    mascotImage: require('../../assets/mascot_hi.png'),
  },
  {
    kicker: 'DAILY TRACKING',
    title: 'See Your Day',
    body: "See if you've practiced today and start your exercise here.",
    icon: 'home-outline' as const,
    accent: '#0E7C7B',
    ringBg: '#E1F4F7',
    backgroundImage: require('../../assets/therapy3.png'),
    mascotImage: require('../../assets/mascot_jempot.png'),
  },
  {
    kicker: 'EASY PRACTICE',
    title: 'Exercise Library',
    body: 'Pick an exercise, follow the steps, and the app counts your reps automatically.',
    icon: 'play-circle-outline' as const,
    accent: '#0E7C7B',
    ringBg: '#E1F4F7',
    backgroundImage: require('../../assets/therapy4.png'),
    mascotImage: require('../../assets/mascot_tab.png'),
  },
  {
    kicker: 'ALWAYS SAFE',
    title: 'Safety First',
    body: "If anything hurts, tap 'Stop — it hurts' any time. Stopping is never a bad thing.",
    icon: 'shield-checkmark-outline' as const,
    accent: '#D64545',
    ringBg: '#FBE6E4',
    backgroundImage: require('../../assets/therapy2.png'),
    mascotImage: require('../../assets/mascot_hi.png'),
  },
];

export default function OnboardingScreen({ onDone }: OnboardingScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

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

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(24);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 420,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep, fadeAnim, slideAnim]);

  const slide = SLIDES[currentStep];

  return (
    <View style={styles.container}>
      <Image source={slide.backgroundImage} style={styles.backgroundImage} />
      <View style={styles.backgroundOverlay} />

      {/* Top Header Row */}
      <View style={styles.header}>
        <Image source={require('../../assets/icon_without_tag.png')} style={styles.logoImage} />
        <Pressable onPress={handleSkip} style={styles.skipButton} accessibilityRole="button">
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Main Illustration and Text Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Animated outer ring and icon background */}
        <View style={styles.illustrationWrapper}>
          <View style={[styles.outerDashedRing, { borderColor: slide.accent }]} />
          <View style={[styles.iconCircle, { backgroundColor: slide.ringBg }]}>
            <Image source={slide.mascotImage} style={styles.mascotImage} />
          </View>
        </View>

        {/* Text descriptions */}
        <Text style={[styles.kicker, { color: slide.accent }]}>{slide.kicker}</Text>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.body}>{slide.body}</Text>
      </Animated.View>

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
    backgroundColor: '#FFFFFF',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: 24,
    paddingBottom: 16,
    zIndex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  logoImage: {
    width: 44,
    height: 44,
    borderRadius: 14,
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
    zIndex: 1,
    paddingHorizontal: 24,
    paddingTop: 120,
    paddingBottom: 120,
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
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  mascotImage: {
    width: 96,
    height: 96,
    resizeMode: 'contain',
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
    zIndex: 1,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 32,
    zIndex: 1,
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
