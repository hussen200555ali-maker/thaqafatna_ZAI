/**
 * 🏠 الصفحة الرئيسية - عرض شامل للمحتوى
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme/theme';
import { Button, BookCover, Loading, EmptyState, SectionHeader, Card, Badge } from '../components';
import { booksApi, gameApi, authApi } from '../services/api';
import type { Book, GameChapter, GameLevel } from '../services/api';

interface HomeScreenProps {
  navigation: any;
}

export function HomeScreen({ navigation }: HomeScreenProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [gameChapters, setGameChapters] = useState<GameChapter[]>([]);
  const [gameLevels, setGameLevels] = useState<GameLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<{ userId: string; userName: string } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);

      const [booksRes, chaptersRes] = await Promise.all([
        booksApi.list({ limit: 10 }),
        gameApi.chapters().catch(() => ({ chapters: [] })),
      ]);

      setBooks(booksRes.books || []);
      setGameChapters(chaptersRes.chapters || []);

      // تحميل مراحل أول فصل
      if (chaptersRes.chapters?.length > 0) {
        const levelsRes = await gameApi.levels(chaptersRes.chapters[0].id).catch(() => ({ levels: [] }));
        setGameLevels(levelsRes.levels || []);
      }
    } catch (error) {
      console.error('Error loading home:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  if (loading) {
    return <Loading fullScreen text="جاري التحميل..." />;
  }

  const featuredBooks = books.filter(b => b.isFeatured).slice(0, 6);
  const displayBooks = featuredBooks.length >= 3 ? featuredBooks : books.slice(0, 6);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Hero Welcome */}
      <View style={styles.hero}>
        <View style={styles.heroContent}>
          <Text style={styles.heroGreeting}>أهلاً {user?.userName || 'بك'} 👋</Text>
          <Text style={styles.heroTitle}>تعلّم واقرأ والعب</Text>
          <Text style={styles.heroSubtitle}>منصة ثقافية شاملة للعالم العربي</Text>
        </View>
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{books.length}</Text>
            <Text style={styles.heroStatLabel}>كتاب</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{gameChapters.length}</Text>
            <Text style={styles.heroStatLabel}>فصل لعبة</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{gameLevels.length}</Text>
            <Text style={styles.heroStatLabel}>مرحلة</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.quickAction, { backgroundColor: Colors.primary + '15' }]}
          onPress={() => navigation.navigate('Game')}
          activeOpacity={0.8}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: Colors.primary }]}>
            <Ionicons name="game-controller" size={26} color="#fff" />
          </View>
          <Text style={styles.quickActionText}>العب الآن</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickAction, { backgroundColor: Colors.secondary + '15' }]}
          onPress={() => navigation.navigate('Library')}
          activeOpacity={0.8}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: Colors.secondary }]}>
            <Ionicons name="library" size={26} color="#fff" />
          </View>
          <Text style={styles.quickActionText}>المكتبة</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickAction, { backgroundColor: Colors.accent + '15' }]}
          onPress={() => navigation.navigate('Leaderboard')}
          activeOpacity={0.8}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: Colors.accent }]}>
            <Ionicons name="trophy" size={26} color="#fff" />
          </View>
          <Text style={styles.quickActionText}>المتصدرون</Text>
        </TouchableOpacity>
      </View>

      {/* Daily Challenge */}
      <Card style={styles.dailyChallengeCard}>
        <View style={styles.dailyChallengeContent}>
          <View style={styles.dailyChallengeIcon}>
            <Text style={{ fontSize: 32 }}>🎯</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.dailyChallengeTitle}>تحدي اليوم</Text>
            <Text style={styles.dailyChallengeDesc}>لغز جديد ينتظرك — احصل على 100 نقطة!</Text>
          </View>
          <Button title="العب" size="sm" onPress={() => navigation.navigate('Game')} />
        </View>
      </Card>

      {/* Featured Books */}
      <View style={styles.section}>
        <SectionHeader
          title="📚 كتب مميزة"
          subtitle="مختارات فريق التحرير"
          action={{ text: 'عرض الكل', onPress: () => navigation.navigate('Library') }}
        />
        {displayBooks.length === 0 ? (
          <EmptyState icon="book-outline" title="لا توجد كتب" />
        ) : (
          <FlatList
            data={displayBooks}
            keyExtractor={item => String(item.id)}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <BookCover
                book={item}
                coverImage={item.coverImage}
                title={item.title}
                author={item.author}
                pdfUrl={item.pdfUrl}
                size="md"
                onPress={() => navigation.navigate('BookDetail', { bookId: item.id })}
              />
            )}
          />
        )}
      </View>

      {/* Game Chapters */}
      <View style={styles.section}>
        <SectionHeader
          title="🎮 فصول اللعبة"
          subtitle={`${gameChapters.length} فصول · ${gameLevels.length} مرحلة`}
          action={{ text: 'عرض الكل', onPress: () => navigation.navigate('Game') }}
        />
        {gameChapters.length === 0 ? (
          <EmptyState icon="game-controller-outline" title="لا توجد فصول لعبة" />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {gameChapters.map((chapter) => (
              <TouchableOpacity
                key={chapter.id}
                onPress={() => navigation.navigate('GameChapter', { chapterId: chapter.id, chapterTitle: chapter.title })}
                style={styles.chapterCard}
                activeOpacity={0.85}
              >
                <View style={styles.chapterIcon}>
                  <Text style={{ fontSize: 28 }}>{chapter.icon || '🎮'}</Text>
                </View>
                <Text style={styles.chapterTitle} numberOfLines={1}>{chapter.title}</Text>
                <Text style={styles.chapterLevelsCount}>{chapter._count?.levels || 0} مرحلة</Text>
                {chapter.isPublished ? (
                  <Badge text="منشور" color="success" />
                ) : (
                  <Badge text="مسودة" color="textDim" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Game Levels (from first chapter) */}
      {gameLevels.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="🏆 مراحل مميزة" subtitle="ابدأ من هنا" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {gameLevels.slice(0, 6).map((level) => (
              <TouchableOpacity
                key={level.id}
                onPress={() => navigation.navigate('GameLevel', { levelId: level.id, chapterId: level.chapter.id })}
                style={styles.levelCard}
                activeOpacity={0.85}
              >
                <View style={[styles.levelNumber, { backgroundColor: getDifficultyColor(level.difficulty) }]}>
                  <Text style={styles.levelNumberText}>{level.number}</Text>
                </View>
                <Text style={styles.levelTitle} numberOfLines={1}>{level.title}</Text>
                <View style={styles.levelMeta}>
                  <Badge
                    text={level.difficulty === 'easy' ? 'سهل' : level.difficulty === 'medium' ? 'متوسط' : 'صعب'}
                    color={getDifficultyBadgeColor(level.difficulty) as any}
                    variant="outline"
                  />
                  <Text style={styles.levelReward}>+{level.reward} 🪙</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </ScrollView>
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
  contentContainer: { paddingBottom: Spacing.xxl },
  hero: {
    margin: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  heroContent: { marginBottom: Spacing.md },
  heroGreeting: { color: Colors.textMuted, fontSize: FontSize.sm, fontFamily: 'Tajawal' },
  heroTitle: {
    color: Colors.text,
    fontSize: FontSize.title,
    fontWeight: '800',
    marginTop: 4,
    fontFamily: 'Cairo',
  },
  heroSubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: 4,
    fontFamily: 'Tajawal',
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  heroStat: { alignItems: 'center' },
  heroStatValue: {
    color: Colors.primaryLight,
    fontSize: FontSize.xxl,
    fontWeight: '800',
    fontFamily: 'Cairo',
  },
  heroStatLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
    fontFamily: 'Tajawal',
  },
  heroStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  quickAction: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  quickActionText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '700',
    fontFamily: 'Cairo',
  },
  dailyChallengeCard: { marginHorizontal: Spacing.md, marginBottom: Spacing.lg },
  dailyChallengeContent: { flexDirection: 'row', alignItems: 'center' },
  dailyChallengeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  dailyChallengeTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '800',
    marginBottom: 2,
    fontFamily: 'Cairo',
  },
  dailyChallengeDesc: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontFamily: 'Tajawal',
  },
  section: { marginBottom: Spacing.lg },
  horizontalList: { paddingHorizontal: Spacing.md, gap: Spacing.md },
  chapterCard: {
    width: 160,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chapterIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  chapterTitle: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: 'Cairo',
  },
  chapterLevelsCount: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginBottom: 6,
    fontFamily: 'Tajawal',
  },
  levelCard: {
    width: 140,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  levelNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    marginBottom: Spacing.xs,
    fontFamily: 'Cairo',
  },
  levelMeta: {
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
