/**
 * API: POST /api/admin/import-pdf — استيراد كتاب من PDF
 *
 * يقوم بـ:
 *   1. استقبال ملف PDF
 *   2. استخراج النص (pdf-parse)
 *   3. تقسيم النص إلى فصول (عبر العناوين / فواصل الصفحات)
 *   4. تنسيق النص كـ HTML
 *   5. حساب وقت القراءة المقدّر
 *   6. إرجاع البيانات المنظّمة للمراجعة
 *
 * المرحلة 2 (POST منفصل): نشر الكتاب بعد المراجعة
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST — استيراد PDF
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("pdf") as File;
    const title = formData.get("title") as string;
    const author = formData.get("author") as string;
    const categoryId = formData.get("categoryId") as string;
    const difficulty = formData.get("difficulty") as string;
    const autoPublish = formData.get("autoPublish") === "true";

    if (!file) {
      return NextResponse.json({ error: "لم يتم رفع ملف PDF" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "الملف يجب أن يكون PDF" }, { status: 400 });
    }

    // قراءة الملف
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // استخراج النص من PDF
    let pdfText = "";
    let pdfInfo: any = {};

    try {
      // pdf-parse@1.1.1 يعمل بشكل أفضل عند تحميله عبر require مباشر
      // مع تجنّب ملف test الذي يحاول قراءة PDF تجريبي
      let pdfParse: any;
      try {
        // محاولة 1: تحميل عادي
        pdfParse = eval('require')('pdf-parse');
      } catch {
        // محاولة 2: مسار نسبي
        const { createRequire } = await import("module");
        const require2 = createRequire(import.meta.url);
        pdfParse = require2('pdf-parse');
      }
      const pdfData = await pdfParse(buffer);
      pdfText = pdfData.text;
      pdfInfo = {
        pages: pdfData.numpages,
        info: pdfData.info || {},
      };
    } catch (e) {
      console.error("PDF parse error:", e);
      return NextResponse.json(
        { error: "تعذّر قراءة ملف PDF. تأكد من أنه ليس محميّاً بكلمة مرور." },
        { status: 500 }
      );
    }

    if (!pdfText || pdfText.trim().length < 100) {
      return NextResponse.json(
        { error: "النص المستخرج فارغ أو قصير جداً" },
        { status: 400 }
      );
    }

    // تنظيف النص
    pdfText = cleanText(pdfText);

    // تقسيم النص إلى فصول
    const chapters = splitIntoChapters(pdfText);

    // تنسيق كل فصل كـ HTML
    const formattedChapters = chapters.map((ch, i) => ({
      number: i + 1,
      title: ch.title || `الفصل ${i + 1}`,
      content: formatAsHTML(ch.content),
      readingTimeMin: estimateReadingTime(ch.content),
    }));

    // حساب المعلومات الإجمالية
    const totalReadingTime = formattedChapters.reduce((s, c) => s + c.readingTimeMin, 0);
    const totalWords = pdfText.split(/\s+/).length;

    const bookData = {
      title: title || pdfInfo.info?.Title || "كتاب بدون عنوان",
      author: author || pdfInfo.info?.Author || "غير معروف",
      categoryId: categoryId ? parseInt(categoryId) : 1,
      difficulty: difficulty || "medium",
      description: generateDescription(pdfText),
      readingTimeMin: totalReadingTime,
      pages: pdfInfo.pages || 0,
      totalWords,
      chaptersCount: formattedChapters.length,
      chapters: formattedChapters,
    };

    // إذا autoPublish: أنشئ الكتاب مباشرة
    if (autoPublish) {
      const book = await db.book.create({
        data: {
          title: bookData.title,
          author: bookData.author,
          categoryId: bookData.categoryId,
          difficulty: bookData.difficulty,
          description: bookData.description,
          contentType: "text",
          readingTimeMin: bookData.readingTimeMin,
          pages: bookData.pages,
          isPublished: true,
        },
      });

      // إنشاء الفصول
      for (const ch of formattedChapters) {
        await db.bookChapter.create({
          data: {
            bookId: book.id,
            number: ch.number,
            title: ch.title,
            content: ch.content,
            readingTimeMin: ch.readingTimeMin,
            isFree: true,
            isPublished: true,
          },
        });
      }

      return NextResponse.json({
        success: true,
        bookId: book.id,
        bookData,
        message: `تم استيراد الكتاب "${bookData.title}" بنجاح! (${formattedChapters.length} فصل)`,
      });
    }

    // إرجاع البيانات للمراجعة
    return NextResponse.json({
      success: true,
      bookData,
      message: `تم استخراج النص بنجاح! ${formattedChapters.length} فصل، ${totalWords} كلمة، ${totalReadingTime} دقيقة قراءة.`,
    });
  } catch (error) {
    console.error("Error importing PDF:", error);
    return NextResponse.json(
      { error: "فشل استيراد PDF: " + (error as Error).message },
      { status: 500 }
    );
  }
}

// ============================================================
// دوال مساعدة
// ============================================================

/** تنظيف النص من الرموز الزائدة */
function cleanText(text: string): string {
  return text
    // إزالة الصفحات الفارغة المتكررة
    .replace(/\n{4,}/g, "\n\n\n")
    // إزالة المسافات الزائدة في الأسطر
    .replace(/[ \t]+/g, " ")
    // إزالة المسافات في بداية ونهاية الأسطر
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    // إزالة أرقام الصفحات (أرقام منفردة في سطر)
    .replace(/^\d{1,4}$/gm, "")
    // تنظيف نهائي
    .trim();
}

/** تقسيم النص إلى فصول */
function splitIntoChapters(text: string): { title: string; content: string }[] {
  const chapters: { title: string; content: string }[] = [];

  // محاولة 1: البحث عن عناوين فصول واضحة
  // أنماط: "الفصل الأول", "الباب الأول", "باب", "فصل", "مقدمة", "خاتمة"
  const chapterPatterns = [
    /^(الفصل\s+(?:الأول|الثاني|الثالث|الرابع|الخامس|السادس|السابع|الثامن|التاسع|العاشر|[١-٩]+|[0-9]+))/gm,
    /^(الباب\s+(?:الأول|الثاني|الثالث|الرابع|الخامس|[١-٩]+|[0-9]+))/gm,
    /^(باب\s+\d+)/gm,
    /^(فصل\s+\d+)/gm,
    /^(مقدمة)/gm,
    /^(خاتمة)/gm,
    /^(تمهيد)/gm,
  ];

  // محاولة إيجاد نقاط التقسيم
  const splitPoints: { title: string; index: number }[] = [];

  for (const pattern of chapterPatterns) {
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      if (match.index !== undefined) {
        splitPoints.push({
          title: match[1] || `فصل ${splitPoints.length + 1}`,
          index: match.index,
        });
      }
    }
  }

  // إذا وجدنا نقاط تقسيم، نقسّم النص
  if (splitPoints.length >= 2) {
    // ترتيب حسب الموقع
    splitPoints.sort((a, b) => a.index - b.index);

    // إزالة التكرار
    const uniquePoints = splitPoints.filter(
      (p, i, arr) => i === 0 || p.index - arr[i - 1].index > 200
    );

    for (let i = 0; i < uniquePoints.length; i++) {
      const start = uniquePoints[i].index;
      const end = i + 1 < uniquePoints.length ? uniquePoints[i + 1].index : text.length;
      const content = text.substring(start, end).trim();
      if (content.length > 200) {
        chapters.push({
          title: uniquePoints[i].title,
          content,
        });
      }
    }
  }

  // محاولة 2: إذا لم نجد فصولاً، نقسّم حسب فواصل كبيرة
  if (chapters.length === 0) {
    const sections = text.split(/\n{3,}/);
    
    // دمج الأقسام الصغيرة + تقسيم لكل ~ 2000 كلمة
    let currentChapter = "";
    let wordCount = 0;
    let chapterNum = 1;

    for (const section of sections) {
      const sectionWords = section.split(/\s+/).length;
      currentChapter += section + "\n\n";
      wordCount += sectionWords;

      if (wordCount >= 2000) {
        chapters.push({
          title: `الفصل ${chapterNum}`,
          content: currentChapter.trim(),
        });
        currentChapter = "";
        wordCount = 0;
        chapterNum++;
      }
    }

    // إضافة ما تبقى
    if (currentChapter.trim().length > 200) {
      chapters.push({
        title: `الفصل ${chapterNum}`,
        content: currentChapter.trim(),
      });
    }
  }

  // محاولة 3: إذا لم نجد شيئاً، نضع كل النص في فصل واحد
  if (chapters.length === 0) {
    chapters.push({
      title: "المحتوى الكامل",
      content: text,
    });
  }

  return chapters;
}

/** تنسيق النص كـ HTML */
function formatAsHTML(text: string): string {
  const lines = text.split("\n");
  let html = "";
  let inList = false;
  let inQuote = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      html += "\n";
      continue;
    }

    // عناوين فرعية (أسطر قصيرة + لا تنتهي بنقطة)
    if (trimmed.length < 60 && !trimmed.endsWith(".") && !trimmed.endsWith("،") && !trimmed.endsWith(":")) {
      // إنهاء القائمة/الاقتباس إن كنّا فيهما
      if (inList) { html += "</ul>\n"; inList = false; }
      if (inQuote) { html += "</blockquote>\n"; inQuote = false; }
      
      html += `<h3>${escapeHtml(trimmed)}</h3>\n`;
    }
    // عناصر قائمة
    else if (trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("*")) {
      if (!inList) { html += "<ul>\n"; inList = true; }
      html += `  <li>${escapeHtml(trimmed.substring(1).trim())}</li>\n`;
    }
    // أرقام
    else if (/^\d+[.)]/.test(trimmed)) {
      if (!inList) { html += "<ul>\n"; inList = true; }
      html += `  <li>${escapeHtml(trimmed.replace(/^\d+[.)]/, "").trim())}</li>\n`;
    }
    // اقتباس (يبدأ بـ " أو «)
    else if (trimmed.startsWith('"') || trimmed.startsWith("«") || trimmed.startsWith('"')) {
      if (inList) { html += "</ul>\n"; inList = false; }
      if (!inQuote) { html += "<blockquote>\n"; inQuote = true; }
      html += `  <p>${escapeHtml(trimmed)}</p>\n`;
    }
    // فقرة عادية
    else {
      if (inList) { html += "</ul>\n"; inList = false; }
      if (inQuote) { html += "</blockquote>\n"; inQuote = false; }
      html += `<p>${escapeHtml(trimmed)}</p>\n`;
    }
  }

  // إغلاق أي وسوم مفتوحة
  if (inList) html += "</ul>\n";
  if (inQuote) html += "</blockquote>\n";

  return html;
}

/** تجنب XSS */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** تقدير وقت القراءة (200 كلمة/دقيقة بالعربية) */
function estimateReadingTime(text: string): number {
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

/** توليد وصف تلقائي من أول 200 كلمة */
function generateDescription(text: string): string {
  const words = text.split(/\s+/).slice(0, 40).join(" ");
  return words + "...";
}
