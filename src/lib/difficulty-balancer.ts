/**
 * موازن صعوبة الفصول (Difficulty Balancer)
 * ===========================================
 *
 * يحلّل توزيع الصعوبة في كل فصل ويقترح توازناً علمياً.
 *
 * النموذج: Bloom's Taxonomy + Vygotsky's ZPD
 * التوزيع الموصى به حسب موضع الفصل:
 *   - الفصول الأولى (33%): 70% سهل، 25% متوسط، 5% صعب
 *   - الفصول المتوسطة: 40% سهل، 45% متوسط، 15% صعب
 *   - الفصول المتقدمة: 20% سهل، 50% متوسط، 30% صعب
 */

export interface DifficultyDistribution {
  easy: number;
  medium: number;
  hard: number;
}

export interface ChapterBalanceReport {
  chapterId: number;
  chapterTitle: string;
  chapterIcon: string;
  totalLevels: number;
  actual: DifficultyDistribution;
  recommended: DifficultyDistribution;
  variance: DifficultyDistribution;
  healthScore: number;
  status: "balanced" | "needs-attention" | "critical";
  issues: string[];
  recommendations: string[];
}

export function getRecommendedDistribution(
  chapterOrder: number,
  totalChapters: number
): DifficultyDistribution {
  if (chapterOrder <= Math.ceil(totalChapters / 3)) {
    return { easy: 70, medium: 25, hard: 5 };
  }
  if (chapterOrder <= Math.ceil((totalChapters * 2) / 3)) {
    return { easy: 40, medium: 45, hard: 15 };
  }
  return { easy: 20, medium: 50, hard: 30 };
}

export function calculateActualDistribution(levels: { difficulty: string }[]): DifficultyDistribution {
  const total = levels.length;
  if (total === 0) return { easy: 0, medium: 0, hard: 0 };

  const easy = levels.filter((l) => l.difficulty === "easy").length;
  const medium = levels.filter((l) => l.difficulty === "medium").length;
  const hard = levels.filter((l) => l.difficulty === "hard").length;

  return {
    easy: Math.round((easy / total) * 100),
    medium: Math.round((medium / total) * 100),
    hard: Math.round((hard / total) * 100),
  };
}

function calculateVariance(actual: DifficultyDistribution, recommended: DifficultyDistribution): DifficultyDistribution {
  return {
    easy: actual.easy - recommended.easy,
    medium: actual.medium - recommended.medium,
    hard: actual.hard - recommended.hard,
  };
}

function calculateHealthScore(actual: DifficultyDistribution, recommended: DifficultyDistribution): number {
  const diff = Math.abs(actual.easy - recommended.easy) + Math.abs(actual.medium - recommended.medium) + Math.abs(actual.hard - recommended.hard);
  return Math.max(0, 100 - diff);
}

function generateIssuesAndRecommendations(
  actual: DifficultyDistribution,
  recommended: DifficultyDistribution,
  variance: DifficultyDistribution,
  totalLevels: number
): { issues: string[]; recommendations: string[] } {
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (variance.easy < -20) {
    issues.push(`نقص في المراحل السهلة (${actual.easy}% بدلاً من ${recommended.easy}%)`);
    const levelsToAdd = Math.ceil(((recommended.easy - actual.easy) / 100) * totalLevels);
    recommendations.push(`➕ أضف ${levelsToAdd} مرحلة سهلة لبناء ثقة اللاعب المبتدئ`);
  } else if (variance.easy > 20) {
    issues.push(`فائض في المراحل السهلة (${actual.easy}% بدلاً من ${recommended.easy}%)`);
    recommendations.push(`⬆️ رفّع صعوبة بعض المراحل السهلة إلى متوسطة`);
  }

  if (variance.medium < -20) {
    issues.push(`نقص في المراحل المتوسطة (${actual.medium}% بدلاً من ${recommended.medium}%)`);
    const levelsToAdd = Math.ceil(((recommended.medium - actual.medium) / 100) * totalLevels);
    recommendations.push(`➕ أضف ${levelsToAdd} مرحلة متوسطة لتدرّج التعلّم`);
  }

  if (variance.hard < -20 && recommended.hard >= 10) {
    issues.push(`نقص في المراحل الصعبة (${actual.hard}% بدلاً من ${recommended.hard}%)`);
    const levelsToAdd = Math.ceil(((recommended.hard - actual.hard) / 100) * totalLevels);
    recommendations.push(`➕ أضف ${levelsToAdd} مرحلة صعبة لتحدّي اللاعب المتقدم`);
  } else if (variance.hard > 25 && recommended.hard < actual.hard) {
    issues.push(`فائض في المراحل الصعبة (${actual.hard}% بدلاً من ${recommended.hard}%)`);
    recommendations.push(`⬇️ خفّض صعوبة بعض المراحل الصعبة`);
  }

  if (totalLevels === 0) {
    issues.push("لا توجد مراحل في هذا الفصل");
    recommendations.push("➕ ابدأ بإضافة مراحل لهذا الفصل");
  } else if (totalLevels < 3) {
    issues.push(`عدد قليل من المراحل (${totalLevels} فقط)`);
    recommendations.push("➕ يُفضّل 5+ مراحل لكل فصل لتجربة كاملة");
  }

  if (issues.length === 0) {
    issues.push("التوزيع متوازن بشكل مثالي ✓");
    recommendations.push("🎉 لا حاجة لتعديلات — استمر بإضافة محتوى مماثل");
  }

  return { issues, recommendations };
}

export function analyzeChapterBalance(
  chapter: { id: number; title: string; icon: string; order: number; levels: { difficulty: string }[] },
  totalChapters: number
): ChapterBalanceReport {
  const totalLevels = chapter.levels.length;
  const actual = calculateActualDistribution(chapter.levels);
  const recommended = getRecommendedDistribution(chapter.order, totalChapters);
  const variance = calculateVariance(actual, recommended);
  const healthScore = calculateHealthScore(actual, recommended);

  let status: ChapterBalanceReport["status"];
  if (healthScore >= 80) status = "balanced";
  else if (healthScore >= 50) status = "needs-attention";
  else status = "critical";

  const { issues, recommendations } = generateIssuesAndRecommendations(actual, recommended, variance, totalLevels);

  return {
    chapterId: chapter.id, chapterTitle: chapter.title, chapterIcon: chapter.icon,
    totalLevels, actual, recommended, variance, healthScore, status, issues, recommendations,
  };
}

export interface OverallBalanceReport {
  totalChapters: number;
  totalLevels: number;
  averageHealthScore: number;
  overallStatus: "balanced" | "needs-attention" | "critical";
  chapterReports: ChapterBalanceReport[];
  criticalChapters: number;
  warningChapters: number;
  healthyChapters: number;
  topRecommendations: string[];
}

export function analyzeAllChapters(
  chapters: Array<{ id: number; title: string; icon: string; order: number; levels: { difficulty: string }[] }>
): OverallBalanceReport {
  const totalChapters = chapters.length;
  const totalLevels = chapters.reduce((s, c) => s + c.levels.length, 0);
  const chapterReports = chapters.map((c) => analyzeChapterBalance(c, totalChapters));

  const healthScores = chapterReports.map((r) => r.healthScore);
  const averageHealthScore = healthScores.length > 0
    ? Math.round(healthScores.reduce((a, b) => a + b, 0) / healthScores.length)
    : 0;

  const criticalChapters = chapterReports.filter((r) => r.status === "critical").length;
  const warningChapters = chapterReports.filter((r) => r.status === "needs-attention").length;
  const healthyChapters = chapterReports.filter((r) => r.status === "balanced").length;

  let overallStatus: OverallBalanceReport["overallStatus"];
  if (averageHealthScore >= 80) overallStatus = "balanced";
  else if (averageHealthScore >= 50) overallStatus = "needs-attention";
  else overallStatus = "critical";

  const topRecommendations = chapterReports
    .filter((r) => r.recommendations.length > 0)
    .flatMap((r) => r.recommendations.map((rec) => `${r.chapterIcon} ${r.chapterTitle}: ${rec}`))
    .slice(0, 3);

  return {
    totalChapters, totalLevels, averageHealthScore, overallStatus, chapterReports,
    criticalChapters, warningChapters, healthyChapters, topRecommendations,
  };
}
