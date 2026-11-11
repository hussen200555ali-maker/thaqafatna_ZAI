#!/usr/bin/env python3
"""
إصلاح خلل عرض الكلمات المتقاطعة في تطبيق PWA.

المشاكل الثلاث:
1. الـ API يرجع level.cells كمصفوفة مسطحة [{row,col,letter,number}, ...]
   لكن PWA يتوقع مصفوفة ثنائية [[cell|null, ...], ...]
2. PWA يستخدم level.rows / level.cols لكن الـ API يرجع gridSizeRows / gridSizeCols
3. PWA يستخدم w.word لكن الـ API يرجع w.text
4. PWA يستخدم w.num لكن الـ API يرجع w.number
"""
import re
import sys
from pathlib import Path

FILE = Path("/home/z/my-project/download/thaqafatna-app/index.html")
content = FILE.read_text(encoding="utf-8")

# ============ الإصلاح 1: إضافة دالة normalizeLevelCells لتحويل المصفوفة المسطحة إلى ثنائية ============
# نضع الدالة قبل renderLevelDetail

# ابحث عن بداية renderLevelDetail
old_block_1 = """        async renderLevelDetail(levelId, chapterId) {
          const modal = document.getElementById('bookModal');
          const content = document.getElementById('bookModalContent');
          modal.classList.add('active');
          document.body.classList.add('no-scroll');

          content.innerHTML = `<div class="loader-block" style="padding:60px 20px;"><div class="spinner spinner-lg"></div><span>جاري تحميل المرحلة...</span></div>`;
"""

new_block_1 = """        // تحويل خلايا المرحلة من صيغة المسطحة (flat) التي يرجعها الـ API
        // [{row, col, letter, number}, ...] إلى صيغة الشبكة ثنائية الأبعاد
        // [[cell|null, cell|null, ...], ...] التي تتوقعها دالة renderCrosswordCells.
        normalizeLevelCells(level) {
          if (!level) return level;
          // إن كان level.cells بالفعل مصفوفة ثنائية الأبعاد (كل عنصر مصفوفة)، أعده كما هو
          if (Array.isArray(level.cells) && level.cells.length > 0 && Array.isArray(level.cells[0])) {
            return level;
          }
          // إن كانت الخلايا مصفوفة مسطحة (كائنات لها row/col/letter/number) حوّلها إلى شبكة
          if (Array.isArray(level.cells) && level.cells.length > 0 && level.cells[0] && typeof level.cells[0] === 'object' && 'row' in level.cells[0]) {
            const flat = level.cells;
            // أوجد أقصى صف وعمود
            let maxRow = 0, maxCol = 0;
            for (const c of flat) {
              if (c.row > maxRow) maxRow = c.row;
              if (c.col > maxCol) maxCol = c.col;
            }
            const rows = maxRow + 1;
            const cols = maxCol + 1;
            // أنشئ شبكة فارغة
            const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));
            // املأ الخلايا
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
          // إن لم توجد خلايا، استخدم gridSizeRows / gridSizeCols من الـ API
          if ((!level.cells || !Array.isArray(level.cells) || level.cells.length === 0)) {
            level.rows = level.rows || level.gridSizeRows || 0;
            level.cols = level.cols || level.gridSizeCols || 0;
          } else {
            level.rows = level.rows || level.gridSizeRows || (Array.isArray(level.cells) ? level.cells.length : 0);
            level.cols = level.cols || level.gridSizeCols || (Array.isArray(level.cells) && level.cells[0] ? level.cells[0].length : 0);
          }
          // طبيع الكلمات: الـ API يرجع {text, number, direction, ...} لكن الكود يستخدم {word, num}
          if (Array.isArray(level.words)) {
            level.words = level.words.map((w) => ({
              ...w,
              word: w.word || w.text || '',
              num: w.num || w.number || null,
            }));
          }
          return level;
        },

        async renderLevelDetail(levelId, chapterId) {
          const modal = document.getElementById('bookModal');
          const content = document.getElementById('bookModalContent');
          modal.classList.add('active');
          document.body.classList.add('no-scroll');

          content.innerHTML = `<div class="loader-block" style="padding:60px 20px;"><div class="spinner spinner-lg"></div><span>جاري تحميل المرحلة...</span></div>`;
"""

if old_block_1 in content:
    content = content.replace(old_block_1, new_block_1, 1)
    print("[✓] الإصلاح 1: أُضيفت دالة normalizeLevelCells قبل renderLevelDetail")
else:
    print("[✗] الإصلاح 1: لم يُعثر على بداية renderLevelDetail — تحقّق من النص")
    sys.exit(1)


# ============ الإصلاح 2: استدعاء normalizeLevelCells قبل renderCrossword ============
# ابحث عن الكتلة التي تتحقق من الخلايا وتستدعي renderCrossword
old_block_2 = """          // إذا لم توجد بيانات شبكة في المرحلة، استخدم البيانات المحلية (احتياطية)
          if (!level.cells || !Array.isArray(level.cells) || level.cells.length === 0) {
            const fbLevel = this.findFallbackLevel(levelId);
            if (fbLevel) {
              level = { ...fbLevel, ...level };
              level.cells = fbLevel.cells;
              level.words = fbLevel.words;
              level.rows = fbLevel.rows;
              level.cols = fbLevel.cols;
            } else {
              // توليد شبكة بسيطة من كلمة واحدة افتراضية
              level.cells = [[{ letter: '?' }]];
              level.rows = 1;
              level.cols = 1;
              level.words = [];
            }
          }

          this.renderCrossword(level, chapter);
        },
"""

new_block_2 = """          // طبيع خلايا المرحلة (حوّل المصفوفة المسطحة من الـ API إلى شبكة ثنائية)
          level = this.normalizeLevelCells(level);

          // إذا لم توجد بيانات شبكة في المرحلة، استخدم البيانات المحلية (احتياطية)
          if (!level.cells || !Array.isArray(level.cells) || level.cells.length === 0
              || (Array.isArray(level.cells) && level.cells.length > 0 && !Array.isArray(level.cells[0]))) {
            const fbLevel = this.findFallbackLevel(levelId);
            if (fbLevel) {
              level = { ...fbLevel, ...level };
              level.cells = fbLevel.cells;
              level.words = fbLevel.words;
              level.rows = fbLevel.rows;
              level.cols = fbLevel.cols;
            } else if (!level.cells || !Array.isArray(level.cells) || level.cells.length === 0) {
              // توليد شبكة بسيطة من كلمة واحدة افتراضية
              level.cells = [[{ letter: '?' }]];
              level.rows = 1;
              level.cols = 1;
              level.words = level.words || [];
            }
          }

          this.renderCrossword(level, chapter);
        },
"""

if old_block_2 in content:
    content = content.replace(old_block_2, new_block_2, 1)
    print("[✓] الإصلاح 2: استدعاء normalizeLevelCells قبل renderCrossword")
else:
    print("[✗] الإصلاح 2: لم يُعثر على كتلة التحقق من الخلايا")
    sys.exit(1)


# ============ الإصلاح 3: استخدام gridSizeRows/gridSizeCols في renderCrossword ============
old_block_3 = """          const rows = level.rows || (level.cells ? level.cells.length : 0);
          const cols = level.cols || (level.cells && level.cells[0] ? level.cells[0].length : 0);
"""

new_block_3 = """          // استخدم rows/cols من البيانات الطبيعية (normalizeLevelCells عيّنها)
          // وإلا فاستخدم gridSizeRows/gridSizeCols من الـ API
          const rows = level.rows || level.gridSizeRows || (level.cells ? level.cells.length : 0);
          const cols = level.cols || level.gridSizeCols || (level.cells && level.cells[0] ? level.cells[0].length : 0);
"""

if old_block_3 in content:
    content = content.replace(old_block_3, new_block_3, 1)
    print("[✓] الإصلاح 3: استخدام gridSizeRows/gridSizeCols كاحتياط")
else:
    print("[✗] الإصلاح 3: لم يُعثر على كتلة rows/cols")
    sys.exit(1)


# حفظ الملف
FILE.write_text(content, encoding="utf-8")
print(f"\n[✓] تم حفظ الملف: {FILE}")
print(f"[✓] الحجم الجديد: {len(content)} bytes / {content.count(chr(10))} سطر")
