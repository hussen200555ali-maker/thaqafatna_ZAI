/**
 * 📖 شاشة تفاصيل الكتاب + قارئ
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '../theme/theme';
import { Button, Loading, EmptyState, Badge, Card } from '../components';
import { booksApi, authApi } from '../services/api';
import type { Book, BookChapter } from '../services/api';

interface BookDetailScreenProps {
  route: { params: { bookId: number } };
  navigation: any;
}

export function BookDetailScreen({ route, navigation }: BookDetailScreenProps) {
  const { bookId } = route.params;
  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<BookChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [user, setUser] = useState<{ userId: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);

      const [bookRes, chaptersRes] = await Promise.all([
        booksApi.get(bookId),
        booksApi.chapters(bookId),
      ]);

      setBook(bookRes.book);
      setChapters(chaptersRes.chapters || []);

      // تحميل حالة الإشارة المرجعية
      if (currentUser) {
        try {
          const bRes = await booksApi.getBookmarks(bookId, currentUser.userId);
          setIsBookmarked(bRes.bookmarks?.length > 0);
        } catch {}
      }
    } catch (error) {
      console.error('Error loading book:', error);
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useEffect(() => { load(); }, [load]);

  const handleBookmark = async () => {
    if (!user) {
      Alert.alert('تنبيه', 'سجّل الدخول لحفظ الكتاب في قائمتك');
      return;
    }
    setBookmarkLoading(true);
    try {
      const res = await booksApi.bookmark(bookId, user.userId, 'toggle');
      setIsBookmarked(!!res.isBookmarked);
    } catch (error) {
      Alert.alert('خطأ', 'فشل تحديث الإشارة المرجعية');
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleStartReading = () => {
    if (chapters.length > 0) {
      const firstChapter = chapters[0];
      navigation.navigate('BookReader', {
        bookId,
        chapterOrder: firstChapter.order,
      });
    } else if (book?.pdfUrl) {
      // لا توجد فصول لكن يوجد PDF
      navigation.navigate('BookReader', { bookId, chapterOrder: 1 });
    }
  };

  if (loading) return <Loading fullScreen text="جاري تحميل الكتاب..." />;

  if (!book) {
    return (
      <EmptyState
        icon="book-outline"
        title="الكتاب غير موجود"
        action={{ text: 'العودة', onPress: () => navigation.goBack() }}
      />
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Cover Section */}
      <View style={styles.coverSection}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-forward" size={24} color={Colors.text} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.bookmarkButton} onPress={handleBookmark} disabled={bookmarkLoading}>
          <Ionicons
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={isBookmarked ? Colors.accent : Colors.textMuted}
          />
        </TouchableOpacity>

        <View style={styles.coverContainer}>
          {book.coverImage ? (
            <View style={styles.coverImageContainer}>
              {/* Image placeholder - يُستبدل بـ Image عند ربط حقيقي */}
              <View style={styles.coverPlaceholder}>
                <Ionicons name="book" size={64} color={Colors.textDim} />
              </View>
            </View>
          ) : (
            <View style={styles.coverPlaceholder}>
              <Ionicons name="book" size={64} color={Colors.textDim} />
              <Text style={styles.coverPlaceholderText}>{book.title}</Text>
            </View>
          )}
        </View>

        <Text style={styles.bookTitle}>{book.title}</Text>
        <Text style={styles.bookAuthor}>{book.author}</Text>

        <View style={styles.bookMeta}>
          {book.pdfUrl && <Badge text="PDF" color="danger" />}
          <Badge text={book.difficulty === 'easy' ? 'سهل' : book.difficulty === 'medium' ? 'متوسط' : 'صعب'}
                 color={book.difficulty === 'easy' ? 'success' : book.difficulty === 'medium' ? 'warning' : 'danger'} />
          <Text style={styles.bookMetaText}>⏱️ {book.readingTimeMin} دقيقة</Text>
          <Text style={styles.bookMetaText}>📄 {book.pages} صفحة</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <Button
          title="ابدأ القراءة"
          onPress={handleStartReading}
          size="lg"
          icon="book"
          style={{ flex: 1, marginRight: Spacing.xs }}
        />
        <TouchableOpacity
          style={styles.shareButton}
          onPress={() => {/* مشاركة */}}
        >
          <Ionicons name="share-outline" size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Description */}
      {book.description ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📖 عن الكتاب</Text>
          <Text style={styles.description}>{book.description}</Text>
        </View>
      ) : null}

      {/* Book Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 التفاصيل</Text>
        <View style={styles.infoGrid}>
          <InfoRow label="التصنيف" value={book.category?.name || '—'} icon="folder-outline" />
          <InfoRow label="اللغة" value={book.language === 'ar' ? 'العربية' : book.language || '—'} icon="language-outline" />
          <InfoRow label="التقييم" value={`⭐ ${book.ratingAvg?.toFixed(1) || '0.0'} (${book._count?.reviews || 0})`} icon="star-outline" />
          <InfoRow label="المشاهدات" value={`👁️ ${book.views}`} icon="eye-outline" />
          <InfoRow label="التنزيلات" value={`⬇️ ${book.downloads}`} icon="download-outline" />
          <InfoRow label="الفصول" value={`${chapters.length} فصل`} icon="list-outline" />
        </View>
      </View>

      {/* Chapters (Table of Contents) */}
      {chapters.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📑 الفهرس ({chapters.length})</Text>
          <View style={styles.chaptersList}>
            {chapters.map((ch, idx) => (
              <TouchableOpacity
                key={ch.id}
                style={styles.chapterItem}
                onPress={() => navigation.navigate('BookReader', { bookId, chapterOrder: ch.order })}
                activeOpacity={0.7}
              >
                <View style={styles.chapterNumber}>
                  <Text style={styles.chapterNumberText}>{idx + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.chapterTitle}>{ch.title}</Text>
                  <Text style={styles.chapterMeta}>
                    {ch.pageStart && ch.pageEnd
                      ? `📄 ص.${ch.pageStart}-${ch.pageEnd} · ⏱️ ${ch.estimatedMinutes} دقيقة`
                      : `⏱️ ${ch.estimatedMinutes} دقيقة`}
                  </Text>
                </View>
                <Ionicons name="chevron-back" size={20} color={Colors.textDim} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={Colors.primaryLight} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  contentContainer: { paddingBottom: Spacing.xxl },
  coverSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.lg,
  },
  backButton: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  bookmarkButton: {
    position: 'absolute',
    top: Spacing.lg,
    left: Spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  coverContainer: { marginBottom: Spacing.lg, ...Shadows.lg },
  coverImageContainer: {
    width: 200,
    height: 300,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  coverPlaceholder: {
    width: 200,
    height: 300,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  coverPlaceholderText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontFamily: 'Tajawal',
  },
  bookTitle: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Spacing.xs,
    fontFamily: 'Cairo',
  },
  bookAuthor: {
    color: Colors.primaryLight,
    fontSize: FontSize.md,
    marginBottom: Spacing.md,
    fontFamily: 'Tajawal',
  },
  bookMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  bookMetaText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontFamily: 'Tajawal',
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  shareButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '800',
    marginBottom: Spacing.md,
    fontFamily: 'Cairo',
  },
  description: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    lineHeight: 26,
    fontFamily: 'Tajawal',
  },
  infoGrid: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs + 2,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  infoLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontFamily: 'Tajawal',
  },
  infoValue: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '700',
    fontFamily: 'Cairo',
  },
  chaptersList: { gap: Spacing.xs },
  chapterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chapterNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  chapterNumberText: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: '800',
    fontFamily: 'Cairo',
  },
  chapterTitle: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '700',
    fontFamily: 'Cairo',
  },
  chapterMeta: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
    fontFamily: 'Tajawal',
  },
});
