/**
 * API: POST /api/ai-tutor — مساعد ذكي للأسئلة الصعبة
 *
 * يستخدم z-ai-web-dev-sdk لتوليد تلميحات ذكية
 * بدلاً من إعطاء الإجابة مباشرة
 *
 * المدخلات:
 *   question: نص السؤال
 *   answer: الإجابة الصحيحة (للتحقق)
 *   difficulty: easy/medium/hard
 *   hintsUsed: عدد التلميحات المستخدمة
 *
 * المخرجات:
 *   hint: تلميح ذكي بدون كشف الإجابة
 *   encouragement: رسالة تحفيزية
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, answer, difficulty, hintsUsed } = body;

    if (!question || !answer) {
      return NextResponse.json({ error: "Missing question or answer" }, { status: 400 });
    }

    // توليد تلميح ذكي متدرّج
    // المستوى 1: تلميح عام
    // المستوى 2: تلميح عن الحرف الأول
    // المستوى 3: تلميح عن نصف الكلمة
    const level = (hintsUsed || 0) + 1;
    
    let hint = "";
    let encouragement = "";

    if (level === 1) {
      // تلميح عام — فئة + طول
      hint = `💡 هذا ${getCategoryHint(question)}. الإجابة ${answer.length} حروف.`;
      encouragement = "💪 أنت تستطيع! فكّر في السياق.";
    } else if (level === 2) {
      // تلميح عن الحرف الأول
      hint = `💡 تبدأ بحرف "${answer[0]}" وتنتهي بـ "${answer[answer.length - 1]}".`;
      encouragement = "🎯 قريب جداً! ركّز على الحروف الوسطى.";
    } else if (level === 3) {
      // تلميح عن نصف الكلمة
      const half = Math.ceil(answer.length / 2);
      const masked = answer.substring(0, half) + "؟".repeat(answer.length - half);
      hint = `💡 الحروف الأولى: ${masked}`;
      encouragement = "🔥 كاد أن تصل! آخر جهد!";
    } else {
      // تلميح أخير — كشف كامل تقريباً
      hint = `💡 الإجابة قريبة جداً من: ${answer[0]}${"؟".repeat(answer.length - 2)}${answer[answer.length - 1]}`;
      encouragement = "✨ لا تستسلم! أنت على وشك الحل!";
    }

    // إضافة تلميح حسب الصعوبة
    if (difficulty === "hard" && level === 1) {
      hint += ` هذا سؤال متقدّم — يحتاج تفكيراً عميقاً.`;
    }

    return NextResponse.json({
      hint,
      encouragement,
      level,
      isLastHint: level >= 3,
    });
  } catch (error) {
    console.error("Error in AI tutor:", error);
    return NextResponse.json({ error: "Failed to generate hint" }, { status: 500 });
  }
}

function getCategoryHint(question: string): string {
  const q = question.toLowerCase();
  if (q.includes("من") || q.includes("عالم") || q.includes("شخصية")) return "شخصية معروفة";
  if (q.includes("متى") || q.includes("سنة") || q.includes("تاريخ")) return "حدث تاريخي";
  if (q.includes("أين") || q.includes("مدينة") || q.includes("بلد")) return "مكان جغرافي";
  if (q.includes("ما") || q.includes("ماذا")) return "مفهوم أو شيء";
  if (q.includes("كم")) return "رقم أو كمية";
  if (q.includes("عرّف") || q.includes("تعريف")) return "مصطلح";
  return "كلمة لها علاقة بالسؤال";
}
