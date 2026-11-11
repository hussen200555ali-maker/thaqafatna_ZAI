// اختبار منطق normalizeLevelCells (مستخرج من PWA)
const normalizeLevelCells = (level) => {
  if (!level) return level;
  if (Array.isArray(level.cells) && level.cells.length > 0 && Array.isArray(level.cells[0])) {
    return level;
  }
  if (Array.isArray(level.cells) && level.cells.length > 0 && level.cells[0] && typeof level.cells[0] === 'object' && 'row' in level.cells[0]) {
    const flat = level.cells;
    let maxRow = 0, maxCol = 0;
    for (const c of flat) {
      if (c.row > maxRow) maxRow = c.row;
      if (c.col > maxCol) maxCol = c.col;
    }
    const rows = maxRow + 1;
    const cols = maxCol + 1;
    const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));
    for (const c of flat) {
      grid[c.row][c.col] = {
        letter: c.letter || '',
        num: c.number || null,
      };
    }
    level.cells = grid;
    level.rows = rows;
    level.cols = cols;
  }
  if ((!level.cells || !Array.isArray(level.cells) || level.cells.length === 0)) {
    level.rows = level.rows || level.gridSizeRows || 0;
    level.cols = level.cols || level.gridSizeCols || 0;
  } else {
    level.rows = level.rows || level.gridSizeRows || (Array.isArray(level.cells) ? level.cells.length : 0);
    level.cols = level.cols || level.gridSizeCols || (Array.isArray(level.cells) && level.cells[0] ? level.cells[0].length : 0);
  }
  if (Array.isArray(level.words)) {
    level.words = level.words.map((w) => ({
      ...w,
      word: w.word || w.text || '',
      num: w.num || w.number || null,
    }));
  }
  return level;
};

console.log('=== اختبار 1: المستوى 1 من الـ API (أول كلمة) ===');
const level1 = {
  id: 1,
  title: 'أول كلمة',
  gridSizeRows: 5,
  gridSizeCols: 5,
  cells: [
    { row: 0, col: 2, letter: 'ل', number: 2 },
    { row: 1, col: 2, letter: 'و', number: null },
    { row: 2, col: 0, letter: 'ك', number: 1 },
    { row: 2, col: 1, letter: 'ت', number: null },
    { row: 2, col: 2, letter: 'ا', number: null },
    { row: 2, col: 3, letter: 'ب', number: null },
    { row: 2, col: 4, letter: '', number: null },
    { row: 3, col: 2, letter: 'ن', number: null },
  ],
  words: [
    { text: 'كتاب', clue: 'مصدر المعرفة', direction: 'across', number: 1 },
    { text: 'لون', clue: 'صفة الشيء', direction: 'down', number: 2 },
  ],
};
const result1 = normalizeLevelCells(JSON.parse(JSON.stringify(level1)));
console.log('  rows:', result1.rows, '(expected 4)');
console.log('  cols:', result1.cols, '(expected 5)');
console.log('  cells[0]:', JSON.stringify(result1.cells[0]));
console.log('  cells[2]:', JSON.stringify(result1.cells[2]));
console.log('  cells[2][0]:', JSON.stringify(result1.cells[2][0]), '(should have letter=ك and num=1)');
console.log('  words[0].word:', result1.words[0].word, '(expected كتاب)');
console.log('  words[0].num:', result1.words[0].num, '(expected 1)');
console.log('  words[1].word:', result1.words[1].word, '(expected لون)');
console.log('  words[1].num:', result1.words[1].num, '(expected 2)');

console.log('\n=== اختبار renderCrosswordCells محاكاة ===');
let html = '';
const cells = result1.cells;
for (let r = 0; r < cells.length; r++) {
  const row = cells[r] || [];
  for (let c = 0; c < row.length; c++) {
    const cell = row[c];
    if (!cell || cell === null) {
      html += '[#]'; // blocked
    } else {
      html += `[${cell.letter || '_'}${cell.num ? '(' + cell.num + ')' : ''}]`;
    }
  }
  html += '\n';
}
console.log(html);

console.log('\n=== اختبار 2: مستوى فارغ (لا خلايا) ===');
const emptyLevel = {
  id: 99,
  title: 'فارغ',
  gridSizeRows: 3,
  gridSizeCols: 3,
  cells: [],
  words: [],
};
const result2 = normalizeLevelCells(JSON.parse(JSON.stringify(emptyLevel)));
console.log('  rows:', result2.rows, '(expected 3)');
console.log('  cols:', result2.cols, '(expected 3)');
console.log('  cells.length:', result2.cells.length);

console.log('\n=== اختبار 3: مستوى بشبكة ثنائية بالفعل (FALLBACK) ===');
const fbLevel = {
  cells: [[{ letter: 'ك', num: 1 }, { letter: 'ت' }, { letter: 'ا' }, { letter: 'ب' }]],
  rows: 1,
  cols: 4,
  words: [{ word: 'كتاب', num: 1, direction: 'across', clue: 'مصدر المعرفة' }],
};
const result3 = normalizeLevelCells(JSON.parse(JSON.stringify(fbLevel)));
console.log('  rows:', result3.rows, '(expected 1, unchanged)');
console.log('  cols:', result3.cols, '(expected 4, unchanged)');
console.log('  cells unchanged?', JSON.stringify(result3.cells) === JSON.stringify(fbLevel.cells));
console.log('  words[0].word preserved:', result3.words[0].word, '(expected كتاب)');
