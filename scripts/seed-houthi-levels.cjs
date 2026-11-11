const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const levels = [
  { title: "هدي القرآن", difficulty: "easy", words: [
    { text: "قرآن", clue: "الكتاب الذي يهدي للتي هي أقوم" },
    { text: "هدى", clue: "ضد الضلال، ما يصلح الإنسان" },
    { text: "نور", clue: "كلمة تطلق على القرآن في قوله تعالى" },
    { text: "حق", clue: "ما ثبت ولم يزول، صفة القرآن" },
    { text: "علم", clue: "ما يحصل به الإدراك، زكاه القرآن" },
  ]},
  { title: "معرفة الله", difficulty: "easy", words: [
    { text: "إله", clue: "المعبود بحق" },
    { text: "رب", clue: "الخالق المالك المدبر" },
    { text: "خالق", clue: "من أوجد الأشياء من العدم" },
    { text: "رزاق", clue: "من يُطعم ويُسقي" },
    { text: "ودود", clue: "صفة لله تعنى المحبة" },
  ]},
  { title: "رمضان والقرآن", difficulty: "easy", words: [
    { text: "صوم", clue: "الإمساك عن المفطرات من الفجر للمغرب" },
    { text: "غفران", clue: "ما يطلبه الصائم من الله" },
    { text: "تلاوة", clue: "قراءة القرآن" },
    { text: "قيام", clue: "صلاة الليل في رمضان" },
    { text: "تراويح", clue: "صلاة جماعية في رمضان" },
  ]},
  { title: "الأخلاق الإسلامية", difficulty: "medium", words: [
    { text: "صدق", clue: "الإخبار بالحقيقة كما هي" },
    { text: "أمانة", clue: "حفظ ما يُؤتمن عليه الإنسان" },
    { text: "صبر", clue: "الإمساك عن الجزع في المصيبة" },
    { text: "عدل", clue: "إعطاء كل ذي حق حقه" },
    { text: "حياء", clue: "خلق يمنع من القبيح" },
  ]},
  { title: "العلم والمعرفة", difficulty: "medium", words: [
    { text: "قراءة", clue: "أول ما نزل من القرآن: اقرأ" },
    { text: "قلم", clue: "أداة الكتابة التي أقسم الله بها" },
    { text: "بيان", clue: "ما يُفهم به المراد" },
    { text: "فكر", clue: "إعمال العقل في الشيء" },
    { text: "تدبر", clue: "التأمل العميق في المعاني" },
  ]},
  { title: "القصص القرآني", difficulty: "medium", words: [
    { text: "يوسف", clue: "النبي الذي رُمي في الجب" },
    { text: "نوح", clue: "النبي الذي صنع السفينة" },
    { text: "موسى", clue: "النبي الذي كلمه الله" },
    { text: "إبراهيم", clue: "خليل الله الذي كسر الأصنام" },
    { text: "محمد", clue: "خاتم الأنبياء والمرسلين" },
  ]},
  { title: "الأمة والوحدة", difficulty: "medium", words: [
    { text: "أمة", clue: "جماعة من الناس تجمعهم عقيدة" },
    { text: "وحدة", clue: "اجتماع الكلمة على الحق" },
    { text: "أخوة", clue: "علاقة المؤمنين بعضهم ببعض" },
    { text: "تعاون", clue: "ما أمر الله به في البر والتقوى" },
    { text: "نصرة", clue: "إعانة المظلوم والمستضعف" },
  ]},
  { title: "العدل والقسط", difficulty: "hard", words: [
    { text: "قسط", clue: "العدل في الأقوال والأفعال" },
    { text: "ميزان", clue: "ما يُوزن به العدل" },
    { text: "إنصاف", clue: "إعطاء الناس حقوقهم" },
    { text: "شهادة", clue: "ما يُقضى به بين الناس" },
    { text: "حكم", clue: "القضاء بين الناس بالحق" },
  ]},
  { title: "الجهاد والصمود", difficulty: "hard", words: [
    { text: "صمود", clue: "الثبات في وجه الباطل" },
    { text: "جهاد", clue: "ال effort في سبيل الله" },
    { text: "ثبات", clue: "عدم التزلزل في الموقف" },
    { text: "إباء", clue: "الرفض للظلم والذل" },
    { text: "كرامة", clue: "ما يُصان به الإنسان من الذل" },
  ]},
  { title: "الحضارة الإسلامية", difficulty: "hard", words: [
    { text: "حضارة", clue: "ما يبنيه الإنسان من عمران وعلم" },
    { text: "عمران", clue: "إعمار الأرض بالخير" },
    { text: "إعمار", clue: "ما أمر الله به في الأرض" },
    { text: "إصلاح", clue: "إقامة الحق وإزالة الباطل" },
    { text: "خلافة", clue: "ما استخلف الله به الإنسان في الأرض" },
  ]},
];

async function main() {
  console.log('📚 بدء إضافة المراحل الثقافية...\n');
  let chapter = await prisma.chapter.findFirst({ where: { title: 'البدايات' } });
  if (!chapter) {
    chapter = await prisma.chapter.create({
      data: { title: 'محاضرات ثقافية', description: 'مراحل ثقافية مستوحاة من محاضرات السيد عبدالملك بدرالدين الحوثي', icon: '📚', color: 'oklch(0.78 0.13 80)', order: 1, unlockAt: 0, isPublished: true }
    });
    console.log(`✅ فصل جديد: ${chapter.title} (#${chapter.id})`);
  } else {
    console.log(`📋 فصل موجود: ${chapter.title} (#${chapter.id})`);
  }
  const chapterId = chapter.id;
  const lastLevel = await prisma.level.findFirst({ where: { chapterId }, orderBy: { number: 'desc' } });
  let nextNumber = (lastLevel?.number || 0) + 1;
  for (const lvl of levels) {
    console.log(`📦 ${lvl.title} (${lvl.difficulty}) - #${nextNumber}`);
    const allLetters = lvl.words.flatMap(w => w.text.split(''));
    const uniqueLetters = [...new Set(allLetters)];
    const level = await prisma.level.create({
      data: { chapterId, number: nextNumber, title: lvl.title, difficulty: lvl.difficulty, gameMode: 'crossword', puzzleType: 'text', timeLimit: 0, gridSizeRows: 8, gridSizeCols: 8, availableLetters: uniqueLetters.join(','), bonusWords: '', reward: 50, hintCost: 10, status: 'published', isPublished: true }
    });
    let wordNumber = 1; let currentRow = 0; let currentCol = 0;
    for (const w of lvl.words) {
      await prisma.word.create({
        data: { levelId: level.id, text: w.text, clue: w.clue, category: 'معرفة', direction: wordNumber % 2 === 0 ? 'down' : 'across', startRow: currentRow, startCol: currentCol, number: wordNumber }
      });
      for (let i = 0; i < w.text.length; i++) {
        const row = wordNumber % 2 === 0 ? currentRow + i : currentRow;
        const col = wordNumber % 2 === 0 ? currentCol : currentCol + i;
        await prisma.cell.create({ data: { levelId: level.id, row, col, letter: w.text[i], number: i === 0 ? wordNumber : null } });
      }
      if (wordNumber % 2 === 0) { currentCol += 2; } else { currentRow += 2; }
      wordNumber++;
    }
    console.log(`   ✅ ${lvl.words.length} كلمة + ${lvl.words.length * 3} خلايا`);
    nextNumber++;
  }
  console.log(`\n🎉 تم! ${levels.length} مراحل، ${levels.length * 5} سؤال`);
  await prisma.$disconnect();
}
main().catch(e => { console.error('❌', e); process.exit(1); });
