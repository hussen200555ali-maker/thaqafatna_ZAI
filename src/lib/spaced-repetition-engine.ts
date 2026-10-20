/**
 * محرّك التكرار المتباعد (Spaced Repetition Engine)
 * ====================================================
 *
 * ينفّذ خوارزمية SM-2 (SuperMemo 2) المعدّلة:
 *
 *   - عند كل مراجعة، يقيّم المستخدم جودة استجابته (0-3)
 *   - يحسب الفاصل الزمني للمراجعة التالية
 *   - يضبط معامل السهولة (easeFactor) ديناميكياً
 *
 * التقديرات:
 *   0 = "أخرى" (خاطئة تماماً — أعد المراجعة فوراً)
 *   1 = "صعبة" (إجابة صحيحة بصعوبة — قلّل الفاصل)
 *   2 = "جيدة" (إجابة صحيحة بسهولة — استمر بالفاصل)
 *   3 = "سهلة" (إجابة فورية — زيّد الفاصل)
 *
 * المراجع:
 *   - SuperMemo 2 algorithm (Piotr Wozniak, 1987)
 *   - Anki's modified SM-2
 *   - Duolingo's Half-Life Regression (مبسّط)
 */

export interface ReviewResult {
  quality: 0 | 1 | 2 | 3; // تقييم المستخدم
}

export interface MasteryUpdate {
  easeFactor: number;
  interval: number; // بالأيام
  repetitions: number;
  nextReviewAt: Date;
  lastReviewedAt: Date;
  lastQuality: number;
  correctCount: number;
  wrongCount: number;
}

export interface WordForReview {
  id: number;
  word: string;
  wordText: string;
  clue: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewAt: Date;
  lastReviewedAt: Date | null;
}

/**
 * يحسب التحديثات بناءً على تقييم المستخدم
 *
 * خوارزمية SM-2 المعدّلة:
 *
 * إذا quality == 0 (خاطئة):
 *   repetitions = 0
 *   interval = 1 (راجع غداً)
 *   easeFactor = max(1.3, easeFactor - 0.2)
 *
 * إذا quality >= 1 (صحيحة):
 *   repetitions += 1
 *   إذا repetitions == 1: interval = 1
 *   إذا repetitions == 2: interval = 3
 *   وإلا: interval = round(previousInterval * easeFactor * qualityMultiplier)
 *
 *   easeFactor = max(1.3, easeFactor + (0.1 - (3 - quality) * 0.15))
 */
export function calculateNextReview(
  current: {
    easeFactor: number;
    interval: number;
    repetitions: number;
    correctCount: number;
    wrongCount: number;
  },
  quality: number
): MasteryUpdate {
  let { easeFactor, interval, repetitions, correctCount, wrongCount } = current;

  // تحديث العدّادات
  if (quality === 0) {
    wrongCount += 1;
  } else {
    correctCount += 1;
  }

  // خوارزمية SM-2
  if (quality === 0) {
    // إجابة خاطئة — أعد المراجعة من البداية
    repetitions = 0;
    interval = 1; // راجع غداً
    // قلّل معامل السهولة
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else {
    // إجابة صحيحة
    repetitions += 1;

    // مضاعف الجودة (1.0 للصعبة، 1.3 للجيدة، 1.6 للسهلة)
    const qualityMultiplier = quality === 1 ? 1.0 : quality === 2 ? 1.3 : 1.6;

    if (repetitions === 1) {
      interval = 1; // أول مراجعة: غداً
    } else if (repetitions === 2) {
      interval = 3; // ثاني مراجعة: بعد 3 أيام
    } else {
      // مراجعات لاحقة: الفاصل السابق × معامل السهولة × مضاعف الجودة
      interval = Math.round(interval * easeFactor * qualityMultiplier);
    }

    // تحديث معامل السهولة
    // زيادة 0.1 للجودة العالية، نقصان للجودة المنخفضة
    easeFactor = Math.max(
      1.3,
      easeFactor + (0.1 - (3 - quality) * 0.15)
    );
  }

  // حدّ أقصى للفاصل (سنة كاملة)
  interval = Math.min(interval, 365);

  // تاريخ المراجعة التالية
  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + interval);

  return {
    easeFactor: Math.round(easeFactor * 100) / 100,
    interval,
    repetitions,
    nextReviewAt,
    lastReviewedAt: new Date(),
    lastQuality: quality,
    correctCount,
    wrongCount,
  };
}

/**
 * يحسب إحصائيات المراجعة اليومية
 */
export function getReviewStats(masteryList: WordForReview[]) {
  const now = new Date();
  const due = masteryList.filter((m) => m.nextReviewAt <= now);
  const newWords = masteryList.filter((m) => m.repetitions === 0);
  const learning = masteryList.filter((m) => m.repetitions > 0 && m.repetitions < 3);
  const mastered = masteryList.filter((m) => m.repetitions >= 3);

  return {
    dueCount: due.length,
    newCount: newWords.length,
    learningCount: learning.length,
    masteredCount: mastered.length,
    totalCount: masteryList.length,
  };
}

/**
 * يولّد رسالة تحفيزية بناءً على الأداء
 */
export function getMotivationalMessage(
  correctCount: number,
  totalCount: number
): string {
  const rate = totalCount > 0 ? correctCount / totalCount : 0;
  if (rate >= 0.9) return "🏆 ممتاز! أنت تتقن هذه الكلمات!";
  if (rate >= 0.7) return "🎉 أحسنت! استمر في المراجعة!";
  if (rate >= 0.5) return "💪 جيد! المراجعة المستمرة ستجعلك تتقنها!";
  return "📚 لا تقلق! المراجعة المتكررة هي مفتاح الإتقان!";
}
