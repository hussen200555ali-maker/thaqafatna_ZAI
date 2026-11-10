/**
 * 🚀 App Entry - التطبيق الرئيسي
 */

import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { AppNavigator } from './src/navigation/AppNavigator';
import { Colors } from './src/theme/theme';
import { loadAuthToken } from './src/services/api';

const getOnboardingSeen = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem('onboarding_seen') === 'true';
    }
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return (await AsyncStorage.getItem('onboarding_seen')) === 'true';
  } catch {
    return false;
  }
};

const setOnboardingSeen = async () => {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem('onboarding_seen', 'true');
      return;
    }
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem('onboarding_seen', 'true');
  } catch {}
};

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        await loadAuthToken();
        const seen = await getOnboardingSeen();
        setShowOnboarding(seen !== true);
      } catch {
        setShowOnboarding(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleFinishOnboarding = async () => {
    await setOnboardingSeen();
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
  loadingEmoji: { fontSize: 72 },
  loadingText: {
    color: Colors.textMuted,
    fontSize: 14,
    marginTop: 12,
    fontFamily: 'Tajawal',
  },
});
