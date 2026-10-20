"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * عرض شهادة الإتقان
 * تظهر عند إكمال كتاب كامل (كل الفصول + الألغاز)
 */

interface CertificateData {
  certificateNumber: string;
  score: number;
  issuedAt: string;
  book: {
    title: string;
    author: string;
    category?: { name: string; icon: string };
  };
}

export function CertificateDisplay({
  bookId,
  userId,
  bookTitle,
  bookAuthor,
}: {
  bookId: number;
  userId: string | null;
  bookTitle: string;
  bookAuthor: string;
}) {
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!userId || !bookId) {
      setLoading(false);
      return;
    }
    fetch(`/api/books/${bookId}/certificate?userId=${userId}`)
      .then((r) => r.json())
      .then((data) => {
        setCertificate(data.certificate || null);
        if (data.certificate) setShowConfetti(true);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [bookId, userId]);

  const handleIssue = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/books/${bookId}/certificate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (res.ok && data.certificate) {
        setCertificate(data.certificate);
        setShowConfetti(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return null;

  if (!certificate) {
    // زر إصدار الشهادة (يظهر فقط عند اكتمال الكتاب)
    return (
      <Button
        onClick={handleIssue}
        className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
      >
        🏆 احصل على شهادة الإتقان
      </Button>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 150 }}
      className="relative"
    >
      {/* جسيمات الاحتفال */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
              animate={{
                scale: [0, 1.5, 0],
                x: (Math.random() - 0.5) * 400,
                y: (Math.random() - 0.5) * 400,
                opacity: [1, 1, 0],
              }}
              transition={{ duration: 2, delay: i * 0.05 }}
              className="absolute top-1/2 left-1/2 text-2xl"
            >
              {["🎉", "⭐", "🏆", "✨", "🎊"][i % 5]}
            </motion.div>
          ))}
        </div>
      )}

      {/* الشهادة */}
      <Card className="p-8 bg-gradient-to-br from-amber-50 to-yellow-100 border-4 border-amber-300 relative overflow-hidden">
        {/* زخارف */}
        <div className="absolute top-2 right-2 text-3xl opacity-20">🏆</div>
        <div className="absolute top-2 left-2 text-3xl opacity-20">🏆</div>
        <div className="absolute bottom-2 right-2 text-3xl opacity-20">🏆</div>
        <div className="absolute bottom-2 left-2 text-3xl opacity-20">🏆</div>

        <div className="text-center relative">
          <div className="text-5xl mb-3">🏆</div>
          <h2 className="text-xl font-bold text-amber-800 mb-1" style={{ fontFamily: "var(--font-tajawal)" }}>
            شهادة إتقان
          </h2>
          <p className="text-xs text-amber-600 mb-4">منصة ثقافتنا</p>

          <div className="border-t border-b border-amber-200 py-4 my-3">
            <p className="text-sm text-stone-600 mb-1">تشهد المنصة بأن</p>
            <p className="text-lg font-bold text-stone-800 mb-2">القارئ المتميّز</p>
            <p className="text-sm text-stone-500 mb-3">قد أتمّ قراءة كتاب</p>
            <p className="text-lg font-bold text-indigo-700" style={{ fontFamily: "var(--font-tajawal)" }}>
              {certificate.book?.title || bookTitle}
            </p>
            <p className="text-xs text-stone-500 mt-1">تأليف: {certificate.book?.author || bookAuthor}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs text-stone-500 mt-4">
            <div>
              <p className="font-bold text-stone-700">رقم الشهادة</p>
              <p className="font-mono">{certificate.certificateNumber}</p>
            </div>
            <div>
              <p className="font-bold text-stone-700">النقاط</p>
              <p>{certificate.score}/100</p>
            </div>
            <div>
              <p className="font-bold text-stone-700">تاريخ الإصدار</p>
              <p>{new Date(certificate.issuedAt).toLocaleDateString("ar-SA")}</p>
            </div>
            <div>
              <p className="font-bold text-stone-700">الحالة</p>
              <p className="text-green-600 font-bold">✓ معتمدة</p>
            </div>
          </div>

          <div className="mt-4 text-xs text-stone-400">
            📋 يمكن التحقق من صحة الشهادة عبر رقمها في منصة ثقافتنا
          </div>
        </div>
      </Card>

      <div className="flex gap-2 mt-3">
        <Button
          onClick={() => window.print()}
          variant="outline"
          className="flex-1 border-amber-300 text-amber-700"
        >
          🖨️ طباعة / حفظ PDF
        </Button>
      </div>
    </motion.div>
  );
}
