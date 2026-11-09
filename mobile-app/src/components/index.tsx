/**
 * 🧩 مكونات UI مشتركة
 */

import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator,
  ViewStyle, TextStyle, ImageStyle, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '../theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ===== Button =====
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function Button({
  title, onPress, variant = 'primary', size = 'md', icon, disabled, loading, style,
}: ButtonProps) {
  const sizes = {
    sm: { paddingVertical: 8, paddingHorizontal: 14, fontSize: FontSize.sm },
    md: { paddingVertical: 12, paddingHorizontal: 20, fontSize: FontSize.md },
    lg: { paddingVertical: 16, paddingHorizontal: 28, fontSize: FontSize.lg },
  };

  const variants = {
    primary: { bg: Colors.primary, color: '#fff', border: Colors.primary },
    secondary: { bg: Colors.secondary, color: '#fff', border: Colors.secondary },
    outline: { bg: 'transparent', color: Colors.primary, border: Colors.primary },
    ghost: { bg: 'transparent', color: Colors.textMuted, border: 'transparent' },
    danger: { bg: Colors.danger, color: '#fff', border: Colors.danger },
  };

  const v = variants[variant];
  const s = sizes[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.button,
        { backgroundColor: v.bg, borderColor: v.border, paddingVertical: s.paddingVertical, paddingHorizontal: s.paddingHorizontal },
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.color} size="small" />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={s.fontSize + 2} color={v.color} style={{ marginRight: 8 }} />}
          <Text style={[styles.buttonText, { color: v.color, fontSize: s.fontSize }]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// ===== Card =====
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  padded?: boolean;
}

export function Card({ children, style, onPress, padded = true }: CardProps) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, padded && styles.cardPadded, style]}
    >
      {children}
    </Wrapper>
  );
}

// ===== Badge =====
interface BadgeProps {
  text: string;
  color?: keyof typeof Colors;
  variant?: 'solid' | 'outline';
}

export function Badge({ text, color = 'primary', variant = 'solid' }: BadgeProps) {
  const c = Colors[color];
  return (
    <View style={[
      styles.badge,
      variant === 'solid'
        ? { backgroundColor: c + '20', borderColor: c + '40' }
        : { backgroundColor: 'transparent', borderColor: c },
    ]}>
      <Text style={[styles.badgeText, { color: c }]}>{text}</Text>
    </View>
  );
}

// ===== Avatar =====
interface AvatarProps {
  text: string;
  size?: number;
  color?: string;
}

export function Avatar({ text, size = 40, color = Colors.primary }: AvatarProps) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>{text.charAt(0)}</Text>
    </View>
  );
}

// ===== Book Cover =====
interface BookCoverProps {
  coverImage?: string;
  title: string;
  author: string;
  pdfUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  onPress?: () => void;
}

export function BookCover({ coverImage, title, author, pdfUrl, size = 'md', onPress }: BookCoverProps) {
  const sizes = {
    sm: { width: 100, height: 150 },
    md: { width: 140, height: 210 },
    lg: { width: 180, height: 270 },
  };
  const s = sizes[size];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.bookCover, { width: s.width, height: s.height }]}>
        {coverImage ? (
          <Image source={{ uri: coverImage }} style={{ width: '100%', height: '100%', borderRadius: BorderRadius.md }} resizeMode="cover" />
        ) : (
          <View style={[styles.bookCoverPlaceholder, { borderRadius: BorderRadius.md }]}>
            <Ionicons name="book" size={s.width * 0.3} color={Colors.textDim} />
            <Text style={styles.bookCoverTitle} numberOfLines={2}>{title}</Text>
          </View>
        )}
        {pdfUrl && (
          <View style={styles.pdfBadge}>
            <Text style={styles.pdfBadgeText}>PDF</Text>
          </View>
        )}
      </View>
      <Text style={styles.bookTitle} numberOfLines={1}>{title}</Text>
      <Text style={styles.bookAuthor} numberOfLines={1}>{author}</Text>
    </TouchableOpacity>
  );
}

// ===== Loading =====
export function Loading({ size = 'large', color = Colors.primary, style, text }: { size?: 'small' | 'large'; color?: string; style?: ViewStyle; text?: string; fullScreen?: boolean }) {
  return (
    <View style={[styles.loadingContainer, style]}>
      <ActivityIndicator size={size} color={color} />
      {text ? <Text style={styles.loadingText}>{text}</Text> : null}
    </View>
  );
}

// ===== Empty State =====
interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  action?: { text: string; onPress: () => void };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={64} color={Colors.textDim} />
      <Text style={styles.emptyTitle}>{title}</Text>
      {description && <Text style={styles.emptyDesc}>{description}</Text>}
      {action && (
        <Button title={action.text} onPress={action.onPress} style={{ marginTop: Spacing.md }} />
      )}
    </View>
  );
}

// ===== Section Header =====
export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: { text: string; onPress: () => void } }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      </View>
      {action && (
        <TouchableOpacity onPress={action.onPress} activeOpacity={0.7}>
          <Text style={styles.sectionAction}>{action.text}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ===== Stat Card =====
interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  color?: keyof typeof Colors;
  trend?: string;
}

export function StatCard({ icon, label, value, color = 'primary', trend }: StatCardProps) {
  const c = Colors[color];
  return (
    <Card style={[styles.statCard, { borderTopColor: c, borderTopWidth: 3 }]}>
      <View style={[styles.statIcon, { backgroundColor: c + '20' }]}>
        <Ionicons name={icon} size={22} color={c} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {trend && <Text style={[styles.statTrend, { color: c }]}>{trend}</Text>}
    </Card>
  );
}

// ===== Styles =====
const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
  buttonText: {
    fontWeight: '700',
    fontFamily: 'Cairo',
  },
  disabled: { opacity: 0.5 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
  },
  cardPadded: { padding: Spacing.md },
  badge: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '800',
    fontFamily: 'Cairo',
  },
  bookCover: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceLight,
    ...Shadows.md,
  },
  bookCoverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceLight,
    padding: Spacing.sm,
  },
  bookCoverTitle: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontFamily: 'Tajawal',
  },
  bookTitle: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '700',
    marginTop: Spacing.sm,
    maxWidth: 140,
    fontFamily: 'Cairo',
  },
  bookAuthor: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
    maxWidth: 140,
    fontFamily: 'Tajawal',
  },
  pdfBadge: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: Colors.danger,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  pdfBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: Spacing.md,
    fontFamily: 'Tajawal',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.md,
    fontFamily: 'Cairo',
  },
  emptyDesc: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    textAlign: 'center',
    fontFamily: 'Tajawal',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
    fontFamily: 'Cairo',
  },
  sectionSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
    fontFamily: 'Tajawal',
  },
  sectionAction: {
    color: Colors.primaryLight,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  statCard: {
    flex: 1,
    margin: Spacing.xs,
    padding: Spacing.md,
    alignItems: 'center',
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
    fontFamily: 'Cairo',
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
    fontFamily: 'Tajawal',
  },
  statTrend: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    marginTop: Spacing.xs,
  },
});
