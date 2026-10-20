"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Hook لإدارة الإشعارات (Web Notifications)
 * - طلب الإذن
 * - إرسال إشعارات محلية
 * - تذكير يومي ذكي
 */

export function useNotifications(userId: string | null) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [enabled, setEnabled] = useState(false);
  const [reminder, setReminder] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    setPermission(Notification.permission);
    
    // تحميل الإعداد المحفوظ
    const saved = localStorage.getItem("thaqafatna-notifications");
    setEnabled(saved === "true");
  }, []);

  // طلب الإذن
  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return false;
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") {
        setEnabled(true);
        localStorage.setItem("thaqafatna-notifications", "true");
        // إشعار ترحيبي
        new Notification("ثقافتنا 📚", {
          body: "تم تفعيل الإشعارات! سنذكّرك بالمراجعة اليومية والتحدّيات.",
          icon: "/icon.svg",
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // إيقاف الإشعارات
  const disable = useCallback(() => {
    setEnabled(false);
    localStorage.setItem("thaqafatna-notifications", "false");
  }, []);

  // إرسال إشعار
  const notify = useCallback((title: string, body: string, tag?: string) => {
    if (!enabled || permission !== "granted") return;
    try {
      new Notification(title, { body, icon: "/icon.svg", tag: tag || "thaqafatna" });
    } catch {}
  }, [enabled, permission]);

  // جلب التذكير اليومي من API
  useEffect(() => {
    if (!userId || !enabled) return;
    fetch(`/api/notifications?userId=${userId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.message) {
          setReminder(data.message);
          // إرسال إشعار إذا كان هناك مراجعة مستحقة
          if (data.pendingReview > 0) {
            notify("📚 مراجعة الكلمات", data.message, "review");
          } else if (!data.dailyCompleted) {
            notify("🎯 تحدّي اليوم", data.message, "daily");
          }
        }
      })
      .catch(() => {});
  }, [userId, enabled, notify]);

  return {
    permission,
    enabled,
    reminder,
    requestPermission,
    disable,
    notify,
  };
}
