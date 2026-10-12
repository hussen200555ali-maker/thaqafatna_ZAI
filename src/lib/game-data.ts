// بيانات المراحل والفصول لتطبيق ثقافتنا
// هذه البيانات تُستخدم للنسخة التجريبية، وستُستبدل لاحقاً بقاعدة بيانات

export interface Cell {
  row: number;
  col: number;
  letter: string;
  number?: number; // رقم السؤال
}

export interface Word {
  id: string;
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

export const chapterColors = [
  "oklch(0.78 0.13 80)",
  "oklch(0.60 0.09 195)",
  "oklch(0.65 0.18 30)",
  "oklch(0.70 0.14 145)",
  "oklch(0.65 0.10 290)",
  "oklch(0.58 0.20 350)",
];

export const chapters: Chapter[] = [
  {
    id: 1,
    title: "البدايات",
    description: "مراحل تعريفية بكلمات سهلة ومألوفة",
    color: chapterColors[0],
    icon: "🌟",
    levelsCount: 6,
    unlockAt: 0,
  },
  {
    id: 2,
    title: "الطبيعة",
    description: "كلمات من عالم النباتات والحيوانات",
    color: chapterColors[1],
    icon: "🌿",
    levelsCount: 4,
    unlockAt: 4,
  },
  {
    id: 3,
    title: "التراث",
    description: "كلمات من التراث والثقافة العربية",
    color: chapterColors[2],
    icon: "📜",
    levelsCount: 4,
    unlockAt: 8,
  },
  {
    id: 4,
    title: "العلوم",
    description: "مصطلحات علمية وتقنية",
    color: chapterColors[3],
    icon: "🔬",
    levelsCount: 4,
    unlockAt: 12,
  },
  {
    id: 5,
    title: "التاريخ",
    description: "شخصيات وأحداث تاريخية",
    color: chapterColors[4],
    icon: "🏛️",
    levelsCount: 4,
    unlockAt: 16,
  },
  {
    id: 6,
    title: "الأدب",
    description: "كلمات من الشعر والأدب العربي",
    color: chapterColors[5],
    icon: "📚",
    levelsCount: 4,
    unlockAt: 20,
  },
];

const c = (row: number, col: number, letter: string, number?: number): Cell => ({
  row, col, letter, number,
});

const w = (
  text: string,
  clue: string,
  direction: "across" | "down",
  startRow: number,
  startCol: number,
  number: number
): Word => ({ id: `${number}-${direction}`, text, clue, direction, startRow, startCol, number });

// دالة مساعدة لبناء قائمة الخلايا من الكلمات
function buildCells(words: Word[], gridSize: { rows: number; cols: number }): Cell[] {
  const cellMap = new Map<string, Cell>();
  
  for (const word of words) {
    for (let i = 0; i < word.text.length; i++) {
      const row = word.direction === "across" ? word.startRow : word.startRow + i;
      const col = word.direction === "across" ? word.startCol + i : word.startCol;
      const key = `${row}-${col}`;
      
      if (!cellMap.has(key)) {
        cellMap.set(key, { row, col, letter: word.text[i] });
      }
      
      // تعيين رقم الخلية لبداية الكلمة
      if (i === 0) {
        const cell = cellMap.get(key)!;
        cell.number = word.number;
      }
    }
  }
  
  // تحويل إلى مصفوفة وإضافة خلايا فارغة
  const cells: Cell[] = [];
  for (let r = 0; r < gridSize.rows; r++) {
    for (let col = 0; col < gridSize.cols; col++) {
      const key = `${r}-${col}`;
      if (cellMap.has(key)) {
        cells.push(cellMap.get(key)!);
      }
      // الخلايا الفارغة لا تُضاف - تُترك ضمنياً
    }
  }
  
  return cells;
}

// دالة مساعدة لجمع الحروف المتاحة من الكلمات + كلمات إضافية
function collectLetters(words: Word[], bonusWords: string[], extraLetters: string[] = []): string[] {
  const letters: string[] = [];
  for (const word of words) {
    for (const letter of word.text) {
      letters.push(letter);
    }
  }
  for (const word of bonusWords) {
    for (const letter of word) {
      if (!letters.includes(letter) || letters.filter(l => l === letter).length < 2) {
        letters.push(letter);
      }
    }
  }
  letters.push(...extraLetters);
  return letters;
}

export const levels: Level[] = [
  // ===== الفصل 1: البدايات =====
  // المرحلة 1: كلمة "كتاب"
  {
    id: 1,
    chapterId: 1,
    number: 1,
    title: "أول كلمة",
    difficulty: "easy",
    gridSize: { rows: 5, cols: 5 },
    cells: buildCells([
      w("كتاب", "مصدر المعرفة", "across", 2, 0, 1),
      w("لون", "صفة الشيء", "down", 0, 2, 2),
    ], { rows: 5, cols: 5 }),
    words: [
      w("كتاب", "مصدر المعرفة", "across", 2, 0, 1),
      w("لون", "صفة الشيء", "down", 0, 2, 2),
    ],
    availableLetters: collectLetters(
      [w("كتاب", "", "across", 0, 0, 0), w("لون", "", "down", 0, 0, 0)],
      ["كلب", "قال"],
      ["ر", "م"]
    ),
    bonusWords: ["كلب", "قال"],
    reward: 50,
    hintCost: 10,
  },
  // المرحلة 2: كلمة "بيت"
  {
    id: 2,
    chapterId: 1,
    number: 2,
    title: "البيت",
    difficulty: "easy",
    gridSize: { rows: 5, cols: 5 },
    cells: buildCells([
      w("بيت", "مسكن الإنسان", "across", 0, 0, 1),
      w("تمر", "ثمرة النخيل", "down", 0, 2, 2),
      w("رجل", "ذكر بالغ", "across", 2, 1, 3),
    ], { rows: 5, cols: 5 }),
    words: [
      w("بيت", "مسكن الإنسان", "across", 0, 0, 1),
      w("تمر", "ثمرة النخيل", "down", 0, 2, 2),
      w("رجل", "ذكر بالغ", "across", 2, 1, 3),
    ],
    availableLetters: collectLetters(
      [w("بيت", "", "across", 0, 0, 0), w("تمر", "", "down", 0, 0, 0), w("رجل", "", "across", 0, 0, 0)],
      ["بر", "ترب"]
    ),
    bonusWords: ["بر", "ترب"],
    reward: 50,
    hintCost: 10,
  },
  // المرحلة 3: كلمة "قمر"
  {
    id: 3,
    chapterId: 1,
    number: 3,
    title: "القمر",
    difficulty: "easy",
    gridSize: { rows: 5, cols: 5 },
    cells: buildCells([
      w("شمس", "نجم النهار", "across", 0, 1, 1),
      w("قمر", "نجم الليل", "down", 0, 2, 2),
      w("بحر", "مياه واسعة", "across", 2, 0, 3),
    ], { rows: 5, cols: 5 }),
    words: [
      w("شمس", "نجم النهار", "across", 0, 1, 1),
      w("قمر", "نجم الليل", "down", 0, 2, 2),
      w("بحر", "مياه واسعة", "across", 2, 0, 3),
    ],
    availableLetters: collectLetters(
      [w("شمس", "", "across", 0, 0, 0), w("قمر", "", "down", 0, 0, 0), w("بحر", "", "across", 0, 0, 0)],
      ["شر", "شبر"]
    ),
    bonusWords: ["شر", "شبر"],
    reward: 50,
    hintCost: 10,
  },
  // المرحلة 4: كلمة "نجمة"
  {
    id: 4,
    chapterId: 1,
    number: 4,
    title: "النجمة",
    difficulty: "easy",
    gridSize: { rows: 5, cols: 5 },
    cells: buildCells([
      w("نار", "حرارة", "across", 0, 0, 1),
      w("نجمة", "كوكب لامع", "down", 0, 0, 2),
      w("جمل", "حيوان الصحراء", "across", 2, 0, 3),
    ], { rows: 5, cols: 5 }),
    words: [
      w("نار", "حرارة", "across", 0, 0, 1),
      w("نجمة", "كوكب لامع", "down", 0, 0, 2),
      w("جمل", "حيوان الصحراء", "across", 2, 0, 3),
    ],
    availableLetters: collectLetters(
      [w("نار", "", "across", 0, 0, 0), w("نجمة", "", "down", 0, 0, 0), w("جمل", "", "across", 0, 0, 0)],
      ["نجم", "نجار"]
    ),
    bonusWords: ["نجم", "نجار"],
    reward: 75,
    hintCost: 10,
  },
  // المرحلة 5: كلمة "ورد"
  {
    id: 5,
    chapterId: 1,
    number: 5,
    title: "الوردة",
    difficulty: "easy",
    gridSize: { rows: 5, cols: 5 },
    cells: buildCells([
      w("ورد", "زهرة عطرة", "across", 0, 0, 1),
      w("دار", "مسكن", "down", 0, 2, 2),
      w("ربيع", "فصل الزهور", "across", 2, 0, 3),
    ], { rows: 5, cols: 5 }),
    words: [
      w("ورد", "زهرة عطرة", "across", 0, 0, 1),
      w("دار", "مسكن", "down", 0, 2, 2),
      w("ربيع", "فصل الزهور", "across", 2, 0, 3),
    ],
    availableLetters: collectLetters(
      [w("ورد", "", "across", 0, 0, 0), w("دار", "", "down", 0, 0, 0), w("ربيع", "", "across", 0, 0, 0)],
      ["درب", "ود"]
    ),
    bonusWords: ["درب", "ود"],
    reward: 75,
    hintCost: 10,
  },
  // المرحلة 6: كلمة "علم"
  {
    id: 6,
    chapterId: 1,
    number: 6,
    title: "العلم",
    difficulty: "easy",
    gridSize: { rows: 5, cols: 5 },
    cells: buildCells([
      w("علم", "معرفة", "across", 0, 0, 1),
      w("قلم", "أداة الكتابة", "down", 0, 2, 2),
      w("ملك", "حاكم", "across", 2, 0, 3),
    ], { rows: 5, cols: 5 }),
    words: [
      w("علم", "معرفة", "across", 0, 0, 1),
      w("قلم", "أداة الكتابة", "down", 0, 2, 2),
      w("ملك", "حاكم", "across", 2, 0, 3),
    ],
    availableLetters: collectLetters(
      [w("علم", "", "across", 0, 0, 0), w("قلم", "", "down", 0, 0, 0), w("ملك", "", "across", 0, 0, 0)],
      ["ملق", "لم"]
    ),
    bonusWords: ["ملق", "لم"],
    reward: 75,
    hintCost: 10,
  },
  // ===== الفصل 2: الطبيعة =====
  {
    id: 11,
    chapterId: 2,
    number: 1,
    title: "نباتات الحديقة",
    difficulty: "medium",
    gridSize: { rows: 6, cols: 6 },
    cells: buildCells([
      w("وردة", "زهرة عطرة", "across", 0, 0, 1),
      w("شجرة", "نبتة كبيرة", "down", 0, 3, 2),
      w("ثمر", "نتاج الشجر", "across", 4, 0, 3),
    ], { rows: 6, cols: 6 }),
    words: [
      w("وردة", "زهرة عطرة", "across", 0, 0, 1),
      w("شجرة", "نبتة كبيرة", "down", 0, 3, 2),
      w("ثمر", "نتاج الشجر", "across", 4, 0, 3),
    ],
    availableLetters: collectLetters(
      [w("وردة", "", "across", 0, 0, 0), w("شجرة", "", "down", 0, 0, 0), w("ثمر", "", "across", 0, 0, 0)],
      ["دثر", "ورد"]
    ),
    bonusWords: ["دثر", "ورد"],
    reward: 100,
    hintCost: 15,
  },
  {
    id: 12,
    chapterId: 2,
    number: 2,
    title: "حيوانات البر",
    difficulty: "medium",
    gridSize: { rows: 6, cols: 6 },
    cells: buildCells([
      w("أسد", "ملك الغابة", "across", 0, 0, 1),
      w("غزال", "حيوان رشيق", "down", 0, 1, 2),
      w("نمر", "حيوان مفترس", "across", 3, 0, 3),
    ], { rows: 6, cols: 6 }),
    words: [
      w("أسد", "ملك الغابة", "across", 0, 0, 1),
      w("غزال", "حيوان رشيق", "down", 0, 1, 2),
      w("نمر", "حيوان مفترس", "across", 3, 0, 3),
    ],
    availableLetters: collectLetters(
      [w("أسد", "", "across", 0, 0, 0), w("غزال", "", "down", 0, 0, 0), w("نمر", "", "across", 0, 0, 0)],
      ["دل", "سن"]
    ),
    bonusWords: ["دل", "سن"],
    reward: 100,
    hintCost: 15,
  },
  {
    id: 13,
    chapterId: 2,
    number: 3,
    title: "طيور السماء",
    difficulty: "medium",
    gridSize: { rows: 6, cols: 6 },
    cells: buildCells([
      w("نسر", "طائر جارح", "across", 0, 0, 1),
      w("عصفور", "طائر صغير", "down", 0, 1, 2),
      w("ريش", "غطاء الطائر", "across", 3, 0, 3),
    ], { rows: 6, cols: 6 }),
    words: [
      w("نسر", "طائر جارح", "across", 0, 0, 1),
      w("عصفور", "طائر صغير", "down", 0, 1, 2),
      w("ريش", "غطاء الطائر", "across", 3, 0, 3),
    ],
    availableLetters: collectLetters(
      [w("نسر", "", "across", 0, 0, 0), w("عصفور", "", "down", 0, 0, 0), w("ريش", "", "across", 0, 0, 0)],
      ["رس", "شر"]
    ),
    bonusWords: ["رس", "شر"],
    reward: 100,
    hintCost: 15,
  },
  {
    id: 14,
    chapterId: 2,
    number: 4,
    title: "أسماك البحر",
    difficulty: "medium",
    gridSize: { rows: 6, cols: 6 },
    cells: buildCells([
      w("سمك", "حيوان البحر", "across", 0, 0, 1),
      w("موج", "حركة الماء", "down", 0, 1, 2),
      w("حوت", "أكبر البحريات", "across", 3, 0, 3),
    ], { rows: 6, cols: 6 }),
    words: [
      w("سمك", "حيوان البحر", "across", 0, 0, 1),
      w("موج", "حركة الماء", "down", 0, 1, 2),
      w("حوت", "أكبر البحريات", "across", 3, 0, 3),
    ],
    availableLetters: collectLetters(
      [w("سمك", "", "across", 0, 0, 0), w("موج", "", "down", 0, 0, 0), w("حوت", "", "across", 0, 0, 0)],
      ["سك", "هم"]
    ),
    bonusWords: ["سك", "هم"],
    reward: 100,
    hintCost: 15,
  },
  // ===== الفصل 3: التراث =====
  {
    id: 21,
    chapterId: 3,
    number: 1,
    title: "من التراث",
    difficulty: "medium",
    gridSize: { rows: 6, cols: 6 },
    cells: buildCells([
      w("سيف", "سلاح العرب", "across", 0, 0, 1),
      w("خيمة", "بيت البدوي", "down", 0, 1, 2),
      w("فنجان", "كوب القهوة", "across", 3, 0, 3),
    ], { rows: 6, cols: 6 }),
    words: [
      w("سيف", "سلاح العرب", "across", 0, 0, 1),
      w("خيمة", "بيت البدوي", "down", 0, 1, 2),
      w("فنجان", "كوب القهوة", "across", 3, 0, 3),
    ],
    availableLetters: collectLetters(
      [w("سيف", "", "across", 0, 0, 0), w("خيمة", "", "down", 0, 0, 0), w("فنجان", "", "across", 0, 0, 0)],
      ["سيف", "فن"]
    ),
    bonusWords: ["سيف", "فن"],
    reward: 125,
    hintCost: 20,
  },
  {
    id: 22,
    chapterId: 3,
    number: 2,
    title: "العادات العربية",
    difficulty: "medium",
    gridSize: { rows: 6, cols: 6 },
    cells: buildCells([
      w("ضيف", "زائر", "across", 0, 0, 1),
      w("كرم", "سخاء", "down", 0, 1, 2),
      w("قهوة", "مشروب الضيافة", "across", 3, 0, 3),
    ], { rows: 6, cols: 6 }),
    words: [
      w("ضيف", "زائر", "across", 0, 0, 1),
      w("كرم", "سخاء", "down", 0, 1, 2),
      w("قهوة", "مشروب الضيافة", "across", 3, 0, 3),
    ],
    availableLetters: collectLetters(
      [w("ضيف", "", "across", 0, 0, 0), w("كرم", "", "down", 0, 0, 0), w("قهوة", "", "across", 0, 0, 0)],
      ["فك", "دق"]
    ),
    bonusWords: ["فك", "دق"],
    reward: 125,
    hintCost: 20,
  },
  // ===== الفصل 4: العلوم =====
  {
    id: 31,
    chapterId: 4,
    number: 1,
    title: "مصطلحات علمية",
    difficulty: "hard",
    gridSize: { rows: 6, cols: 6 },
    cells: buildCells([
      w("ذرة", "وحدة المادة", "across", 0, 0, 1),
      w("طاقة", "قوة", "down", 0, 1, 2),
      w("ضوء", "إشعاع مرئي", "across", 3, 0, 3),
    ], { rows: 6, cols: 6 }),
    words: [
      w("ذرة", "وحدة المادة", "across", 0, 0, 1),
      w("طاقة", "قوة", "down", 0, 1, 2),
      w("ضوء", "إشعاع مرئي", "across", 3, 0, 3),
    ],
    availableLetters: collectLetters(
      [w("ذرة", "", "across", 0, 0, 0), w("طاقة", "", "down", 0, 0, 0), w("ضوء", "", "across", 0, 0, 0)],
      ["رطب", "وذ"]
    ),
    bonusWords: ["رطب", "وذ"],
    reward: 150,
    hintCost: 25,
  },
];

export function getLevelsByChapter(chapterId: number): Level[] {
  return levels.filter((l) => l.chapterId === chapterId);
}

export function getLevelById(id: number): Level | undefined {
  return levels.find((l) => l.id === id);
}

export function getAllChapters(): Chapter[] {
  return chapters;
}
