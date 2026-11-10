/**
 * بذور كتب إضافية (10 كتب جديدة)
 * يضيف كتباً من تراثنا العربي لمختلف التصنيفات
 */

import { db } from "../src/lib/db";

const additionalBooks = [
  {
    title: "حي بن يقظان",
    author: "ابن طفيل",
    description: "رواية فلسفية تتناول قصة طفل نشأ على جزيرة منعزل، وتوصّل بالعقل وحده إلى معرفة الله والكون. من أعظم ما كُتب في الفلسفة الإسلامية.",
    categorySlug: "literature",
    difficulty: "medium",
    readingTimeMin: 75,
    keywords: ["فلسفة", "رواية", "تصوّف", "عقل"],
    isFeatured: false,
    chapters: [
      { title: "نشأة حي بن يقظان", content: "<p>حي بن يقظان طفل وُلد على جزيرة نائية، نشأ بلا أبوين. ربّته ظبيةٌ حتى كبر. بدأ يتأمّل الطبيعة من حوله: الماء، النار، الهواء، الأرض.</p><p>تدرّج في المعرفة من المحسوس إلى المعقول، ومن المخلوق إلى الخالق.</p>", readingTimeMin: 15 },
      { title: "رحلة المعرفة", content: "<p>لمّا كبر حي بن يقظان، بدأ يتفكّر في نفسه وفي الكون. اكتشف أن الجسد أداة للروح، وأن المعرفة الحقيقية تأتي بالتأمّل لا بالحواس وحدها.</p><p>توصّل إلى وحدة الوجود وأن كل شيء من الله وإليه يعود.</p>", readingTimeMin: 20 },
    ],
  },
  {
    title: "رسالة الغفران",
    author: "أبو العلاء المعري",
    description: "رحلة خيالية إلى الجنة والنار، يلتقي فيها البطل بشعراء وأدباء عرب. عمل أدبي فريد يمزج بين السخرية والحكمة والفلسفة.",
    categorySlug: "literature",
    difficulty: "hard",
    readingTimeMin: 100,
    keywords: ["أدب", "رحلة", "جنة", "شعراء"],
    isFeatured: false,
    chapters: [
      { title: "الرحلة إلى الآخرة", content: "<p>يبدأ البطل رحلته من دار الدنيا إلى دار الآخرة. يمرّ بمنازل البرزخ، ثم يدخل الجنة حيث يلتقي بشعراء وأدباء عرب غفر الله لهم.</p><p>يلتقي بالحطيئة، والنابغة، وامرئ القيس، وغيرهم.</p>", readingTimeMin: 25 },
      { title: "في الجنة", content: "<p>يصف أبو العلاء لقاءاته في الجنة. يلتقي بشعراء كان يختلف معهم في الدنيا، لكنّه يصافحهم هنا ويتجاوز الخلافات.</p><p>يستعرض آراءهم في الشعر والحياة.</p>", readingTimeMin: 25 },
    ],
  },
  {
    title: "مقامات الحريري",
    author: "الحريري",
    description: "مجموعة مقامات بديعية بأسلوب بليغ، تحكي مغامرات أبي زيد السروجي. تُعدّ ذروة فن المقامات في الأدب العربي.",
    categorySlug: "literature",
    difficulty: "hard",
    readingTimeMin: 90,
    keywords: ["مقامات", "أدب", "بلاغة", "سخرية"],
    isFeatured: false,
    chapters: [
      { title: "المقامة الأولى: المقامة المدنية", content: "<p>تبدأ مقامات الحريري بوصف الراوي الحارث بن همام وهو يلتقي بأبي زيد السروجي في مجلس من مجالس العلم. يصف بلاغة أبي زيد وفصاحته وحيله في استعطاف الناس.</p>", readingTimeMin: 20 },
      { title: "المقامة الثانية: المقامة الأصفهانية", content: "<p>يستمر الراوي في وصف مغامرات أبي زيد. في هذه المقامة، يظهر أبو زيد في أصفهان يحتال على أهلها ببلاغته وفصاحته.</p>", readingTimeMin: 20 },
    ],
  },
  {
    title: "رياض الصالحين",
    author: "الإمام النووي",
    description: "مجموعة أحاديث نبوية منتقاة في الأداب والأخلاق والعبادات. من أكثر الكتب الدينية انتشاراً بين المسلمين.",
    categorySlug: "religion",
    difficulty: "easy",
    readingTimeMin: 60,
    keywords: ["حديث", "أخلاق", "أدب", "دين"],
    isFeatured: true,
    chapters: [
      { title: "باب الإخلاص والنية", content: "<p>يقول النبي صلى الله عليه وسلم: «إنما الأعمال بالنيات، وإنما لكل امرئ ما نوى».</p><p>هذا الحديث أصل عظيم في الإسلام، فالإخلاص أساس قبول العمل.</p>", readingTimeMin: 10 },
      { title: "باب الصدق", content: "<p>يقول النبي: «عليكم بالصدق، فإن الصدق يهدي إلى البر، وإن البر يهدي إلى الجنة».</p><p>الصدق من أعظم الأخلاق، وهو صفة الأنبياء والصالحين.</p>", readingTimeMin: 10 },
      { title: "باب بر الوالدين", content: "<p>يقول الله تعالى: «وقضى ربك ألا تعبدوا إلا إياه وبالوالدين إحساناً».</p><p>بر الوالدين من أعظم الواجبات في الإسلام، وقد قرنه الله بالتوحيد.</p>", readingTimeMin: 12 },
    ],
  },
  {
    title: "تفسير ابن كثير (مختارات)",
    author: "ابن كثير",
    description: "مختارات من تفسير القرآن العظيم لابن كثير، أحد أهم كتب التفسير المعتمدة في الإسلام. يفسّر الآيات بالأحاديث وأقوال الصحابة.",
    categorySlug: "religion",
    difficulty: "medium",
    readingTimeMin: 80,
    keywords: ["تفسير", "قرآن", "دين", "علوم"],
    isFeatured: false,
    chapters: [
      { title: "تفسير سورة الفاتحة", content: "<p>سورة الفاتحة أم الكتاب، فيها سبع آيات. يقول ابن كثير: هي أعظم سورة في القرآن، تشتمل على حمد الله وثناء عليه وطلب الهداية.</p>", readingTimeMin: 20 },
      { title: "تفسير آية الكرسي", content: "<p>آية الكرسي أعظم آية في القرآن. يقول ابن كثير: فيها أسماء الله الحسنى وصفاته العظيمة. من قرأها لم يقربه شيطان.</p>", readingTimeMin: 20 },
    ],
  },
  {
    title: "سيرة ابن هشام (مختارات)",
    author: "عبد الملك بن هشام",
    description: "مختارات من السيرة النبوية لابن هشام، أهم مصدر لسيرة النبي محمد صلى الله عليه وسلم. تصف حياته من الميلاد إلى الوفاة.",
    categorySlug: "religion",
    difficulty: "medium",
    readingTimeMin: 70,
    keywords: ["سيرة", "نبي", "تاريخ", "إسلام"],
    isFeatured: false,
    chapters: [
      { title: "مولد النبي ونشأته", content: "<p>وُلد النبي محمد صلى الله عليه وسلم في مكة عام الفيل. نشأ يتيماً، كفله جده عبد المطلب ثم عمه أبو طالب. عُرف بالصادق الأمين بين قومه.</p>", readingTimeMin: 15 },
      { title: "البعثة والدعوة", content: "<p>لمّا بلغ الأربعين، نزل عليه جبريل في غار حراء. بدأ الدعوة سراً ثم جهراً. لقي أذى قريش وصبر، ثم هاجر إلى المدينة.</p>", readingTimeMin: 20 },
    ],
  },
  {
    title: "وفيات الأعيان (مختارات)",
    author: "ابن خلكان",
    description: "مختارات من موسوعة وفيات الأعيان، تراجم لأشهر الشخصيات العربية والإسلامية. من أهم كتب التراجم في التراث العربي.",
    categorySlug: "history",
    difficulty: "medium",
    readingTimeMin: 65,
    keywords: ["تراجم", "تاريخ", "أعلام", "وفيات"],
    isFeatured: false,
    chapters: [
      { title: "ترجمة المتنبي", content: "<p>أبو الطيب المتنبي، أشهر شعراء العرب. وُلد بالكوفة، تنقّل بين بلاطات الأمراء. قتله فاتك الأسدي وهو عائد من مصر.</p>", readingTimeMin: 15 },
      { title: "ترجمة الجاحظ", content: "<p>أبو عثمان الجاحظ، أديب عربي شهير. صاحب كتب البخلاء والبيان والتبيين والحيوان. عُرف ببلاغته وفصاحته.</p>", readingTimeMin: 15 },
    ],
  },
  {
    title: "معجم الأدباء (مختارات)",
    author: "ياقوت الحموي",
    description: "مختارات من معجم الأدباء، موسوعة تراجم الأدباء العرب عبر العصور. من أهم المراجع في تاريخ الأدب العربي.",
    categorySlug: "history",
    difficulty: "hard",
    readingTimeMin: 55,
    keywords: ["أدب", "تراجم", "معجم", "أعلام"],
    isFeatured: false,
    chapters: [
      { title: "أدباء العصر الأموي", content: "<p>ازدهر الأدب في العصر الأموي. من أبرز أدبائه: الأخطل، والفرزدق، وجرير، والأحنف بن قيس. تنافسوا في الشعر والخطابة.</p>", readingTimeMin: 15 },
      { title: "أدباء العصر العباسي", content: "<p>العصر العباسي هو العصر الذهبي للأدب العربي. ظهر فيه: الجاحظ، وأبو تمام، والبحتري، والمتنبي، وأبو العلاء المعري.</p>", readingTimeMin: 15 },
    ],
  },
  {
    title: "حكايات جدتي",
    author: "تراث شعبي",
    description: "مجموعة من الحكايات الشعبية العربية التي ترويها الجدات للأحفاد. قصص ممتعة تحمل حكماً وقيمًا تربوية.",
    categorySlug: "children",
    difficulty: "easy",
    readingTimeMin: 40,
    keywords: ["قصص", "أطفال", "حكايات", "تراث"],
    isFeatured: true,
    chapters: [
      { title: "الجنية والحطّاب", content: "<p>كان هناك حطّاب فقير يقطع الحطب في الغابة. وجد يوماً جنّيةً محبوسة في قمقم. أطلقها فشكرته ومنحته ثلاث أمنيات.</p><p><strong>الحكمة:</strong> الإحسان يُجازى بالإحسان.</p>", readingTimeMin: 10 },
      { title: "الولد والذئب", content: "<p>كان ولدٌ يرعى الغنم. كذب على أهل القرية مرّتين قائلاً: الذئب! الذئب! في المرة الثالثة جاء الذئب حقاً، فلم يصدّقه أحد. أكل الذئب غنمه.</p><p><strong>الحكمة:</strong> الكذّاب لا يُصدّق ولو قال صدقاً.</p>", readingTimeMin: 8 },
      { title: "الأرنب والسلحفاة", content: "<p>تبارى الأرنب والسلحفاة في سباق. كان الأرنب سريعاً فتكبّر ونام. أمّا السلحفاة فمضت بثبات حتى سبقت الأرنب.</p><p><strong>الحكمة:</strong> في الإبطاء مع الثبات خيرٌ من السرعة مع الكسل.</p>", readingTimeMin: 8 },
    ],
  },
  {
    title: "موسوعة الحيوانات للأطفال",
    author: "فريق ثقافتنا",
    description: "كتاب تعليمي مصوّر للأطفال، يعرّفهم على عالم الحيوانات: الأسد، الفيل، الجمل، النعامة، والصقر. مع معلومات شيّقة ومبسّطة.",
    categorySlug: "children",
    difficulty: "easy",
    readingTimeMin: 35,
    keywords: ["حيوانات", "أطفال", "علوم", "تعليم"],
    isFeatured: false,
    chapters: [
      { title: "ملك الغابة: الأسد", content: "<p>الأسد ملك الغابة. ذكره له لبدة كثيفة. يعيش في قطعان. صوته قوي يُسمع من بعيد. يصطاد بالليل.</p><p>هل تعلم؟ الأسد ينام 20 ساعة في اليوم!</p>", readingTimeMin: 8 },
      { title: "سفينة الصحراء: الجمل", content: "<p>الجمل سفينة الصحراء. يتحمّل العطش أياماً. سنامه يخزّن الدهن لا الماء. له خفّان كبيران يمنعانه من الغوص في الرمل.</p><p>هل تعلم؟ الجمل يغلق منخريه في العواصف!</p>", readingTimeMin: 8 },
      { title: "ملك السماء: الصقر", content: "<p>الصقر ملك السماء. يرى فريسته من بعيد. سرعته تفوق 300 كم/ساعة عند الانقضاض. العرب كانوا يصيدون به.</p><p>هل تعلم؟ الصقر يرى 8 مرات أكثر من الإنسان!</p>", readingTimeMin: 8 },
    ],
  },
];

async function main() {
  console.log("📚 بدء زرع كتب إضافية...\n");

  for (const book of additionalBooks) {
    const category = await db.bookCategory.findUnique({
      where: { slug: book.categorySlug },
    });
    if (!category) {
      console.warn(`  ⚠️ التصنيف غير موجود: ${book.categorySlug}`);
      continue;
    }

    const existing = await db.book.findFirst({
      where: { title: book.title },
      select: { id: true },
    });
    if (existing) {
      console.log(`  ⏭️  "${book.title}" — موجود`);
      continue;
    }

    const created = await db.book.create({
      data: {
        categoryId: category.id,
        title: book.title,
        author: book.author,
        description: book.description,
        contentType: "text",
        difficulty: book.difficulty,
        readingTimeMin: book.readingTimeMin,
        keywords: JSON.stringify(book.keywords),
        isFeatured: book.isFeatured || false,
        isPublished: true,
      },
    });

    for (let i = 0; i < book.chapters.length; i++) {
      await db.bookChapter.create({
        data: {
          bookId: created.id,
          number: i + 1,
          title: book.chapters[i].title,
          content: book.chapters[i].content,
          readingTimeMin: book.chapters[i].readingTimeMin,
          isFree: true,
          isPublished: true,
        },
      });
    }
    console.log(`  ✅ 📕 "${book.title}" — ${book.author} (${book.chapters.length} فصول)`);
  }

  const total = await db.book.count();
  const chapters = await db.bookChapter.count();
  console.log(`\n✅ الإجمالي: ${total} كتاب، ${chapters} فصل`);
  await db.$disconnect();
}

main().catch(console.error);
