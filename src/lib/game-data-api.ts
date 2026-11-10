// طبقة الوصول للبيانات - تدعم API + fallback للبيانات المحلية
// تُستخدم في شاشة اللعب والصفحة الرئيسية

export interface Cell {
  row: number;
  col: number;
  letter: string;
  number?: number | null;
}

export interface Word {
  id?: string;
  text: string;
  clue: string;
  category?: string;
  imageUrl?: string;
  image2Url?: string;
  image3Url?: string;
  image4Url?: string;
  emojis?: string;
  options?: string[];
  correctOption?: number;
  matchPairs?: string[];
  fillBlanks?: string;
  audioUrl?: string;
  logicData?: string;
  sequence?: string;
  direction: "across" | "down";
  startRow: number;
  startCol: number;
  number: number;
}

export interface Level {
  id: number;
  chapterId: number;
  number: number;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  gameMode?: "crossword" | "quiz";
  puzzleType?: string;
  timeLimit?: number;
  gridSize: { rows: number; cols: number };
  cells: Cell[];
  words: Word[];
  availableLetters: string[];
  bonusWords: string[];
  reward: number;
  hintCost: number;
  // ===== الأهداف التربوية =====
  learningGoals?: string[];
  educationalDescription?: string;
}

export interface Chapter {
  id: number;
  title: string;
  description: string;
  color: string;
  icon: string;
  levelsCount: number;
  unlockAt: number;
}

// ===== بيانات احتياطية محلية (تُستخدم عند فشل API) =====
const fallbackChapters: Chapter[] = [
  {
    id: 1,
    title: "البدايات",
    description: "مراحل تعريفية بكلمات سهلة ومألوفة",
    color: "oklch(0.78 0.13 80)",
    icon: "🌟",
    levelsCount: 3,
    unlockAt: 0,
  },
];

const fallbackLevels: Level[] = [
  {
    id: 1,
    chapterId: 1,
    number: 1,
    title: "أول كلمة",
    difficulty: "easy",
    gridSize: { rows: 5, cols: 5 },
    cells: [
      { row: 0, col: 2, letter: "ل", number: 2 },
      { row: 1, col: 2, letter: "و" },
      { row: 2, col: 0, letter: "ك", number: 1 },
      { row: 2, col: 1, letter: "ت" },
      { row: 2, col: 2, letter: "ا" },
      { row: 2, col: 3, letter: "ب" },
      { row: 3, col: 2, letter: "ن" },
    ],
    words: [
      { id: "1-across", text: "كتاب", clue: "مصدر المعرفة", direction: "across", startRow: 2, startCol: 0, number: 1 },
      { id: "2-down", text: "لون", clue: "صفة الشيء", direction: "down", startRow: 0, startCol: 2, number: 2 },
    ],
    availableLetters: ["ك", "ت", "ا", "ب", "ل", "و", "ن", "ر", "م", "ق"],
    bonusWords: ["كلب", "قال"],
    reward: 50,
    hintCost: 10,
  },
];

// ===== دوال API =====
export async function fetchChapters(): Promise<Chapter[]> {
  try {
    const response = await fetch("/api/chapters");
    if (!response.ok) throw new Error("Failed to fetch");
    const data = await response.json();
    const chapters = (data.chapters || []).map((c: any) => ({
      ...c,
      levelsCount: c.levels?.length || 0,
      color: c.color || "oklch(0.78 0.13 80)",
      icon: c.icon || "⭐",
      unlockAt: c.unlockAt || 0,
    }));
    return chapters.length > 0 ? chapters : fallbackChapters;
  } catch (error) {
    console.error("Error fetching chapters, using fallback:", error);
    return fallbackChapters;
  }
}

export async function fetchLevels(chapterId: number): Promise<Level[]> {
  try {
    const response = await fetch(`/api/levels?chapterId=${chapterId}`);
    if (!response.ok) throw new Error("Failed to fetch");
    const data = await response.json();
    return data.levels || [];
  } catch (error) {
    console.error("Error fetching levels, using fallback:", error);
    return fallbackLevels.filter((l) => l.chapterId === chapterId);
  }
}

export async function fetchLevelById(id: number): Promise<Level | null> {
  try {
    const response = await fetch(`/api/levels?id=${id}`);
    if (!response.ok) throw new Error("Failed to fetch");
    const data = await response.json();
    if (!data.level) return null;

    // تحويل من تنسيق قاعدة البيانات إلى تنسيق الواجهة
    const level = data.level;
    return {
      id: level.id,
      chapterId: level.chapterId,
      number: level.number,
      title: level.title,
      difficulty: level.difficulty,
      gameMode: level.gameMode || "quiz",
      puzzleType: level.puzzleType || "text",
      gridSize: { rows: level.gridSizeRows, cols: level.gridSizeCols },
      // ===== الأهداف التربوية =====
      learningGoals: (() => {
        try {
          const goals = JSON.parse(level.learningGoals || "[]");
          return Array.isArray(goals) ? goals : [];
        } catch {
          return [];
        }
      })(),
      educationalDescription: level.educationalDescription || "",
      cells: (level.cells || []).map((c: any) => ({
        row: c.row,
        col: c.col,
        letter: c.letter,
        number: c.number,
      })),
      words: (level.words || []).map((w: any) => ({
        id: `${w.number}-${w.direction}`,
        text: w.text,
        clue: w.clue,
        category: w.category || "",
        imageUrl: w.imageUrl || "",
        image2Url: w.image2Url || "",
        image3Url: w.image3Url || "",
        image4Url: w.image4Url || "",
        emojis: w.emojis || "",
        options: Array.isArray(w.options) ? w.options : (w.options ? w.options.split("|") : []),
        correctOption: w.correctOption || 0,
        matchPairs: Array.isArray(w.matchPairs) ? w.matchPairs : (w.matchPairs ? w.matchPairs.split("|") : []),
        fillBlanks: w.fillBlanks || "",
        audioUrl: w.audioUrl || "",
        logicData: w.logicData || "",
        sequence: w.sequence || "",
        direction: w.direction,
        startRow: w.startRow,
        startCol: w.startCol,
        number: w.number,
      })),
      availableLetters: Array.isArray(level.availableLetters)
        ? level.availableLetters
        : level.availableLetters
        ? level.availableLetters.split(",")
        : [],
      bonusWords: Array.isArray(level.bonusWords)
        ? level.bonusWords
        : level.bonusWords
        ? level.bonusWords.split(",").filter((w: string) => w)
        : [],
      reward: level.reward,
      hintCost: level.hintCost,
    };
  } catch (error) {
    console.error("Error fetching level, using fallback:", error);
    return fallbackLevels.find((l) => l.id === id) || null;
  }
}

// ===== حفظ التقدم =====
export async function saveProgress(progress: {
  userId: string;
  levelId: number;
  isCompleted: boolean;
  stars: number;
  score: number;
  hintsUsed: number;
  timeSpent: number;
  coinsEarned: number;
}): Promise<void> {
  try {
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(progress),
    });
  } catch (error) {
    console.error("Error saving progress:", error);
  }
}

// ===== إنشاء مستخدم ضيف =====
// يعالج الحالات التالية بأناقة:
//   - لا يوجد userId محفوظ → ينشئ مستخدم جديد
//   - userId محفوظ لكن لم يعد موجوداً في DB (404) → ينظّف وينشئ جديد
//   - خطأ شبكة/خادم → يعيد null بهدوء (التطبيق يبقى قابل للاستخدام بدون مزامنة)
export async function getOrCreateUser(): Promise<{ id: string; coins: number } | null> {
  try {
    const isClient = typeof window !== "undefined";
    const storedUserId = isClient
      ? localStorage.getItem("thaqafatna-user-id")
      : null;

    // محاولة جلب المستخدم المحفوظ إن وُجد
    if (storedUserId) {
      try {
        const response = await fetch(`/api/progress?userId=${storedUserId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            return { id: data.user.id, coins: data.user.coins };
          }
        } else if (response.status === 404) {
          // المستخدم لم يعد موجوداً في DB (ربما بعد reset) — ننظّف ونتابع لإنشاء جديد
          if (isClient) {
            localStorage.removeItem("thaqafatna-user-id");
          }
        }
        // أي حالة أخرى (5xx مثلاً): نسقط لإنشاء جديد كمحاولة أخيرة
      } catch (e) {
        // فشل شبكي عند محاولة المستخدم المحفوظ — نتابع لإنشاء جديد
        console.warn("Failed to fetch existing user, will create a new one:", e);
      }
    }

    // إنشاء مستخدم ضيف جديد
    try {
      const response = await fetch("/api/progress");
      if (!response.ok) {
        console.warn("User creation API returned non-OK status:", response.status);
        return null;
      }
      const data = await response.json();
      if (data.user) {
        if (isClient) {
          localStorage.setItem("thaqafatna-user-id", data.user.id);
        }
        return { id: data.user.id, coins: data.user.coins };
      }
    } catch (e) {
      console.error("Error creating new user:", e);
    }

    return null;
  } catch (error) {
    console.error("Unexpected error in getOrCreateUser:", error);
    return null;
  }
}
