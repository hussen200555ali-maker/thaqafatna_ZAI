/**
 * 📖 شاشة قارئ الكتاب (PDF + نص)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme/theme';
import { Button, Loading, EmptyState } from '../components';
import { booksApi, authApi } from '../services/api';

interface BookReaderScreenProps {
  route: { params: { bookId: number; chapterOrder: number } };
  navigation: any;
}

export function BookReaderScreen({ route, navigation }: BookReaderScreenProps) {
  const { bookId, chapterOrder } = route.params;
  const [book, setBook] = useState<any>(null);
  const [chapter, setChapter] = useState<any>(null);
  const [allChapters, setAllChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState(18);
  const [isDark, setIsDark] = useState(true);
  const [user, setUser] = useState<{ userId: string } | null>(null);
  const [progress, setProgress] = useState(0);

  const load = useCallback(async () => {
    try {
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);

      const [bookRes, chapterRes] = await Promise.all([
        booksApi.get(bookId),
        booksApi.chapter(bookId, chapterOrder).catch(async () => {
          // fallback: ربما الكتاب له PDF بدون فصول
          const b = await booksApi.get(bookId);
          return {
            chapter: {
              id: 0,
              order: chapterOrder,
              title: b.book.title,
              content: '',
              estimatedMinutes: 0,
              isFree: true,
              relatedLevelId: null,
              pageStart: null,
              pageEnd: null,
            },
            totalChapters: 0,
            isPdfOnly: true,
          };
        }),
      ]);

      setBook(bookRes.book);
      setChapter(chapterRes.chapter);

      // تحميل كل الفصول للتنقّل
      try {
        const chaptersRes = await booksApi.chapters(bookId);
        setAllChapters(chaptersRes.chapters || []);
      } catch {}

      // تحميل التقدّم المحفوظ
      if (currentUser) {
        try {
          const progRes = await booksApi.getProgress(bookId, currentUser.userId);
          if (progRes.progress?.currentChapter) {
            setProgress(progRes.progress.currentScroll || 0);
          }
        } catch {}
      }
    } catch (error) {
      console.error('Error loading chapter:', error);
    } finally {
      setLoading(false);
    }
  }, [bookId, chapterOrder]);

  useEffect(() => { load(); }, [load]);

  // حفظ التقدّم تلقائيًا
  const saveProgress = useCallback(async (scrollPercent: number) => {
    if (!user) return;
    try {
      await booksApi.updateProgress(bookId, user.userId, {
        currentChapter: chapterOrder,
        currentScroll: scrollPercent,
        timeSpentSec: 5,
      });
    } catch {}
  }, [bookId, chapterOrder, user]);

  const handleScroll = (e: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const percent = Math.round((contentOffset.y / (contentSize.height - layoutMeasurement.height)) * 100);
    if (percent >= 0 && percent <= 100) {
      setProgress(percent);
      if (percent > 0 && percent % 25 === 0) {
        saveProgress(percent);
      }
    }
  };

  const currentIdx = allChapters.findIndex(c => c.order === chapterOrder);
  const prevChapter = currentIdx > 0 ? allChapters[currentIdx - 1] : null;
  const nextChapter = currentIdx >= 0 && currentIdx < allChapters.length - 1 ? allChapters[currentIdx + 1] : null;

  if (loading) return <Loading fullScreen text="جاري فتح الفصل..." />;

  if (!chapter) {
    return (
      <EmptyState
        icon="book-outline"
        title="الفصل غير موجود"
        action={{ text: 'العودة', onPress: () => navigation.goBack() }}
      />
    );
  }

  const isPdfOnly = book?.pdfUrl && !book?.chapters?.length;

  return (
    <View style={[styles.container, !isDark && styles.lightContainer]}>
      {/* Header */}
      <View style={[styles.header, !isDark && styles.lightHeader]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-forward" size={22} color={isDark ? Colors.text : Colors.background} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, !isDark && styles.lightText]} numberOfLines={1}>
            {book?.title}
          </Text>
          <Text style={[styles.headerSubtitle, !isDark && styles.lightTextMuted]}>
            {allChapters.length > 0
              ? `الفصل ${chapter.order} من ${allChapters.length}`
              : 'ملف PDF كامل'}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setFontSize(Math.max(14, fontSize - 2))}
            style={styles.headerButton}
          >
            <Text style={[styles.fontSizeButton, !isDark && styles.lightText]}>A−</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFontSize(Math.min(28, fontSize + 2))}
            style={styles.headerButton}
          >
            <Text style={[styles.fontSizeButtonBig, !isDark && styles.lightText]}>A+</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsDark(!isDark)} style={styles.headerButton}>
            <Ionicons name={isDark ? 'sunny' : 'moon'} size={20} color={isDark ? Colors.text : Colors.background} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={32}
      >
        {/* Chapter Title */}
        <View style={styles.chapterHeader}>
          <Text style={[styles.chapterLabel, !isDark && styles.lightTextMuted]}>
            {allChapters.length > 0
              ? `الفصل ${chapter.order} من ${allChapters.length}`
              : '📖 قراءة'}
          </Text>
          <Text style={[styles.chapterTitle, !isDark && styles.lightText]}>
            {chapter.title}
          </Text>
          <Text style={[styles.chapterMeta, !isDark && styles.lightTextMuted]}>
            {chapter.pageStart && chapter.pageEnd
              ? `📄 صفحات ${chapter.pageStart}–${chapter.pageEnd}`
              : `⏱️ ${chapter.estimatedMinutes} دقيقة قراءة`}
          </Text>
        </View>

        {/* Content */}
        {chapter.content ? (
          <Text style={[styles.content, { fontSize, color: isDark ? Colors.text : Colors.background }]}>
            {chapter.content}
          </Text>
        ) : book?.pdfUrl ? (
          <View style={styles.pdfNotice}>
            <View style={styles.pdfIconContainer}>
              <Text style={{ fontSize: 56 }}>📄</Text>
            </View>
            <Text style={[styles.pdfNoticeTitle, !isDark && styles.lightText]}>
              هذا الفصل بصيغة PDF
            </Text>
            <Text style={[styles.pdfNoticeDesc, !isDark && styles.lightTextMuted]}>
              يمكن قراءة الكتاب كاملًا عبر ملف PDF المرفق
            </Text>
            <Button
              title="فتح PDF"
              onPress={() => Alert.alert('قريبًا', 'سيتم دعم قراءة PDF الكاملة في الإصدار التالي')}
              icon="document"
              style={{ marginTop: Spacing.md }}
            />
          </View>
        ) : (
          <EmptyState icon="document-text-outline" title="لا يوجد محتوى لهذا الفصل" />
        )}
      </ScrollView>

      {/* Navigation Footer */}
      <View style={[styles.footer, !isDark && styles.lightHeader]}>
        {prevChapter ? (
          <TouchableOpacity
            onPress={() => navigation.replace('BookReader', { bookId, chapterOrder: prevChapter.order })}
            style={styles.footerButton}
          >
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            <Text style={styles.footerButtonText}>السابق</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.footerButton} />
        )}

        <View style={styles.footerProgress}>
          <Text style={styles.footerProgressText}>{progress}%</Text>
        </View>

        {nextChapter ? (
          <TouchableOpacity
            onPress={() => navigation.replace('BookReader', { bookId, chapterOrder: nextChapter.order })}
            style={styles.footerButton}
          >
            <Text style={styles.footerButtonTextActive}>التالي</Text>
            <Ionicons name="chevron-back" size={20} color={Colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.footerButton}>
            <Text style={styles.footerCompleteText}>✅ اكتمل</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  lightContainer: { backgroundColor: '#FAFAF7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  lightHeader: { backgroundColor: '#fff', borderBottomColor: Colors.border },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: { flex: 1, marginHorizontal: Spacing.sm },
  headerTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
    fontFamily: 'Cairo',
  },
  headerSubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
    fontFamily: 'Tajawal',
  },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  fontSizeButton: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  fontSizeButtonBig: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  lightText: { color: Colors.background },
  lightTextMuted: { color: Colors.textDim },
  progressBarContainer: {
    height: 2,
    backgroundColor: Colors.border,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  scrollView: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  chapterHeader: { marginBottom: Spacing.xl, alignItems: 'center' },
  chapterLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginBottom: Spacing.xs,
    fontFamily: 'Tajawal',
  },
  chapterTitle: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Spacing.xs,
    fontFamily: 'Cairo',
  },
  chapterMeta: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontFamily: 'Tajawal',
  },
  content: {
    color: Colors.text,
    fontSize: FontSize.md,
    lineHeight: 32,
    fontFamily: 'Tajawal',
    textAlign: 'justify',
  },
  pdfNotice: {
    alignItems: 'center',
    padding: Spacing.xl,
    marginTop: Spacing.lg,
  },
  pdfIconContainer: {
    marginBottom: Spacing.md,
  },
  pdfNoticeTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    fontFamily: 'Cairo',
  },
  pdfNoticeDesc: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginBottom: Spacing.md,
    fontFamily: 'Tajawal',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: Spacing.xs,
  },
  footerButtonText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontFamily: 'Tajawal',
  },
  footerButtonTextActive: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '700',
    fontFamily: 'Cairo',
  },
  footerCompleteText: {
    color: Colors.success,
    fontSize: FontSize.sm,
    fontWeight: '700',
    fontFamily: 'Cairo',
  },
  footerProgress: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.pill,
  },
  footerProgressText: {
    color: Colors.primaryLight,
    fontSize: FontSize.xs,
    fontWeight: '700',
    fontFamily: 'Cairo',
  },
});
