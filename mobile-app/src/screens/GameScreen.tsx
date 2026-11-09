/**
 * 🎮 شاشة اللعبة - فصول ومراحل
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme/theme';
import { Loading, EmptyState, Badge } from '../components';
import { gameApi } from '../services/api';
import type { GameChapter, GameLevel } from '../services/api';

interface GameScreenProps {
  navigation: any;
}

export function GameScreen({ navigation }: GameScreenProps) {
  const [chapters, setChapters] = useState<GameChapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [levels, setLevels] = useState<GameLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const chaptersRes = await gameApi.chapters();
      const chs = chaptersRes.chapters || [];
      setChapters(chs);
      if (chs.length > 0 && !selectedChapter) {
        setSelectedChapter(chs[0].id);
      }
    } catch (error) {
      console.error('Error loading game chapters:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedChapter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!selectedChapter) return;
    gameApi.levels(selectedChapter)
      .then(res => setLevels(res.levels || []))
      .catch(() => setLevels([]));
  }, [selectedChapter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    if (selectedChapter) {
      const res = await gameApi.levels(selectedChapter).catch(() => ({ levels: [] }));
      setLevels(res.levels || []);
    }
    setRefreshing(false);
  }, [load, selectedChapter]);

  if (loading) return <Loading fullScreen text="جاري تحميل اللعبة..." />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>🎮 اللعبة</Text>
        <Text style={styles.pageSubtitle}>{chapters.length} فصول · {levels.length} مرحلة</Text>
      </View>

      {/* Chapters Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chaptersScroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {chapters.map(ch => (
          <TouchableOpacity
            key={ch.id}
            onPress={() => setSelectedChapter(ch.id)}
            style={[
              styles.chapterPill,
              selectedChapter === ch.id && styles.chapterPillActive,
            ]}
            activeOpacity={0.8}
          >
            <Text style={styles.chapterIcon}>{ch.icon || '🎮'}</Text>
            <Text style={[styles.chapterTitle, selectedChapter === ch.id && styles.chapterTitleActive]}>
              {ch.title}
            </Text>
            <Text style={styles.chapterLevels}>{ch._count?.levels || 0} مرحلة</Text>
            <Badge
              text={ch.isPublished ? 'منشور' : 'مسودة'}
              color={ch.isPublished ? 'success' : 'textDim'}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Levels Grid */}
      <View style={styles.levelsHeader}>
        <Text style={styles.levelsHeaderTitle}>
          مراحل {chapters.find(c => c.id === selectedChapter)?.title || ''}
        </Text>
      </View>

      {levels.length === 0 ? (
        <EmptyState
          icon="game-controller-outline"
          title="لا توجد مراحل"
          description="سيتم إضافة مراحل قريبًا"
        />
      ) : (
        <FlatList
          data={levels}
          keyExtractor={item => String(item.id)}
          numColumns={2}
          contentContainerStyle={styles.levelsGrid}
          columnWrapperStyle={styles.levelRow}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate('GameLevel', { levelId: item.id, chapterId: item.chapter.id })}
              style={styles.levelCard}
              activeOpacity={0.85}
            >
              <View style={[styles.levelNumber, { backgroundColor: getDifficultyColor(item.difficulty) }]}>
                <Text style={styles.levelNumberText}>{item.number}</Text>
              </View>
              <Text style={styles.levelTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.levelMeta}>{item._count?.words || 0} كلمة</Text>
              <View style={styles.levelBadges}>
                <Badge
                  text={item.difficulty === 'easy' ? 'سهل' : item.difficulty === 'medium' ? 'متوسط' : 'صعب'}
                  color={getDifficultyBadgeColor(item.difficulty) as any}
                  variant="outline"
                />
                <Text style={styles.levelReward}>+{item.reward} 🪙</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

function getDifficultyColor(difficulty: string) {
  return difficulty === 'easy' ? Colors.success :
         difficulty === 'medium' ? Colors.warning :
         Colors.danger;
}

function getDifficultyBadgeColor(difficulty: string) {
  return difficulty === 'easy' ? 'success' :
         difficulty === 'medium' ? 'warning' :
         'danger';
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
  chaptersScroll: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, gap: Spacing.sm },
  chapterPill: {
    width: 180,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    marginHorizontal: Spacing.xs,
  },
  chapterPillActive: {
    backgroundColor: Colors.accent + '15',
    borderColor: Colors.accent,
  },
  chapterIcon: { fontSize: 32, marginBottom: Spacing.xs },
  chapterTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: 'Cairo',
  },
  chapterTitleActive: { color: Colors.accent },
  chapterLevels: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginBottom: Spacing.xs,
    fontFamily: 'Tajawal',
  },
  levelsHeader: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  levelsHeaderTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '800',
    fontFamily: 'Cairo',
  },
  levelsGrid: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xxl },
  levelRow: { justifyContent: 'space-between', marginBottom: Spacing.md },
  levelCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: Spacing.xs,
  },
  levelNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  levelNumberText: {
    color: '#fff',
    fontSize: FontSize.lg,
    fontWeight: '800',
    fontFamily: 'Cairo',
  },
  levelTitle: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: 'Cairo',
  },
  levelMeta: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginBottom: Spacing.xs,
    fontFamily: 'Tajawal',
  },
  levelBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  levelReward: {
    color: Colors.accent,
    fontSize: FontSize.xs,
    fontWeight: '700',
    fontFamily: 'Tajawal',
  },
});
