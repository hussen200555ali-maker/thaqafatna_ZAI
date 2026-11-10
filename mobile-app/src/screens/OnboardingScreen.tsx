/**
 * 🚀 شاشة الـ Onboarding - تعريف التطبيق
 */

import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  FlatList, Animated, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme/theme';
import { Button } from '../components';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: 1,
    icon: '🎮' as any,
    title: 'العب وتعلّم',
    description: 'كلمات متقاطعة وألغاز عربية تنمّي مفرداتك وتثقّفك بطريقة ممتعة',
    color: Colors.primary,
  },
  {
    id: 2,
    icon: '📚' as any,
    title: 'اقرأ كتبك المفضّلة',
    description: 'مكتبة رقمية ضخمة من الكتب العربية مع قارئ PDF احترافي وتتبّع تقدّمك',
    color: Colors.secondary,
  },
  {
    id: 3,
    icon: '🏆' as any,
    title: 'تنافس وارتقِ',
    description: 'تحدَّ أصدقاءك، اصعد لقمة المتصدرين، واكسب الشارات والنقاط',
    color: Colors.accent,
  },
];

export function OnboardingScreen({ onFinish }: { onFinish: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      onFinish();
    }
  };

  const handleSkip = () => onFinish();

  const renderItem = ({ item }: any) => (
    <View style={[styles.slide, { width }]}>
      <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
        <Text style={styles.icon}>{item.icon}</Text>
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Skip button */}
      <View style={styles.skipContainer}>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>تخطّي</Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <FlatList
        ref={slidesRef}
        data={slides}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        keyExtractor={(item) => String(item.id)}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={32}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        style={{ flex: 1 }}
      />

      {/* Dots */}
      <View style={styles.dotsContainer}>
        {slides.map((_, i) => {
          const opacity = scrollX.interpolate({
            inputRange: [(i - 1) * width, i * width, (i + 1) * width],
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });
          const width_ = scrollX.interpolate({
            inputRange: [(i - 1) * width, i * width, (i + 1) * width],
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });
          return <Animated.View key={i} style={[styles.dot, { opacity, width: width_ as any }]} />;
        })}
      </View>

      {/* CTA */}
      <View style={styles.ctaContainer}>
        <Button
          title={currentIndex === slides.length - 1 ? 'ابدأ الآن' : 'التالي'}
          onPress={handleNext}
          size="lg"
          icon={currentIndex === slides.length - 1 ? 'rocket' : 'arrow-forward'}
          style={styles.ctaButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  skipContainer: {
    position: 'absolute',
    top: 60,
    right: Spacing.lg,
    zIndex: 1,
  },
  skipText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    fontFamily: 'Tajawal',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  iconContainer: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  icon: {
    fontSize: 80,
  },
  title: {
    fontSize: FontSize.hero,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
    fontFamily: 'Cairo',
  },
  description: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 28,
    fontFamily: 'Tajawal',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: Spacing.lg,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginHorizontal: 4,
  },
  ctaContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl + 20,
  },
  ctaButton: {
    backgroundColor: Colors.primary,
  },
});
