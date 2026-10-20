/**
 * بذور كتب إضافية (15 كتاب جديد)
 * تنوّع المحتوى وتوسيع المكتبة
 */

import { db } from "../src/lib/db";

const newBooks = [
  {
    title: "الحيوان (مختارات)",
    author: "الجاحظ",
    description: "موسوعة علمية وأدبية من العصر العباسي، يصف فيها الجاحظ أنواع الحيوانات وأحوالها بأسلوب أدبي ممتع وعلمي دقيق.",
    categorySlug: "science", difficulty: "hard", readingTimeMin: 80, keywords: ["حيوانات", "علم", "أدب", "طبيعة"], isFeatured: false,
    chapters: [
      { title: "البعير سفينة الصحراء", content: "<p>البعير من أعجب الحيوانات خلقاً. يتحمّل العطش أياماً ويسير في الصحراء بأثقال لا يحملها غيره.</p><p>يقول الجاحظ: «البعير أشدّ الحيوان صبراً على الجوع والعطش، وأقواها على حمل الأثقال».</p>", readingTimeMin: 15 },
      { title: "النحل والحكمة", content: "<p>النحل حشرة عجيبة. تبني بيوتها سداسية الأضلاع بأ精准 هندسي عجيب. تأكل من كل الثمرات فتخرج عسلاً شافياً للناس.</p><p>قال الجاحظ: «النحل أذكى الحشرات، تعرف مراعي الأزهار وتعود إلى خلاياها بأقصر طريق».</p>", readingTimeMin: 12 },
    ],
  },
  {
    title: "الإشارة إلى من نال الوزارة",
    author: "ابن بقاق",
    description: "كتاب تاريخي يتناول تاريخ الوزراء في الدولة العباسية وأخبارهم وأحوالهم.",
    categorySlug: "history", difficulty: "hard", readingTimeMin: 55, keywords: ["تاريخ", "عباسي", "وزراء", "دولة"], isFeatured: false,
    chapters: [
      { title: "أول وزير في الإسلام", content: "<p>أول من لُقّب بالوزير في الإسلام كان أبو سلمة حفص بن سليمان الخلّال، في عهد العباسيين. كان يُسمّى «وزير آل محمد».</p>", readingTimeMin: 15 },
      { title: "خيانة أبي سلمة", content: "<p>لمّا استقرّت الدولة العباسية، أراد أبو سلمة أن ينقل البيعة لآل علي. فأرسل أبو مسلم الخراساني من قتله بأمر من الخليفة.</p>", readingTimeMin: 12 },
    ],
  },
  {
    title: "العقد الفريد (مختارات)",
    author: "ابن عبد ربه الأندلسي",
    description: "موسوعة أدبية أندلسية، تجمع بين الشعر والنثر والحكم والأخبار. من أعظم كتب الأدب العربي في الأندلس.",
    categorySlug: "literature", difficulty: "medium", readingTimeMin: 70, keywords: ["أدب", "أندلس", "شعر", "حكم"], isFeatured: true,
    chapters: [
      { title: "الباب الأول: في السلطان", content: "<p>يقول ابن عبد ربه: «الملك عزّ لا يثبت إلا بالعدل، والعدل لا يثبت إلا بملك عزيز».</p><p>يصف في هذا الباب صفات الحاكم العادل وأخلاقه وواجباته نحو رعيته.</p>", readingTimeMin: 15 },
      { title: "الباب الثاني: في الأدب", content: "<p>الأدب عند العرب هو حسن المعاشرة ولطف المحاورة. قالوا: «الأدب خُلق يُزين صاحبه في عين الناس».</p>", readingTimeMin: 12 },
      { title: "الباب الثالث: في الحكم والأمثال", content: "<p>من أجود ما جمع ابن عبد ربه من حكم: «من أراد أن ينام قرير العين، فلا ينم إلا وذمّته بريئة».</p>", readingTimeMin: 10 },
    ],
  },
  {
    title: "تاج العروس (مختارات)",
    author: "الزبيدي",
    description: "أكبر معجم عربي في اللغة، شرح فيه الزبيدي قاموس القاموس المحيط. من أهم مراجع اللغة العربية.",
    categorySlug: "literature", difficulty: "hard", readingTimeMin: 50, keywords: ["لغة", "معجم", "قاموس", "عربية"], isFeatured: false,
    chapters: [
      { title: "مقدمة المعجم", content: "<p>تاج العروس من جواهر القاموس، ألّفه محمد مرتضى الزبيدي. هو شرح لقاموس الفيروزآبادي. يُعدّ من أضخم المعاجم العربية.</p>", readingTimeMin: 10 },
      { title: "أصول اللغة العربية", content: "<p>اللغة العربية أوسع اللغات مفردات. يقول الزبيدي: «لا تُحصى كلمات العربية لكثرتها، فلكل شيء اسم ولكل حالة وصف».</p>", readingTimeMin: 15 },
    ],
  },
  {
    title: "الأمالي (مختارات)",
    author: "أبو علي القالي",
    description: "كتاب أدبي لغوي، يجمع فيه القالي ما أملاه على تلاميذه من شعر ونثر وأخبار ولغة. من كتب التراث المهمة.",
    categorySlug: "literature", difficulty: "medium", readingTimeMin: 60, keywords: ["أدب", "لغة", "تراث", "شعر"], isFeatured: false,
    chapters: [
      { title: "في غريب اللغة", content: "<p>يذكر القالي في أماليه كلمات غريبة من لغة العرب. منها قولهم: «أبلس» أي سكت متحيراً، ومنها «أكِنّ» أي أغار.</p>", readingTimeMin: 15 },
      { title: "في أشعار العرب", content: "<p>يروي القالي أشعاراً نادرة للشعراء العرب. منها قول امرئ القيس: «قفا نبك من ذكرى حبيب ومنزلِ» — أول معلّقة في الجاهلية.</p>", readingTimeMin: 15 },
    ],
  },
  {
    title: "فقه اللغة (مختارات)",
    author: "الثعالبي",
    description: "كتاب في خصائص اللغة العربية وأسرارها وبلاغتها. يكشف عن جمال العربية وعمقها.",
    categorySlug: "literature", difficulty: "medium", readingTimeMin: 45, keywords: ["لغة", "بلاغة", "فقه", "عربية"], isFeatured: false,
    chapters: [
      { title: "في فضل العربية", content: "<p>يقول الثعالبي: «اللغة العربية أفصح اللغات وأوسعها. فيها من المفردات ما لا يُحصى، ولكل معنى عدة ألفاظ».</p>", readingTimeMin: 10 },
      { title: "في أسرار البلاغة", content: "<p>البلاغة هي مطابقة الكلام لمقتضى الحال. قالوا: «أبلغ الكلام ما قلّ ودلّ ولم يطلل».</p>", readingTimeMin: 12 },
    ],
  },
  {
    title: "محاضرات الأدباء (مختارات)",
    author: "الراغب الأصفهاني",
    description: "موسوعة أدبية تجمع بين الحكمة والأدب والتاريخ. ينقل فيها مؤلفها أجمل ما قاله العرب في مختلف الموضوعات.",
    categorySlug: "literature", difficulty: "medium", readingTimeMin: 65, keywords: ["أدب", "حكمة", "مواعظ", "أخبار"], isFeatured: false,
    chapters: [
      { title: "في العقل وفضله", content: "<p>العقل هو ما يميّز الإنسان عن الحيوان. قال علي بن أبي طالب: «لا غنى كالعقل، ولا فقر كالجهل».</p>", readingTimeMin: 15 },
      { title: "في الصداقة", content: "<p>الصديق الحقيقي من صدقك لا من صدّقك. قالوا: «الصديق وقت الضيق»، و«من ذاق عرف، ومن عرف غرف».</p>", readingTimeMin: 12 },
    ],
  },
  {
    title: "البيان والتبيين (مختارات)",
    author: "الجاحظ",
    description: "أعظم كتاب في البلاغة العربية. يبحث فيه الجاحظ في أسرار البيان والفصاحة والبلاغة عند العرب.",
    categorySlug: "literature", difficulty: "hard", readingTimeMin: 75, keywords: ["بلاغة", "بيان", "فصاحة", "أدب"], isFeatured: true,
    chapters: [
      { title: "في فضل البيان", content: "<p>البيان هو الإيضاح والإظهار. يقول الجاحظ: «البيان طبقة عن المعنى، ومرتبة فوق المرتبة».</p><p>البيان يكون باللسان واليد والإشارة. وأبلغها البيان باللسان.</p>", readingTimeMin: 15 },
      { title: "في الفصاحة", content: "<p>الفصاحة هي الظهور والوضوح. الفصيح من العرب هو من يتكلم بسلاسة ووضوح بلا تكلف.</p>", readingTimeMin: 15 },
    ],
  },
  {
    title: "التمثيل والمحاضرة (مختارات)",
    author: "الثعالبي",
    description: "كتاب في الأمثال العربية والحكم القصيرة. يجمع أجمل ما قيل في الحكمة والوعظ.",
    categorySlug: "literature", difficulty: "easy", readingTimeMin: 40, keywords: ["أمثال", "حكم", "مواعظ", "أدب"], isFeatured: false,
    chapters: [
      { title: "أمثال في الصبر", content: "<p>من أمثال العرب في الصبر: «الصبر مفتاح الفرج»، و«إن مع العسر يسراً»، و«الوقوف عند الصدمة الأولى».</p>", readingTimeMin: 10 },
      { title: "أمثال في الكرم", content: "<p>من أمثال العرب في الكرم: «أجود من حاتم»، و«أنعم من السحاب». حاتم الطائي كان مضرب المثل في الكرم.</p>", readingTimeMin: 10 },
    ],
  },
  {
    title: "الأغاني (مختارات)",
    author: "أبو الفرج الأصفهاني",
    description: "موسوعة ضخمة في الأدب والغناء والموسيقى والأخبار. من أعظم ما ألّف العرب في الفنون.",
    categorySlug: "literature", difficulty: "medium", readingTimeMin: 90, keywords: ["موسيقى", "غناء", "أدب", "أخبار"], isFeatured: false,
    chapters: [
      { title: "أخبار المغنين", content: "<p>كان للمغنين في العصر العباسي مكانة عالية. من أشهرهم: إسحاق الموصلي، وزرياب، وإبراهيم بن المهدي.</p>", readingTimeMin: 20 },
      { title: "أخبار الشعراء", content: "<p>يروي الأصفهاني أخبار الشعراء وأشعارهم. منهم: أبو نواس، وأبو تمام، والبحتري، والمتنبي.</p>", readingTimeMin: 20 },
    ],
  },
  {
    title: "صبح الأعشى في صناعة الإنشا (مختارات)",
    author: "القلقشندي",
    description: "موسوعة في فنون الكتابة والإنشاء والإدارة. من أهم مراجع الفنون الإدارية في الحضارة الإسلامية.",
    categorySlug: "literature", difficulty: "hard", readingTimeMin: 55, keywords: ["كتابة", "إنشاء", "إدارة", "فنون"], isFeatured: false,
    chapters: [
      { title: "في آداب الكاتب", content: "<p>الكاتب يجب أن يكون عالماً باللغة والفقه والحساب. قالوا: «الكاتب نصف الوزير».</p>", readingTimeMin: 15 },
      { title: "في أنواع الرسائل", content: "<p>الرسائل أنواع: رسمية، شخصية، ديوانية. لكل نوع أسلوب وقواعد في الكتابة.</p>", readingTimeMin: 12 },
    ],
  },
  {
    title: "نهاية الأرب في فنون الأدب (مختارات)",
    author: "النويري",
    description: "موسوعة شاملة في الأدب والتاريخ والجغرافيا والعلوم. من أكبر الموسوعات الإسلامية.",
    categorySlug: "literature", difficulty: "medium", readingTimeMin: 60, keywords: ["موسوعة", "أدب", "تاريخ", "علوم"], isFeatured: false,
    chapters: [
      { title: "في عجائب المخلوقات", content: "<p>يصف النويري عجائب الطبيعة: الجبال والبحار والحيوانات والنباتات. يقول: «كل ما في الكون آية تدل على الخالق».</p>", readingTimeMin: 15 },
      { title: "في أخبار الدول", content: "<p>يروي النويري تاريخ الدول الإسلامية: الأموية، العباسية، الفاطمية، الأيوبية، المملوكية.</p>", readingTimeMin: 15 },
    ],
  },
  {
    title: "مسالك الأبصار في ممالك الأمصار (مختارات)",
    author: "ابن فضل الله العمري",
    description: "موسوعة جغرافية تاريخية تصف بلدان العالم الإسلامي وأحوالها وأخبارها.",
    categorySlug: "geography", difficulty: "medium", readingTimeMin: 50, keywords: ["جغرافيا", "رحلات", "بلدان", "تاريخ"], isFeatured: false,
    chapters: [
      { title: "وصف مصر", content: "<p>مصر أمّ الدنيا. يقول ابن فضل الله: «مصر أرض الخير والبركة، فيها نهر النيل الذي يروي الأرض ويجعلها خصبة».</p>", readingTimeMin: 12 },
      { title: "وصف الشام", content: "<p>الشام أرض المقدسات. مدنها: دمشق، حلب، حمص، القدس. كل منها لها تاريخ عريق وأخبار كثيرة.</p>", readingTimeMin: 13 },
    ],
  },
  {
    title: "الإمتاع والمؤانسة (مختارات)",
    author: "أبو حيان التوحيدي",
    description: "كتاب أدبي فلسفي، حوارات بين التوحيدي ووزيره ابن سعدان في موضوعات فلسفية وأدبية واجتماعية عميقة.",
    categorySlug: "literature", difficulty: "hard", readingTimeMin: 70, keywords: ["فلسفة", "حوار", "أدب", "اجتماع"], isFeatured: false,
    chapters: [
      { title: "في فضل العلم", content: "<p>يقول التوحيدي: «العلم نور، والجهل ظلام. من عرف نفسه عرف ربّه، ومن جهل نفسه جهل كل شيء».</p>", readingTimeMin: 15 },
      { title: "في الصدق والكذب", content: "<p>الصدق أساس الفضائل. قال التوحيدي: «لو قُدر أن الصدق رجل لكان أحسن الناس خلقاً وأعظمهم عقلاً».</p>", readingTimeMin: 15 },
    ],
  },
  {
    title: "الهوامل والشوامل (مختارات)",
    author: "أبو حيان التوحيدي",
    description: "كتاب في النقد الأدبي والفلسفي، حوارات بين التوحيدي ومسكويه في موضوعات الفلسفة والطبيعة.",
    categorySlug: "literature", difficulty: "hard", readingTimeMin: 55, keywords: ["فلسفة", "نقد", "طبيعة", "حوار"], isFeatured: false,
    chapters: [
      { title: "في الجوهر والعرض", content: "<p>يبحث التوحيدي في الفلسفة: ما هو الجوهر؟ ما هو العرض؟ هل الأشياء جواهر قائمة بذاتها أم صفات زائلة؟</p>", readingTimeMin: 15 },
      { title: "في النفس الإنسانية", content: "<p>النفس الإنسانية سرّ من أسرار الله. هي روح منفصلة عن الجسد، تفارقه عند الموت.</p>", readingTimeMin: 12 },
    ],
  },
];

async function main() {
  console.log("📚 بدء زرع 15 كتاباً إضافياً...\n");
  let added = 0;

  for (const book of newBooks) {
    const category = await db.bookCategory.findUnique({ where: { slug: book.categorySlug } });
    if (!category) continue;

    const existing = await db.book.findFirst({ where: { title: book.title }, select: { id: true } });
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
    added++;
  }

  const total = await db.book.count();
  const chapters = await db.bookChapter.count();
  console.log(`\n✅ تمت إضافة ${added} كتاب. الإجمالي: ${total} كتاب، ${chapters} فصل`);
  await db.$disconnect();
}
main().catch(console.error);
