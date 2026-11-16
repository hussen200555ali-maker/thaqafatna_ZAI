// وثيقة تخطيط تجربة المستخدم (UX Blueprint) لتطبيق ثقافتنا v2.0.3
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  Header, Footer, AlignmentType, HeadingLevel, PageNumber, PageBreak,
  WidthType, BorderStyle, ShadingType, TableLayoutType, SectionType,
  HeightRule, NumberFormat,
} = require("docx");
const fs = require("fs");

// ====== Palette: DM-1 Deep Cyan (tech) ======
const P = {
  bg: "162235", primary: "FFFFFF", accent: "37DCF2",
  titleColor: "FFFFFF", subtitleColor: "B0B8C0",
  metaColor: "90989F", footerColor: "687078",
  body: "000000", secondary: "5A6080", surface: "EDF3F5",
  tableHeaderBg: "1B6B7A", tableHeaderText: "FFFFFF",
  tableInnerLine: "C8DDE2", tableAccentLine: "1B6B7A",
};
const AR_FONT = { ascii: "Arial", eastAsia: "Arial", cs: "Arial", hAnsi: "Arial" };
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { ...noBorders, insideHorizontal: NB, insideVertical: NB };

function arPara(text, opts = {}) {
  const { bold = false, size = 24, color = P.body, after = 120, before = 0,
    align = AlignmentType.JUSTIFIED, indent = null, heading = null, line = 360 } = opts;
  const props = { alignment: align, bidirectional: true, spacing: { after, before, line },
    children: [new TextRun({ text, bold, size, color, font: AR_FONT, rightToLeft: true })] };
  if (indent) props.indent = indent;
  if (heading) props.heading = heading;
  return new Paragraph(props);
}
function arHeading(text, level = HeadingLevel.HEADING_1) {
  const size = level === HeadingLevel.HEADING_1 ? 32 : (level === HeadingLevel.HEADING_2 ? 28 : 24);
  return new Paragraph({ heading: level, alignment: AlignmentType.RIGHT, bidirectional: true,
    spacing: { before: level === HeadingLevel.HEADING_1 ? 360 : 240, after: 160, line: 360 },
    children: [new TextRun({ text, bold: true, size, color: P.tableHeaderBg, font: AR_FONT, rightToLeft: true })] });
}
function arCell(text, opts = {}) {
  const { bold = false, bg = null, align = AlignmentType.RIGHT, size = 20, color = P.body } = opts;
  const cellProps = { children: [new Paragraph({ alignment: align, bidirectional: true,
    spacing: { after: 0, line: 280 },
    children: [new TextRun({ text: String(text), bold, size, color, font: AR_FONT, rightToLeft: true })] })],
    margins: { top: 80, bottom: 80, left: 100, right: 100 } };
  if (bg) cellProps.shading = { type: ShadingType.CLEAR, fill: bg };
  return new TableCell(cellProps);
}
function buildTable(headers, rows) {
  const headerRow = new TableRow({ tableHeader: true, cantSplit: true,
    children: headers.map(h => arCell(h, { bold: true, bg: P.tableHeaderBg, color: P.tableHeaderText, align: AlignmentType.CENTER })) });
  const dataRows = rows.map((r, i) => new TableRow({ cantSplit: true,
    children: r.map(c => arCell(c, { bg: i % 2 === 0 ? P.surface : "FFFFFF" })) }));
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, visuallyRightToLeft: true,
    borders: { top: { style: BorderStyle.SINGLE, size: 4, color: P.tableAccentLine },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: P.tableAccentLine },
      left: NB, right: NB, insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: P.tableInnerLine }, insideVertical: NB },
    rows: [headerRow, ...dataRows] });
}

// ====== Cover (R1 RTL) ======
function buildCover() {
  const padL = 1200, padR = 800;
  const ch = [];
  ch.push(new Paragraph({ spacing: { before: 3200 } }));
  ch.push(new Paragraph({ alignment: AlignmentType.RIGHT, bidirectional: true,
    indent: { left: padR, right: padL }, spacing: { after: 500 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: P.accent, space: 8 } },
    children: [new TextRun({ text: "U X   B L U E P R I N T   /   D E S I G N   S P E C",
      size: 18, color: P.accent, font: { ascii: "Calibri" }, characterSpacing: 40 })] }));
  ch.push(new Paragraph({ alignment: AlignmentType.RIGHT, bidirectional: true, indent: { right: padL },
    spacing: { after: 200, line: 920, lineRule: "atLeast" },
    children: [new TextRun({ text: "وثيقة تخطيط تجربة المستخدم", size: 72, bold: true,
      color: P.titleColor, font: AR_FONT, rightToLeft: true })] }));
  ch.push(new Paragraph({ alignment: AlignmentType.RIGHT, bidirectional: true, indent: { right: padL },
    spacing: { after: 400, line: 760, lineRule: "atLeast" },
    children: [new TextRun({ text: "تطبيق ثقافتنا v2.0.3 — مواصفات التصميم والهندسة",
      size: 52, bold: true, color: P.titleColor, font: AR_FONT, rightToLeft: true })] }));
  ch.push(new Paragraph({ alignment: AlignmentType.RIGHT, bidirectional: true, indent: { right: padL },
    spacing: { after: 800 },
    children: [new TextRun({ text: "تجاوب الشاشات + فتح PDF + تخزين مراحل رحلة المستخدم",
      size: 26, color: P.subtitleColor, font: AR_FONT, rightToLeft: true })] }));
  const accentRight = { style: BorderStyle.SINGLE, size: 8, color: P.accent, space: 12 };
  const metaLines = [
    "المشروع: منصة ثقافتنا الثقافية التفاعلية",
    "الإصدار: v2.0.3 (WebView Android)",
    "المُعدّ: فريق التطوير الآلي (ZCode Agent)",
    "التاريخ: 16 نوفمبر 2026",
    "الجمهور: المستشار التقني + فريق التصميم",
  ];
  for (const line of metaLines) {
    ch.push(new Paragraph({ alignment: AlignmentType.RIGHT, bidirectional: true,
      indent: { right: padL + 200 }, spacing: { after: 100 }, border: { right: accentRight },
      children: [new TextRun({ text: line, size: 24, color: P.metaColor, font: AR_FONT, rightToLeft: true })] }));
  }
  ch.push(new Paragraph({ spacing: { before: 2400 } }));
  ch.push(new Paragraph({ alignment: AlignmentType.RIGHT, bidirectional: true,
    indent: { left: padR, right: padL },
    border: { top: { style: BorderStyle.SINGLE, size: 2, color: P.accent, space: 8 } },
    spacing: { before: 200 },
    children: [ new TextRun({ text: "ثقافتنا — مواصفات UX", size: 16, color: P.footerColor, font: AR_FONT, rightToLeft: true }),
      new TextRun({ text: "                                        " }),
      new TextRun({ text: "v2.0.3 — 2026.11.16", size: 16, color: P.footerColor, font: { ascii: "Arial" } }) ] }));
  return [new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, layout: TableLayoutType.FIXED,
    borders: allNoBorders, rows: [new TableRow({ height: { value: 16838, rule: HeightRule.EXACT },
      children: [new TableCell({ shading: { type: ShadingType.CLEAR, fill: P.bg }, borders: noBorders,
        verticalAlign: "top", children: ch })] })] })];
}

// ====== Body ======
function buildBody() {
  const c = [];

  // 1. الملخص التنفيذي
  c.push(arHeading("الملخص التنفيذي", HeadingLevel.HEADING_1));
  c.push(arPara("تقدّم هذه الوثيقة مواصفات التصميم وتجربة المستخدم للإصدار v2.0.3 من تطبيق ثقافتنا، الذي يغلّف منصة ثقافتنا الثقافية المباشرة داخل تطبيق Android أصلي خفيف بتقنية WebView. تغطّي الوثيقة ثلاثة محاور رئيسية طلبها المستشار: التصميم التجاوبي المتوافق مع جميع أحجام الشاشات وكثافاتها، وآلية فتح ملفات PDF داخل نظام Android، ونظام تخزين مراحل رحلة المستخدم لتحليل تجربة الاستخدام وتحسينها.",
    { before: 120 }));
  c.push(arPara("يعتمد التصميم على مبادئ الهندسة الحديثة في Android: نمط Edge-to-edge الذي يمتد فيه المحتوى خلف شرائط النظام مع معالجة Window Insets لمنع اختفاء المحتوى تحت شريط الحالة أو التنقّل، ودعم جميع فئات الشاشات (small/normal/large/xlarge) مع anyDensity، وإتاحة الوضع متعدّد النوافذ. بالنسبة لملفات PDF، يعترض التطبيق روابط .pdf ويمرّرها إلى عارضات PDF الخارجية المثبَّتة على الجهاز، مع مسار احتياطي ينزّل الملف ويفتحه عبر FileProvider عند غياب عارض مباشر."));
  c.push(arPara("نظام تخزين المراحل (StageLogger) يسجّل 18 مرحلة موحَّدة لكل تفاعل في رحلة المستخدم، من تشغيل التطبيق إلى إغلاقه، ويخزّنها مزدوجاً في SharedPreferences وملف JSON قابل للتصدير. هذا يوفّر بيانات موضوعية لتحليل مسار الاستخدام، وتحديد نقاط التسرّب، وقياس تكرار الأعطال، دون الاعتماد على خدمات تحليلية خارجية قد تُمسّ بخصوصية المستخدم."));

  // 2. شخصيات المستخدمين
  c.push(arHeading("شخصيات المستخدمين (User Personas)", HeadingLevel.HEADING_1));
  c.push(arPara("صُمِّم التطبيق لخدمة جمهور ثقافي عربي واسع بفئات عمرية وخبرات تقنية متفاوتة. تحدّد الشخصيات الثلاث التالية نطاق القرارات التصميمية: قارئ محتوى يومي، وباحث أكاديمي يحتاج فتح ملفات PDF، ومستخدم ضعيف البصر يحتاج إمكانية وصول كاملة.",
    { before: 120 }));
  c.push(buildTable(
    ["الشخصية", "العمر", "الجهاز", "الهدف الرئيسي", "متطلبات خاصة"],
    [
      ["أحمد — قارئ يومي", "28", "هاتف 6.1 بوصة", "تصفّح المحتوى الثقافي", "تحميل سريع، تجربة سلسة"],
      ["د. سارة — باحثة", "41", "تابلت 10 بوصة", "قراءة ملفات PDF الأكاديمية", "فتح PDF بعارض خارجي + طباعة"],
      ["محمد — كبير سنّ", "62", "هاتف 5.5 بوصة", "قراءة المحتوى الديني", "خط كبير، تباين عالٍ، بساطة"],
    ]
  ));

  // 3. خريطة رحلة المستخدم + المخطط
  c.push(arHeading("خريطة رحلة المستخدم ومخطط الحالات", HeadingLevel.HEADING_1));
  c.push(arPara("الرسم التالي يوضّح آلة الحالات الكاملة لتجربة المستخدم في التطبيق، من لحظة التشغيل إلى الإغلاق، مروراً بكل المسارات الممكنة: التحميل الناجح، الفقدان المؤقت للشبكة، اعتراض روابط PDF، فتح التطبيقات الخارجية، والتنقّل الداخلي. كل عقدة في المخطط تقابل مرحلة مسجَّلة في StageLogger، ما يربط التصميم بالتحليل.",
    { before: 120 }));
  // embed flowchart image
  const imgData = fs.readFileSync("/home/z/my-project/download/ux-flowchart.png");
  c.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 200 },
    children: [new ImageRun({
      data: imgData,
      transformation: { width: 460, height: 667 },
      type: "png",
    })],
  }));
  c.push(new Paragraph({
    alignment: AlignmentType.CENTER, bidirectional: true, spacing: { after: 200 },
    children: [new TextRun({ text: "الشكل 1: مخطط تدفق حالات تجربة المستخدم في تطبيق ثقافتنا v2.0.3",
      size: 18, color: P.secondary, italics: true, font: AR_FONT, rightToLeft: true })],
  }));

  // 4. التصميم التجاوبي
  c.push(arHeading("مواصفات التصميم التجاوبي", HeadingLevel.HEADING_1));
  c.push(arPara("التجاوب في تطبيق WebView يتحقّق على مستويين متكاملين: مستوى الحاوية الأصلية (Native Container) التي يتحكّم بها التطبيق، ومستوى المحتوى (Web Content) الذي يتحكّم به الموقع المباشر. يضمن التطبيق أن الحاوية تملأ الشاشة بأكملها وتتعامل بشكل صحيح مع شرائط النظام والـ notches والقواطع، بينما يضمن الموقع أن المحتوى يتدفّق بشكل مناسب داخل تلك الحاوية عبر استعلامات الوسائط CSS.",
    { before: 120 }));
  c.push(arHeading("مستوى الحاوية الأصلية (Native)", HeadingLevel.HEADING_2));
  c.push(buildTable(
    ["الخاصية", "القيمة", "الغرض"],
    [
      ["Edge-to-edge", "setDecorFitsSystemWindows(false) على API 30+", "امتداد المحتوى خلف شرائط النظام"],
      ["Window Insets", "OnApplyWindowInsetsListener + systemBars()", "ضبط الحشو لمنع اختفاء المحتوى"],
      ["supports-screens", "small/normal/large/xlarge = true", "دعم جميع فئات الأحجام"],
      ["anyDensity", "true", "دعم جميع كثافات البكسل"],
      ["resizeableActivity", "true", "الوضع متعدّد النوافذ والشاشات المقسّمة"],
      ["configChanges", "orientation|screenSize|uiMode|...", "منع إعادة التشغيل عند الدوران"],
      ["viewport", "useWideViewPort + loadWithOverview", "ملاءمة المحتوى لعرض الشاشة"],
    ]
  ));
  c.push(arHeading("مستوى شاشة Offline (Arabic)", HeadingLevel.HEADING_2));
  c.push(arPara("صُمِّمت شاشة Offline كصفحة HTML مضمَّنة متجاوبة بالكامل عبر دوال CSS الحديثة: clamp() لحجم الخطوط والأيقونة بحيث تتكيّف مع عرض الشاشة، وmax-width: 600px لمنع تمدّد النص على التابلت، وenv(safe-area-inset-bottom) لاحترام القواطع السفلية على أجهزة iPhone-like. الجدول التالي يلخّص نقاط التوقّع (breakpoints)."));
  c.push(buildTable(
    ["نقطة التوقّف", "عرض الشاشة", "سلوك التصميم"],
    [
      ["هاتف صغير", "≤ 360dp", "أيقونة 72px، خط 14px، padding 24px"],
      ["هاتف قياسي", "361–599dp", "أيقونة ~96px، خط 16px (القيمة الافتراضية)"],
      ["تابلت/شاشة كبيرة", "≥ 600px", "max-width 600px محاذاة وسط، padding 48px"],
    ]
  ));

  // 5. فتح PDF
  c.push(arHeading("مواصفات فتح ملفات PDF", HeadingLevel.HEADING_1));
  c.push(arPara("نظام WebView الافتراضي لا يستطيع عرض ملفات PDF داخلياً، ما يؤدي إلى شاشة فارغة عند النقر على روابط PDF. صمّمنا حلاً متدرّجاً يضمن فتح كل ملف PDF بنجاح بغضّ النظر عن الجهاز: المحاولة الأولى تمرّر الرابط مباشرة إلى عارضات PDF الخارجية (Adobe Acrobat، Google Drive، WPS Office) عبر Intent.ACTION_VIEW. إذا لم يوجد عارض، ينزّل التطبيق الملف إلى الذاكرة المؤقتة ويفتحه عبر FileProvider.",
    { before: 120 }));
  c.push(buildTable(
    ["الخطوة", "الإجراء", "المرحلة المسجَّلة"],
    [
      ["1. الاعتراض", "shouldOverrideUrlLoading يفحص امتداد .pdf", "PDF_INTERCEPTED"],
      ["2. المحاولة الأولى", "Intent.ACTION_VIEW + application/pdf", "PDF_OPENED_EXTERNAL"],
      ["3. الفشل", "التقاط ActivityNotFoundException", "PDF_NO_VIEWER"],
      ["4. التنزيل", "HttpURLConnection → cache/pdfs/", "—"],
      ["5. الفتح المحلي", "FileProvider.getUriForFile + Intent", "PDF_OPENED_EXTERNAL"],
    ]
  ));
  c.push(arPara("إضافة إلى PDF، يعترض التطبيق الأنظمة الخارجية الأخرى ويمرّرها إلى التطبيقات المناسبة: mailto: إلى تطبيق البريد، وtel: وsms: إلى تطبيق الهاتف، وwhatsapp: إلى واتساب، وintent: إلى التطبيق المطلوب. الروابط الخارجية (خارج نطاق الموقع) تُفتح في المتصفح الخارجي عبر chooser، حتى يبقى المستخدم متحكّماً في اختيار التطبيق."));

  // 6. StageLogger
  c.push(arHeading("نظام تخزين مراحل رحلة المستخدم", HeadingLevel.HEADING_1));
  c.push(arPara("StageLogger هو نظام تخزين محلي يسجّل كل مرحلة يمرّ بها المستخدم أثناء استخدام التطبيق، بهدف توفير بيانات موضوعية لتحليل تجربة الاستخدام وتشخيص الأعطال وتحسين الرحلة. التخزين محلي بالكامل (لا يُرسَل إلى أي خادم)، ما يصون خصوصية المستخدم ويتجاهل الاعتماد على خدمات تحليلية خارجية. لكل تشغيل جلسة فريدة (session_id) تربط الأحداث ضمن تجربة واحدة.",
    { before: 120 }));
  c.push(arHeading("المراحل الموحَّدة (18 مرحلة)", HeadingLevel.HEADING_2));
  c.push(buildTable(
    ["المرحلة", "الوصف", "متى تُسجَّل"],
    [
      ["APP_LAUNCH", "تشغيل التطبيق", "onCreate"],
      ["WEBVIEW_INIT", "تهيئة WebView", "configureWebView"],
      ["URL_LOADING", "بدء تحميل رابط", "loadUrl"],
      ["PAGE_PROGRESS", "تقدّم التحميل", "كل 25%"],
      ["PAGE_LOADED", "اكتمال التحميل", "onPageFinished"],
      ["OFFLINE_SHOWN", "عرض الشاشة الاحتياطية", "loadOfflinePage"],
      ["PDF_INTERCEPTED", "اعتراض رابط PDF", "shouldOverride"],
      ["PDF_OPENED_EXTERNAL", "فتح PDF خارجياً", "بعد startActivity"],
      ["PDF_NO_VIEWER", "غياب عارض PDF", "catch exception"],
      ["FILE_DOWNLOAD", "بدء تنزيل ملف", "DownloadListener"],
      ["EXTERNAL_INTENT", "فتح تطبيق خارجي", "mailto/tel/wa"],
      ["NAVIGATE_BACK", "الرجوع للصفحة السابقة", "onBackPressed"],
      ["APP_PAUSE / RESUME", "إيقاف/استئناف مؤقت", "onPause/onResume"],
      ["APP_DESTROY", "إغلاق التطبيق", "onDestroy"],
      ["ERROR_RECEIVED", "استقبال خطأ شبكة", "onReceivedError"],
      ["CONFIG_CHANGE", "تغيير الاتجاه/الحجم", "onConfigurationChanged"],
      ["USER_RETRY", "ضغط زر إعادة المحاولة", "reload"],
    ]
  ));
  c.push(arPara("السجل يُخزَّن مزدوجاً: في SharedPreferences (للقراءة السريعة داخل التطبيق) وفي ملف JSON في مجلد filesDir للتصدير والمراجعة الخارجية. الحدّ الأقصى 500 سجل، ويُقتطع الأقدم تلقائياً عند التجاوز. توفّر دالة getSummary ملخّصاً إحصائياً بعدد كل مرحلة وتاريخ أول تشغيل، ما يكفي لتقارير سريعة دون معالجة معقّدة."));

  // 7. إمكانية الوصول
  c.push(arHeading("إمكانية الوصول (Accessibility)", HeadingLevel.HEADING_1));
  c.push(arPara("صُمِّم التطبيق بحيث يكون قابلاً للاستخدام من قبل أكبر شريحة من المستخدمين بمن فيهم ذوو الاحتياجات الخاصة. ركّزنا على ثلاثة محاور: التباين اللوني، ودعم الوضع الداكن، واحترام إعدادات النظام.",
    { before: 120 }));
  c.push(buildTable(
    ["المعيار", "التطبيق", "المعيار المرجعي"],
    [
      ["تباين النص على الخلفية", "#F5F0E1 على #1A1A2E = 15.3:1", "WCAG AAA ≥ 7:1"],
      ["تباين زر الذهب", "#1A1A2E على #C9A961 = 8.1:1", "WCAG AAA ≥ 7:1"],
      ["الوضع الداكن", "setAlgorithmicDarkeningAllowed (API 33+)", "يحترم إعداد النظام"],
      ["حجم الخط", "احترام textZoom النظام (100% افتراضياً)", "إمكانية تكبير المستخدم"],
      ["منطقة اللمس", "زر إعادة المحاولة ≥ 48dp", "Material ≥ 48dp"],
      ["دعم RTL", "dir=\"rtl\" في كل الصفحات", "طبيعي للعربية"],
    ]
  ));

  // 8. مكوّنات الواجهة
  c.push(arHeading("مخزون مكوّنات الواجهة", HeadingLevel.HEADING_1));
  c.push(arPara("يتكوّن التطبيق من مكوّنات واجهة قليلة ومركّزة، ما يقلّل التعقيد ويزيد الاتساق. الجدول التالي يفصل كل مكوّن وخصائصه التصميمية.",
    { before: 120 }));
  c.push(buildTable(
    ["المكوّن", "الموقع", "اللون", "الحجم"],
    [
      ["أيقونة التطبيق", "Launcher", "ذهبي #C9A961 على #1A1A2E", "Adaptive 48–192dp"],
      ["شريط الحالة", "أعلى الشاشة", "#1A1A2E", "ارتفاع النظام"],
      ["شريط التحميل", "أعلى WebView", "ذهبي #C9A961", "3dp"],
      ["WebView", "وسط الشاشة", "#1A1A2E (خلفية)", "ملء الشاشة"],
      ["شريط التنقّل", "أسفل الشاشة", "#1A1A2E", "ارتفاع النظام"],
      ["شاشة Offline", "ملء WebView", "تدرّج ذهبي/داكن", "متجاوب clamp()"],
      ["Toast", "أسفل الشاشة", "افتراضي النظام", "مؤقت"],
    ]
  ));

  // 9. التوصيات
  c.push(arHeading("التوصيات وخارطة الطريق", HeadingLevel.HEADING_1));
  c.push(arPara("بناءً على التحليل أعلاه، نوصي بمتابعة التحسين في ثلاث مراحل زمنية: المدى القصير لإصلاح ما يُلاحَظ من ردود فعل المستخدمين، والمدى المتوسط لإضافة قدرات تحليلية أعمق، والمدى الطويل لإعادة تقييم البنية التقنية.",
    { before: 120 }));
  c.push(buildTable(
    ["المرحلة", "الإجراء", "الأولوية"],
    [
      ["قصيرة (أسبوع)", "جمع بيانات StageLogger من اختبار ميداني محدود", "عالية"],
      ["قصيرة", "إضافة Splash screen بهوية التطبيق", "متوسطة"],
      ["متوسطة (شهر)", "لوحة تحكم داخلية لعرض ملخّص المراحل", "عالية"],
      ["متوسطة", "اختبار آلي على محاكيات متعدّدة الأحجام", "متوسطة"],
      ["متوسطة", "إضافة دعم التنزيل عبر DownloadManager الأصلي", "متوسطة"],
      ["طويلة (ربع)", "تقييم الانتقال إلى Flutter لتجربة أغنى", "منخفضة"],
      ["طويلة", "دمج تحليلات Firebase (مع موافقة المستخدم)", "منخفضة"],
    ]
  ));
  c.push(arPara("المرحلة الأهم هي الأولى: جمع بيانات حقيقية من StageLogger خلال أسبوع من الاستخدام الميداني على 5–10 أجهزة مختلفة الأحجام والإصدارات. هذه البيانات ستكشف أنماط الاستخدام الفعلية (كم مرة تظهر شاشة Offline؟ ما نسبة النقر على روابط PDF؟) وترشد القرارات اللاحقة بدل الاعتماد على الافتراضات."));

  return c;
}

// ====== Assemble ======
const doc = new Document({
  styles: { default: { document: {
    run: { font: AR_FONT, size: 24, color: P.body },
    paragraph: { spacing: { line: 360 }, bidirectional: true },
  },
  heading1: { run: { font: AR_FONT, size: 32, bold: true, color: P.tableHeaderBg },
    paragraph: { spacing: { before: 360, after: 160, line: 360 }, bidirectional: true, alignment: AlignmentType.RIGHT } },
  heading2: { run: { font: AR_FONT, size: 28, bold: true, color: P.tableHeaderBg },
    paragraph: { spacing: { before: 240, after: 140, line: 360 }, bidirectional: true, alignment: AlignmentType.RIGHT } },
  }},
  sections: [
    { properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 0, bottom: 0, left: 0, right: 0 } } },
      children: buildCover() },
    { properties: { type: SectionType.NEXT_PAGE,
        page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
          pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } },
      },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, bidirectional: true,
        children: [new TextRun({ text: "وثيقة تخطيط UX — ثقافتنا v2.0.3", size: 18, color: "808080", font: AR_FONT, rightToLeft: true })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "808080", font: { ascii: "Arial" } })] })] }) },
      children: buildBody() },
  ],
});

Packer.toBuffer(doc).then(buf => {
  const out = "/home/z/my-project/download/وثيقة_تخطيط_UX_ثقافتنا_v2.0.3.docx";
  fs.writeFileSync(out, buf);
  console.log("[✓] Generated:", out);
  console.log("    Size:", buf.length, "bytes");
});
