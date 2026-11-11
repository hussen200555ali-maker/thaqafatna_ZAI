/**
 * 👤 شاشة الملف الشخصي
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme/theme';
import { Button, Avatar, Card, StatCard, Loading } from '../components';
import { authApi, booksApi } from '../services/api';

interface ProfileScreenProps {
  navigation: any;
}

export function ProfileScreen({ navigation }: ProfileScreenProps) {
  const [user, setUser] = useState<{ userId: string; userName: string } | null>(null);
  const [stats, setStats] = useState({ booksRead: 0, chapters: 0, levels: 0, score: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const currentUser = await authApi.getCurrentUser();
      if (!currentUser) {
        // مستخدم زائر — أنشئ له حساب
        const guest = await authApi.loginAsGuest();
        setUser(guest);
      } else {
        setUser(currentUser);
      }
      // إحصائيات تجريبية
      setStats({
        booksRead: 5,
        chapters: 12,
        levels: 8,
        score: 1250,
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleLogout = () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل تريد تسجيل الخروج؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'خروج',
          style: 'destructive',
          onPress: async () => {
            await authApi.logout();
            navigation.replace('Onboarding');
          },
        },
      ]
    );
  };

  if (loading) return <Loading fullScreen text="جاري تحميل الملف..." />;

  const badges = [
    { id: 1, icon: '🎯', label: 'أول تحدي', unlocked: true },
    { id: 2, icon: '📚', label: 'قارئ مبتدئ', unlocked: true },
    { id: 3, icon: '🔥', label: '5 أيام متتالية', unlocked: true },
    { id: 4, icon: '⚡', label: 'سريع البديهة', unlocked: true },
    { id: 5, icon: '🏆', label: 'متصدّر الأسبوع', unlocked: false },
    { id: 6, icon: '💎', label: 'محترف', unlocked: false },
    { id: 7, icon: '🌟', label: 'متميّز', unlocked: false },
    { id: 8, icon: '👑', label: 'الأسطورة', unlocked: false },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <Avatar text={user?.userName || 'زائر'} size={96} color={Colors.primary} />
        <Text style={styles.userName}>{user?.userName || 'زائر'}</Text>
        <Text style={styles.userId}>#{user?.userId?.slice(-8) || 'guest'}</Text>
        <View style={styles.levelBadge}>
          <Text style={styles.levelBadgeText}>المستوى 3 · متعلّم</Text>
        </View>
      </View>

      {/* Level Progress */}
      <Card style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>تقدّمك نحو المستوى التالي</Text>
          <Text style={styles.progressPercent}>62%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '62%' }]} />
        </View>
        <Text style={styles.progressMeta}>1250 / 2000 نقطة للمستوى 4</Text>
      </Card>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard icon="book" label="كتب مقروءة" value={stats.booksRead} color="secondary" trend="+2 هذا الشهر" />
        <StatCard icon="list" label="فصول مكتملة" value={stats.chapters} color="primary" trend="+5 هذا الأسبوع" />
        <StatCard icon="game-controller" label="مراحل منجزة" value={stats.levels} color="accent" trend="+3 هذا الأسبوع" />
        <StatCard icon="trophy" label="نقاطك" value={stats.score} color="success" trend="+150 اليوم" />
      </View>

      {/* Badges */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏅 الشارات ({badges.filter(b => b.unlocked).length}/{badges.length})</Text>
        <View style={styles.badgesGrid}>
          {badges.map(badge => (
            <View
              key={badge.id}
              style={[styles.badgeCard, !badge.unlocked && styles.badgeCardLocked]}
            >
              <Text style={[styles.badgeIcon, !badge.unlocked && styles.badgeIconLocked]}>
                {badge.unlocked ? badge.icon : '🔒'}
              </Text>
              <Text style={[styles.badgeLabel, !badge.unlocked && styles.badgeLabelLocked]}>
                {badge.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Menu */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚙️ الإعدادات</Text>
        <Card style={styles.menuCard}>
          <MenuItem icon="notifications-outline" title="الإشعارات" onPress={() => Alert.alert('قريبًا', 'سيتم إضافة الإشعارات')} />
          <MenuItem icon="moon-outline" title="الوضع الليلي" onPress={() => Alert.alert('مفعّل', 'الوضع الليلي مفعّل افتراضيًا')} />
          <MenuItem icon="language-outline" title="اللغة" subtitle="العربية" onPress={() => Alert.alert('قريبًا', 'دعم لغات إضافية')} />
          <MenuItem icon="help-circle-outline" title="المساعدة" onPress={() => Alert.alert('قريبًا', 'مركز المساعدة')} />
          <MenuItem icon="information-circle-outline" title="عن التطبيق" subtitle="الإصدار 1.0.0" onPress={() => Alert.alert('ثقافتنا', 'تطبيق ثقافي عربي شامل')} />
        </Card>
      </View>

      {/* Logout */}
      <Button
        title="تسجيل الخروج"
        onPress={handleLogout}
        variant="danger"
        icon="log-out-outline"
        style={styles.logoutButton}
      />
    </ScrollView>
  );
}

function MenuItem({ icon, title, subtitle, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle?: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.menuItem} activeOpacity={0.7}>
      <View style={styles.menuIcon}>
        <Ionicons name={icon} size={20} color={Colors.primaryLight} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-back" size={18} color={Colors.textDim} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  contentContainer: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  profileHeader: {
    alignItems: 'center',
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  userName: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '800',
    marginTop: Spacing.md,
    fontFamily: 'Cairo',
  },
  userId: {
    color: Colors.textDim,
    fontSize: FontSize.xs,
    marginTop: 4,
    fontFamily: 'Tajawal',
  },
  levelBadge: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.primary + '20',
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  levelBadgeText: {
    color: Colors.primaryLight,
    fontSize: FontSize.sm,
    fontWeight: '700',
    fontFamily: 'Cairo',
  },
  progressCard: { marginBottom: Spacing.lg },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  progressTitle: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '700',
    fontFamily: 'Cairo',
  },
  progressPercent: {
    color: Colors.primaryLight,
    fontSize: FontSize.md,
    fontWeight: '800',
    fontFamily: 'Cairo',
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressMeta: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
    fontFamily: 'Tajawal',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.lg,
    marginHorizontal: -Spacing.xs,
  },
  section: { marginBottom: Spacing.xl },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '800',
    marginBottom: Spacing.md,
    fontFamily: 'Cairo',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
  },
  badgeCard: {
    width: '25%',
    alignItems: 'center',
    padding: Spacing.sm,
    margin: Spacing.xs,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badgeCardLocked: {
    opacity: 0.4,
  },
  badgeIcon: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  badgeIconLocked: {
    opacity: 0.5,
  },
  badgeLabel: {
    color: Colors.text,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'Tajawal',
  },
  badgeLabelLocked: {
    color: Colors.textDim,
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  menuTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
    fontFamily: 'Tajawal',
  },
  menuSubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
    fontFamily: 'Tajawal',
  },
  logoutButton: {
    marginTop: Spacing.md,
  },
});
