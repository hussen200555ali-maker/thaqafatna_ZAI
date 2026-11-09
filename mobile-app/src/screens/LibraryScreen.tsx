/**
 * 📚 شاشة المكتبة - تصفّح الكتب
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme/theme';
import { BookCover, Loading, EmptyState } from '../components';
import { booksApi } from '../services/api';
import type { Book } from '../services/api';

interface LibraryScreenProps {
  navigation: any;
}

export function LibraryScreen({ navigation }: LibraryScreenProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');

  const loadBooks = useCallback(async () => {
    try {
      const res = await booksApi.list({ limit: 100 });
      setBooks(res.books || []);
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBooks(); }, [loadBooks]);

  const filteredBooks = books.filter(b => {
    if (filter !== 'all' && b.difficulty !== filter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        (b.title || '').toLowerCase().includes(q) ||
        (b.author || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) return <Loading fullScreen text="جاري تحميل المكتبة..." />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>📚 المكتبة</Text>
        <Text style={styles.pageSubtitle}>{books.length} كتاب عربي</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="ابحث عن كتاب أو مؤلف..."
          placeholderTextColor={Colors.textDim}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filters */}
      <View style={styles.filtersRow}>
        {[
          { key: 'all', label: 'الكل' },
          { key: 'easy', label: 'سهل' },
          { key: 'medium', label: 'متوسط' },
          { key: 'hard', label: 'صعب' },
        ].map(f => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key as any)}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Books Grid */}
      {filteredBooks.length === 0 ? (
        <EmptyState
          icon="book-outline"
          title="لا توجد كتب"
          description={searchQuery ? 'جرّب كلمات بحث أخرى' : 'لا توجد كتب بهذه الفلترة'}
        />
      ) : (
        <FlatList
          data={filteredBooks}
          keyExtractor={item => String(item.id)}
          numColumns={2}
          contentContainerStyle={styles.booksGrid}
          columnWrapperStyle={styles.bookRow}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <BookCover
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.md,
    fontFamily: 'Tajawal',
    padding: 0,
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '600',
    fontFamily: 'Tajawal',
  },
  filterChipTextActive: { color: '#fff' },
  booksGrid: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  bookRow: {
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
});
