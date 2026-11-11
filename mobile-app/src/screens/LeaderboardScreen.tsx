/**
 * 🏆 شاشة المتصدرين
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme/theme';
import { Loading, EmptyState, Avatar } from '../components';
import { leaderboardApi, authApi } from '../services/api';
import type { LeaderboardEntry } from '../services/api';

interface LeaderboardScreenProps {
  navigation: any;
}

export function LeaderboardScreen({ navigation }: LeaderboardScreenProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'all'>('weekly');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const user = await authApi.getCurrentUser();
      if (user) setCurrentUserId(user.userId);

      const res = await leaderboardApi.get(period, user?.userId);
      setEntries(res.leaderboard || []);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      // بيانات تجريبية لو فشل الـ API
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const periods = [
    { key: 'weekly' as const, label: 'هذا الأسبوع' },
    { key: 'monthly' as const, label: 'هذا الشهر' },
    { key: 'all' as const, label: 'كل الأوقات' },
  ];

  if (loading) return <Loading fullScreen text="جاري تحميل المتصدرين..." />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>🏆 المتصدرون</Text>
        <Text style={styles.pageSubtitle}>{entries.length} متصدّر</Text>
      </View>

      {/* Period Tabs */}
      <View style={styles.tabsContainer}>
        {periods.map(p => (
          <TouchableOpacity
            key={p.key}
            onPress={() => setPeriod(p.key)}
            style={[styles.tab, period === p.key && styles.tabActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, period === p.key && styles.tabTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Top 3 Podium */}
      {entries.length >= 3 && (
        <View style={styles.podium}>
          {/* Second Place */}
          <PodiumItem entry={entries[1]} rank={2} color="#C0C0C0" height={100} />
          {/* First Place */}
          <PodiumItem entry={entries[0]} rank={1} color="#FFD700" height={130} />
          {/* Third Place */}
          <PodiumItem entry={entries[2]} rank={3} color="#CD7F32" height={80} />
        </View>
      )}

      {/* List */}
      {entries.length === 0 ? (
        <EmptyState
          icon="trophy-outline"
          title="لا يوجد متصدرون بعد"
          description="كن أول من يتصدر القائمة!"
        />
      ) : (
        <FlatList
          data={entries.slice(3)}
          keyExtractor={(item, idx) => String(item.userId || idx)}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          renderItem={({ item, index }) => {
            const rank = index + 4;
            const isCurrentUser = item.userId === currentUserId;
            return (
              <View style={[styles.listItem, isCurrentUser && styles.listItemCurrentUser]}>
                <Text style={styles.listItemRank}>{rank}</Text>
                <Avatar text={item.userName} size={36} color={isCurrentUser ? Colors.primary : Colors.surfaceLight} />
                <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                  <Text style={styles.listItemName} numberOfLines={1}>
                    {item.userName} {isCurrentUser && '(أنت)'}
                  </Text>
                  <Text style={styles.listItemMeta}>
                    {item.completedLevels} مرحلة مكتملة
                  </Text>
                </View>
                <Text style={styles.listItemScore}>{item.score.toLocaleString()}</Text>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

function PodiumItem({ entry, rank, color, height }: { entry: LeaderboardEntry; rank: number; color: string; height: number }) {
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <View style={styles.podiumItem}>
      <Text style={styles.podiumMedal}>{medals[rank - 1]}</Text>
      <Avatar text={entry.userName} size={56} color={color} />
      <Text style={styles.podiumName} numberOfLines={1}>{entry.userName}</Text>
      <Text style={styles.podiumScore}>{entry.score.toLocaleString()}</Text>
      <View style={[styles.podiumBar, { backgroundColor: color, height }]}>
        <Text style={styles.podiumRank}>#{rank}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  pageTitle: {
    color: Colors.text,
    fontSize: FontSize.hero,
    fontWeight: '800',
    fontFamily: 'Cairo',
  },
  pageSubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: 2,
    fontFamily: 'Tajawal',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '600',
    fontFamily: 'Tajawal',
  },
  tabTextActive: { color: '#fff' },
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  podiumItem: { alignItems: 'center', flex: 1 },
  podiumMedal: { fontSize: 32, marginBottom: Spacing.xs },
  podiumName: {
    color: Colors.text,
    fontSize: FontSize.xs,
    fontWeight: '700',
    marginTop: Spacing.xs,
    fontFamily: 'Cairo',
  },
  podiumScore: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: '800',
    fontFamily: 'Cairo',
  },
  podiumBar: {
    width: '100%',
    marginTop: Spacing.xs,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: Spacing.xs,
  },
  podiumRank: {
    color: Colors.background,
    fontSize: FontSize.lg,
    fontWeight: '800',
    fontFamily: 'Cairo',
  },
  listContainer: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  listItemCurrentUser: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary,
  },
  listItemRank: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    fontWeight: '700',
    width: 30,
    fontFamily: 'Cairo',
  },
  listItemName: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '700',
    fontFamily: 'Cairo',
  },
  listItemMeta: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
    fontFamily: 'Tajawal',
  },
  listItemScore: {
    color: Colors.accent,
    fontSize: FontSize.md,
    fontWeight: '800',
    fontFamily: 'Cairo',
  },
});
