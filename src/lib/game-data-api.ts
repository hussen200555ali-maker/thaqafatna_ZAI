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
  gridSize: { rows: number; cols: number };
  cells: Cell[];
  words: Word[];
  availableLetters: string[];
  bonusWords: string[];
  reward: number;
  hintCost: number;
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
export async function getOrCreateUser(): Promise<{ id: string; coins: number } | null> {
  try {
    // فحص إذا كان لدينا معرف مستخدم محفوظ
    const storedUserId = typeof window !== "undefined"
      ? localStorage.getItem("thaqafatna-user-id")
      : null;

    const url = storedUserId ? `/api/progress?userId=${storedUserId}` : "/api/progress";
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch user");
    const data = await response.json();

    if (data.user) {
      if (typeof window !== "undefined") {
        localStorage.setItem("thaqafatna-user-id", data.user.id);
      }
      return { id: data.user.id, coins: data.user.coins };
    }
    return null;
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
}
