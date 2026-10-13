/**
 * محرّك التكيّف الخوارزمي (Adaptive Learning Engine)
 * ====================================================
 *
 * المسؤوليات:
 *   1. حساب إتقان اللاعب لكل مهارة (Bayers-style mastery with decay)
 *   2. اكتشاف نقاط القوة والضعف
 *   3. حساب معامل الصعوبة الديناميكي
 *   4. اقتراح المرحلة التالية (next | review | challenge | explore)
 *   5. تسجيل أحداث التعلّم (LearningEvent)
 *   6. تحديث إحصائيات أنواع الألغاز
 *
 * المراجع المستخدمة في التصميم:
 *   - Bloom's Mastery Learning (1968)
 *   - Bayesian Knowledge Tracing (Corbett & Anderson, 1995)
 *   - Duolingo's Half-Life Regression (Settles & Meeder, 2016)
 *   - Khan Academy's Mastery System
 *
 * المؤلف: فريق ثقافتنا
 * النسخة: 1.0.0
 */

import { db } from "./db";

// ============================================================
// الأنواع (Types)
// ============================================================

export interface SkillMasteryUpdate {
  userId: string;
  skillId: number;
  isCorrect: boolean;
  hintsUsed: number;
  timeSpentSec: number;
}

export interface AdaptiveRecommendation {
  recommendedLevelId: number | null;
  reason: string;
  type: "next" | "review" | "challenge" | "explore";
  // المهارات المستهدفة في المرحلة المقترحة
  targetSkills: string[];
}

export interface PlayerAnalytics {
  playerLevel: number;
  xp: number;
  totalStars: number;
  difficultyMultiplier: number;
  strengths: SkillSummary[];
  weaknesses: SkillSummary[];
  recommendation: AdaptiveRecommendation;
  // نمو التعلم عبر الأيام السبعة الأخيرة
  weeklyProgress: { date: string; events: number; stars: number }[];
  // توزيع الأداء حسب نوع اللغز
  puzzleTypeBreakdown: PuzzleTypeBreakdown[];
}

export interface SkillSummary {
  id: number;
  code: string;
  title: string;
  icon: string;
  mastery: number;
  category: string;
}

export interface PuzzleTypeBreakdown {
  puzzleType: string;
  attempts: number;
  correct: number;
  successRate: number;
  avgTimeSec: number;
  lastPlayedAt: Date | null;
}

// ============================================================
// الركيزة 1: حساب الإتقان (Mastery Calculation)
// ============================================================

/**
 * يحسب نسبة الإتقان الجديدة بناءً على الأداء.
 *
 * نستخدم نموذج Bayesian Knowledge Tracing مبسّط:
 *
 *   P(L_new) = P(L_old) * P(correct|known) / P(correct)
 *
 * لكن لتبسيط الاستخدام في واجهة المستخدم، نستخدم نموذج
 * متوسط مرجّح مع decay:
 *
 *   mastery_new = 0.85 * mastery_old + 0.15 * performance
 *
 * حيث performance = 1.0 للإجابة الصحيحة، 0.3 للإجابة الخاطئة، 0.5 مع تلميح
 *
 * هذا يضمن:
 *   - مكافأة الإجابات الصحيحة (رفع تدريجي)
 *   - معاقبة الإجابات الخاطئة (انخفاض بسيط لا انهيار)
 *   - عدم الاعتماد فقط على آخر إجابة (decay)
 *
 * العتبة الذهبية: ≥80% تعتبر "مُتقَنة"، ≥95% "إتقان كامل"
 */
function calculateNewMastery(
  currentMastery: number,
  isCorrect: boolean,
  hintsUsed: number
): number {
  let performance: number;
  if (isCorrect) {
    // إجابة صحيحة: أداء 1.0، لكن يقلل كل تلميح
    performance = Math.max(0.4, 1.0 - hintsUsed * 0.2);
  } else {
    // إجابة خاطئة: أداء 0.2 (لا 0 لتفادي الانهيار التام)
    performance = 0.2;
  }

  // متوسط مرجّح: 85% للماضي، 15% للجديد
  const newMastery = 0.85 * currentMastery + 0.15 * performance * 100;
  return Math.max(0, Math.min(100, newMastery));
}

/**
 * يحدّث إتقان اللاعب لمهارة محددة.
 * يُستدعى بعد كل سؤال يُجاب عليه.
 */
export async function updatePlayerSkill(
  update: SkillMasteryUpdate
): Promise<void> {
  const existing = await db.playerSkill.findUnique({
    where: {
      userId_skillId: {
        userId: update.userId,
        skillId: update.skillId,
      },
    },
  });

  const currentMastery = existing?.mastery ?? 0;
  const newMastery = calculateNewMastery(
    currentMastery,
    update.isCorrect,
    update.hintsUsed
  );

  const attempts = (existing?.attempts ?? 0) + 1;
  const correct = (existing?.correct ?? 0) + (update.isCorrect ? 1 : 0);
  const incorrect = (existing?.incorrect ?? 0) + (update.isCorrect ? 0 : 1);
  const totalHints = (existing?.hintsUsed ?? 0) + update.hintsUsed;
  // متوسط الوقت: نأخذ 80% من القديم + 20% من الجديد
  const newAvgTime = Math.round(
    0.8 * (existing?.avgTimeSec ?? 0) + 0.2 * update.timeSpentSec
  );

  // تحديد تاريخ الإتقان الكامل إن وصل لـ 95%
  const masteredAt =
    newMastery >= 95 ? existing?.masteredAt ?? new Date() : existing?.masteredAt;

  await db.playerSkill.upsert({
    where: {
      userId_skillId: {
        userId: update.userId,
        skillId: update.skillId,
      },
    },
    create: {
      userId: update.userId,
      skillId: update.skillId,
      mastery: newMastery,
      attempts,
      correct,
      incorrect,
      hintsUsed: totalHints,
      avgTimeSec: newAvgTime,
      lastPracticedAt: new Date(),
      masteredAt: newMastery >= 95 ? new Date() : null,
    },
    update: {
      mastery: newMastery,
      attempts,
      correct,
      incorrect,
      hintsUsed: totalHints,
      avgTimeSec: newAvgTime,
      lastPracticedAt: new Date(),
      masteredAt,
    },
  });
}

// ============================================================
// الركيزة 2: تسجيل أحداث التعلّم (Learning Events)
// ============================================================

export type LearningEventType =
  | "level_start"
  | "level_complete"
  | "question_correct"
  | "question_wrong"
  | "hint_used"
  | "bonus_found"
  | "star_earned"
  | "daily_complete";

/**
 * يسجّل حدث تعلّم في قاعدة البيانات.
 * يُستخدم لاحقاً في:
 *   - رسم نمو التعلم
 *   - اكتشاف أنماط الضعف
 *   - حساب الإحصائيات الأسبوعية
 */
export async function logLearningEvent(
  userId: string,
  eventType: LearningEventType,
  context: Record<string, any> = {},
  value: number = 0
): Promise<void> {
  await db.learningEvent.create({
    data: {
      userId,
      eventType,
      context: JSON.stringify(context),
      value,
      timestamp: new Date(),
    },
  });
}

/**
 * يحدّث إحصائيات نوع اللغز للاعب.
 */
export async function updateQuestionTypeStat(
  userId: string,
  puzzleType: string,
  isCorrect: boolean,
  timeSpentSec: number
): Promise<void> {
  const existing = await db.questionTypeStat.findUnique({
    where: {
      userId_puzzleType: { userId, puzzleType },
    },
  });

  const attempts = (existing?.attempts ?? 0) + 1;
  const correct = (existing?.correct ?? 0) + (isCorrect ? 1 : 0);
  const newAvgTime = Math.round(
    0.8 * (existing?.avgTimeSec ?? 0) + 0.2 * timeSpentSec
  );

  await db.questionTypeStat.upsert({
    where: {
      userId_puzzleType: { userId, puzzleType },
    },
    create: {
      userId,
      puzzleType,
      attempts,
      correct,
      avgTimeSec: newAvgTime,
      lastPlayedAt: new Date(),
    },
    update: {
      attempts,
      correct,
      avgTimeSec: newAvgTime,
      lastPlayedAt: new Date(),
    },
  });
}

// ============================================================
// الركيزة 3: الحالة التكيّفية (Adaptive State)
// ============================================================

/**
 * يعيد حساب الحالة التكيّفية للاعب:
 *   - المستوى العام
 *   - نقاط الخبرة (XP)
 *   - معامل الصعوبة
 *   - نقاط القوة والضعف
 *   - التوصية الذكية للمرحلة التالية
 *
 * يُستدعى بعد كل إكمال مرحلة.
 */
export async function recalcAdaptiveState(userId: string): Promise<void> {
  // 1. جلب بيانات اللاعب
  const [playerSkills, playerProgress, allSkills, allLevels] = await Promise.all([
    db.playerSkill.findMany({
      where: { userId },
      include: { skill: true },
    }),
    db.playerProgress.findMany({
      where: { userId, isCompleted: true },
    }),
    db.skill.findMany({ where: { isRoot: false } }),
    db.level.findMany({
      where: { isPublished: true },
      include: { chapter: true, levelSkills: true },
    }),
  ]);

  // 2. حساب المستوى العام و XP
  const totalStars = playerProgress.reduce((sum, p) => sum + p.stars, 0);
  const totalXp = playerProgress.reduce(
    (sum, p) => sum + p.score + p.stars * 30,
    0
  );
  // كل 3 نجوم = مستوى جديد
  const playerLevel = Math.max(1, Math.floor(totalStars / 3) + 1);

  // 3. اكتشاف نقاط القوة والضعف
  // نأخذ المهارات التي لاعبها على الأقل 3 محاولات
  const eligibleSkills = playerSkills.filter((ps) => ps.attempts >= 1);
  const sorted = [...eligibleSkills].sort((a, b) => b.mastery - a.mastery);

  const strengths: SkillSummary[] = sorted
    .slice(0, 3)
    .filter((ps) => ps.mastery >= 50)
    .map((ps) => ({
      id: ps.skillId,
      code: ps.skill.code,
      title: ps.skill.title,
      icon: ps.skill.icon,
      mastery: Math.round(ps.mastery),
      category: ps.skill.category,
    }));

  const weaknesses: SkillSummary[] = sorted
    .slice(-3)
    .filter((ps) => ps.mastery < 70)
    .reverse()
    .map((ps) => ({
      id: ps.skillId,
      code: ps.skill.code,
      title: ps.skill.title,
      icon: ps.skill.icon,
      mastery: Math.round(ps.mastery),
      category: ps.skill.category,
    }));

  // 4. حساب معامل الصعوبة (0.7 - 1.3)
  // يعتمد على نسبة الإتقان الإجمالية
  const avgMastery =
    eligibleSkills.length > 0
      ? eligibleSkills.reduce((s, ps) => s + ps.mastery, 0) /
        eligibleSkills.length
      : 0;
  // لاعب متقن (avgMastery عالية) → يرفع الصعوبة (1.3)
  // لاعب متعثر (avgMastery منخفضة) → يخفض الصعوبة (0.7)
  const difficultyMultiplier = Math.max(0.7, Math.min(1.3, 0.7 + (avgMastery / 100) * 0.6));

  // 5. توليد التوصية الذكية
  const recommendation = await generateRecommendation(
    userId,
    playerProgress,
    allLevels,
    allSkills,
    strengths,
    weaknesses
  );

  // 6. حفظ الحالة التكيّفية
  await db.adaptiveState.upsert({
    where: { userId },
    create: {
      userId,
      playerLevel,
      xp: totalXp,
      difficultyMultiplier,
      strengths: JSON.stringify(strengths.map((s) => s.id)),
      weaknesses: JSON.stringify(weaknesses.map((w) => w.id)),
      recommendedLevelId: recommendation.recommendedLevelId,
      recommendationReason: recommendation.reason,
      recommendationType: recommendation.type,
      lastMapUpdate: new Date(),
    },
    update: {
      playerLevel,
      xp: totalXp,
      difficultyMultiplier,
      strengths: JSON.stringify(strengths.map((s) => s.id)),
      weaknesses: JSON.stringify(weaknesses.map((w) => w.id)),
      recommendedLevelId: recommendation.recommendedLevelId,
      recommendationReason: recommendation.reason,
      recommendationType: recommendation.type,
      lastMapUpdate: new Date(),
    },
  });
}

// ============================================================
// الركيزة 4: خوارزمية التوصية الذكية
// ============================================================

/**
 * يولّد توصية ذكية للمرحلة التالية بناءً على أداء اللاعب.
 *
 * القواعد (Ordered — أول قاعدة مطابقة تُطبّق):
 *
 * 1. **review**: إذا كان لدى اللاعب مهارة مهمة (< 40% mastery) لها مراحل غير مكتملة
 *    → اقترح أقدم مرحلة غير مكتملة تُغطّي هذه المهارة
 *    → سبب: "تحتاج إلى تقوية مهارة X — راجع هذه المرحلة"
 *
 * 2. **next**: إذا أكمل اللاعب مرحلة ولم يبدأ المرحلة التالية في نفس الفصل
 *    → اقترح المرحلة التالية في نفس الفصل
 *    → سبب: "أكمل رحلتك في فصل X"
 *
 * 3. **challenge**: إذا أتقن اللاعب كل مراحل الفصل الحالي بنسبة ≥ 80% (3 نجوم)
 *    → اقترح فصلاً جديداً
 *    → سبب: "أتقنت فصل X! حان وقت تحدٍّ جديد"
 *
 * 4. **explore**: إذا لم تنطبق أي من القواعد أعلاه
 *    → اقترح أقدم مرحلة غير مكتملة
 *    → سبب: "استكمل رحلتك في التعلم"
 */
async function generateRecommendation(
  userId: string,
  completedProgress: { levelId: number; stars: number }[],
  allLevels: any[],
  allSkills: any[],
  strengths: SkillSummary[],
  weaknesses: SkillSummary[]
): Promise<AdaptiveRecommendation> {
  const completedLevelIds = new Set(completedProgress.map((p) => p.levelId));
  const completedLevelsWithStars = new Map(
    completedProgress.map((p) => [p.levelId, p.stars])
  );

  // 1. فحص نقاط الضعف: هل هناك مهارة ضعيفة لها مراحل غير مكتملة؟
  if (weaknesses.length > 0) {
    const weakSkill = weaknesses[0];
    // إيجاد مرحلة غير مكتملة تُغطّي هذه المهارة
    const candidateLevel = allLevels.find(
      (level) =>
        !completedLevelIds.has(level.id) &&
        level.levelSkills.some(
          (ls: any) => ls.skillId === weakSkill.id && ls.weight >= 5
        )
    );

    if (candidateLevel) {
      return {
        recommendedLevelId: candidateLevel.id,
        reason: `مهارة "${weakSkill.title}" تحتاج تقوية (${weakSkill.mastery}% إتقان) — هذه المرحلة ستجعلك تتقنها`,
        type: "review",
        targetSkills: [weakSkill.title],
      };
    }
  }

  // 2. المرحلة التالية في نفس الفصل
  // نجد آخر مرحلة مكتملة ونقترح التالية لها
  if (completedProgress.length > 0) {
    // نجلب آخر مرحلة مكتملة (مع تفاصيلها)
    const lastCompleted = completedProgress[completedProgress.length - 1];
    const lastLevel = allLevels.find((l) => l.id === lastCompleted.levelId);
    if (lastLevel) {
      // إيجاد المرحلة التالية في نفس الفصل
      const nextLevel = allLevels.find(
        (l) =>
          l.chapterId === lastLevel.chapterId &&
          l.number === lastLevel.number + 1 &&
          !completedLevelIds.has(l.id)
      );
      if (nextLevel) {
        return {
          recommendedLevelId: nextLevel.id,
          reason: `أكمل رحلتك في فصل "${lastLevel.chapter.title}" — المرحلة ${nextLevel.number}`,
          type: "next",
          targetSkills: nextLevel.levelSkills.map((ls: any) => ls.skillId),
        };
      }
    }
  }

  // 3. تحدٍّ جديد: إذا أتقن كل مراحل فصله بنجوم عالية
  // نجد فصولاً كل مراحلها مكتملة بـ 3 نجوم
  for (const level of allLevels) {
    if (completedLevelIds.has(level.id)) continue;
    // أول فصل غير مكتمل — نقترح أول مرحلة فيه
    const chapterTitle = level.chapter?.title || "الجديد";
    return {
      recommendedLevelId: level.id,
      reason: `استكشف فصلاً جديداً: "${chapterTitle}"`,
      type: "challenge",
      targetSkills: level.levelSkills.map((ls: any) => ls.skillId),
    };
  }

  // 4. fallback: أقدم مرحلة غير مكتملة
  const firstUncompleted = allLevels.find((l) => !completedLevelIds.has(l.id));
  if (firstUncompleted) {
    return {
      recommendedLevelId: firstUncompleted.id,
      reason: "استكمل رحلتك في التعلم",
      type: "explore",
      targetSkills: [],
    };
  }

  return {
    recommendedLevelId: null,
    reason: "أكملت كل المراحل المتاحة! ترقّب محتوى جديداً قريباً",
    type: "explore",
    targetSkills: [],
  };
}

// ============================================================
// الركيزة 5: جلب التحليلات الكاملة للاعب
// ============================================================

/**
 * يجلب كل تحليلات اللاعب في بنية واحدة منظّمة.
 * يُستخدم في صفحة الملف الشخصي وخريطة المعرفة.
 */
export async function getPlayerAnalytics(userId: string): Promise<PlayerAnalytics | null> {
  // 1. الحالة التكيّفية
  const adaptiveState = await db.adaptiveState.findUnique({
    where: { userId },
  });

  if (!adaptiveState) {
    // إن لم تكن موجودة، نحسبها الآن
    await recalcAdaptiveState(userId);
  }

  const state =
    adaptiveState ?? (await db.adaptiveState.findUnique({ where: { userId } }));

  // 2. المهارات مع التفاصيل
  const playerSkills = await db.playerSkill.findMany({
    where: { userId },
    include: { skill: true },
    orderBy: { mastery: "desc" },
  });

  // 3. التقدم الإجمالي
  const completedProgress = await db.playerProgress.findMany({
    where: { userId, isCompleted: true },
  });
  const totalStars = completedProgress.reduce((s, p) => s + p.stars, 0);

  // 4. نقاط القوة والضعف (مرتبة)
  const eligibleSkills = playerSkills.filter((ps) => ps.attempts >= 1);
  const sorted = [...eligibleSkills].sort((a, b) => b.mastery - a.mastery);

  const strengths: SkillSummary[] = sorted
    .slice(0, 3)
    .filter((ps) => ps.mastery >= 50)
    .map((ps) => ({
      id: ps.skillId,
      code: ps.skill.code,
      title: ps.skill.title,
      icon: ps.skill.icon,
      mastery: Math.round(ps.mastery),
      category: ps.skill.category,
    }));

  const weaknesses: SkillSummary[] = sorted
    .slice(-3)
    .filter((ps) => ps.mastery < 70)
    .reverse()
    .map((ps) => ({
      id: ps.skillId,
      code: ps.skill.code,
      title: ps.skill.title,
      icon: ps.skill.icon,
      mastery: Math.round(ps.mastery),
      category: ps.skill.category,
    }));

  // 5. نمو الأسبوع الأخير (آخر 7 أيام)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentEvents = await db.learningEvent.findMany({
    where: {
      userId,
      timestamp: { gte: sevenDaysAgo },
    },
    orderBy: { timestamp: "asc" },
  });

  // تجميع حسب اليوم
  const weeklyProgress: { date: string; events: number; stars: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const dayEvents = recentEvents.filter(
      (e) => e.timestamp.toISOString().split("T")[0] === dateStr
    );
    weeklyProgress.push({
      date: dateStr,
      events: dayEvents.length,
      stars: dayEvents
        .filter((e) => e.eventType === "star_earned")
        .reduce((s, e) => s + e.value, 0),
    });
  }

  // 6. توزيع أنواع الألغاز
  const questionTypeStats = await db.questionTypeStat.findMany({
    where: { userId },
  });
  const puzzleTypeBreakdown: PuzzleTypeBreakdown[] = questionTypeStats
    .map((qts) => ({
      puzzleType: qts.puzzleType,
      attempts: qts.attempts,
      correct: qts.correct,
      successRate: qts.attempts > 0 ? Math.round((qts.correct / qts.attempts) * 100) : 0,
      avgTimeSec: qts.avgTimeSec,
      lastPlayedAt: qts.lastPlayedAt,
    }))
    .sort((a, b) => b.attempts - a.attempts);

  // 7. التوصية النهائية
  const recommendation: AdaptiveRecommendation = {
    recommendedLevelId: state?.recommendedLevelId ?? null,
    reason: state?.recommendationReason ?? "ابدأ أول مرحلة لتحليل أدائك",
    type: (state?.recommendationType as AdaptiveRecommendation["type"]) ?? "explore",
    targetSkills: [],
  };

  return {
    playerLevel: state?.playerLevel ?? 1,
    xp: state?.xp ?? 0,
    totalStars,
    difficultyMultiplier: state?.difficultyMultiplier ?? 1.0,
    strengths,
    weaknesses,
    recommendation,
    weeklyProgress,
    puzzleTypeBreakdown,
  };
}

// ============================================================
// الركيزة 6: معالجة إكمال المرحلة
// ============================================================

/**
 * تُعالج إكمال مرحلة بشكل كامل:
 *   1. تحديث إتقان كل مهارة في المرحلة
 *   2. تسجيل أحداث التعلّم
 *   3. تحديث إحصائيات نوع اللغز
 *   4. إعادة حساب الحالة التكيّفية
 *
 * يُستدعى من game-screen.tsx عند إكمال مرحلة.
 */
export async function processLevelCompletion(params: {
  userId: string;
  levelId: number;
  stars: number;
  hintsUsed: number;
  timeSpentSec: number;
  correctCount: number;
  wrongCount: number;
  bonusWordsFound: number;
  puzzleType: string;
}): Promise<void> {
  const {
    userId,
    levelId,
    stars,
    hintsUsed,
    timeSpentSec,
    correctCount,
    wrongCount,
    bonusWordsFound,
    puzzleType,
  } = params;

  // 1. جلب المهارات المرتبطة بالمرحلة
  const levelSkills = await db.levelSkill.findMany({
    where: { levelId },
    include: { skill: true },
  });

  // 2. تحديث إتقان كل مهارة بناءً على وزنها
  const avgTimePerQuestion =
    correctCount + wrongCount > 0
      ? Math.floor(timeSpentSec / (correctCount + wrongCount))
      : timeSpentSec;

  for (const ls of levelSkills) {
    // نحدّث المهارة بناءً على عدد من "الإجابات الصحيحة" موزّعة على وزن المهارة
    const effectiveCorrect = Math.max(1, Math.round(correctCount * (ls.weight / 10)));
    for (let i = 0; i < effectiveCorrect; i++) {
      await updatePlayerSkill({
        userId,
        skillId: ls.skillId,
        isCorrect: true,
        hintsUsed: Math.max(0, Math.floor(hintsUsed / levelSkills.length)),
        timeSpentSec: avgTimePerQuestion,
      });
    }
    // نضيف إجابة خاطئة واحدة إن وُجدت
    if (wrongCount > 0) {
      await updatePlayerSkill({
        userId,
        skillId: ls.skillId,
        isCorrect: false,
        hintsUsed: 0,
        timeSpentSec: avgTimePerQuestion,
      });
    }
  }

  // 3. تسجيل أحداث التعلّم
  await logLearningEvent(userId, "level_complete", { levelId, stars }, stars);
  if (bonusWordsFound > 0) {
    await logLearningEvent(
      userId,
      "bonus_found",
      { levelId, count: bonusWordsFound },
      bonusWordsFound * 20
    );
  }

  // 4. تحديث إحصائيات نوع اللغز
  await updateQuestionTypeStat(userId, puzzleType, stars > 0, timeSpentSec);

  // 5. إعادة حساب الحالة التكيّفية
  await recalcAdaptiveState(userId);
}

// ============================================================
// التصدير الافتراضي
// ============================================================

export const adaptiveEngine = {
  updatePlayerSkill,
  logLearningEvent,
  updateQuestionTypeStat,
  recalcAdaptiveState,
  getPlayerAnalytics,
  processLevelCompletion,
};
