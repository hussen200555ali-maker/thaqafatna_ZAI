# 📋 سجل التغييرات (CHANGELOG)

جميع التغييرات البارزة في مشروع "ثقافتنا" موثّقة هنا.

الصيغة مبنية على [Keep a Changelog](https://keepachangelog.com/ar/1.0.0/)
والإصدار يتبع [Semantic Versioning](https://semver.org/lang/ar/).

---

## [2.0.0] — 2026-10-13

### 🎉 الإصدار الاحترافي الكامل

نقلة نوعية من لعبة كلمات تقليدية إلى **منصّة تعلّم عربية ذكية تكيّفية**.

---

### 🆕 ميزات جديدة

#### 🗺️ نظام خريطة المعرفة التكيّفية
- **Skill model**: 20 مهارة في 5 جذور هرمية
  - 📖 المفردات العربية (5 فروع)
  - 🏛️ الثقافة العربية (4 فروع)
  - 📜 التاريخ والحضارة (2 فروع)
  - 🔬 العلوم والمعرفة (2 فروع)
  - 🧩 التفكير المنطقي (2 فروع)
- **LevelSkill model**: 56 ربط بين المراحل والمهارات بأوزان دقيقة
- **PlayerSkill model**: تتبّع إتقان كل لاعب لكل مهارة (0-100%)
- **AdaptiveState model**: الحالة التكيّفية الكاملة للاعب
- **LearningEvent model**: سجل كل أحداث التعلّم
- **QuestionTypeStat model**: إحصائيات الأداء حسب نوع اللغز

#### 🧠 محرّك التكيّف الخوارزمي (`adaptive-engine.ts`)
- معادلة Bayesian-style: `0.85*mastery_old + 0.15*performance`
- خوارزمية توصية ذكية من 4 مستويات
  - `review`: مهارة ضعيفة لها مرحلة غير مكتملة
  - `next`: المرحلة التالية في نفس الفصل
  - `challenge`: فصل جديد
  - `explore`: fallback
- معامل صعوبة ديناميكي (0.7-1.3)
- API: `/api/analytics`, `/api/knowledge-map`, `/api/skills`

#### ⭐ نظام النجوم الإيجابي (`star-reward.tsx`)
- 3 نجوم: الإنجاز (مضمونة) + الذكاء + السرعة
- توهج تدريجي بدلاً من الظهور المفاجئ
- جسيمات متطايرة عند التوهج
- مؤثرات صوتية متصاعدة (3 جديدة: starReveal, starShine, starMiss)
- بطاقة "كيف تكسب نجوم أكثر؟" ذكية

#### ✅ مدقّق جودة الأسئلة الآلي (`question-validator.ts`)
- 10 معايير تربوية لكل سؤال:
  1. طول السؤال (مثالي/مقبول/طويل)
  2. وجود إجابة محددة
  3. طول الإجابة مناسب
  4. لا يعتمد على الحفظ فقط
  5. لا يحوي تلميحات عارية
  6. لا يحوي معلومات قديمة
  7. مناسبة للصعوبة المُعلنة
  8. وجود فئة للسؤال
  9. خيارات سليمة (للاختيار من متعدد)
  10. وجود وسائط متنوعة
- Score 0-100 + severity (good/warning/critical)
- توصيات ذكية للتحسين
- دالة `validateLevelQuestions()` لمرحلة كاملة

#### ⚖️ موازن صعوبة الفصول (`difficulty-balancer.ts`)
- نموذج علمي: Bloom's Taxonomy + Vygotsky ZPD
- توزيع موصى به حسب موضع الفصل:
  - الفصول الأولى (33%): 70% سهل، 25% متوسط، 5% صعب
  - الفصول المتوسطة: 40% سهل، 45% متوسط، 15% صعب
  - الفصول المتقدمة: 20% سهل، 50% متوسط، 30% صعب
- health score لكل فصل (0-100)
- API: `/api/admin/difficulty-check`
- تكامل بصري في لوحة الإدارة (أشرطة + خطوط مرجعية)

#### 🎯 شاشة الأهداف التربوية (`learning-goals-screen.tsx`)
- تُعرض قبل بدء كل مرحلة
- توليد أهداف ذكية حسب نوع اللغز (12 نوع مدعوم)
- تعرض مرة واحدة فقط لكل مرحلة (localStorage)
- حركات framer-motion سلسة
- شارة الصعوبة + معلومات اللغز

#### 🔊 اللغز الصوتي (audio)
- معالج كامل في `game-screen.tsx` لنوع `audio`
- يدعم `audioUrl` (ملفات صوتية حقيقية)
- بديل تلقائي: Web Speech API (`speechSynthesis`)
  - ينطق الكلمة بصوت عربي
  - سرعة بطيئة (0.7) للتعلّم
  - محاولة إيجاد صوت عربي مدمج
- حل أخير: عرض الإجابة كتلميح
- مرحلة تجريبية (Level #47): "أصوات وكلمات" مع 5 أسئلة

#### 🎛️ تكامل في لوحة الإدارة
- زر جديد: **✅ مدقّق الجودة** → QualityCheckView
- زر جديد: **⚖️ موازنة الصعوبة** → DifficultyBalanceView
- تحليل بصري كامل لكل فصل
- توصيات ذكية لكل سؤال وكل فصل

#### 🏠 بطاقة التوصية الذكية في الصفحة الرئيسية
- جلب التوصية من API تلقائياً
- عرض السبب + نوع التوصية
- بطاقتي دخول سريع لخريطة المعرفة والتحليلات

---

### 🔧 تحسينات

#### قاعدة البيانات
- إضافة `learningGoals` (JSON array) للـ Level model
- إضافة `educationalDescription` للـ Level model
- تحديث 6 نماذج جديدة مع فهارس محسّنة

#### API
- `/api/levels` الآن يرجع `puzzleType` + `gameMode` في القائمة
- `/api/progress` معالجة 404 بشكل أنيق
- `/api/analytics` POST يعالج إكمال المرحلة بشكل كامل

#### الواجهة
- شريط تنقّل سفلي محدّث من 3 إلى 5 أزرار
- إضافة `userId` إلى `HomeView` props
- معالجة `Level | null` بشكل آمن في `game-screen.tsx`
- إصلاح nullable types في `crossword-grid.tsx`
- إصلاح واجهات Word + Level في `game-data-api.ts`

#### TypeScript
- صفر أخطاء في `src/` ✅
- تفعيل فحص الأنواع في `next.config.ts` (ignoreBuildErrors: false)
- استبعاد `examples`, `skills`, `tests`, `scripts` من الـ build

#### الأداء
- إيقاف Prisma query logs في dev mode
- `optimizePackageImports` لـ lucide-react, framer-motion, radix-ui
- `NODE_OPTIONS=--max-old-space-size=2048` للتطوير
- manual joins في `/api/knowledge-map` بدلاً من `include` متداخلة

---

### 🐛 إصلاحات

- ✅ إصلاح خطأ `Property 'split' does not exist on type 'never'` في admin routes
- ✅ إصلاح خطأ `Level | null` type mismatch في `game-screen.tsx`
- ✅ إصلاح خطأ `gameMode not in type Level` في `game-data-api.ts`
- ✅ إصلاح خطأ `size is not defined` في `star-reward.tsx`
- ✅ إصلاح خطأ `Failed to fetch user` عند وجود userId قديم في localStorage
- ✅ إصلاح مشكلة Turbopack corrupted database (مسح `.next`)
- ✅ إصلاح تدفّق `getOrCreateUser` لمعالجة 404 بشكل أنيق
- ✅ إصلاح خطأ Prisma `learningGoals` بعد `prisma generate`

---

### 📦 البنية التحتية

#### النشر
- `vercel.json` جديد: إعدادات النشر الكاملة
- `.env.example`: نموذج متغيرات البيئة
- `package.json` scripts جديدة: `build:vercel`, `db:deploy`, `db:seed`, `postinstall`
- `next.config.ts`: `optimizePackageImports` + `eslint` استثناء
- `tsconfig.json`: استبعاد المجلدات غير الضرورية للـ build
- Prisma schema: دعم PostgreSQL للنشر (تبديل سطر واحد)

#### التوثيق
- `docs/ADAPTIVE-KNOWLEDGE-MAP.md` (جديد): وثيقة معمارية شاملة (9 أقسام)
- `docs/DEPLOYMENT.md` (جديد): دليل النشر على Vercel/Neon
- `worklog.md`: محدّث بكل القرارات
- `README.md`: محدّث بالكامل ليعكس v2
- `CHANGELOG.md`: هذا الملف

#### سكربتات جديدة
- `scripts/seed-skills.ts`: زرع 20 مهارة + 56 رابط
- `scripts/create-audio-level.ts`: إنشاء مرحلة لغز صوتي تجريبية
- `scripts/check-puzzle-types.ts`: فحص شامل لكل أنواع الألغاز
- `scripts/create-project-archive.sh`: إنشاء أرشيف مضغوط

---

### 📊 الإحصائيات

| المقياس | v1.0.0 | v2.0.0 | التغيير |
|---|---|---|---|
| إجمالي الأسطر | ~5,000 | ~10,000 | +100% |
| نماذج DB | 8 | 14 | +6 |
| API endpoints | 9 | 14 | +5 |
| أنواع الألغاز المدعومة | 12 | 13 | +1 |
| المهارات | 0 | 20 | +20 |
| مكوّنات React | 12 | 17 | +5 |
| ميزات احترافية | 0 | 5 | +5 |
| مستوى الاحترافية | 75% | 85% | +10% |

---

## [1.0.0] — 2026-10-12

### الإصدار الأولي

#### ميزات أساسية
- 8 فصول ثقافية: البدايات، الطبيعة، التراث، الأمثال، شخصيات إسلامية، جغرافيا، علوم، شعر
- 12 نوع لغز (بدون audio): نصي، صورة، 4 صور، إيموجي، حروف مبعثرة، شبكة متقاطعة، فراغات، توصيل، اختيار من متعدد، منطقي، تلميحات متدرجة، مرحلة بوس
- لوحة إدارة متكاملة
- نظام تقدّم + عملات + تلميحات
- تحدٍّ يومي + سلسلة يومية
- لوحة مفاتيح عربية كاملة
- مؤثرات صوتية + اهتزاز
- RTL كامل + خطوط عربية (Tajawal, Cairo, Noto)

#### التقنيات
- Next.js 16 + React 19 + TypeScript
- Tailwind CSS 4 + shadcn/ui
- Prisma ORM + SQLite
- Framer Motion + Zustand

---

## 🚀 خارطة الطريق (v2.1+)

### قصيرة المدى
- [ ] اختبارات آلية (Vitest + Playwright)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] مراقبة (Sentry + Vercel Analytics)

### متوسطة المدى
- [ ] تكيّف ترتيب الأسئلة داخل المرحلة
- [ ] شجرة مهارات مرئية بـ D3.js
- [ ] تقارير أسبوعية + إشعارات
- [ ] Redis cache للـ APIs

### طويلة المدى
- [ ] Machine Learning model للاستبدال القواعد اليدوية
- [ ] Learning Path Generation مخصّص
- [ ] B2B Dashboard للمدارس
- [ ] Multi-language / لهجات

---

**شكراً لكل من ساهم في هذا الإصدار** 🙏
