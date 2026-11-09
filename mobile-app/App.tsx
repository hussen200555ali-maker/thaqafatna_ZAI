/**
 * 🚀 App Entry - التطبيق الرئيسي
 */

import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AsyncStorage, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { AppNavigator } from './src/navigation/AppNavigator';
import { Colors } from './src/theme/theme';
import { loadAuthToken } from './src/services/api';

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // تحميل token إذا موجود
        await loadAuthToken();

        // التحقق إن كان المستخدم شاهد الـ Onboarding
        const seen = await AsyncStorage.getItem('onboarding_seen');
        setShowOnboarding(seen !== 'true');
      } catch (error) {
        setShowOnboarding(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleFinishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('onboarding_seen', 'true');
    } catch {}
    setShowOnboarding(false);
  };

  if (loading || showOnboarding === null) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingEmoji}>📚</Text>
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  if (showOnboarding) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <OnboardingScreen onFinish={handleFinishOnboarding} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingEmoji: {
    fontSize: 72,
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: 14,
    marginTop: 12,
    fontFamily: 'Tajawal',
  },
});
