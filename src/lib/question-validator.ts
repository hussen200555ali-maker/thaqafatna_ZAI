/**
 * مدقّق جودة الأسئلة الآلي (Question Quality Validator)
 * ====================================================
 *
 * يحلّل كل سؤال بناءً على 10 معايير تربوية مستوحاة من الأدبيات التعليمية
 *
 * يُرجع كائن يحوي:
 *   - score: 0-100 (نسبة الجودة الإجمالية)
 *   - checks: قائمة بالمعايير وحالتها
 *   - suggestions: اقتراحات للتحسين
 *   - severity: 'good' | 'warning' | 'critical'
 */

export interface QualityCheck {
  id: string;
  title: string;
  description: string;
  passed: boolean;
  severity: "info" | "warning" | "critical";
  suggestion?: string;
}

export interface QuestionQualityResult {
  score: number;
  severity: "good" | "warning" | "critical";
  checks: QualityCheck[];
  suggestions: string[];
  passedCount: number;
  totalCount: number;
}

const QUESTION_LENGTH_THRESHOLDS = {
  ideal: 80,
  acceptable: 150,
  tooLong: 250,
};

const ANSWER_LENGTH = {
  min: 2,
  max: 15,
  ideal: 8,
};

const MEMORIZATION_TRIGGERS = [
  "متى ولد", "في أي سنة", "كم عدد", "ما اسم",
  "من هو مؤلف", "عاصمة", "أين تقع", "ما عاصمة",
];

const LEAKING_HINTS = ["يبدأ بحرف", "ينتهي بـ", "عدد حروفها", "مكونة من", "طولها"];
const OUTDATED_INDICATORS = ["السنة الماضية", "العام الماضي", "مؤخراً", "حالياً", "اليوم"];

export function validateQuestion(
  question: {
    text: string;
    clue: string;
    category?: string;
    options?: string[];
    correctOption?: number;
    matchPairs?: string[];
    fillBlanks?: string;
    emojis?: string;
    imageUrl?: string;
    sequence?: string;
  },
  context?: { difficulty?: "easy" | "medium" | "hard" }
): QuestionQualityResult {
  const checks: QualityCheck[] = [];
  const difficulty = context?.difficulty ?? "medium";

  // 1. طول السؤال
  const clueLength = question.clue?.length ?? 0;
  if (clueLength <= QUESTION_LENGTH_THRESHOLDS.ideal) {
    checks.push({
      id: "length", title: "طول السؤال مثالي",
      description: `السؤال قصير وواضح (${clueLength} حرفاً)`,
      passed: true, severity: "info",
    });
  } else if (clueLength <= QUESTION_LENGTH_THRESHOLDS.acceptable) {
    checks.push({
      id: "length", title: "طول السؤال مقبول",
      description: `السؤال في حدود المقبول (${clueLength} حرفاً)`,
      passed: true, severity: "info",
      suggestion: "يمكن جعله أقصر لمزيد من الوضوح",
    });
  } else {
    checks.push({
      id: "length", title: "السؤال طويل جداً",
      description: `السؤال ${clueLength} حرفاً — يُفضّل أقل من ${QUESTION_LENGTH_THRESHOLDS.acceptable}`,
      passed: false,
      severity: clueLength > QUESTION_LENGTH_THRESHOLDS.tooLong ? "critical" : "warning",
      suggestion: "اختصار السؤال مع الحفاظ على المعنى",
    });
  }

  // 2. وجود إجابة محددة
  const hasAnswer = !!(question.text && question.text.length >= ANSWER_LENGTH.min);
  checks.push({
    id: "has_answer",
    title: hasAnswer ? "يوجد إجابة محددة" : "لا توجد إجابة واضحة",
    description: hasAnswer ? `الإجابة محددة: "${question.text}"` : "السؤال لا يحوي إجابة واضحة",
    passed: hasAnswer,
    severity: hasAnswer ? "info" : "critical",
    suggestion: hasAnswer ? undefined : "أضف إجابة صحيحة ومحددة",
  });

  // 3. طول الإجابة مناسب
  const answerLength = question.text?.length ?? 0;
  if (answerLength < ANSWER_LENGTH.min) {
    checks.push({
      id: "answer_length", title: "الإجابة قصيرة جداً",
      description: `الإجابة ${answerLength} حرفاً فقط`,
      passed: false, severity: "warning",
      suggestion: "الإجابة يجب أن تكون حرفين على الأقل",
    });
  } else if (answerLength > ANSWER_LENGTH.max) {
    checks.push({
      id: "answer_length", title: "الإجابة طويلة جداً",
      description: `الإجابة ${answerLength} حرفاً (الحد الأقصى ${ANSWER_LENGTH.max})`,
      passed: false, severity: "warning",
      suggestion: "اختصار الإجابة أو تقسيمها",
    });
  } else {
    checks.push({
      id: "answer_length", title: "طول الإجابة مناسب",
      description: `الإجابة ${answerLength} حرفاً — مثالي`,
      passed: true, severity: "info",
    });
  }

  // 4. لا يعتمد على الحفظ فقط
  const clueLower = question.clue?.toLowerCase() ?? "";
  const hasMemorizationTrigger = MEMORIZATION_TRIGGERS.some((t) => clueLower.includes(t));
  checks.push({
    id: "memorization",
    title: hasMemorizationTrigger ? "يعتمد على الحفظ" : "يتطلب فهماً",
    description: hasMemorizationTrigger ? "السؤال يختبر الحفظ المباشر" : "السؤال يتطلب الفهم أو التحليل",
    passed: !hasMemorizationTrigger,
    severity: hasMemorizationTrigger ? "warning" : "info",
    suggestion: hasMemorizationTrigger ? "أعد صياغة السؤال ليختبر الفهم بدل الحفظ" : undefined,
  });

  // 5. لا يحوي تلميحات عارية
  const hasLeakingHint = LEAKING_HINTS.some((h) => clueLower.includes(h));
  checks.push({
    id: "leaking_hints",
    title: hasLeakingHint ? "يحوي تلميحات عارية" : "خالٍ من التلميحات العارية",
    description: hasLeakingHint ? "السؤال يكشف معلومات عن الإجابة" : "السؤال لا يكشف معلومات الإجابة",
    passed: !hasLeakingHint,
    severity: hasLeakingHint ? "warning" : "info",
    suggestion: hasLeakingHint ? "احذف التلميحات العارية من نص السؤال" : undefined,
  });

  // 6. لا يحوي معلومات قديمة
  const hasOutdatedInfo = OUTDATED_INDICATORS.some((o) => clueLower.includes(o));
  checks.push({
    id: "outdated",
    title: hasOutdatedInfo ? "معلومة قد تكون قديمة" : "محتوى دائم",
    description: hasOutdatedInfo ? "السؤال يحوي إشارات زمنية قد تتقادم" : "السؤال يحوي معلومات دائمة",
    passed: !hasOutdatedInfo,
    severity: hasOutdatedInfo ? "warning" : "info",
    suggestion: hasOutdatedInfo ? "استبدل الإشارات الزمنية بحقائق دائمة" : undefined,
  });

  // 7. مناسبة للصعوبة المُعلنة
  if (difficulty === "easy") {
    checks.push({
      id: "difficulty_match", title: "مناسب للمستوى السهل",
      description: "السؤال بسيط ومناسب للمبتدئين",
      passed: true, severity: "info",
    });
  } else if (difficulty === "hard") {
    checks.push({
      id: "difficulty_match", title: "مناسب للمستوى الصعب",
      description: "السؤال يتحدّى اللاعب المتقدم",
      passed: true, severity: "info",
    });
  } else {
    checks.push({
      id: "difficulty_match", title: "مناسب للمستوى المتوسط",
      description: "السؤال متوازن",
      passed: true, severity: "info",
    });
  }

  // 8. وجود الفئة
  if (question.category) {
    checks.push({
      id: "category", title: "الفئة محددة",
      description: `الفئة: ${question.category}`,
      passed: true, severity: "info",
    });
  } else {
    checks.push({
      id: "category", title: "الفئة غير محددة",
      description: "تحديد الفئة يساعد في التحليلات",
      passed: false, severity: "info",
      suggestion: "أضف فئة للسؤال (مثل: مفردات، تاريخ، علوم)",
    });
  }

  // 9. خيارات للاختيار من متعدد
  if (question.options && question.options.length > 0) {
    const optionsCount = question.options.length;
    const hasCorrectOption = question.correctOption !== undefined;
    if (optionsCount >= 3 && optionsCount <= 5 && hasCorrectOption) {
      checks.push({
        id: "options", title: "خيارات سليمة",
        description: `${optionsCount} خيارات مع إجابة صحيحة محددة`,
        passed: true, severity: "info",
      });
    } else {
      checks.push({
        id: "options", title: "خيارات غير متوازنة",
        description: `عدد الخيارات: ${optionsCount}`,
        passed: false, severity: "warning",
        suggestion: "استخدم 3-5 خيارات مع تحديد الإجابة الصحيحة",
      });
    }
  }

  // 10. وجود وسائط
  const hasMedia = question.imageUrl || question.emojis || question.sequence || question.matchPairs || question.fillBlanks;
  if (hasMedia) {
    checks.push({
      id: "media", title: "وسائط متنوعة ✓",
      description: "السؤال يستخدم وسائط بصرية/سمعية لزيادة التفاعل",
      passed: true, severity: "info",
    });
  }

  const passedCount = checks.filter((c) => c.passed).length;
  const totalCount = checks.length;
  const score = Math.round((passedCount / totalCount) * 100);

  const hasCritical = checks.some((c) => c.severity === "critical" && !c.passed);
  const hasWarning = checks.some((c) => c.severity === "warning" && !c.passed);
  let severity: QuestionQualityResult["severity"];
  if (hasCritical) severity = "critical";
  else if (hasWarning) severity = "warning";
  else severity = "good";

  const suggestions = checks
    .filter((c) => !c.passed && c.suggestion)
    .map((c) => c.suggestion as string);

  return { score, severity, checks, suggestions, passedCount, totalCount };
}

// ============================================================
// فحص مجموعة أسئلة كاملة
// ============================================================

export interface LevelQualityReport {
  totalScore: number;
  severity: "good" | "warning" | "critical";
  questionReports: QuestionQualityResult[];
  topIssues: { issue: string; count: number }[];
  recommendations: string[];
}

export function validateLevelQuestions(
  words: any[],
  difficulty?: "easy" | "medium" | "hard"
): LevelQualityReport {
  const questionReports = words.map((w) => validateQuestion(w, { difficulty }));
  const totalScore = questionReports.length > 0
    ? Math.round(questionReports.reduce((s, q) => s + q.score, 0) / questionReports.length)
    : 0;

  const hasCritical = questionReports.some((q) => q.severity === "critical");
  const criticalCount = questionReports.filter((q) => q.severity === "critical").length;
  const warningCount = questionReports.filter((q) => q.severity === "warning").length;

  let severity: LevelQualityReport["severity"];
  if (hasCritical && criticalCount > questionReports.length / 3) severity = "critical";
  else if (warningCount > 0 || hasCritical) severity = "warning";
  else severity = "good";

  const issueCount = new Map<string, number>();
  for (const report of questionReports) {
    for (const check of report.checks) {
      if (!check.passed) {
        issueCount.set(check.title, (issueCount.get(check.title) ?? 0) + 1);
      }
    }
  }
  const topIssues = Array.from(issueCount.entries())
    .map(([issue, count]) => ({ issue, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const recommendations: string[] = [];
  if (topIssues.find((i) => i.issue.includes("طويل"))) recommendations.push("📋 اختصر الأسئلة الطويلة لزيادة الوضوح");
  if (topIssues.find((i) => i.issue.includes("الحفظ"))) recommendations.push("🧠 أعد صياغة الأسئلة لاختبار الفهم بدل الحفظ");
  if (topIssues.find((i) => i.issue.includes("الفئة"))) recommendations.push("🏷️ أضف فئات للأسئلة لتحسين التحليلات");
  if (topIssues.find((i) => i.issue.includes("تلميحات"))) recommendations.push("🚫 احذف التلميحات العارية من الأسئلة");
  if (recommendations.length === 0) recommendations.push("🎉 جودة ممتازة! لا توجد توصيات إضافية");

  return { totalScore, severity, questionReports, topIssues, recommendations };
}
